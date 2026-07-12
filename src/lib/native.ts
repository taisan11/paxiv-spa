declare global {
  interface Window {
    __PAXIV_NATIVE__?: boolean;
    __paxivNativeCall?: (method: string, params?: Record<string, unknown>) => Promise<unknown>;
  }
}

export const isNativeApp = () => window.__PAXIV_NATIVE__ === true && typeof window.__paxivNativeCall === "function";

export async function callNative<T>(method: string, params: Record<string, unknown> = {}): Promise<T> {
  if (!isNativeApp()) throw new Error("Native API is not available");
  return window.__paxivNativeCall!(method, params) as Promise<T>;
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (let offset = 0; offset < bytes.length; offset += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + 0x8000));
  }
  return btoa(binary);
}

function base64ToBytes(value: string): ArrayBuffer {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

export async function nativeFetch(url: string, init: RequestInit = {}, cacheable = true): Promise<Response> {
  const headers = Object.fromEntries(new Headers(init.headers).entries());
  let body: string | undefined;
  if (init.body != null) {
    body = bytesToBase64(new Uint8Array(await new Response(init.body).arrayBuffer()));
  }
  const result = await callNative<{
    status: number;
    url: string;
    headers: Record<string, string>;
    body: string;
  }>("fetch", {
    url,
    httpMethod: init.method ?? "GET",
    headers,
    body,
    cacheable
  });
  return new Response(base64ToBytes(result.body), {
    status: result.status,
    headers: result.headers
  });
}

export async function getCacheSize(): Promise<number> {
  if (isNativeApp()) return callNative<number>("cache.size");
  if ("storage" in navigator && "estimate" in navigator.storage) {
    return (await navigator.storage.estimate()).usage ?? 0;
  }
  throw new Error("Cache size is not supported");
}

export async function getAppStorageSize(): Promise<number> {
  if (isNativeApp()) return callNative<number>("storage.size");
  return new Blob(Object.entries(localStorage).map(([key, value]) => `${key}${value}`)).size;
}

export function clearAppStorage(): void {
  localStorage.clear();
}

export interface NativeLoginResult {
  PHPSESSID: string;
  csrfToken?: string;
  userId?: string;
}

export async function startNativeLogin(): Promise<NativeLoginResult> {
  return callNative<NativeLoginResult>("login.start");
}

export async function clearCache(): Promise<void> {
  if (isNativeApp()) {
    await callNative("cache.clear");
    return;
  }
  const keys = await caches.keys();
  await Promise.all(keys.map((key) => caches.delete(key)));
  const registration = await navigator.serviceWorker?.getRegistration();
  if (registration) await registration.update();
}

export {};
