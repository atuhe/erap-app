import { createFileRoute } from "@tanstack/react-router";
import { DeviceManagement } from "@/components/device-management/DeviceManagement";
import { requirePermission } from "@/lib/route-guards";
import { AppShell } from "@/components/shell/AppShell";

export const Route = createFileRoute("/")({
  beforeLoad: () => requirePermission("devices.view"),
  head: () => ({
    meta: [
      { title: "Device Management — Remote Admin Console" },
      { name: "description", content: "Enterprise Windows device management, monitoring, and remote administration." },
      { property: "og:title", content: "Device Management — Remote Admin Console" },
      { property: "og:description", content: "Enterprise Windows device management, monitoring, and remote administration." },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <AppShell>
      <DeviceManagement />
    </AppShell>
  );
}
