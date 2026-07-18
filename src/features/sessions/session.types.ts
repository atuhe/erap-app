export interface ConnectResponse {
  sessionId: string;
  hostname: string;
  ipAddress: string | null;
  rustDeskPort: number | null;
  launchUrl: string | null;
  status: string;
}
