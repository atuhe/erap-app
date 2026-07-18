import { createFileRoute } from "@tanstack/react-router";
import { SecurityCenter } from "@/components/security/SecurityCenter";
import { requirePermission } from "@/lib/route-guards";

export const Route = createFileRoute("/security")({
  beforeLoad: () => requirePermission("audit.view"),
  head: () => ({
    meta: [
      { title: "Security Center — ERAP" },
      { name: "description", content: "Audit, compliance and security monitoring center for private-WAN enterprise remote administration." },
      { property: "og:title", content: "Security Center — ERAP" },
      { property: "og:description", content: "Audit, compliance and security monitoring center for private-WAN enterprise remote administration." },
    ],
  }),
  component: () => <SecurityCenter />,
});