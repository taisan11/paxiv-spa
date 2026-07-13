import { createResource, createSignal, For, Show, type Component } from "solid-js";
import { useSearchParams } from "@solidjs/router";
import { fetchPixivJson } from "../../lib/fetch";
import { url2imageURL, toLowResThumbnailURL } from "../../lib/util";
import { SearchOptions, normalizeSearchMode } from "../../components/SearchOptions";
import { SearchTabBar } from "../../components/SearchTabBar";
import { Pagination } from "../../components/Pagination";
import { ThumbnailCard } from "../../components/ThumbnailCard";
import { ViewModeToggle, type ViewMode } from "../../components/ViewModeToggle";
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
    order?: string;
    mode?: string;
    scd?: string; ecd?: string; blt?: string; bgt?: string; dgw?: string;
    tlt?: string; tgt?: string; wlt?: string; wgt?: string; rlt?: string; rgt?: string;
    original_only?: string; genre?: string; replaceable_only?: string;
  }>();

  const q = () => searchParams.q ?? "";
  const p = () => parseInt(searchParams.p || "1");
  const sMode = () => normalizeSearchMode("novel", searchParams.s_mode);
  const [viewMode, setViewMode] = createSignal<ViewMode>("grid");

  const apiUrl = () => {
    const query = q();
    if (!query) return null;
    const params = new URLSearchParams({
        order: searchParams.order || "date_d",
        mode: searchParams.mode || "all",
        p: String(p()),
        ai_type: searchParams.ai_type === "1" ? "1" : "0",
        csw: searchParams.csw === "1" ? "1" : "0",
        gs: searchParams.gs === "1" ? "1" : "0",
        s_mode: sMode()
      });
    for (const key of ["scd", "ecd", "blt", "bgt", "dgw", "tlt", "tgt", "wlt", "wgt", "rlt", "rgt", "work_lang", "genre"] as const) {
      const value = searchParams[key];
      if (value) params.set(key, value);
    }
    if (searchParams.original_only === "1") params.set("original_only", "1");
    if (searchParams.replaceable_only === "1") params.set("replaceable_only", "1");
    return `https://www.pixiv.net/ajax/search/novels/${encodeURIComponent(query)}?${params.toString()}`;
  };

  const [data] = createResource(apiUrl, (url) => fetchPixivJson<AjaxSearchNovelsResponse>(url));

  const novels = () => {
    const d = data();
    if (!d) return [];
    return (d.body?.novel?.data ?? []).filter((v) => v?.id);
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
          <ViewModeToggle mode={viewMode()} onChange={setViewMode} />
          <div class={`list-base-grid ${viewMode() === "list" ? "list-view" : ""}`}>
            <For each={novels()}>
              {(novel) => (
                <ThumbnailCard
                  href={`/novel/${novel.id}`}
                  imageSrc={url2imageURL(toLowResThumbnailURL(
                    novel.cover?.urls["240mw"] || novel.cover?.urls["480mw"] || novel.cover?.urls.original || novel.url || ""
                  ))}
                  title={novel.title}
                  author={novel.userName}
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
