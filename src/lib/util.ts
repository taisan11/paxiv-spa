export function url2imageURL(url: string): string {
  if (!url) return "";
  const i = new URL(url);
  if (i.hostname === "i.pximg.net") {
    return `https://corsproxy.io/?url=${encodeURIComponent(url)}`;
  }
  throw new Error("Invalid URL");
}

export function toLowResThumbnailURL(url: string): string {
  if (!url) return "";
  return url.replace(/\/c\/[^/]+\//, "/c/250x250_80_a2/");
}

export function sanitizeHtml(html: string): string {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
    .replace(/\son\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]*)/gi, "")
    .replace(/javascript\s*:/gi, "");
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
