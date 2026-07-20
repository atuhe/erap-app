export interface ConnectResponse {
  sessionId: string;
  hostname: string;
  ipAddress: string | null;
  rustDeskPort: number | null;
  launchUrl: string | null;
  status: string;
}

// Mirrors the backend SessionDto.
export interface SessionSummary {
  sessionId: string;
  deviceId: number;
  hostname: string;
  technicianUsername: string;
  reason: string | null;
  status: string;            // Active | Ended | Terminated | Failed
  startTime: string;         // ISO
  endTime: string | null;
  durationSeconds: number;
}
