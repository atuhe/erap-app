// Real ERAP session broker calls. `startRustDeskSession` creates an audited
// session on the backend and hands off to the locally-installed RustDesk client
// via the rustdesk:// URL protocol. `stopRustDeskSession` ends the session on
// the backend. `sendApprovalDecision` stays a UI-only simulation until the
// agent sprint implements real target-side approval.

import type { ConnectTarget } from "@/components/sessions/SessionWorkflow";
import { ApiError } from "./apiClient";
import { connectSession, endSession as endBackendSession } from "@/features/sessions/sessionService";

export type HandshakeStep = "permission_verified" | "agent_ok" | "request_sent";

export interface HandshakeResult {
  ok: boolean;
  step?: HandshakeStep;
  error?:
    | "device_offline"
    | "permission_denied"
    | "agent_not_running"
    | "network_unreachable"
    | "connection_timeout";
  brokerId: string;
  latencyMs: number;
}

export interface StartOptions {
  onStep?: (step: HandshakeStep) => void;
  timeoutMs?: number;
  reason?: string;
}

// Hand off to the local RustDesk client. The OS picks up the registered
// rustdesk:// handler; nothing renders in the browser.
function launchRustDesk(url: string) {
  if (typeof document === "undefined") return;
  const a = document.createElement("a");
  a.href = url;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
}

export async function startRustDeskSession(
  device: ConnectTarget,
  { onStep, reason }: StartOptions = {},
): Promise<HandshakeResult> {
  const t0 = Date.now();

  if (device.status === "offline") {
    return { ok: false, error: "device_offline", brokerId: "", latencyMs: 0 };
  }

  // "DEV-16" -> 16 (the backend keys sessions by numeric device id)
  const deviceId = Number.parseInt(device.id.replace(/\D/g, ""), 10);

  try {
    onStep?.("permission_verified");
    const res = await connectSession(deviceId, reason);
    onStep?.("agent_ok");
    onStep?.("request_sent");

    if (res.launchUrl) launchRustDesk(res.launchUrl);

    // The REAL session id becomes the brokerId the workflow threads through,
    // so stopRustDeskSession can end the correct session.
    return { ok: true, brokerId: res.sessionId, latencyMs: Date.now() - t0 };
  } catch (e) {
    const status = e instanceof ApiError ? e.status : 0;
    const error: NonNullable<HandshakeResult["error"]> =
      status === 403 ? "permission_denied" :
      status === 409 ? "device_offline" :
      "network_unreachable";
    return { ok: false, error, brokerId: "", latencyMs: Date.now() - t0 };
  }
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
  try {
    if (brokerId) await endBackendSession(brokerId);
  } catch {
    /* already ended or a network hiccup — the UI still closes out cleanly */
  }
  return { ok: true, brokerId, reason, closedAt: Date.now() };
}

export interface ApprovalResult {
  ok: boolean;
  brokerId: string;
  decision: "approved" | "declined" | "expired";
  respondedAt: number;
}

// UI-only until the agent sprint implements real target-side approval.
export async function sendApprovalDecision(
  brokerId: string,
  decision: ApprovalResult["decision"],
): Promise<ApprovalResult> {
  await new Promise<void>((r) => setTimeout(r, 150));
  return { ok: true, brokerId, decision, respondedAt: Date.now() };
}
