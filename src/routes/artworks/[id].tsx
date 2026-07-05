import { createResource, For, Show, Switch, Match, createSignal, type Component } from "solid-js";
import { useParams } from "@solidjs/router";
import { fetchPixivJson } from "../../lib/fetch";
import { url2imageURL, sanitizeHtml, toLowResThumbnailURL } from "../../lib/util";
import { ThumbnailCard } from "../../components/ThumbnailCard";
import { saveHistory, toggleBookmark } from "../../lib/storage";
import type {
  AjaxIllustDetailResponse,
  AjaxIllustPagesResponse,
  AjaxIllustRecommendInitResponse,
  AjaxUserIllustsByIdsResponse,
  AjaxUserProfileAllResponse
} from "../../lib/types/ajax";

const ArtworkDetail: Component = () => {
  const params = useParams<{ id: string }>();
  const [viewerOpen, setViewerOpen] = createSignal(false);

  const [illustData] = createResource(
    () => params.id,
    async (id) => {
      const data = await fetchPixivJson<AjaxIllustDetailResponse>(
        `https://www.pixiv.net/ajax/illust/${id}`
      );
      if (!data.error) {
        saveHistory(data.body.id, data.body.title, "artwork", `/artworks/${data.body.id}`);
      }
      return data;
    }
  );

  const [pagesData] = createResource(
    () => {
      const d = illustData();
      return d && !d.error && d.body.pageCount > 1 ? params.id : null;
    },
    async (id) => fetchPixivJson<AjaxIllustPagesResponse>(`https://www.pixiv.net/ajax/illust/${id}/pages`)
  );

  const [recommendData] = createResource(
    () => illustData() && !illustData()?.error ? params.id : null,
    async (id) => fetchPixivJson<AjaxIllustRecommendInitResponse>(
      `https://www.pixiv.net/ajax/illust/${id}/recommend/init?limit=18`
    )
  );

  const [profileAllData] = createResource(
    () => illustData() && !illustData()?.error ? illustData()!.body.userId : null,
    async (userId) => fetchPixivJson<AjaxUserProfileAllResponse>(
      `https://www.pixiv.net/ajax/user/${userId}/profile/all?sensitiveFilterMode=userSetting`
    )
  );

  return (
    <>
      <Switch>
        <Match when={illustData.loading}>
          <p>読み込み中...</p>
        </Match>
        <Match when={illustData.error}>
          <h1>エラー</h1>
          <p>作品の取得に失敗しました。</p>
        </Match>
        <Match when={illustData()?.error}>
          <h1>エラー</h1>
          <p>{illustData()!.message || "作品の取得に失敗しました。"}</p>
        </Match>
        <Match when={illustData()}>
          {(() => {
            const details = illustData()!.body;
            const seriesNavData = details.seriesNavData;
            const prevWork = seriesNavData?.prev ?? null;
            const nextWork = seriesNavData?.next ?? null;
            const seriesId = seriesNavData?.seriesId ? String(seriesNavData.seriesId) : null;
            const displayTags = details.tags.tags ?? [];

            const relatedWorks = () => {
              const rd = recommendData();
              if (!rd || rd.error) return [];
              return (rd.body.illusts ?? [])
                .filter((work) => work.id !== details.id)
                .slice(0, 12);
            };

            return (
              <>
                <a href={`/users/${details.userId}`}>{details.userName}</a>
                <h1 id="title">{details.title}</h1>

                <div class="client-action-bar">
                  <button
                    class="client-action-btn"
                    onClick={() => toggleBookmark(details.id, details.title, "artwork", `/artworks/${details.id}`)}
                    type="button"
                  >
                    ブックマークする
                  </button>
                </div>

                <Show when={pagesData()} fallback={
                  <img loading="lazy" src={url2imageURL(details.urls.regular)} alt={details.title} />
                }>
                  <>
                    <button class="viewer-open-btn" onClick={() => setViewerOpen(true)}>
                      📖 全画面で読む
                    </button>
                    <For each={pagesData()!.body}>
                      {(manga, index) => (
                        <>
                          <img loading="lazy" src={url2imageURL(manga.urls.small)} alt={String(index() + 1)} /><br />
                        </>
                      )}
                    </For>
                    <Show when={viewerOpen()}>
                      <div class="manga-viewer">
                        <button class="viewer-close" onClick={() => setViewerOpen(false)}>✕</button>
                        <div class="viewer-scroll">
                          <For each={pagesData()!.body}>
                            {(manga, index) => (
                              <img
                                src={url2imageURL(manga.urls.original || manga.urls.regular)}
                                alt={`${index() + 1}ページ`}
                                class="viewer-img"
                                loading="lazy"
                              />
                            )}
                          </For>
                          <div class="viewer-info-page">
                            <p class="viewer-info-author">
                              <a href={`/users/${details.userId}`}>{details.userName}</a>
                            </p>
                            <h2 class="viewer-info-title">{details.title}</h2>
                            <Show when={displayTags.length > 0}>
                              <div class="viewer-info-tags">
                                <For each={displayTags.slice(0, 10)}>
                                  {(t) => (
                                    <a href={`/search/i?q=${encodeURIComponent(t.tag)}`} class="viewer-tag">{t.tag}</a>
                                  )}
                                </For>
                              </div>
                            </Show>
                            <Show when={seriesId}>
                              <a href={`/users/${details.userId}/series/${seriesId}`} class="viewer-series-link">
                                📚 {seriesNavData?.title}
                              </a>
                            </Show>
                            <div class="viewer-prev-next">
                              <Show when={prevWork?.id}>
                                <a href={`/artworks/${String(prevWork!.id)}`} class="viewer-nav-btn">← 前の作品</a>
                              </Show>
                              <Show when={nextWork?.id}>
                                <a href={`/artworks/${String(nextWork!.id)}`} class="viewer-nav-btn">次の作品 →</a>
                              </Show>
                            </div>
                            <a href={`https://www.pixiv.net/artworks/${params.id}`} target="_blank" rel="noopener noreferrer" class="viewer-pixiv-link">
                              Pixivで見る
                            </a>
                          </div>
                        </div>
                      </div>
                    </Show>
                  </>
                </Show>

                <p innerHTML={sanitizeHtml(details.description)}></p>

                <Show when={seriesId || prevWork?.id || nextWork?.id}>
                  <div class="series-nav">
                    <Show when={seriesId}>
                      <a href={`/users/${details.userId}/series/${seriesId}`} class="series-link">
                        📚 シリーズ: {seriesNavData?.title}
                      </a>
                    </Show>
                    <Show when={nextWork?.id}>
                      <a href={`/artworks/${String(nextWork!.id)}`} class="series-nav-btn">次の作品: {nextWork!.title}</a>
                    </Show>
                    <Show when={prevWork?.id}>
                      <a href={`/artworks/${String(prevWork!.id)}`} class="series-nav-btn">前の作品: {prevWork!.title}</a>
                    </Show>
                  </div>
                </Show>

                <Show when={relatedWorks().length > 0}>
                  <section class="related-works-section">
                    <h2>関連作品</h2>
                    <div class="list-base-grid">
                      <For each={relatedWorks()}>
                        {(work) => (
                          <ThumbnailCard
                            href={`/artworks/${work.id}`}
                            imageSrc={url2imageURL(toLowResThumbnailURL(work.url ?? ""))}
                            title={work.title}
                            xRestrict={work.xRestrict}
                            pageCount={work.pageCount}
                          />
                        )}
                      </For>
                    </div>
                  </section>
                </Show>

                <div class="inline-links">
                  <a href={`https://www.pixiv.net/artworks/${params.id}`} target="_blank" rel="noopener noreferrer">Pixivで見る</a>
                </div>
              </>
            );
          })()}
        </Match>
      </Switch>
    </>
  );
};

export default ArtworkDetail;
