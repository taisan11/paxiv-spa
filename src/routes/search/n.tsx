import { createResource, For, Show, type Component } from "solid-js";
import { useSearchParams } from "@solidjs/router";
import { fetchPixivJson } from "../../lib/fetch";
import { url2imageURL, toLowResThumbnailURL } from "../../lib/util";
import { SearchOptions, normalizeSearchMode } from "../../components/SearchOptions";
import { SearchTabBar } from "../../components/SearchTabBar";
import { Pagination } from "../../components/Pagination";
import { ThumbnailCard } from "../../components/ThumbnailCard";
import type { AjaxSearchNovelsResponse } from "../../lib/types/ajax";

const SearchNovel: Component = () => {
  const [searchParams] = useSearchParams<{
    q?: string;
    p?: string;
    s_mode?: string;
    ai_type?: string;
    csw?: string;
    gs?: string;
    work_lang?: string;
  }>();

  const q = () => searchParams.q ?? "";
  const p = () => parseInt(searchParams.p || "1");
  const sMode = () => normalizeSearchMode("novel", searchParams.s_mode);

  const [data] = createResource(
    () => q(),
    async (query) => {
      if (!query) return null;
      const params = new URLSearchParams({
        order: "date_d",
        mode: "all",
        p: String(p()),
        ai_type: searchParams.ai_type === "1" ? "1" : "0",
        csw: searchParams.csw === "1" ? "1" : "0",
        gs: searchParams.gs === "1" ? "1" : "0",
        s_mode: sMode(),
        work_lang: searchParams.work_lang || "ja"
      });
      return fetchPixivJson<AjaxSearchNovelsResponse>(
        `https://www.pixiv.net/ajax/search/novels/${encodeURIComponent(query)}?${params.toString()}`
      );
    }
  );

  const novels = () => {
    const d = data();
    if (!d) return [];
    return (d.body?.novel?.data ?? [])
      .filter((v) => v?.id)
      .sort((a, b) => parseInt(b.id) - parseInt(a.id));
  };

  const lastPage = () => data()?.body?.novel?.lastPage ?? 1;

  return (
    <>
      <Show when={q()} fallback={
        <>
          <h1>検索</h1>
          <SearchOptions
            formAction="/search/n"
            showSeriesGroup={true}
            showWorkLang={true}
            searchWorkKind="novel"
          />
        </>
      }>
        <h1>{q()}の検索結果</h1>
        <SearchOptions
          formAction="/search/n"
          showSeriesGroup={true}
          showWorkLang={true}
          currentQuery={q()}
          searchWorkKind="novel"
        />
        <SearchTabBar q={q()} />
        <Show when={!data.loading}>
          <div class="list-base-grid">
            <For each={novels()}>
              {(novel) => (
                <ThumbnailCard
                  href={`/novel/${novel.id}`}
                  imageSrc={url2imageURL(toLowResThumbnailURL(
                    novel.cover?.urls["240mw"] || novel.cover?.urls["480mw"] || novel.cover?.urls.original || novel.url || ""
                  ))}
                  title={novel.title}
                  xRestrict={novel.xRestrict}
                />
              )}
            </For>
          </div>
          <Pagination currentPage={p()} lastPage={lastPage()} />
        </Show>
      </Show>
    </>
  );
};

export default SearchNovel;
