import { createFileRoute } from "@tanstack/react-router";
import { ReportsModule } from "@/components/reports/ReportsModule";
import { AppShell } from "@/components/shell/AppShell";
import { requirePermission } from "@/lib/route-guards";

export const Route = createFileRoute("/reports")({
  beforeLoad: () => requirePermission("audit.view"),
  head: () => ({
    meta: [
      { title: "Reports — ERAP Console" },
      { name: "description", content: "Operational reporting: device inventory, session activity, and technician metrics." },
    ],
  }),
  component: () => (
    <AppShell>
      <ReportsModule />
    </AppShell>
  ),
});
