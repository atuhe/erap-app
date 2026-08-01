import {
  LayoutDashboard,
  MonitorSmartphone,
  Radio,
  Package,
  Users,
  ShieldCheck,
  Terminal,
  History,
  ScrollText,
  Siren,
  Settings,
  FileBarChart,
  type LucideIcon,
} from "lucide-react";
import type { Permission } from "./erap-roles";

export interface NavLink {
  key: string;
  label: string;
  to: string;
  icon: LucideIcon;
  perm?: Permission;
}

export interface NavGroup {
  key: string;
  label: string;
  items: NavLink[];
}

export const APP_NAV: NavGroup[] = [
  {
    key: "overview",
    label: "Overview",
    items: [
      { key: "devices", label: "Devices", to: "/", icon: MonitorSmartphone },
    ],
  },
  {
    key: "operations",
    label: "Operations",
    items: [
      { key: "console", label: "Session Console", to: "/console", icon: Terminal, perm: "remote_desktop" },
      { key: "sessions", label: "Remote Sessions", to: "/sessions", icon: Radio },
      { key: "agents", label: "Agent Management", to: "/agents", icon: Package, perm: "view_devices" },
    ],
  },
  {
    key: "identity",
    label: "Identity",
    items: [
      { key: "users", label: "Users & Roles", to: "/users", icon: Users, perm: "view_devices" },
    ],
  },
  {
    key: "security",
    label: "Security Center",
    items: [
      { key: "security", label: "Audit & Compliance", to: "/security", icon: ShieldCheck, perm: "view_audit" },
    ],
  },
  {
    key: "insights",
    label: "Insights",
    items: [
      { key: "reports", label: "Reports", to: "/reports", icon: FileBarChart, perm: "view_reports" },
    ],
  },
];

export const ROUTE_META: Record<string, { title: string; breadcrumbs: { label: string; to?: string }[] }> = {
  "/": {
    title: "Devices",
    breadcrumbs: [{ label: "Overview" }, { label: "Devices" }],
  },
  "/console": {
    title: "Session Console",
    breadcrumbs: [{ label: "Operations" }, { label: "Session Console" }],
  },
  "/sessions": {
    title: "Remote Sessions",
    breadcrumbs: [{ label: "Operations" }, { label: "Remote Sessions" }],
  },
  "/agents": {
    title: "Agent Management",
    breadcrumbs: [{ label: "Operations" }, { label: "Agent Management" }],
  },
  "/users": {
    title: "Users, Roles & Permissions",
    breadcrumbs: [{ label: "Identity" }, { label: "Users & Roles" }],
  },
  "/security": {
    title: "Security Center",
    breadcrumbs: [{ label: "Security" }, { label: "Audit & Compliance" }],
  },
  "/reports": {
    title: "Reports",
    breadcrumbs: [{ label: "Insights" }, { label: "Reports" }],
  },
};

// Kept for future settings/reports pages.
export const AUX_ICONS = { LayoutDashboard, History, ScrollText, Siren, Settings, FileBarChart };