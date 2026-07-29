import { apiFetch, setToken, clearToken, PROFILE_KEY } from "./apiClient";

// Demo credentials — lets the app be used without the ERAP backend running.
// Any request against `admin` / `Admin@123` resolves locally with a full
// permission set. All other credentials still hit the real backend.
const DEMO_USERNAME = "admin";
const DEMO_PASSWORD = "Admin@123";
const DEMO_TOKEN = "demo.local.session";
const DEMO_PROFILE: Profile = {
  username: "admin",
  fullName: "Administrator",
  roles: ["Administrator", "System Administrator"],
  permissions: [
    "devices.view",
    "devices.manage",
    "sessions.start",
    "sessions.approve",
    "audit.view",
    "users.manage",
  ],
};

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
  // Demo shortcut — resolves before hitting the network.
  if (username.trim().toLowerCase() === DEMO_USERNAME && password === DEMO_PASSWORD) {
    setToken(DEMO_TOKEN);
    sessionStorage.setItem(PROFILE_KEY, JSON.stringify(DEMO_PROFILE));
    return DEMO_PROFILE;
  }

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

/** Display name for the signed-in user — used for audit actors and UI chips. */
export function getViewerName(): string {
  const p = getProfile();
  return p?.fullName || p?.username || "Signed-in User";
}

/** Uppercase initials (up to 2 chars) derived from the display name. */
export function getViewerInitials(): string {
  const name = getViewerName();
  const parts = name.match(/\b[\p{L}\p{N}]/gu) ?? ["U"];
  return parts.slice(0, 2).join("").toUpperCase();
}
