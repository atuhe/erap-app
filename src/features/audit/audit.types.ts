// Mirrors the backend AuditLogDto.
export interface AuditLogDto {
  auditId: number;
  actor: string | null;
  action: string;
  category: string | null;
  target: string | null;
  targetId: string | null;
  result: string | null;
  details: string | null;
  createdAt: string;   // ISO
}
