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
