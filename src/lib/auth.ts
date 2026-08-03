import { apiFetch, setToken, clearToken, PROFILE_KEY } from "./apiClient";
import { resetSessionTimeout, stopSessionTimeout } from "./session-timeout";
import { useSyncExternalStore } from "react";
import { logAudit } from "./audit-log";
import type { ErapRole } from "./erap-roles";
import { ALL_ROLES } from "./erap-roles";

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

// ---------------------------------------------------------------------------
// Reactive auth store
//
// A single source of truth so any component (AccountBadge, badges in shells,
// route guards) stays in sync when the user logs in or out — including from
// another tab. Consumers subscribe via `useAuth()`.
// ---------------------------------------------------------------------------

function readProfileFromStorage(): Profile | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(PROFILE_KEY);
    return raw ? (JSON.parse(raw) as Profile) : null;
  } catch {
    return null;
  }
}

let cachedProfile: Profile | null = readProfileFromStorage();
const authListeners = new Set<() => void>();

function emitAuthChange() {
  for (const l of authListeners) l();
}

function setCachedProfile(next: Profile | null) {
  cachedProfile = next;
  emitAuthChange();
}

// Keep tabs synchronised: sessionStorage is per-tab, but we mirror auth state
// through a broadcast key on localStorage so other tabs can react.
const AUTH_BROADCAST_KEY = "erap:auth:broadcast";

function broadcast(kind: "login" | "logout") {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      AUTH_BROADCAST_KEY,
      JSON.stringify({ kind, at: Date.now() }),
    );
  } catch {
    /* storage may be unavailable */
  }
}

if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => {
    if (e.key !== AUTH_BROADCAST_KEY) return;
    // Another tab's login/logout — re-read this tab's own session storage.
    setCachedProfile(readProfileFromStorage());
  });
  // Also refresh when the tab regains focus, in case sessionStorage was
  // cleared by the 401 interceptor while we were away.
  window.addEventListener("focus", () => {
    const current = readProfileFromStorage();
    if (JSON.stringify(current) !== JSON.stringify(cachedProfile)) {
      setCachedProfile(current);
    }
  });
}

function toErapRole(roles: string[] | undefined): ErapRole {
  const match = roles?.find((r): r is ErapRole => (ALL_ROLES as string[]).includes(r));
  return match ?? "Viewer";
}

export async function login(username: string, password: string): Promise<Profile> {
  let result: LoginResponse;
  try {
    result = await apiFetch<LoginResponse>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });
  } catch (err) {
    logAudit({
      actor: username.trim() || "(unknown)",
      actorRole: "Viewer",
      category: "auth",
      action: "login_failed",
      target: username.trim() || "(unknown)",
      status: "denied",
      details: err instanceof Error ? err.message : "Sign-in failed",
    });
    throw err;
  }

  setToken(result.token);

  const profile: Profile = {
    username: result.username,
    fullName: result.fullName,
    roles: result.roles,
    permissions: result.permissions,
  };
  sessionStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  setCachedProfile(profile);
  broadcast("login");
  resetSessionTimeout();
  logAudit({
    actor: profile.fullName || profile.username,
    actorRole: toErapRole(profile.roles),
    category: "auth",
    action: "login",
    target: profile.username,
    status: "success",
    details: "Signed in",
  });
  return profile;
}

export function logout(): void {
  const p = cachedProfile ?? readProfileFromStorage();
  if (p) {
    logAudit({
      actor: p.fullName || p.username,
      actorRole: toErapRole(p.roles),
      category: "auth",
      action: "logout",
      target: p.username,
      status: "success",
      details: "Signed out",
    });
  }
  // Record the sign-out on the server while the token is still valid.
  apiFetch("/api/auth/logout", { method: "POST" }).catch(() => {});
  stopSessionTimeout();
  clearToken();
  setCachedProfile(null);
  broadcast("logout");
}

export function getProfile(): Profile | null {
  // Prefer the in-memory cache; fall back to storage for the first read.
  if (cachedProfile) return cachedProfile;
  const fromStorage = readProfileFromStorage();
  if (fromStorage) cachedProfile = fromStorage;
  return cachedProfile;
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

// ---------------------------------------------------------------------------
// React hook — the single global source of auth state for UI.
// ---------------------------------------------------------------------------

function subscribeAuth(cb: () => void) {
  authListeners.add(cb);
  return () => {
    authListeners.delete(cb);
  };
}

function getAuthSnapshot(): Profile | null {
  return cachedProfile;
}

function getServerAuthSnapshot(): Profile | null {
  return null;
}

export interface AuthState {
  profile: Profile | null;
  isAuthenticated: boolean;
  viewerName: string;
  viewerInitials: string;
  hasPermission: (permission: string) => boolean;
}

/** Reactive access to the signed-in profile — re-renders on login/logout. */
export function useAuth(): AuthState {
  const profile = useSyncExternalStore(subscribeAuth, getAuthSnapshot, getServerAuthSnapshot);
  const name = profile?.fullName || profile?.username || "Signed-in User";
  const initials = (name.match(/\b[\p{L}\p{N}]/gu) ?? ["U"]).slice(0, 2).join("").toUpperCase();
  return {
    profile,
    isAuthenticated: profile !== null,
    viewerName: name,
    viewerInitials: initials,
    hasPermission: (perm) => profile?.permissions.includes(perm) ?? false,
  };
}
