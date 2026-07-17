import { createFileRoute } from "@tanstack/react-router";
import { SessionsModule } from "@/components/sessions/SessionsModule";
import { AppShell } from "@/components/shell/AppShell";

export const Route = createFileRoute("/sessions")({
  head: () => ({
    meta: [
      { title: "Remote Sessions — ERAP Console" },
      { name: "description", content: "Live remote sessions, technician history, and administrator oversight for the private-WAN remote support platform." },
      { property: "og:title", content: "Remote Sessions — ERAP Console" },
      { property: "og:description", content: "Live remote sessions, technician history, and administrator oversight for the private-WAN remote support platform." },
    ],
  }),
  component: () => (
    <AppShell>
      <SessionsModule />
    </AppShell>
  ),
});