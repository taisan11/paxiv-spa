import { createResource, For, Show, type Component } from "solid-js";
import { useSearchParams } from "@solidjs/router";
import { fetchPixivJson } from "../../lib/fetch";
import { url2imageURL, toLowResThumbnailURL } from "../../lib/util";
import { SearchOptions, normalizeSearchMode } from "../../components/SearchOptions";
import { SearchTabBar } from "../../components/SearchTabBar";
import { Pagination } from "../../components/Pagination";
import { ThumbnailCard } from "../../components/ThumbnailCard";
import type { AjaxSearchArtworksResponse } from "../../lib/types/ajax";

const SearchIllust: Component = () => {
  const [searchParams] = useSearchParams<{ q?: string; p?: string; s_mode?: string; type?: string; ai_type?: string; csw?: string }>();

  const q = () => searchParams.q ?? "";
  const p = () => parseInt(searchParams.p || "1");
  const sMode = () => normalizeSearchMode("illust", searchParams.s_mode);
  const type = () => searchParams.type || "illust_and_ugoira";

  const [data] = createResource(
    () => q(),
    async (query) => {
      if (!query) return null;
      const params = new URLSearchParams({
        order: "date_d",
        mode: type() === "illust_and_ugoira" ? "all" : type(),
        p: String(p()),
        ai_type: searchParams.ai_type === "1" ? "1" : "0",
        csw: searchParams.csw === "1" ? "1" : "0",
        s_mode: sMode(),
        ratio: ""
      });
      return fetchPixivJson<AjaxSearchArtworksResponse>(
        `https://www.pixiv.net/ajax/search/artworks/${encodeURIComponent(query)}?${params.toString()}`
      );
    }
  );

  const illusts = () => {
    const d = data();
    if (!d) return [];
    return (d.body?.illustManga?.data ?? [])
      .filter((v) => v?.id)
      .sort((a, b) => parseInt(b.id) - parseInt(a.id));
  };

  const lastPage = () => data()?.body?.illustManga?.lastPage ?? 1;

  return (
    <>
      <Show when={q()} fallback={
        <>
          <h1>検索</h1>
          <SearchOptions formAction="/search/i" showType={true} searchWorkKind="illust" />
        </>
      }>
        <h1>{q()}の検索結果</h1>
        <SearchOptions formAction="/search/i" showType={true} currentQuery={q()} searchWorkKind="illust" />
        <SearchTabBar q={q()} />
        <Show when={!data.loading}>
          <div class="list-base-grid">
            <For each={illusts()}>
              {(v) => (
                <ThumbnailCard
                  href={`/artworks/${v.id}`}
                  imageSrc={url2imageURL(toLowResThumbnailURL(v.url ?? ""))}
                  title={v.title}
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

export default SearchIllust;
