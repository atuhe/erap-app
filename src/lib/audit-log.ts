import { useSyncExternalStore } from "react";
import type { ErapRole } from "./erap-roles";

export type AuditCategory =
  | "user"
  | "role"
  | "policy"
  | "device"
  | "session"
  | "report"
  | "auth"
  | "mfa";

export type AuditStatus = "success" | "denied" | "info";

export interface AuditEntry {
  id: string;
  ts: number;
  actor: string;
  actorRole: ErapRole;
  category: AuditCategory;
  action: string;
  target?: string;
  targetId?: string;
  details?: string;
  status: AuditStatus;
}

const listeners = new Set<() => void>();
let entries: AuditEntry[] = seed();
let counter = entries.length;

function seed(): AuditEntry[] {
  const now = Date.now();
  const mk = (
    offsetMin: number,
    e: Omit<AuditEntry, "id" | "ts">,
  ): AuditEntry => ({
    id: `AUD-${1000 + offsetMin}`,
    ts: now - offsetMin * 60_000,
    ...e,
  });
  return [
    mk(4, { actor: "Alex Morgan", actorRole: "Administrator", category: "user", action: "view_user", target: "Sara Patel", targetId: "U-1002", status: "info", details: "Opened profile" }),
    mk(18, { actor: "Sara Patel", actorRole: "Supervisor", category: "role", action: "role_change", target: "Jamie Nguyen", targetId: "U-1004", status: "success", details: "support_tech → senior_engineer" }),
    mk(55, { actor: "Alex Morgan", actorRole: "Administrator", category: "user", action: "reset_password", target: "Yuki Tanaka", targetId: "U-1005", status: "success", details: "Reset link emailed" }),
    mk(90, { actor: "Karl Mueller", actorRole: "Viewer", category: "session", action: "connect_attempt", target: "NYC-FIN-WS01", targetId: "DEV-10241", status: "denied", details: "Role lacks Remote Desktop permission" }),
    mk(140, { actor: "Alex Morgan", actorRole: "Administrator", category: "mfa", action: "mfa_enabled", target: "Emma Brown", targetId: "U-1007", status: "success", details: "Enrollment queued" }),
    mk(220, { actor: "Sara Patel", actorRole: "Supervisor", category: "user", action: "unlock_account", target: "Yuki Tanaka", targetId: "U-1005", status: "success" }),
    mk(310, { actor: "Alex Morgan", actorRole: "Administrator", category: "policy", action: "policy_update", target: "Approval Policies", status: "success", details: "After-hours approval enabled" }),
    mk(600, { actor: "Lin Chen", actorRole: "Supervisor", category: "user", action: "disable_account", target: "Lin Chen", targetId: "U-1009", status: "success", details: "Off-boarded" }),
  ].filter(Boolean) as AuditEntry[];
}

function emit() {
  for (const l of listeners) l();
}

export function logAudit(entry: Omit<AuditEntry, "id" | "ts">) {
  counter += 1;
  const next: AuditEntry = {
    id: `AUD-${2000 + counter}`,
    ts: Date.now(),
    ...entry,
  };
  entries = [next, ...entries];
  emit();
  return next;
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function getSnapshot() {
  return entries;
}

export function useAuditLog() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

export const AUDIT_CATEGORY_LABELS: Record<AuditCategory, string> = {
  user: "User",
  role: "Role",
  policy: "Policy",
  device: "Device",
  session: "Session",
  report: "Report",
  auth: "Auth",
  mfa: "MFA",
};

export const AUDIT_ACTION_LABELS: Record<string, string> = {
  view_user: "Viewed user",
  edit_user: "Edited user",
  role_change: "Changed role",
  reset_password: "Reset password",
  disable_account: "Disabled account",
  enable_account: "Enabled account",
  unlock_account: "Unlocked account",
  mfa_enabled: "Enabled MFA",
  mfa_disabled: "Disabled MFA",
  connect_attempt: "Attempted connect",
  connect: "Started session",
  restart_device: "Restarted device",
  shutdown_device: "Shutdown device",
  copy_ip: "Copied IP address",
  policy_update: "Updated policy",
  access_denied: "Access denied",
  view_report: "Viewed report",
  export_report: "Exported report",
  view_sessions: "Viewed sessions",
};

export function formatAuditTime(ts: number) {
  const d = new Date(ts);
  return d.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}