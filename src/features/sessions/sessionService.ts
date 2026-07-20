import { apiFetch } from "../../lib/apiClient";
import type { ConnectResponse, SessionSummary } from "./session.types";

export function connectSession(deviceId: number, reason?: string): Promise<ConnectResponse> {
  return apiFetch<ConnectResponse>("/api/sessions/connect", {
    method: "POST",
    body: JSON.stringify({ deviceId, reason: reason ?? null }),
  });
}

export function endSession(sessionId: string): Promise<{ message: string }> {
  return apiFetch(`/api/sessions/${sessionId}/end`, { method: "POST" });
}

export function terminateSession(sessionId: string): Promise<{ message: string }> {
  return apiFetch(`/api/sessions/${sessionId}/terminate`, { method: "POST" });
}

export function getActiveSessions(): Promise<SessionSummary[]> {
  return apiFetch<SessionSummary[]>("/api/sessions/active");
}

export function getSessionHistory(max = 100): Promise<SessionSummary[]> {
  return apiFetch<SessionSummary[]>(`/api/sessions/history?max=${max}`);
}
