import { createFileRoute } from "@tanstack/react-router";
import { RemoteSessionConsole } from "@/components/console/RemoteSessionConsole";
import { requirePermission } from "@/lib/route-guards";

export const Route = createFileRoute("/console")({
  beforeLoad: () => requirePermission("sessions.start"),
  head: () => ({
    meta: [
      { title: "Remote Session Console — ERAP" },
      { name: "description", content: "Secure private-WAN remote session console for authorized Windows endpoint administration." },
      { property: "og:title", content: "Remote Session Console — ERAP" },
      { property: "og:description", content: "Secure private-WAN remote session console for authorized Windows endpoint administration." },
    ],
  }),
  component: () => <RemoteSessionConsole />,
});