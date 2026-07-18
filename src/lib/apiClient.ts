// The single choke point for every call to the ERAP backend.
// It attaches the JWT, sets JSON headers, and turns HTTP errors into
// friendly messages. Every service in the app should go through here.

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "https://localhost:7188";

const TOKEN_KEY = "erap_token";
const PROFILE_KEY = "erap_profile";

export function getToken(): string | null {
  return sessionStorage.getItem(TOKEN_KEY);
}
export function setToken(token: string): void {
  sessionStorage.setItem(TOKEN_KEY, token);
}
export function clearToken(): void {
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(PROFILE_KEY);
}

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = "ApiError";
  }
}

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");

  const token = getToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);   // the Bearer prefix you learned the hard way

  const response = await fetch(`${API_BASE}${path}`, { ...options, headers });

  // 401 = not authenticated (token missing/expired) -> force re-login
  if (response.status === 401) {
    clearToken();
    if (typeof window !== "undefined" && window.location.pathname !== "/login") {
      window.location.assign("/login");
    }
    throw new ApiError(401, "Your session has expired. Please sign in again.");
  }
  // 403 = authenticated but lacks the permission for this action
  if (response.status === 403) {
    throw new ApiError(403, "You don't have permission to do that.");
  }

  if (!response.ok) {
    let message = `Request failed (${response.status}).`;
    try {
      const body = await response.json();
      if (body?.message) message = body.message;
    } catch {
      /* response had no JSON body */
    }
    throw new ApiError(response.status, message);
  }

  if (response.status === 204) return undefined as T;   // no content
  return (await response.json()) as T;
}

export { PROFILE_KEY };
