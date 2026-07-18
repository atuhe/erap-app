import { apiFetch } from "../../lib/apiClient";
import type { ConnectResponse } from "./session.types";

export function connectSession(deviceId: number, reason?: string): Promise<ConnectResponse> {
  return apiFetch<ConnectResponse>("/api/sessions/connect", {
    method: "POST",
    body: JSON.stringify({ deviceId, reason: reason ?? null }),
  });
}

export function endSession(sessionId: string): Promise<{ message: string }> {
  return apiFetch(`/api/sessions/${sessionId}/end`, { method: "POST" });
}
