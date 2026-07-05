import { proxyUrl } from "./fetch";

export function url2imageURL(url: string): string {
  if (!url) return "";
  if (!url.includes("i.pximg.net")) throw new Error("Invalid URL");
  return proxyUrl(url);
}

export function toLowResThumbnailURL(url: string): string {
  if (!url) return "";
  return url.replace(/\/c\/[^/]+\//, "/c/250x250_80_a2/");
}

const RE_SCRIPT = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi;
const RE_STYLE = /<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi;
const RE_ON_EVENT = /\son\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]*)/gi;
const RE_JAVASCRIPT = /javascript\s*:/gi;

export function sanitizeHtml(html: string): string {
  return html
    .replace(RE_SCRIPT, "")
    .replace(RE_STYLE, "")
    .replace(RE_ON_EVENT, "")
    .replace(RE_JAVASCRIPT, "");
}

export function normalizePixivMapValues<T>(value: Record<string, T | null> | T[] | null | undefined): T[] {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter((v): v is T => v !== null && v !== undefined);
  return Object.values(value).filter((v): v is T => v !== null && v !== undefined);
}

export function normalizePixivIdList(value: Record<string, unknown> | string[] | null | undefined): string[] {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter((v): v is string => typeof v === "string");
  return Object.keys(value);
}

export function paginateItems<T>(items: T[], currentPage: number, perPage: number): {
  page: number;
  lastPage: number;
  pagedItems: T[];
} {
  const lastPage = Math.max(1, Math.ceil(items.length / perPage));
  const safePage = Math.max(1, Math.min(Number.isFinite(currentPage) ? Math.floor(currentPage) : 1, lastPage));
  const start = (safePage - 1) * perPage;
  return {
    page: safePage,
    lastPage,
    pagedItems: items.slice(start, start + perPage)
  };
}
