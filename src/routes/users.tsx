import { createFileRoute } from "@tanstack/react-router";
import { UsersModule } from "@/components/users/UsersModule";
import { requirePermission } from "@/lib/route-guards";
import { AppShell } from "@/components/shell/AppShell";

export const Route = createFileRoute("/users")({
  beforeLoad: () => requirePermission("users.manage"),
  head: () => ({
    meta: [
      { title: "Users, Roles & Permissions — Remote Admin Console" },
      { name: "description", content: "Manage identities, roles, permissions, device access rules and approval policies across the enterprise." },
      { property: "og:title", content: "Users, Roles & Permissions — Remote Admin Console" },
      { property: "og:description", content: "Manage identities, roles, permissions, device access rules and approval policies across the enterprise." },
    ],
  }),
  component: () => (
    <AppShell>
      <UsersModule />
    </AppShell>
  ),
});