import { createResource, For, Show, Switch, Match, createSignal, onMount, type Component } from "solid-js";
import { useParams } from "@solidjs/router";
import { fetchPixivJson } from "../../lib/fetch";
import { url2imageURL, sanitizeHtml } from "../../lib/util";
import { isBookmarked, saveHistory, toggleBookmark } from "../../lib/storage";
import type { AjaxNovelDetailResponse } from "../../lib/types/ajax";

function applyNovelSettings() {
  const family = localStorage.getItem("novel-font-family") || "serif";
  const sizeMap: Record<string, string> = {
    small: "14px",
    medium: "16px",
    large: "18px",
    xlarge: "22px"
  };
  const size = sizeMap[localStorage.getItem("novel-font-size") || "medium"] || "16px";
  const lineMap: Record<string, string> = {
    compact: "1.6",
    normal: "2.0",
    wide: "2.5"
  };
  const line = lineMap[localStorage.getItem("novel-line-height") || "normal"] || "2.0";
  const spacingMap: Record<string, string> = {
    normal: "normal",
    wide: "0.05em",
    wider: "0.1em"
  };
  const spacing = spacingMap[localStorage.getItem("novel-letter-spacing") || "normal"] || "normal";

  const el = document.getElementById("novel-text");
  if (el) {
    el.style.fontFamily = family;
    el.style.fontSize = size;
    el.style.lineHeight = line;
    el.style.letterSpacing = spacing;
  }
}

const NovelDetail: Component = () => {
  const params = useParams<{ id: string }>();
  const [bookmarked, setBookmarked] = createSignal(isBookmarked(params.id, "novel"));

  const [data] = createResource(
    () => params.id,
    async (id) => {
      const data = await fetchPixivJson<AjaxNovelDetailResponse>(
        `https://www.pixiv.net/ajax/novel/${id}`
      );
      if (!data.error) {
        saveHistory(data.body.id, data.body.title, "novel", `/novel/${data.body.id}`);
      }
      return data;
    }
  );

  onMount(() => {
    setTimeout(applyNovelSettings, 100);
  });

  return (
    <>
      <Switch>
        <Match when={data.loading}>
          <p>読み込み中...</p>
        </Match>
        <Match when={data.error}>
          <h1>エラー</h1>
          <p>小説の取得に失敗しました。</p>
        </Match>
        <Match when={data()?.error}>
          <h1>エラー</h1>
          <p>{data()!.message || "小説の取得に失敗しました。"}</p>
        </Match>
        <Match when={data()}>
          {(() => {
            const details = data()!.body;
            const seriesNavData = details.seriesNavData;
            const prevWork = seriesNavData?.prev ?? null;
            const nextWork = seriesNavData?.next ?? null;
            const seriesId = seriesNavData?.seriesId ? String(seriesNavData.seriesId) : null;

            return (
              <>
                <a href={`/users/${details.userId}`}>{details.userName}</a>
                <h1 id="title">{details.title}</h1>
                <div class="client-action-bar">
                  <button
                    class={`client-action-btn${bookmarked() ? " active" : ""}`}
                    aria-pressed={bookmarked()}
                    onClick={() => setBookmarked(toggleBookmark(details.id, details.title, "novel", `/novel/${details.id}`))}
                    type="button"
                  >
                    {bookmarked() ? "ブックマーク済み" : "ブックマークする"}
                  </button>
                </div>
                <img loading="lazy" src={url2imageURL(details.coverUrl)} alt="表紙" />
                <p innerHTML={sanitizeHtml(details.description)}></p>
                <hr />
                <div id="novel-text" class="novel-text">
                  {details.content.split("\n").map((v, i) => {
                    if (v === "[newpage]") return <hr />;
                    return <p>{v}</p>;
                  })}
                </div>
                <Show when={seriesId || prevWork?.id || nextWork?.id}>
                  <div class="series-nav">
                    <Show when={seriesId}>
                      <a
                        href={`https://www.pixiv.net/novel/series/${seriesId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        class="series-link"
                      >
                        📚 シリーズ: {seriesNavData?.title}
                      </a>
                    </Show>
                    <Show when={nextWork?.id}>
                      <a href={`/novel/${String(nextWork!.id)}`} class="series-nav-btn">
                        次の作品: {nextWork!.title}
                      </a>
                    </Show>
                    <Show when={prevWork?.id}>
                      <a href={`/novel/${String(prevWork!.id)}`} class="series-nav-btn">
                        前の作品: {prevWork!.title}
                      </a>
                    </Show>
                  </div>
                </Show>
                <div class="inline-links">
                  <a
                    href={`https://www.pixiv.net/novel/show.php?id=${params.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Pixivで見る
                  </a>
                </div>
              </>
            );
          })()}
        </Match>
      </Switch>
    </>
  );
};

export default NovelDetail;
