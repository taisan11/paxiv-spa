export const CORS_PROXIES = [
  { id: "corsproxy.io", name: "corsproxy.io", base: "https://corsproxy.io/" },
  { id: "api.cors.lol", name: "api.cors.lol", base: "https://api.cors.lol/" },
  { id: "custom", name: "カスタム...", base: "" },
] as const;

export type CorsProxyId = (typeof CORS_PROXIES)[number]["id"];

const DEFAULT_PROXY: CorsProxyId = "corsproxy.io";

export function getSelectedProxy(): CorsProxyId {
  const saved = localStorage.getItem("corsProxy");
  if (saved && CORS_PROXIES.some((p) => p.id === saved)) return saved as CorsProxyId;
  return DEFAULT_PROXY;
}

export function setSelectedProxy(id: CorsProxyId) {
  localStorage.setItem("corsProxy", id);
}

export function getCustomProxyUrl(): string {
  return localStorage.getItem("customProxyUrl") ?? "";
}

export function setCustomProxyUrl(url: string) {
  localStorage.setItem("customProxyUrl", url);
}

export function proxyUrl(url: string): string {
  const selected = getSelectedProxy();
  if (selected === "custom") {
    const customBase = getCustomProxyUrl().replace(/\/+$/, "");
    return `${customBase}?url=${encodeURIComponent(url)}`;
  }
  const proxy = CORS_PROXIES.find((p) => p.id === selected) ?? CORS_PROXIES[0];
  return `${proxy.base}?url=${encodeURIComponent(url)}`;
}

const PIXIV_DEFAULT_HEADERS = {
  "Accept": "application/json",
  "Accept-Language": "ja,en-US;q=0.9,en;q=0.8",
  "DNT": "1",
  "Referer": "https://www.pixiv.net/",
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36"
} as const;

function normalizeHeaders(headers?: HeadersInit): Headers {
  return new Headers(headers);
}

export function withAuth(
  PHPSESSID?: string,
  CSRFToken?: string,
  UserID?: string,
  init: RequestInit = {}
): RequestInit {
  const headers = normalizeHeaders(init.headers);
  headers.set("Origin", "https://www.pixiv.net");
  headers.set("accept", "application/json");
  headers.set("referer", "https://www.pixiv.net");
  headers.set("user-agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36");

  if (CSRFToken) {
    headers.set("X-Csrf-Token", CSRFToken);
  }

  if (UserID) {
    headers.set("x-user-id", UserID);
  }

  if (PHPSESSID) {
    const cookie = headers.get("Cookie");
    if (cookie && cookie.includes("PHPSESSID=")) {
      headers.set("Cookie", cookie);
    } else if (cookie) {
      headers.set("Cookie", `${cookie}; PHPSESSID=${PHPSESSID};`);
    } else {
      headers.set("Cookie", `PHPSESSID=${PHPSESSID};`);
    }
  }

  return { ...init, headers };
}

function getAuthFromStorage() {
  return {
    PHPSESSID: localStorage.getItem("PHPSESSID") || undefined,
    csrfToken: localStorage.getItem("X-Csrf-Token") || undefined,
    userId: localStorage.getItem("userId") || undefined
  };
}

async function _fetch(url: string | URL, init?: RequestInit, lang: string = "ja"): Promise<Response> {
  const formattedUrl = new URL(url);
  formattedUrl.searchParams.set("lang", lang);
  formattedUrl.searchParams.set("version", "8665b63a37a52408c102f586c91b13250ec0a1b2");

  const headers = normalizeHeaders(init?.headers);
  for (const [key, value] of Object.entries(PIXIV_DEFAULT_HEADERS)) {
    if (!headers.has(key)) {
      headers.set(key, value);
    }
  }

  const requestInit: RequestInit = { ...init, headers };
  return fetch(proxyUrl(formattedUrl.toString()), requestInit);
}

export async function fetchPixivJson<T>(
  url: string,
  init?: RequestInit,
  _cacheable: boolean = true
): Promise<T> {
  const auth = getAuthFromStorage();
  const requestInit = withAuth(auth.PHPSESSID, auth.csrfToken, auth.userId, init);
  const response = await _fetch(url, requestInit);
  return response.json() as Promise<T>;
}

export { _fetch as fetch };
