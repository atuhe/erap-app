// Shape mirrors ERAP.Application.DTOs.DeviceDto on the backend.
// JSON is camelCase because ASP.NET serialises that way by default.
export type DeviceStatus = "Online" | "Offline" | "In Session" | "Disabled";

export interface Device {
  deviceId: number;
  hostname: string;
  currentUsername: string | null;
  branch: string | null;
  department: string | null;
  ipAddress: string | null;
  rustDeskPort: number;
  osVersion: string | null;
  agentVersion: string | null;
  status: DeviceStatus;
  lastSeen: string | null;   // ISO timestamp
}
