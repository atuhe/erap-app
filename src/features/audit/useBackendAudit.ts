import { useEffect, useState } from "react";
import type { AuditEntry, AuditCategory, AuditStatus } from "@/lib/audit-log";
import { getAuditLog } from "./auditService";
import type { AuditLogDto } from "./audit.types";

const CATEGORIES: AuditCategory[] = ["user", "role", "policy", "device", "session", "report", "auth", "mfa"];

function toStatus(result: string | null): AuditStatus {
  const r = (result ?? "").toLowerCase();
  if (r === "success") return "success";
  if (r === "denied" || r === "failed") return "denied";
  return "info";
}

function toCategory(c: string | null): AuditCategory {
  return c && (CATEGORIES as string[]).includes(c) ? (c as AuditCategory) : "session";
}

function toAuditEntry(d: AuditLogDto): AuditEntry {
  return {
    id: `AUD-${d.auditId}`,
    ts: Date.parse(d.createdAt),
    actor: d.actor ?? "system",
    actorRole: "Administrator",       // sessions/audit don't store the actor's role yet
    category: toCategory(d.category),
    action: d.action,
    target: d.target ?? undefined,
    targetId: d.targetId ?? undefined,
    details: d.details ?? undefined,
    status: toStatus(d.result),
  };
}

// Real audit trail from the backend AUDIT_LOG table (replaces the mock store).
export function useBackendAudit(intervalMs = 8000): AuditEntry[] {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  useEffect(() => {
    let alive = true;
    const load = () =>
      getAuditLog(200)
        .then((rows) => { if (alive) setEntries(rows.map(toAuditEntry)); })
        .catch(() => { /* transient; keep last good data */ });
    load();
    const t = setInterval(load, intervalMs);
    return () => { alive = false; clearInterval(t); };
  }, [intervalMs]);
  return entries;
}
