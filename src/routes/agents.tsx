import { createFileRoute } from "@tanstack/react-router";
import { AgentManagement } from "@/components/agents/AgentManagement";
import { requirePermission } from "@/lib/route-guards";

export const Route = createFileRoute("/agents")({
  beforeLoad: () => requirePermission("devices.manage"),
  head: () => ({
    meta: [
      { title: "Agent Management — Remote Admin Console" },
      { name: "description", content: "Deploy, monitor, update and govern the ERAP agent installed on Windows endpoints across the private enterprise WAN." },
      { property: "og:title", content: "Agent Management — Remote Admin Console" },
      { property: "og:description", content: "Deploy, monitor, update and govern the ERAP agent installed on Windows endpoints across the private enterprise WAN." },
    ],
  }),
  component: () => <AgentManagement />,
});