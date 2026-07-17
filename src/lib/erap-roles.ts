export type ErapRole =
  | "system_admin"
  | "regional_admin"
  | "senior_engineer"
  | "support_tech"
  | "helpdesk"
  | "auditor";

export const ROLE_LABELS: Record<ErapRole, string> = {
  system_admin: "System Administrator",
  regional_admin: "Regional Administrator",
  senior_engineer: "Senior Support Engineer",
  support_tech: "Support Technician",
  helpdesk: "Help Desk Operator",
  auditor: "Auditor",
};

export const ROLE_DESCRIPTIONS: Record<ErapRole, string> = {
  system_admin: "Full control of ERAP. Owns platform configuration, roles, policies and audit surface.",
  regional_admin: "Manages users and devices within an assigned region. Sees regional reports and audit logs.",
  senior_engineer: "Handles escalations. Full remote desktop toolkit and reporting for the support team.",
  support_tech: "First-line remote support. Remote desktop, chat and file transfer on assigned devices.",
  helpdesk: "Triages tickets. Searches devices and requests remote sessions, but does not launch them directly.",
  auditor: "Read-only compliance role. Reviews audit logs, session history and reports. Cannot connect.",
};

export type Permission =
  | "remote_desktop"
  | "file_transfer"
  | "clipboard"
  | "chat"
  | "restart"
  | "shutdown"
  | "wake_on_lan"
  | "force_disconnect"
  | "view_devices"
  | "view_reports"
  | "view_audit"
  | "manage_users"
  | "manage_roles"
  | "manage_policies"
  | "manage_branches"
  | "export_reports";

export const PERMISSION_LABELS: Record<Permission, string> = {
  remote_desktop: "Remote Desktop",
  file_transfer: "File Transfer",
  clipboard: "Clipboard Sharing",
  chat: "Chat",
  restart: "Restart Device",
  shutdown: "Shutdown Device",
  wake_on_lan: "Wake-on-LAN",
  force_disconnect: "Force Disconnect",
  view_devices: "View Devices",
  view_reports: "View Reports",
  view_audit: "View Audit Logs",
  manage_users: "Manage Users",
  manage_roles: "Manage Roles",
  manage_policies: "Manage Policies",
  manage_branches: "Manage Branches",
  export_reports: "Export Reports",
};

export const ROLE_PERMISSIONS: Record<ErapRole, Permission[]> = {
  system_admin: [
    "remote_desktop","file_transfer","clipboard","chat","restart","shutdown",
    "wake_on_lan","force_disconnect","view_devices","view_reports","view_audit",
    "manage_users","manage_roles","manage_policies","manage_branches","export_reports",
  ],
  regional_admin: [
    "remote_desktop","file_transfer","clipboard","chat","restart","shutdown",
    "view_devices","view_reports","view_audit","manage_users","manage_branches","export_reports",
  ],
  senior_engineer: [
    "remote_desktop","file_transfer","clipboard","chat","restart","shutdown",
    "wake_on_lan","view_devices","view_reports",
  ],
  support_tech: ["remote_desktop","file_transfer","chat","view_devices"],
  helpdesk: ["view_devices","chat"],
  auditor: ["view_devices","view_reports","view_audit","export_reports"],
};

export interface NavItem {
  key: string;
  label: string;
  to?: string;
}

export const ROLE_NAV: Record<ErapRole, NavItem[]> = {
  support_tech: [
    { key: "devices", label: "Devices", to: "/" },
    { key: "sessions", label: "Sessions" },
    { key: "history", label: "My Session History" },
    { key: "settings", label: "Settings" },
  ],
  senior_engineer: [
    { key: "devices", label: "Devices", to: "/" },
    { key: "sessions", label: "Sessions" },
    { key: "history", label: "My Session History" },
    { key: "reports", label: "Reports" },
    { key: "settings", label: "Settings" },
  ],
  regional_admin: [
    { key: "dashboard", label: "Dashboard" },
    { key: "devices", label: "Devices", to: "/" },
    { key: "sessions", label: "Sessions" },
    { key: "users", label: "Users", to: "/users" },
    { key: "branches", label: "Branches" },
    { key: "audit", label: "Audit Logs" },
    { key: "reports", label: "Reports" },
    { key: "settings", label: "Settings" },
  ],
  system_admin: [
    { key: "dashboard", label: "Dashboard" },
    { key: "devices", label: "Devices", to: "/" },
    { key: "sessions", label: "Sessions" },
    { key: "users", label: "Users", to: "/users" },
    { key: "roles", label: "Roles", to: "/users" },
    { key: "branches", label: "Branches" },
    { key: "departments", label: "Departments" },
    { key: "policies", label: "Policies", to: "/users" },
    { key: "audit", label: "Audit Logs" },
    { key: "reports", label: "Reports" },
    { key: "settings", label: "Settings" },
  ],
  helpdesk: [
    { key: "devices", label: "Devices", to: "/" },
    { key: "sessions", label: "Sessions" },
    { key: "history", label: "My Session History" },
    { key: "settings", label: "Settings" },
  ],
  auditor: [
    { key: "audit", label: "Audit Logs" },
    { key: "reports", label: "Reports" },
    { key: "sessions", label: "Sessions" },
    { key: "settings", label: "Settings" },
  ],
};

export function hasPermission(role: ErapRole, perm: Permission) {
  return ROLE_PERMISSIONS[role].includes(perm);
}