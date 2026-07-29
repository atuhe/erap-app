// The real roles, matching the backend ROLES table and the JWT.
export type ErapRole = "Administrator" | "Support Officer" | "Supervisor" | "Viewer";

export const ALL_ROLES: ErapRole[] = ["Administrator", "Support Officer", "Supervisor", "Viewer"];

export const ROLE_LABELS: Record<ErapRole, string> = {
  "Administrator": "Administrator",
  "Support Officer": "Support Officer",
  "Supervisor": "Supervisor",
  "Viewer": "Viewer",
};

export const ROLE_DESCRIPTIONS: Record<ErapRole, string> = {
  "Administrator": "Full platform administration — users, roles, devices, sessions, and the audit surface.",
  "Support Officer": "Initiates and runs remote sessions on managed devices.",
  "Supervisor": "Oversees sessions, approves access, and reviews the audit trail.",
  "Viewer": "Read-only access to inventory, session history, and logs.",
};

// UI-side permission concepts used for badges/toggles in the console.
export type Permission =
  | "remote_desktop" | "file_transfer" | "clipboard" | "chat" | "restart" | "shutdown"
  | "wake_on_lan" | "force_disconnect" | "view_devices" | "view_reports" | "view_audit"
  | "manage_users" | "manage_roles" | "manage_policies" | "manage_branches" | "export_reports";

export const PERMISSION_LABELS: Record<Permission, string> = {
  remote_desktop: "Remote Desktop", file_transfer: "File Transfer", clipboard: "Clipboard Sharing",
  chat: "Chat", restart: "Restart Device", shutdown: "Shutdown Device", wake_on_lan: "Wake-on-LAN",
  force_disconnect: "Force Disconnect", view_devices: "View Devices", view_reports: "View Reports",
  view_audit: "View Audit Logs", manage_users: "Manage Users", manage_roles: "Manage Roles",
  manage_policies: "Manage Policies", manage_branches: "Manage Branches", export_reports: "Export Reports",
};

export const ROLE_PERMISSIONS: Record<ErapRole, Permission[]> = {
  "Administrator": [
    "remote_desktop","file_transfer","clipboard","chat","restart","shutdown",
    "wake_on_lan","force_disconnect","view_devices","view_reports","view_audit",
    "manage_users","manage_roles","manage_policies","manage_branches","export_reports",
  ],
  "Supervisor": [
    "remote_desktop","file_transfer","clipboard","chat","restart","force_disconnect",
    "view_devices","view_reports","view_audit","manage_users","export_reports",
  ],
  "Support Officer": [
    "remote_desktop","file_transfer","clipboard","chat","restart","view_devices",
  ],
  "Viewer": ["view_devices","view_reports","view_audit","export_reports"],
};

export interface NavItem { key: string; label: string; to?: string; }

export const ROLE_NAV: Record<ErapRole, NavItem[]> = {
  "Administrator": [
    { key: "dashboard", label: "Dashboard" },
    { key: "devices", label: "Devices", to: "/" },
    { key: "sessions", label: "Sessions" },
    { key: "users", label: "Users", to: "/users" },
    { key: "audit", label: "Audit Logs" },
    { key: "reports", label: "Reports" },
    { key: "settings", label: "Settings" },
  ],
  "Supervisor": [
    { key: "dashboard", label: "Dashboard" },
    { key: "devices", label: "Devices", to: "/" },
    { key: "sessions", label: "Sessions" },
    { key: "users", label: "Users", to: "/users" },
    { key: "audit", label: "Audit Logs" },
    { key: "reports", label: "Reports" },
    { key: "settings", label: "Settings" },
  ],
  "Support Officer": [
    { key: "devices", label: "Devices", to: "/" },
    { key: "sessions", label: "Sessions" },
    { key: "history", label: "My Session History" },
    { key: "settings", label: "Settings" },
  ],
  "Viewer": [
    { key: "audit", label: "Audit Logs" },
    { key: "reports", label: "Reports" },
    { key: "sessions", label: "Sessions" },
    { key: "settings", label: "Settings" },
  ],
};

export function hasPermission(role: ErapRole, perm: Permission) {
  return ROLE_PERMISSIONS[role].includes(perm);
}
