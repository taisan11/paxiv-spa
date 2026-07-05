export interface AuthData {
  PHPSESSID?: string;
  csrfToken?: string;
  userId?: string;
}

let _cachedAuth: AuthData | null = null;

function readAuth(): AuthData {
  return {
    PHPSESSID: localStorage.getItem("PHPSESSID") || undefined,
    csrfToken: localStorage.getItem("X-Csrf-Token") || undefined,
    userId: localStorage.getItem("userId") || undefined
  };
}

export function getAuth(): AuthData {
  if (!_cachedAuth) _cachedAuth = readAuth();
  return _cachedAuth;
}

export function setAuth(data: AuthData): void {
  if (data.PHPSESSID) localStorage.setItem("PHPSESSID", data.PHPSESSID);
  if (data.csrfToken) localStorage.setItem("X-Csrf-Token", data.csrfToken);
  if (data.userId) localStorage.setItem("userId", data.userId);
  _cachedAuth = readAuth();
}

export function clearAuth(): void {
  localStorage.removeItem("PHPSESSID");
  localStorage.removeItem("X-Csrf-Token");
  localStorage.removeItem("userId");
  _cachedAuth = readAuth();
}

export function isLoggedIn(): boolean {
  const auth = getAuth();
  return Boolean(auth.PHPSESSID || auth.csrfToken || auth.userId);
}
