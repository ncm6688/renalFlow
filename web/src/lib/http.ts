import { API_BASE } from "./env";
import { useAuth } from "../store/auth";

export type ApiError = { message: string };

let refreshInFlight: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const { refreshToken, setTokens, logout } = useAuth.getState();
  if (!refreshToken) return null;

  if (!refreshInFlight) {
    refreshInFlight = (async () => {
      try {
        const res = await apiFetch<{ accessToken: string; refreshToken: string }>(
          "/api/auth/refresh",
          {
            method: "POST",
            body: JSON.stringify({ refreshToken }),
            // no token here
          },
          { _skipRefresh: true }
        );
        setTokens(res.accessToken, res.refreshToken);
        return res.accessToken;
      } catch {
        logout();
        return null;
      } finally {
        refreshInFlight = null;
      }
    })();
  }
  return refreshInFlight;
}

export async function apiFetch<T>(
  path: string,
  opts: RequestInit & { token?: string } = {},
  internal?: { _skipRefresh?: boolean }
): Promise<T> {
  const url = path.startsWith("http") ? path : `${API_BASE}${path}`;
  const headers = new Headers(opts.headers || {});
  headers.set("Content-Type", "application/json");
  if (opts.token) headers.set("Authorization", `Bearer ${opts.token}`);

  const res = await fetch(url, { ...opts, headers });
  const text = await res.text();
  const data = text ? JSON.parse(text) : undefined;
  if (!res.ok) {
    if (res.status === 401 && !internal?._skipRefresh) {
      const newAccess = await refreshAccessToken();
      if (newAccess) {
        return apiFetch<T>(
          path,
          {
            ...opts,
            token: newAccess,
          },
          { _skipRefresh: true }
        );
      }
    }
    const msg = (data && data.message) || `Request failed (${res.status})`;
    throw new Error(msg);
  }
  return data as T;
}

