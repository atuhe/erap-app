import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/shell/AppShell";
import { ComingSoon } from "@/components/shared/ComingSoon";
import { requirePermission } from "@/lib/route-guards";

export const Route = createFileRoute("/agents")({
  beforeLoad: () => requirePermission("devices.manage"),
  head: () => ({ meta: [{ title: "Agent Management — ERAP" }] }),
  component: () => (
    <AppShell>
      <ComingSoon
        title="Agent Management"
        description="Deploy, monitor, and update the ERAP agent across Windows endpoints."
        needs="This activates when the ERAP agent is built and deployed. The agent will auto-register devices, report heartbeats, and keep RustDesk IDs current."
      />
    </AppShell>
  ),
});
