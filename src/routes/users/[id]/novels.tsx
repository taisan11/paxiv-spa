import { createResource, For, Show, Switch, Match, type Component } from "solid-js";
import { useParams, useSearchParams } from "@solidjs/router";
import { fetchPixivJson } from "../../../lib/fetch";
import { url2imageURL, normalizePixivIdList, paginateItems, toLowResThumbnailURL } from "../../../lib/util";
import { Pagination } from "../../../components/Pagination";
import { ThumbnailCard } from "../../../components/ThumbnailCard";
import type { AjaxUserProfileAllResponse, AjaxUserNovelsByIdsResponse } from "../../../lib/types/ajax";

const UserNovels: Component = () => {
  const params = useParams<{ id: string }>();
  const [searchParams] = useSearchParams<{ p?: string }>();

  const p = () => Number(searchParams.p) || 1;

  const [profileData] = createResource(
    () => params.id,
    (id) => fetchPixivJson<AjaxUserProfileAllResponse>(
      `https://www.pixiv.net/ajax/user/${id}/profile/all?sensitiveFilterMode=userSetting`
    )
  );

  const [novelsData] = createResource(
    () => {
      const prof = profileData();
      if (!prof || prof.error) return null;
      const ids = normalizePixivIdList(prof.body.novels);
      const { pagedItems } = paginateItems(ids, p(), 20);
      return pagedItems.length > 0 ? { userId: params.id, ids: pagedItems } : null;
    },
    async ({ userId, ids }) => {
      const params = new URLSearchParams();
      ids.forEach((id) => params.append("ids[]", id));
      return fetchPixivJson<AjaxUserNovelsByIdsResponse>(
        `https://www.pixiv.net/ajax/user/${userId}/novels?${params.toString()}`
      );
    }
  );

  const allIds = () => {
    const prof = profileData();
    if (!prof || prof.error) return [];
    return normalizePixivIdList(prof.body.novels);
  };

  const novels = () => {
    const data = novelsData();
    const prof = profileData();
    if (!data || data.error || !prof) return [];
    const { pagedItems } = paginateItems(allIds(), p(), 20);
    return pagedItems.map((id) => data.body[id]).filter((v) => v != null);
  };

  const novelSeries = () => {
    const prof = profileData();
    if (!prof || prof.error) return [];
    return prof.body.novelSeries;
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
          <p>小説一覧の取得に失敗しました。</p>
        </Match>
        <Match when={true}>
          <h1>小説一覧</h1>
          <h2>シリーズ</h2>
          <Show when={novelSeries().length === 0}>
            <p class="empty-state">公開されているシリーズがありません。</p>
          </Show>
          <div class="series-list">
            <For each={novelSeries()}>
              {(series) => (
                <a
                  class="series-item"
                  href={`https://www.pixiv.net/novel/series/${series.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <img loading="lazy" src={url2imageURL(series.cover.urls["128x128"])} alt={series.title} />
                  <span>{series.title}</span>
                </a>
              )}
            </For>
          </div>
          <p>合計{allIds().length}個の小説</p>
          <Show when={novels().length === 0}>
            <p class="empty-state">表示できる小説がありません。</p>
          </Show>
          <div class="list-base-grid">
            <For each={novels()}>
              {(novel) => (
                <ThumbnailCard
                  href={`/novel/${novel.id}`}
                  imageSrc={url2imageURL(toLowResThumbnailURL(
                    novel.cover?.urls["240mw"] || novel.url || novel.cover?.urls["480mw"] || novel.cover?.urls.original || ""
                  ))}
                  title={novel.title}
                  xRestrict={novel.xRestrict}
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

export default UserNovels;
