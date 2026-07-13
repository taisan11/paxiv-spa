import { createResource, createSignal, For, Show, Switch, Match, type Component } from "solid-js";
import { useParams, useSearchParams } from "@solidjs/router";
import { fetchPixivJson } from "../../../lib/fetch";
import { url2imageURL, normalizePixivIdList, paginateItems, toLowResThumbnailURL } from "../../../lib/util";
import { Pagination } from "../../../components/Pagination";
import { ThumbnailCard } from "../../../components/ThumbnailCard";
import { ViewModeToggle, type ViewMode } from "../../../components/ViewModeToggle";
import type { AjaxUserProfileAllResponse, AjaxUserIllustsByIdsResponse } from "../../../lib/types/ajax";

const UserIllusts: Component = () => {
  const params = useParams<{ id: string }>();
  const [searchParams] = useSearchParams<{ p?: string }>();

  const p = () => Number(searchParams.p) || 1;
  const [viewMode, setViewMode] = createSignal<ViewMode>("grid");

  const [profileData] = createResource(
    () => params.id,
    (id) => fetchPixivJson<AjaxUserProfileAllResponse>(
      `https://www.pixiv.net/ajax/user/${id}/profile/all?sensitiveFilterMode=userSetting`
    )
  );

  const [illustsData] = createResource(
    () => {
      const prof = profileData();
      if (!prof || prof.error) return null;
      const ids = normalizePixivIdList(prof.body.illusts);
      const { pagedItems } = paginateItems(ids, p(), 20);
      return pagedItems.length > 0 ? { userId: params.id, ids: pagedItems } : null;
    },
    async ({ userId, ids }) => {
      const params = new URLSearchParams();
      ids.forEach((id) => params.append("ids[]", id));
      return fetchPixivJson<AjaxUserIllustsByIdsResponse>(
        `https://www.pixiv.net/ajax/user/${userId}/illusts?${params.toString()}`
      );
    }
  );

  const allIds = () => {
    const prof = profileData();
    if (!prof || prof.error) return [];
    return normalizePixivIdList(prof.body.illusts);
  };

  const illusts = () => {
    const data = illustsData();
    const prof = profileData();
    if (!data || data.error || !prof) return [];
    const { pagedItems } = paginateItems(allIds(), p(), 20);
    return pagedItems.map((id) => data.body[id]).filter((v) => v != null);
  };

  const lastPage = () => Math.max(1, Math.ceil(allIds().length / 20));

  return (
    <>
      <Switch>
        <Match when={profileData.loading}>
          <p>読み込み中...</p>
        </Match>
        <Match when={profileData.error || profileData()?.error}>
          <h1>エラー</h1>
          <p>作品一覧の取得に失敗しました。</p>
        </Match>
        <Match when={true}>
          <h1>イラスト一覧</h1>
          <p>合計{allIds().length}個のイラスト</p>
          <Show when={illusts().length === 0}>
            <p class="empty-state">表示できるイラストがありません。</p>
          </Show>
          <ViewModeToggle mode={viewMode()} onChange={setViewMode} />
          <div class={`list-base-grid ${viewMode() === "list" ? "list-view" : ""}`}>
            <For each={illusts()}>
              {(illust) => (
                <ThumbnailCard
                  href={`/artworks/${illust.id}`}
                  imageSrc={url2imageURL(toLowResThumbnailURL(illust.url))}
                  title={illust.title}
                  author={illust.userName}
                  xRestrict={illust.xRestrict}
                  pageCount={illust.pageCount}
                />
              )}
            </For>
          </div>
          <Pagination currentPage={p()} lastPage={lastPage()} />
        </Match>
      </Switch>
    </>
  );
};

export default UserIllusts;
