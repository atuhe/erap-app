// Route-level permission guard. Reads permission keys from the JWT profile
// stored by src/lib/auth.ts (backend keys such as `devices.view`,
// `sessions.start`, `audit.view`, `users.manage`) — NOT the app's internal
// ErapRole names used for UI polish.
//
// Usage inside a route's beforeLoad:
//   beforeLoad: () => requirePermission("users.manage"),
import { redirect } from "@tanstack/react-router";
import { toast } from "sonner";
import { hasPermission, isAuthenticated } from "./auth";

export type BackendPermission =
  | "devices.view"
  | "devices.manage"
  | "sessions.start"
  | "sessions.approve"
  | "audit.view"
  | "users.manage";

const DENIED_LABELS: Record<BackendPermission, string> = {
  "devices.view": "view devices",
  "devices.manage": "manage devices",
  "sessions.start": "start remote sessions",
  "sessions.approve": "approve remote sessions",
  "audit.view": "view audit logs",
  "users.manage": "manage users",
};

/**
 * Throws a redirect if the current profile lacks `perm`.
 * Shows a friendly toast so the user understands why they were bounced.
 * Only runs client-side (SSR skips the check).
 */
export function requirePermission(perm: BackendPermission, fallback: string = "/") {
  if (typeof window === "undefined") return;
  if (!isAuthenticated()) return; // root guard handles unauthenticated users
  if (hasPermission(perm)) return;

  toast.error("Access denied", {
    description: `Your account can't ${DENIED_LABELS[perm]}. Contact an administrator to request the "${perm}" permission.`,
  });
  throw redirect({ to: fallback });
}