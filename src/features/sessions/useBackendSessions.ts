import { useEffect, useState } from "react";
import type { SessionRecord, SessionStatus } from "@/lib/sessions";
import { getSessionHistory } from "./sessionService";
import type { SessionSummary } from "./session.types";

// Backend status -> UI SessionStatus
function toStatus(s: string): SessionStatus {
  switch (s) {
    case "Active": return "connected";
    case "Ended": return "completed";
    case "Terminated": return "cancelled";
    default: return "failed";
  }
}

function toSessionRecord(d: SessionSummary): SessionRecord {
  const startedAt = Date.parse(d.startTime);
  const endedAt = d.endTime ? Date.parse(d.endTime) : undefined;
  const status = toStatus(d.status);
  return {
    id: d.sessionId,
    technician: d.technicianUsername,
    technicianRole: "Administrator",   // sessions don't store the role yet
    deviceId: `DEV-${d.deviceId}`,
    hostname: d.hostname,
    currentUser: "—",                 // not captured on the session record
    branch: "—",
    department: "—",
    reason: d.reason ?? "",
    mode: "unattended",
    startedAt,
    endedAt,
    status,
    result: status === "completed" ? "Completed" : status === "cancelled" ? "Cancelled" : status === "failed" ? "Failed" : undefined,
    events: [
      { ts: startedAt, kind: "request_created", message: `Started by ${d.technicianUsername}` },
      ...(endedAt ? [{ ts: endedAt, kind: "disconnected" as const, message: "Session ended" }] : []),
    ],
  };
}

// Polls the backend so the tables reflect real sessions (and updates after
// a terminate). Replaces the old in-memory useSessions() store.
export function useBackendSessions(intervalMs = 5000): SessionRecord[] {
  const [sessions, setSessions] = useState<SessionRecord[]>([]);
  useEffect(() => {
    let alive = true;
    const load = () =>
      getSessionHistory(200)
        .then((rows) => { if (alive) setSessions(rows.map(toSessionRecord)); })
        .catch(() => { /* transient; keep last good data */ });
    load();
    const t = setInterval(load, intervalMs);
    return () => { alive = false; clearInterval(t); };
  }, [intervalMs]);
  return sessions;
}
