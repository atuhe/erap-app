import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/shell/AppShell";
import { AuditLogView } from "@/components/audit/AuditLogView";
import { requirePermission } from "@/lib/route-guards";

export const Route = createFileRoute("/audit")({
  beforeLoad: () => requirePermission("audit.view"),
  head: () => ({ meta: [{ title: "Audit & Compliance — ERAP" }] }),
  component: () => (
    <AppShell>
      <AuditLogView canExport />
    </AppShell>
  ),
});
