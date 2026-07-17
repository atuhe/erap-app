import { useSyncExternalStore } from "react";
import type { ErapRole } from "./erap-roles";
import type { ConnectTarget } from "@/components/sessions/SessionWorkflow";

export type SessionStatus =
  | "requesting"
  | "awaiting_approval"
  | "connected"
  | "completed"
  | "cancelled"
  | "failed";

export type SessionResult = "Completed" | "Cancelled" | "Failed";

export type SessionEventKind =
  | "request_created"
  | "permission_verified"
  | "agent_ok"
  | "approval_requested"
  | "approved"
  | "declined"
  | "connected"
  | "disconnected"
  | "error"
  | "chat"
  | "file"
  | "info";

export interface SessionEvent {
  ts: number;
  kind: SessionEventKind;
  message: string;
}

export interface SessionRecord {
  id: string;
  technician: string;
  technicianRole: ErapRole;
  deviceId: string;
  hostname: string;
  currentUser: string;
  branch: string;
  department: string;
  reason: string;
  mode: "approval" | "unattended";
  startedAt: number;
  endedAt?: number;
  status: SessionStatus;
  result?: SessionResult;
  failure?: string;
  events?: SessionEvent[];
  deviceSnapshot?: ConnectTarget;
}

const listeners = new Set<() => void>();
let store: SessionRecord[] = seed();
let counter = store.length + 1;

function mk(
  minutesAgo: number,
  durationMin: number,
  base: Omit<SessionRecord, "id" | "startedAt" | "endedAt" | "status">,
  status: SessionStatus = "completed",
): SessionRecord {
  const startedAt = Date.now() - minutesAgo * 60_000;
  const endedAt =
    status === "connected" || status === "awaiting_approval" || status === "requesting"
      ? undefined
      : startedAt + durationMin * 60_000;
  const events: SessionEvent[] = [
    { ts: startedAt, kind: "request_created", message: `Requested by ${base.technician}` },
    { ts: startedAt + 800, kind: "permission_verified", message: "Technician permissions verified" },
    { ts: startedAt + 1600, kind: "agent_ok", message: "ERAP Agent reachable on private WAN" },
  ];
  if (base.mode === "approval") {
    events.push({ ts: startedAt + 2400, kind: "approval_requested", message: "Approval requested from remote user" });
    if (status === "cancelled") {
      events.push({ ts: startedAt + 3200, kind: "declined", message: "Remote user declined the request" });
    } else {
      events.push({ ts: startedAt + 3200, kind: "approved", message: "Remote user approved" });
    }
  }
  if (status === "connected" || status === "completed") {
    events.push({ ts: startedAt + 4000, kind: "connected", message: "RustDesk tunnel established" });
  }
  if (endedAt) {
    events.push({ ts: endedAt, kind: "disconnected", message: `Session ${status}` });
  }
  return {
    id: `SES-${5000 + Math.round(minutesAgo)}`,
    startedAt,
    endedAt,
    status,
    events,
    ...base,
  };
}

function seed(): SessionRecord[] {
  return [
    mk(6, 0, {
      technician: "Sara Patel", technicianRole: "senior_engineer",
      deviceId: "DEV-10244", hostname: "SFO-DES-MB08", currentUser: "j.nguyen",
      branch: "San Francisco", department: "Design",
      reason: "Adobe Suite license reset", mode: "approval",
      result: undefined,
    }, "connected"),
    mk(22, 0, {
      technician: "Rafa Silva", technicianRole: "support_tech",
      deviceId: "DEV-10246", hostname: "NYC-ENG-WS31", currentUser: "r.silva",
      branch: "New York", department: "Engineering",
      reason: "Push VPN config profile", mode: "unattended",
    }, "connected"),
    mk(85, 27, {
      technician: "Alex Morgan", technicianRole: "system_admin",
      deviceId: "DEV-10241", hostname: "NYC-FIN-WS01", currentUser: "a.morgan",
      branch: "New York", department: "Finance",
      reason: "Install printer drivers", mode: "approval", result: "Completed",
    }),
    mk(210, 12, {
      technician: "Alex Morgan", technicianRole: "system_admin",
      deviceId: "DEV-10247", hostname: "LON-FIN-LT02", currentUser: "e.brown",
      branch: "London", department: "Finance",
      reason: "Outlook profile rebuild", mode: "approval", result: "Completed",
    }),
    mk(360, 4, {
      technician: "Alex Morgan", technicianRole: "system_admin",
      deviceId: "DEV-10249", hostname: "SFO-OPS-WS17", currentUser: "l.chen",
      branch: "San Francisco", department: "Operations",
      reason: "Investigate slow logon", mode: "approval", result: "Cancelled",
      failure: "Remote user declined the request",
    }, "cancelled"),
    mk(1440, 18, {
      technician: "Karl Mueller", technicianRole: "auditor",
      deviceId: "DEV-10248", hostname: "BER-HR-WS10", currentUser: "k.mueller",
      branch: "Berlin", department: "HR",
      reason: "Compliance evidence review", mode: "approval", result: "Completed",
    }),
  ];
}

function emit() { for (const l of listeners) l(); }
function subscribe(cb: () => void) { listeners.add(cb); return () => listeners.delete(cb); }
function getSnapshot() { return store; }

export function useSessions() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

export function createSession(rec: Omit<SessionRecord, "id" | "startedAt" | "status">): SessionRecord {
  counter += 1;
  const next: SessionRecord = {
    id: `SES-${6000 + counter}`,
    startedAt: Date.now(),
    status: "requesting",
    events: [{ ts: Date.now(), kind: "request_created", message: `Requested by ${rec.technician}` }],
    ...rec,
  };
  store = [next, ...store];
  emit();
  return next;
}

export function updateSession(id: string, patch: Partial<SessionRecord>) {
  store = store.map((s) => (s.id === id ? { ...s, ...patch } : s));
  emit();
}

export function appendSessionEvent(id: string, event: Omit<SessionEvent, "ts"> & { ts?: number }) {
  store = store.map((s) => {
    if (s.id !== id) return s;
    const ev: SessionEvent = { ts: event.ts ?? Date.now(), kind: event.kind, message: event.message };
    return { ...s, events: [...(s.events ?? []), ev] };
  });
  emit();
}

export function endSession(id: string, result: SessionResult, failure?: string) {
  store = store.map((s) =>
    s.id === id
      ? {
          ...s,
          status: result === "Completed" ? "completed" : result === "Cancelled" ? "cancelled" : "failed",
          result,
          failure,
          endedAt: Date.now(),
          events: [
            ...(s.events ?? []),
            { ts: Date.now(), kind: "disconnected" as SessionEventKind, message: failure ? `${result}: ${failure}` : `Session ${result.toLowerCase()}` },
          ],
        }
      : s,
  );
  emit();
}

export function formatDuration(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(sec)}` : `${pad(m)}:${pad(sec)}`;
}

export function formatTime(ts: number) {
  return new Date(ts).toLocaleString(undefined, {
    year: "numeric", month: "short", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
  });
}

export const SESSION_STATUS_META: Record<SessionStatus, { label: string; tone: "green" | "yellow" | "red" | "slate" }> = {
  requesting: { label: "Requesting", tone: "yellow" },
  awaiting_approval: { label: "Awaiting approval", tone: "yellow" },
  connected: { label: "Connected", tone: "green" },
  completed: { label: "Completed", tone: "slate" },
  cancelled: { label: "Cancelled", tone: "yellow" },
  failed: { label: "Failed", tone: "red" },
};