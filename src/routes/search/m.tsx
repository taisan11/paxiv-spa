import { createResource, createSignal, For, Show, type Component } from "solid-js";
import { useSearchParams } from "@solidjs/router";
import { fetchPixivJson } from "../../lib/fetch";
import { url2imageURL, toLowResThumbnailURL } from "../../lib/util";
import { SearchOptions, normalizeSearchMode } from "../../components/SearchOptions";
import { SearchTabBar } from "../../components/SearchTabBar";
import { Pagination } from "../../components/Pagination";
import { ThumbnailCard } from "../../components/ThumbnailCard";
import { ViewModeToggle, type ViewMode } from "../../components/ViewModeToggle";
import type { AjaxSearchMangaResponse } from "../../lib/types/ajax";

const SearchManga: Component = () => {
  const [searchParams] = useSearchParams<{
    q?: string; p?: string; s_mode?: string; order?: string; mode?: string; ai_type?: string; csw?: string;
    scd?: string; ecd?: string; blt?: string; bgt?: string; ratio?: string; tool?: string;
    wlt?: string; wgt?: string; hlt?: string; hgt?: string; dgw?: string;
  }>();

  const q = () => searchParams.q ?? "";
  const p = () => parseInt(searchParams.p || "1");
  const [viewMode, setViewMode] = createSignal<ViewMode>("grid");
  const sMode = () => normalizeSearchMode("manga", searchParams.s_mode);

  const apiUrl = () => {
    const query = q();
    if (!query) return null;
    const params = new URLSearchParams({
        order: searchParams.order || "date_d",
        mode: searchParams.mode || "all",
        p: String(p()),
        ai_type: searchParams.ai_type === "1" ? "1" : "0",
        csw: searchParams.csw === "1" ? "1" : "0",
        s_mode: sMode(),
        ratio: searchParams.ratio ?? ""
      });
    for (const key of ["scd", "ecd", "blt", "bgt", "tool", "wlt", "wgt", "hlt", "hgt", "dgw"] as const) {
      const value = searchParams[key];
      if (value) params.set(key, value);
    }
    return `https://www.pixiv.net/ajax/search/manga/${encodeURIComponent(query)}?${params.toString()}`;
  };

  const [data] = createResource(apiUrl, (url) => fetchPixivJson<AjaxSearchMangaResponse>(url));

  const mangas = () => {
    const d = data();
    if (!d) return [];
    return (d.body?.manga?.data ?? []).filter((v) => v?.id);
  };

  const lastPage = () => data()?.body?.manga?.lastPage ?? 1;

  return (
    <>
      <Show when={q()} fallback={
        <>
          <h1>検索</h1>
          <SearchOptions formAction="/search/m" searchWorkKind="manga" />
        </>
      }>
        <h1>{q()}の検索結果</h1>
        <SearchOptions formAction="/search/m" currentQuery={q()} searchWorkKind="manga" />
        <SearchTabBar q={q()} />
        <Show when={!data.loading}>
          <Show when={mangas().length === 0}>
            <p>該当するマンガが見つからなかったか、リクエストでエラーが発生しました。</p>
          </Show>
          <ViewModeToggle mode={viewMode()} onChange={setViewMode} />
          <div class={`list-base-grid ${viewMode() === "list" ? "list-view" : ""}`}>
            <For each={mangas()}>
              {(v) => (
                <ThumbnailCard
                  href={`/artworks/${v.id}`}
                  imageSrc={url2imageURL(toLowResThumbnailURL(v.url ?? ""))}
                  title={v.title}
                  author={v.userName}
                  xRestrict={v.xRestrict}
                  pageCount={v.pageCount}
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

export default SearchManga;
