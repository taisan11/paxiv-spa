export interface AuthData {
  PHPSESSID?: string;
  csrfToken?: string;
  userId?: string;
}

export function getAuth(): AuthData {
  return {
    PHPSESSID: localStorage.getItem("PHPSESSID") || undefined,
    csrfToken: localStorage.getItem("X-Csrf-Token") || undefined,
    userId: localStorage.getItem("userId") || undefined
  };
}

export function setAuth(data: AuthData): void {
  if (data.PHPSESSID) localStorage.setItem("PHPSESSID", data.PHPSESSID);
  if (data.csrfToken) localStorage.setItem("X-Csrf-Token", data.csrfToken);
  if (data.userId) localStorage.setItem("userId", data.userId);
}

export function clearAuth(): void {
  localStorage.removeItem("PHPSESSID");
  localStorage.removeItem("X-Csrf-Token");
  localStorage.removeItem("userId");
}

export function isLoggedIn(): boolean {
  const auth = getAuth();
  return Boolean(auth.PHPSESSID || auth.csrfToken || auth.userId);
}
