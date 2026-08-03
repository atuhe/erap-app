import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/shell/AppShell";
import { AgentFleet } from "@/components/agents/AgentFleet";
import { requirePermission } from "@/lib/route-guards";

export const Route = createFileRoute("/agents")({
  beforeLoad: () => requirePermission("devices.manage"),
  head: () => ({ meta: [{ title: "Agent Management — ERAP" }] }),
  component: () => (
    <AppShell>
      <AgentFleet />
    </AppShell>
  ),
});
