import { apiFetch } from "../../lib/apiClient";
import type { AuditLogDto } from "./audit.types";

export function getAuditLog(max = 200): Promise<AuditLogDto[]> {
  return apiFetch<AuditLogDto[]>(`/api/audit?max=${max}`);
}
