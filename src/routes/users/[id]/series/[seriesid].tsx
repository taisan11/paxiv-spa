import { createResource, For, Show, Switch, Match, type Component } from "solid-js";
import { useParams, useSearchParams } from "@solidjs/router";
import { fetchPixivJson } from "../../../../lib/fetch";
import { url2imageURL, toLowResThumbnailURL } from "../../../../lib/util";
import { Pagination } from "../../../../components/Pagination";
import type { AjaxIllustSeriesPageResponse } from "../../../../lib/types/ajax";

const SeriesDetail: Component = () => {
  const params = useParams<{ id: string; seriesid: string }>();
  const [searchParams] = useSearchParams<{ p?: string }>();

  const p = () => Number(searchParams.p) || 1;

  const [seriesData] = createResource(
    () => ({ seriesid: params.seriesid, p: p() }),
    ({ seriesid, p }) => fetchPixivJson<AjaxIllustSeriesPageResponse>(
      `https://www.pixiv.net/ajax/series/${seriesid}?p=${p}`
    )
  );

  const items = () => {
    const d = seriesData();
    if (!d || d.error) return [];
    const byId = new Map(d.body.thumbnails.illust.map((item) => [item.id, item]));
    return d.body.page.series.flatMap(({ workId }) => {
      const item = byId.get(workId);
      return item ? [item] : [];
    });
  };

  const detail = () => seriesData()?.body.illustSeries.find((series) => series.id === params.seriesid)
    ?? seriesData()?.body.illustSeries[0];

  const total = () => seriesData()?.body.page.total ?? detail()?.total ?? 0;

  const lastPage = () => {
    const t = total();
    return t > 0 ? Math.ceil(t / 12) : p();
  };

  const imageUrl = (url: string) => url.includes("i.pximg.net")
    ? url2imageURL(toLowResThumbnailURL(url))
    : url;

  return (
    <>
      <Switch>
        <Match when={seriesData.loading}>
          <p>読み込み中...</p>
        </Match>
        <Match when={seriesData.error || seriesData()?.error}>
          <h1>エラー</h1>
          <p>{seriesData()?.message || "シリーズ情報の取得に失敗しました。"}</p>
        </Match>
        <Match when={seriesData()}>
          {(() => {
            const series = detail();
            return (
              <>
                <h1>{series?.title || "シリーズ"}</h1>
                <Show when={series?.description}><p>{series?.description}</p></Show>
                <p>合計{total()}個の作品</p>
                <Show when={items().length === 0}>
                  <p class="empty-state">表示できる作品がありません。</p>
                </Show>
                <div class="series-list">
                  <For each={items()}>
                    {(illust) => (
                      <a
                        class="series-item"
                        href={`/artworks/${illust.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <img loading="lazy" src={imageUrl(illust.url)} alt={illust.title} />
                        <span>{illust.title}</span>
                      </a>
                    )}
                  </For>
                </div>
                <Pagination currentPage={p()} lastPage={lastPage()} />
              </>
            );
          })()}
        </Match>
      </Switch>
    </>
  );
};

export default SeriesDetail;
