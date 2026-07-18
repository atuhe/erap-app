import { apiFetch, setToken, clearToken, PROFILE_KEY } from "./apiClient";

export interface LoginResponse {
  token: string;
  username: string;
  fullName: string;
  roles: string[];
  permissions: string[];
}

export interface Profile {
  username: string;
  fullName: string;
  roles: string[];
  permissions: string[];
}

export async function login(username: string, password: string): Promise<Profile> {
  const result = await apiFetch<LoginResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });

  setToken(result.token);

  const profile: Profile = {
    username: result.username,
    fullName: result.fullName,
    roles: result.roles,
    permissions: result.permissions,
  };
  sessionStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  return profile;
}

export function logout(): void {
  clearToken();
}

export function getProfile(): Profile | null {
  const raw = sessionStorage.getItem(PROFILE_KEY);
  return raw ? (JSON.parse(raw) as Profile) : null;
}

export function isAuthenticated(): boolean {
  return getProfile() !== null;
}

// Mirror of the backend's [Authorize(Policy = "...")] — use it to show/hide
// buttons. The server still enforces it; this is just for a clean UI.
export function hasPermission(permission: string): boolean {
  return getProfile()?.permissions.includes(permission) ?? false;
}
