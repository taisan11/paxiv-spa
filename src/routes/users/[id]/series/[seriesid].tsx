import { createResource, For, Show, Switch, Match, type Component } from "solid-js";
import { useParams, useSearchParams } from "@solidjs/router";
import { fetchPixivJson } from "../../../../lib/fetch";
import { url2imageURL, toLowResThumbnailURL } from "../../../../lib/util";
import { Pagination } from "../../../../components/Pagination";
import type { AjaxIllustSeriesDetailResponse, AjaxIllustSeriesContentResponse } from "../../../../lib/types/ajax";

const SeriesDetail: Component = () => {
  const params = useParams<{ id: string; seriesid: string }>();
  const [searchParams] = useSearchParams<{ p?: string }>();

  const p = () => Number(searchParams.p) || 1;

  const [detailData] = createResource(
    () => params.seriesid,
    (id) => fetchPixivJson<AjaxIllustSeriesDetailResponse>(
      `https://www.pixiv.net/ajax/illust/series/${id}`
    )
  );

  const [contentData] = createResource(
    () => ({ seriesid: params.seriesid, p: p() }),
    async ({ seriesid, p }) => {
      const lastOrder = (p - 1) * 10;
      return fetchPixivJson<AjaxIllustSeriesContentResponse>(
        `https://www.pixiv.net/ajax/illust/series_content/${seriesid}?limit=10&last_order=${lastOrder}`
      );
    }
  );

  const items = () => {
    const d = contentData();
    if (!d || d.error) return [];
    return d.body.series_contents ?? d.body.thumbnails?.illust ?? [];
  };

  const total = () => {
    const d = detailData();
    if (!d || d.error) return 0;
    return Number(d.body.series.total);
  };

  const lastPage = () => {
    const t = total();
    return t > 0 ? Math.ceil(t / 10) : p();
  };

  return (
    <>
      <Switch>
        <Match when={detailData.loading}>
          <p>読み込み中...</p>
        </Match>
        <Match when={detailData.error || detailData()?.error}>
          <h1>エラー</h1>
          <p>{detailData()?.message || "シリーズ情報の取得に失敗しました。"}</p>
        </Match>
        <Match when={contentData.error || contentData()?.error}>
          <h1>エラー</h1>
          <p>{contentData()?.message || "シリーズ作品の取得に失敗しました。"}</p>
        </Match>
        <Match when={detailData()}>
          {(() => {
            const detail = detailData()!;
            return (
              <>
                <h1>{detail.body.series.title}</h1>
                <p>合計{detail.body.series.total}個のイラスト</p>
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
                        <img loading="lazy" src={url2imageURL(toLowResThumbnailURL(illust.url))} alt={illust.title} />
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
