import { apiFetch } from "../../lib/apiClient";
import type { Device } from "./device.types";

export function getDevices(): Promise<Device[]> {
  return apiFetch<Device[]>("/api/devices");
}

export function searchDevices(query: string): Promise<Device[]> {
  return apiFetch<Device[]>(`/api/devices/search?q=${encodeURIComponent(query)}`);
}

export function getDevice(id: number): Promise<Device> {
  return apiFetch<Device>(`/api/devices/${id}`);
}

export function disableDevice(id: number): Promise<{ message: string }> {
  return apiFetch(`/api/devices/${id}/disable`, { method: "POST" });
}

export function enableDevice(id: number): Promise<{ message: string }> {
  return apiFetch(`/api/devices/${id}/enable`, { method: "POST" });
}

// Change a kit's lifecycle status. Obsolete/Disposed require a reason.
export function setKitStatus(id: number, status: string, reason?: string) {
  return apiFetch(`/api/devices/${id}/status`, {
    method: "POST",
    body: JSON.stringify({ status, reason: reason ?? null }),
  });
}

export interface RegisterDeviceRequest {
  hostname: string;
  currentUsername?: string | null;
  branch?: string | null;
  department?: string | null;
  ipAddress?: string | null;
  rustDeskId?: string | null;
  rustDeskPort?: number | null;
  osVersion?: string | null;
  agentVersion?: string | null;
}

// Create/update a kit (upserts on hostname). Used by the Add Kit form.
export function registerDevice(req: RegisterDeviceRequest): Promise<Device> {
  return apiFetch<Device>("/api/devices/register", {
    method: "POST",
    body: JSON.stringify(req),
  });
}
