import { createFileRoute } from "@tanstack/react-router";
import { SecurityCenter } from "@/components/security/SecurityCenter";

export const Route = createFileRoute("/security")({
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