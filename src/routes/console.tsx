import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/shell/AppShell";
import { ComingSoon } from "@/components/shared/ComingSoon";
import { requirePermission } from "@/lib/route-guards";

export const Route = createFileRoute("/console")({
  beforeLoad: () => requirePermission("sessions.start"),
  head: () => ({ meta: [{ title: "Session Console — ERAP" }] }),
  component: () => (
    <AppShell>
      <ComingSoon
        title="Session Console"
        description="A live technician dashboard of in-progress remote sessions, approvals, and quick actions."
        needs="Becomes live once the ERAP agent is deployed — it will report real active sessions, status, and approvals. Until then, use Remote Sessions for real session records."
      />
    </AppShell>
  ),
});
