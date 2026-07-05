import { createResource, For, Show, Switch, Match, type Component } from "solid-js";
import { useParams } from "@solidjs/router";
import { fetchPixivJson } from "../../../lib/fetch";
import { url2imageURL, sanitizeHtml, normalizePixivMapValues, toLowResThumbnailURL } from "../../../lib/util";
import { ThumbnailCard } from "../../../components/ThumbnailCard";
import type { AjaxUserResponse, AjaxUserProfileTopResponse } from "../../../lib/types/ajax";

const UserProfile: Component = () => {
  const params = useParams<{ id: string }>();

  const [userdata] = createResource(
    () => params.id,
    (id) => fetchPixivJson<AjaxUserResponse>(`https://www.pixiv.net/ajax/user/${id}?full=1`)
  );

  const [homedata] = createResource(
    () => params.id,
    (id) => fetchPixivJson<AjaxUserProfileTopResponse>(
      `https://www.pixiv.net/ajax/user/${id}/profile/top?sensitiveFilterMode=userSetting`
    )
  );

  const illusts = () => {
    const d = homedata();
    if (!d || d.error) return [];
    return normalizePixivMapValues(d.body.illusts);
  };

  const mangas = () => {
    const d = homedata();
    if (!d || d.error) return [];
    return normalizePixivMapValues(d.body.manga);
  };

  const novels = () => {
    const d = homedata();
    if (!d || d.error) return [];
    return normalizePixivMapValues(d.body.novels);
  };

  const twitterUrl = () => {
    const d = userdata();
    if (!d || d.error) return undefined;
    const social = d.body.social;
    return !Array.isArray(social) ? social.twitter?.url : undefined;
  };

  return (
    <>
      <Switch>
        <Match when={userdata.loading || homedata.loading}>
          <p>読み込み中...</p>
        </Match>
        <Match when={userdata.error}>
          <h1>エラー</h1>
          <p>ユーザー情報の取得に失敗しました。</p>
        </Match>
        <Match when={userdata()?.error}>
          <h1>エラー</h1>
          <p>{userdata()!.message || "ユーザー情報の取得に失敗しました。"}</p>
        </Match>
        <Match when={homedata()?.error}>
          <h1>エラー</h1>
          <p>{homedata()!.message || "作品情報の取得に失敗しました。"}</p>
        </Match>
        <Match when={userdata() && homedata()}>
          {(() => {
            const user = userdata()!.body;
            const userId = params.id;
            return (
              <>
                <h1>{user.name}</h1>
                <div class="client-action-bar">
                  <button
                    class="client-action-btn"
                    onClick={() => {
                      const follows = JSON.parse(localStorage.getItem("paxiv_follows") || "[]");
                      const exists = follows.find((f: any) => f.id === user.userId);
                      if (exists) {
                        localStorage.setItem("paxiv_follows", JSON.stringify(follows.filter((f: any) => f.id !== user.userId)));
                      } else {
                        follows.unshift({ id: user.userId, title: user.name, type: "follow", url: `/users/${user.userId}`, timestamp: Date.now() });
                        localStorage.setItem("paxiv_follows", JSON.stringify(follows.slice(0, 1000)));
                      }
                    }}
                    type="button"
                  >
                    フォローする
                  </button>
                </div>
                <div innerHTML={sanitizeHtml(user.commentHtml)}></div>
                <img loading="lazy" src={url2imageURL(user.imageBig || user.image)} alt="プロフィール画像" />
                <div class="inline-links">
                  {twitterUrl() && (
                    <a href={twitterUrl()} target="_blank" rel="noopener noreferrer">Twitter</a>
                  )}
                  {user.webpage && (
                    <a
                      href={user.webpage.startsWith("http") ? user.webpage : `https://${user.webpage}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Webサイト
                    </a>
                  )}
                </div>

                <h2>イラスト|漫画</h2>
                <Show when={[...illusts(), ...mangas()].length === 0}>
                  <p class="empty-state">公開されているイラスト・マンガがありません。</p>
                </Show>
                <div class="list-base-grid">
                  <For each={[...illusts(), ...mangas()]}>
                    {(illust) => (
                      <ThumbnailCard
                        href={`/artworks/${illust.id}`}
                        imageSrc={url2imageURL(toLowResThumbnailURL(illust.url))}
                        title={illust.title}
                        xRestrict={illust.xRestrict}
                        pageCount={illust.pageCount}
                      />
                    )}
                  </For>
                </div>
                <a href={`/users/${userId}/illusts`}>イラストをもっと見る</a><br />
                <a href={`/users/${userId}/manga`}>漫画をもっと見る</a>

                <h2>小説</h2>
                <Show when={novels().length === 0}>
                  <p class="empty-state">公開されている小説がありません。</p>
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
                <a href={`/users/${userId}/novels`}>小説をもっと見る</a>
              </>
            );
          })()}
        </Match>
      </Switch>
    </>
  );
};

export default UserProfile;
