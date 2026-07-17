// Simulated RustDesk broker for the private-WAN demo. In production, these
// helpers would call an internal ERAP<->RustDesk gateway; here they mimic the
// step-by-step handshake so the UI can drive realistic progress and errors.

import type { ConnectTarget } from "@/components/sessions/SessionWorkflow";

export type HandshakeStep =
  | "permission_verified"
  | "agent_ok"
  | "request_sent";

export interface HandshakeResult {
  ok: boolean;
  step?: HandshakeStep;
  error?:
    | "device_offline"
    | "agent_not_running"
    | "network_unreachable"
    | "connection_timeout";
  brokerId: string;
  latencyMs: number;
}

export interface StartOptions {
  onStep?: (step: HandshakeStep) => void;
  timeoutMs?: number;
}

function jitter(base: number) {
  return base + Math.round((Math.random() - 0.5) * base * 0.4);
}

export async function startRustDeskSession(
  device: ConnectTarget,
  { onStep, timeoutMs = 8000 }: StartOptions = {},
): Promise<HandshakeResult> {
  const t0 = Date.now();
  const brokerId = `RD-${device.id.replace(/[^A-Z0-9]/gi, "")}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
  if (device.status === "offline") {
    return { ok: false, error: "device_offline", brokerId, latencyMs: 0 };
  }
  await sleep(jitter(500));
  onStep?.("permission_verified");
  await sleep(jitter(600));
  onStep?.("agent_ok");
  await sleep(jitter(500));
  onStep?.("request_sent");
  const total = Date.now() - t0;
  if (total > timeoutMs) {
    return { ok: false, error: "connection_timeout", brokerId, latencyMs: total };
  }
  return { ok: true, brokerId, latencyMs: total };
}

export interface StopResult {
  ok: boolean;
  brokerId: string;
  reason: "user" | "admin" | "timeout" | "network";
  closedAt: number;
}

export async function stopRustDeskSession(
  brokerId: string,
  reason: StopResult["reason"] = "user",
): Promise<StopResult> {
  await sleep(jitter(250));
  return { ok: true, brokerId, reason, closedAt: Date.now() };
}

export interface ApprovalResult {
  ok: boolean;
  brokerId: string;
  decision: "approved" | "declined" | "expired";
  respondedAt: number;
}

export async function sendApprovalDecision(
  brokerId: string,
  decision: ApprovalResult["decision"],
): Promise<ApprovalResult> {
  await sleep(jitter(150));
  return { ok: true, brokerId, decision, respondedAt: Date.now() };
}

function sleep(ms: number) {
  return new Promise<void>((r) => setTimeout(r, ms));
}