import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/shell/AppShell";
import { ComingSoon } from "@/components/shared/ComingSoon";
import { requirePermission } from "@/lib/route-guards";

export const Route = createFileRoute("/security")({
  beforeLoad: () => requirePermission("audit.view"),
  head: () => ({ meta: [{ title: "Security Center — ERAP" }] }),
  component: () => (
    <AppShell>
      <ComingSoon
        title="Security Center"
        description="Security posture, alerts, and event monitoring across the private-WAN fabric."
        needs="Real security monitoring depends on the ERAP agent and event pipeline. For the real audit trail today, see Audit & Compliance, which reads the live AUDIT_LOG."
      />
    </AppShell>
  ),
});
