import { createFileRoute } from "@tanstack/react-router";
import { UsersModule } from "@/components/users/UsersModule";

export const Route = createFileRoute("/users")({
  head: () => ({
    meta: [
      { title: "Users, Roles & Permissions — Remote Admin Console" },
      { name: "description", content: "Manage identities, roles, permissions, device access rules and approval policies across the enterprise." },
      { property: "og:title", content: "Users, Roles & Permissions — Remote Admin Console" },
      { property: "og:description", content: "Manage identities, roles, permissions, device access rules and approval policies across the enterprise." },
    ],
  }),
  component: () => <UsersModule />,
});