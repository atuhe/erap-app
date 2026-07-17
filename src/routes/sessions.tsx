import { createFileRoute } from "@tanstack/react-router";
import { SessionManagement } from "@/components/sessions/SessionManagement";

export const Route = createFileRoute("/sessions")({
  head: () => ({
    meta: [
      { title: "Sessions — Remote Admin Console" },
      { name: "description", content: "Live remote support sessions, approvals, scheduling, and audit for enterprise Windows endpoints." },
      { property: "og:title", content: "Sessions — Remote Admin Console" },
      { property: "og:description", content: "Live remote support sessions, approvals, scheduling, and audit for enterprise Windows endpoints." },
    ],
  }),
  component: SessionsPage,
});

function SessionsPage() {
  return <SessionManagement />;
}