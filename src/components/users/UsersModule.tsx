import { useMemo, useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  MonitorSmartphone,
  Radio,
  History,
  Settings as SettingsIcon,
  Users as UsersIcon,
  ShieldCheck,
  Building2,
  Boxes,
  FileBarChart2,
  ScrollText,
  KeyRound,
  Plug,
  Bell,
  ChevronDown,
  Search,
  Lock,
  Unlock,
  UserCog,
  UserX,
  RotateCw,
  Eye,
  Circle,
  ShieldAlert,
  Check,
  X,
  Activity as ActivityIcon,
  Clock,
  AlertTriangle,
  MonitorSmartphone as DeviceIcon,
  KeyRound as KeyIcon,
  UserCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  ErapRole, ROLE_LABELS, ROLE_DESCRIPTIONS, ROLE_PERMISSIONS,
  PERMISSION_LABELS, Permission, ROLE_NAV, hasPermission,
} from "@/lib/erap-roles";
import { logAudit } from "@/lib/audit-log";
import { useBackendUsers, type AppUser } from "@/features/users/useBackendUsers";
import { AuditLogView } from "@/components/audit/AuditLogView";

type Status = "active" | "disabled" | "locked";


const BRANCHES = ["New York", "London", "Berlin", "San Francisco", "Tokyo", "Singapore"];
const DEPARTMENTS = ["IT Operations", "Finance", "HR", "Engineering", "Design", "Legal", "Support"];


// ---------- Shell ----------

const NAV_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  dashboard: LayoutDashboard,
  devices: MonitorSmartphone,
  sessions: Radio,
  history: History,
  settings: SettingsIcon,
  users: UsersIcon,
  roles: ShieldCheck,
  branches: Building2,
  departments: Boxes,
  policies: ScrollText,
  audit: ScrollText,
  reports: FileBarChart2,
};

export function UsersModule() {
  const [role, setRole] = useState<ErapRole>("Administrator");
  const [tab, setTab] = useState("dashboard");
  const canManageUsers = hasPermission(role, "manage_users");
  const canManageRoles = hasPermission(role, "manage_roles");
  const canManagePolicies = hasPermission(role, "manage_policies");
  const canViewAudit = hasPermission(role, "view_audit");
  const canExportReports = hasPermission(role, "export_reports");
  const viewerName = "Alex Morgan";

  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const nav = ROLE_NAV[role];

  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex h-screen w-full overflow-hidden bg-background text-foreground">
        {/* Sidebar */}
        <aside className="hidden w-60 flex-col bg-sidebar text-sidebar-foreground md:flex">
          <div className="flex h-14 items-center gap-2 border-b border-sidebar-border px-4">
            <div className="grid h-8 w-8 place-items-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
              <Plug className="h-4 w-4" />
            </div>
            <div className="leading-tight">
              <div className="text-sm font-semibold">RemoteAdmin</div>
              <div className="text-[11px] text-sidebar-foreground/60">Enterprise Console</div>
            </div>
          </div>
          <nav className="flex-1 space-y-1 p-2">
            {nav.map((n) => {
              const Icon = NAV_ICONS[n.key] ?? Boxes;
              const active = n.to === pathname || (n.key === "users" && pathname === "/users");
              const content = (
                <>
                  <Icon className="h-4 w-4" />
                  {n.label}
                </>
              );
              const cls = cn(
                "flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-sidebar-primary text-sidebar-primary-foreground"
                  : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              );
              return n.to ? (
                <Link key={n.key} to={n.to} className={cls}>{content}</Link>
              ) : (
                <button key={n.key} className={cls} onClick={() => toast(`${n.label} — coming soon`)}>{content}</button>
              );
            })}
          </nav>
          <div className="border-t border-sidebar-border p-3 text-xs text-sidebar-foreground/60">
            v2.4.1 · Build 20260717
          </div>
        </aside>

        {/* Main */}
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex h-14 items-center gap-3 border-b bg-card px-4">
            <div className="min-w-0">
              <h1 className="truncate text-sm font-semibold">Users, Roles &amp; Permissions</h1>
              <p className="text-[11px] text-muted-foreground">Identity, access control and approval policies</p>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <Select value={role} onValueChange={(v) => setRole(v as ErapRole)}>
                <SelectTrigger className="h-9 w-[220px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(ROLE_LABELS) as ErapRole[]).map((r) => (
                    <SelectItem key={r} value={r}>Role: {ROLE_LABELS[r]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="ghost" size="icon" aria-label="Notifications">
                <Bell className="h-4 w-4" />
              </Button>
              <div className="flex items-center gap-2 rounded-md border px-2 py-1 text-xs">
                <div className="grid h-6 w-6 place-items-center rounded-full bg-primary text-primary-foreground text-[10px] font-semibold">AM</div>
                <span className="hidden sm:inline">Alex Morgan</span>
                <ChevronDown className="h-3 w-3 text-muted-foreground" />
              </div>
            </div>
          </header>

          <div className="flex min-h-0 flex-1 flex-col">
            <Tabs value={tab} onValueChange={setTab} className="flex min-h-0 flex-1 flex-col">
              <div className="border-b bg-card px-4">
                <TabsList className="h-11 bg-transparent p-0">
                  <TabsTrigger value="dashboard" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4">Dashboard</TabsTrigger>
                  <TabsTrigger value="users" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4">Users</TabsTrigger>
                  <TabsTrigger value="roles" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4">Roles</TabsTrigger>
                  <TabsTrigger value="matrix" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4">Permission Matrix</TabsTrigger>
                  <TabsTrigger value="access" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4">Device Access</TabsTrigger>
                  <TabsTrigger value="policies" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4">Approval Policies</TabsTrigger>
                  <TabsTrigger value="activity" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4">Activity</TabsTrigger>
                  <TabsTrigger value="audit" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4">Audit Logs</TabsTrigger>
                </TabsList>
              </div>

              <ScrollArea className="flex-1">
                <TabsContent value="dashboard" className="m-0 p-4"><DashboardTab /></TabsContent>
                <TabsContent value="users" className="m-0 p-4"><UsersTab canManage={canManageUsers} viewerRole={role} viewerName={viewerName} /></TabsContent>
                <TabsContent value="roles" className="m-0 p-4"><RolesTab canManage={canManageRoles} /></TabsContent>
                <TabsContent value="matrix" className="m-0 p-4"><MatrixTab /></TabsContent>
                <TabsContent value="access" className="m-0 p-4"><AccessTab canManage={canManageUsers} /></TabsContent>
                <TabsContent value="policies" className="m-0 p-4"><PoliciesTab canManage={canManagePolicies} /></TabsContent>
                <TabsContent value="activity" className="m-0 p-4"><ActivityTab /></TabsContent>
                <TabsContent value="audit" className="m-0 p-4">
                  {canViewAudit ? (
                    <AuditLogView canExport={canExportReports} />
                  ) : (
                    <div className="rounded-md border border-amber-500/30 bg-amber-500/5 p-4 text-sm text-amber-700 dark:text-amber-400">
                      Your role does not include the View Audit Logs permission.
                    </div>
                  )}
                </TabsContent>
              </ScrollArea>
            </Tabs>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}

// ---------- Dashboard ----------

function DashboardTab() {
  const users = useBackendUsers();
  const total = users.length;
  const onlineTech = users.filter((u) => u.online && u.role === "Support Officer").length;
  const admins = users.filter((u) => u.role === "Administrator" || u.role === "Supervisor").length;
  const locked = users.filter((u) => u.status === "locked").length;
  const disabled = users.filter((u) => u.status === "disabled").length;

  const kpis = [
    { label: "Total Users", value: total, icon: UsersIcon, tone: "text-primary" },
    { label: "Online Technicians", value: onlineTech, icon: ActivityIcon, tone: "text-emerald-600" },
    { label: "Administrators", value: admins, icon: ShieldCheck, tone: "text-blue-600" },
    { label: "Locked Accounts", value: locked, icon: Lock, tone: "text-amber-600" },
    { label: "Disabled Accounts", value: disabled, icon: UserX, tone: "text-red-600" },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {kpis.map((k) => {
        const Icon = k.icon;
        return (
          <Card key={k.label}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardDescription>{k.label}</CardDescription>
                <Icon className={cn("h-4 w-4", k.tone)} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold">{k.value}</div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

// ---------- Users ----------

function UsersTab({ canManage, viewerRole, viewerName }: { canManage: boolean; viewerRole: ErapRole; viewerName: string }) {
  const users = useBackendUsers();
  const [q, setQ] = useState("");
  const [fRole, setFRole] = useState("all");
  const [fBranch, setFBranch] = useState("all");
  const [fDept, setFDept] = useState("all");
  const [fStatus, setFStatus] = useState("all");
  const [detail, setDetail] = useState<AppUser | null>(null);
  const [assign, setAssign] = useState<AppUser | null>(null);
  const [mfaMap, setMfaMap] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(users.map((u) => [u.id, u.mfa])),
  );

  const audit = (
    action: string,
    u: AppUser,
    status: "success" | "denied" | "info" = "success",
    details?: string,
    category: "user" | "role" | "mfa" = "user",
  ) =>
    logAudit({
      actor: viewerName,
      actorRole: viewerRole,
      category,
      action,
      target: u.fullName,
      targetId: u.id,
      status,
      details,
    });

  const guarded = (u: AppUser, action: string, fn: () => void) => {
    if (!canManage) {
      audit(action, u, "denied", "Role lacks Manage Users permission");
      toast.error("Your role can't perform this action");
      return;
    }
    fn();
  };

  const openDetail = (u: AppUser) => {
    setDetail(u);
    audit("view_user", u, "info", "Opened profile");
  };

  const toggleMfa = (u: AppUser, next: boolean) => {
    setMfaMap((m) => ({ ...m, [u.id]: next }));
    audit(
      next ? "mfa_enabled" : "mfa_disabled",
      u,
      "success",
      "Placeholder toggle — enrollment ships in a future release",
      "mfa",
    );
    toast.success(next ? `MFA marked required for ${u.fullName}` : `MFA requirement removed for ${u.fullName}`);
  };

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return users.filter((u) => {
      if (fRole !== "all" && u.role !== fRole) return false;
      if (fBranch !== "all" && u.branch !== fBranch) return false;
      if (fDept !== "all" && u.department !== fDept) return false;
      if (fStatus !== "all" && u.status !== fStatus) return false;
      if (!term) return true;
      return (
        u.fullName.toLowerCase().includes(term) ||
        u.username.toLowerCase().includes(term) ||
        u.employeeNo.toLowerCase().includes(term) ||
        u.email.toLowerCase().includes(term)
      );
    });
  }, [q, fRole, fBranch, fDept, fStatus]);

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-[280px] flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search Full Name, Username, Employee #, or Email…" className="h-9 pl-9" />
            </div>
            <Select value={fRole} onValueChange={setFRole}>
              <SelectTrigger className="h-9 w-[180px]"><SelectValue placeholder="Role" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                {(Object.keys(ROLE_LABELS) as ErapRole[]).map((r) => (<SelectItem key={r} value={r}>{ROLE_LABELS[r]}</SelectItem>))}
              </SelectContent>
            </Select>
            <Select value={fBranch} onValueChange={setFBranch}>
              <SelectTrigger className="h-9 w-[160px]"><SelectValue placeholder="Branch" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Branches</SelectItem>
                {BRANCHES.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={fDept} onValueChange={setFDept}>
              <SelectTrigger className="h-9 w-[180px]"><SelectValue placeholder="Department" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {DEPARTMENTS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={fStatus} onValueChange={setFStatus}>
              <SelectTrigger className="h-9 w-[150px]"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="locked">Locked</SelectItem>
                <SelectItem value="disabled">Disabled</SelectItem>
              </SelectContent>
            </Select>
            <div className="ml-auto text-xs text-muted-foreground">{filtered.length} of {users.length} users</div>
          </div>
        </CardContent>
      </Card>

      <div className="overflow-hidden rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40">
              <TableHead className="w-[52px]"></TableHead>
              <TableHead>Full Name</TableHead>
              <TableHead>Username</TableHead>
              <TableHead>Employee #</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Branch</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Last Login</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((u) => (
              <TableRow key={u.id} className="cursor-pointer" onClick={() => openDetail(u)}>
                <TableCell><UserAvatar name={u.fullName} online={u.online} /></TableCell>
                <TableCell className="font-medium">{u.fullName}</TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">{u.username}</TableCell>
                <TableCell className="text-muted-foreground">{u.employeeNo}</TableCell>
                <TableCell><RoleBadge role={u.role} /></TableCell>
                <TableCell>{u.branch}</TableCell>
                <TableCell>{u.department}</TableCell>
                <TableCell className="text-muted-foreground">{u.lastLogin}</TableCell>
                <TableCell><StatusBadge status={u.status} /></TableCell>
                <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                  <div className="flex justify-end gap-1">
                    <IconBtn label="View" onClick={() => openDetail(u)}><Eye className="h-4 w-4" /></IconBtn>
                    <IconBtn label={canManage ? "Edit" : "Requires Manage Users"} disabled={!canManage} onClick={() => guarded(u, "edit_user", () => setAssign(u))}><UserCog className="h-4 w-4" /></IconBtn>
                    <IconBtn label={canManage ? "Reset Password" : "Requires Manage Users"} disabled={!canManage} onClick={() => guarded(u, "reset_password", () => { audit("reset_password", u, "success", `Reset link sent to ${u.email}`); toast.success(`Password reset link sent to ${u.email}`); })}><KeyRound className="h-4 w-4" /></IconBtn>
                    <IconBtn label={canManage ? "Disable" : "Requires Manage Users"} disabled={!canManage || u.status === "disabled"} onClick={() => guarded(u, "disable_account", () => { audit("disable_account", u); toast.success(`${u.fullName} disabled`); })}><UserX className="h-4 w-4" /></IconBtn>
                    <IconBtn label={canManage ? "Unlock" : "Requires Manage Users"} disabled={!canManage || u.status !== "locked"} onClick={() => guarded(u, "unlock_account", () => { audit("unlock_account", u); toast.success(`${u.fullName} unlocked`); })}><Unlock className="h-4 w-4" /></IconBtn>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow><TableCell colSpan={10} className="h-32 text-center text-sm text-muted-foreground">No users match the current filters.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <UserDetailSheet
        user={detail}
        onClose={() => setDetail(null)}
        onEdit={(u) => { setDetail(null); setAssign(u); }}
        canManage={canManage}
        mfaEnabled={detail ? mfaMap[detail.id] ?? detail.mfa : false}
        onToggleMfa={(next) => detail && toggleMfa(detail, next)}
        onReset={(u) => guarded(u, "reset_password", () => { audit("reset_password", u, "success", `Reset link sent to ${u.email}`); toast.success(`Password reset link sent to ${u.email}`); })}
        onDisable={(u) => guarded(u, "disable_account", () => { audit("disable_account", u); toast.success(`${u.fullName} disabled`); })}
        onUnlock={(u) => guarded(u, "unlock_account", () => { audit("unlock_account", u); toast.success(`${u.fullName} unlocked`); })}
      />
      <AssignRoleDialog
        user={assign}
        onClose={() => setAssign(null)}
        viewerRole={viewerRole}
        viewerName={viewerName}
      />
    </div>
  );
}

function IconBtn({ children, label, onClick, disabled }: { children: React.ReactNode; label: string; onClick: () => void; disabled?: boolean }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span>
          <Button variant="ghost" size="icon" className="h-8 w-8" disabled={disabled} onClick={onClick}>{children}</Button>
        </span>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

function UserAvatar({ name, online }: { name: string; online: boolean }) {
  const initials = name.split(" ").map((s) => s[0]).slice(0, 2).join("").toUpperCase();
  return (
    <div className="relative">
      <Avatar className="h-8 w-8"><AvatarFallback className="text-xs">{initials}</AvatarFallback></Avatar>
      <span className={cn("absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full ring-2 ring-card", online ? "bg-emerald-500" : "bg-muted-foreground/40")} />
    </div>
  );
}

function StatusBadge({ status }: { status: Status }) {
  const map = {
    active: { label: "Active", cls: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400", dot: "text-emerald-500" },
    locked: { label: "Locked", cls: "bg-amber-500/10 text-amber-700 dark:text-amber-400", dot: "text-amber-500" },
    disabled: { label: "Disabled", cls: "bg-red-500/10 text-red-700 dark:text-red-400", dot: "text-red-500" },
  }[status];
  return (
    <Badge variant="outline" className={cn("gap-1.5 border-transparent font-medium", map.cls)}>
      <Circle className={cn("h-2 w-2 fill-current", map.dot)} />{map.label}
    </Badge>
  );
}

function RoleBadge({ role }: { role: ErapRole }) {
  const tones: Record<ErapRole, string> = {
    "Administrator": "bg-primary/10 text-primary",
    "Supervisor": "bg-blue-500/10 text-blue-700 dark:text-blue-400",
    "Support Officer": "bg-slate-500/10 text-slate-700 dark:text-slate-300",
    "Viewer": "bg-amber-500/10 text-amber-700 dark:text-amber-400",
  };
  return <Badge variant="outline" className={cn("border-transparent font-medium", tones[role])}>{ROLE_LABELS[role]}</Badge>;
}

// ---------- User Detail Sheet ----------

function UserDetailSheet({
  user, onClose, onEdit, canManage,
  mfaEnabled, onToggleMfa, onReset, onDisable, onUnlock,
}: {
  user: AppUser | null;
  onClose: () => void;
  onEdit: (u: AppUser) => void;
  canManage: boolean;
  mfaEnabled: boolean;
  onToggleMfa: (next: boolean) => void;
  onReset: (u: AppUser) => void;
  onDisable: (u: AppUser) => void;
  onUnlock: (u: AppUser) => void;
}) {
  return (
    <Sheet open={!!user} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
        {user && (
          <div className="space-y-6 pt-2">
            <div className="flex items-start gap-4">
              <UserAvatar name={user.fullName} online={user.online} />
              <div className="min-w-0 flex-1">
                <h2 className="text-lg font-semibold">{user.fullName}</h2>
                <p className="font-mono text-xs text-muted-foreground">{user.username} · {user.employeeNo}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <RoleBadge role={user.role} />
                  <StatusBadge status={user.status} />
                  {mfaEnabled ? (
                    <Badge variant="outline" className="gap-1 border-transparent bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"><ShieldCheck className="h-3 w-3" />MFA Required</Badge>
                  ) : (
                    <Badge variant="outline" className="gap-1 border-transparent bg-amber-500/10 text-amber-700 dark:text-amber-400"><ShieldAlert className="h-3 w-3" />MFA Off</Badge>
                  )}
                </div>
              </div>
            </div>

            <Section title="Personal Information">
              <Field label="Full Name" value={user.fullName} />
              <Field label="Username" value={user.username} mono />
              <Field label="Employee #" value={user.employeeNo} />
              <Field label="Email" value={user.email} />
              <Field label="Phone" value={user.phone} />
            </Section>

            <Section title="Organization">
              <Field label="Branch" value={user.branch} />
              <Field label="Department" value={user.department} />
              <Field label="Position" value={user.position} />
              <Field label="Supervisor" value={user.supervisor} />
            </Section>

            <Section title="Account Information">
              <Field label="Account Status" value={<StatusBadge status={user.status} />} />
              <Field label="Date Created" value={user.createdAt} />
              <Field label="Last Login" value={user.lastLogin} />
              <Field label="Password Last Changed" value={user.passwordChanged} />
              <Field label="MFA Enabled" value={mfaEnabled ? "Yes" : "No"} />
            </Section>

            <Section title="Multi-Factor Authentication">
              <div className="col-span-2 space-y-3">
                <div className="flex items-center justify-between rounded-md border bg-background px-3 py-2">
                  <div>
                    <div className="text-sm font-medium">Require MFA for this user</div>
                    <div className="text-xs text-muted-foreground">Placeholder control. Toggling records an audit event.</div>
                  </div>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span>
                        <Switch
                          checked={mfaEnabled}
                          disabled={!canManage}
                          onCheckedChange={(v) => onToggleMfa(!!v)}
                        />
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>{canManage ? "Marks MFA as required — enrollment ships in an upcoming release" : "Requires Manage Users permission"}</TooltipContent>
                  </Tooltip>
                </div>
                <div className="rounded-md border border-primary/20 bg-primary/5 p-3 text-xs text-primary/90">
                  Rollout note · Enforcement, enrollment and recovery codes ship in a future release. This control marks the intent so admins can stage policy today.
                </div>
              </div>
            </Section>

            <Section title="Permissions Summary">
              <div className="col-span-2 flex flex-wrap gap-2">
                {ROLE_PERMISSIONS[user.role].map((p) => (
                  <Badge key={p} variant="secondary" className="font-normal">{PERMISSION_LABELS[p]}</Badge>
                ))}
              </div>
            </Section>

            <Separator />
            <div className="grid grid-cols-2 gap-2">
              <Button disabled={!canManage} onClick={() => onEdit(user)}><UserCog className="mr-2 h-4 w-4" />Edit User</Button>
              <Button variant="outline" disabled={!canManage} onClick={() => onReset(user)}><KeyRound className="mr-2 h-4 w-4" />Reset Password</Button>
              <Button variant="outline" disabled={!canManage || user.status === "disabled"} onClick={() => onDisable(user)}><UserX className="mr-2 h-4 w-4" />Disable Account</Button>
              <Button variant="outline" disabled={!canManage || user.status !== "locked"} onClick={() => onUnlock(user)}><Unlock className="mr-2 h-4 w-4" />Unlock Account</Button>
              <Button variant="outline" className="col-span-2" onClick={() => toast("Opening activity timeline…")}><ActivityIcon className="mr-2 h-4 w-4" />View Activity</Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</h3>
      <div className="grid grid-cols-2 gap-x-4 gap-y-2 rounded-lg border bg-muted/20 p-3">{children}</div>
    </div>
  );
}

function Field({ label, value, mono }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div className="text-sm">
      <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className={cn("mt-0.5 break-words", mono && "font-mono text-xs")}>{value}</div>
    </div>
  );
}

// ---------- Assign Role Dialog ----------

function AssignRoleDialog({ user, onClose, viewerRole, viewerName }: { user: AppUser | null; onClose: () => void; viewerRole: ErapRole; viewerName: string }) {
  const [newRole, setNewRole] = useState<ErapRole>("Support Officer");
  const [branch, setBranch] = useState("New York");
  const [dept, setDept] = useState("Support");
  const [perms, setPerms] = useState({
    unattended: false, fileTransfer: true, clipboard: true, restart: false, shutdown: false, forceDisc: false,
  });
  const canSave = viewerRole === "Administrator" || viewerRole === "Supervisor";

  return (
    <Dialog open={!!user} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Assign Role</DialogTitle>
          <DialogDescription>Update role, scope and additional per-session permissions.</DialogDescription>
        </DialogHeader>
        {user && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">User</Label><div className="mt-1 rounded-md border bg-muted/30 px-3 py-2 text-sm">{user.fullName}</div></div>
              <div><Label className="text-xs">Current Role</Label><div className="mt-1 rounded-md border bg-muted/30 px-3 py-2 text-sm">{ROLE_LABELS[user.role]}</div></div>
              <div className="col-span-2">
                <Label className="text-xs">New Role</Label>
                <Select value={newRole} onValueChange={(v) => setNewRole(v as ErapRole)}>
                  <SelectTrigger className="mt-1 h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(Object.keys(ROLE_LABELS) as ErapRole[]).map((r) => (<SelectItem key={r} value={r}>{ROLE_LABELS[r]}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Branch</Label>
                <Select value={branch} onValueChange={setBranch}>
                  <SelectTrigger className="mt-1 h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>{BRANCHES.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Department</Label>
                <Select value={dept} onValueChange={setDept}>
                  <SelectTrigger className="mt-1 h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>{DEPARTMENTS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label className="text-xs">Additional Permissions</Label>
              <div className="mt-2 grid grid-cols-2 gap-2 rounded-md border p-3">
                {[
                  ["unattended", "Allow Unattended Connections"],
                  ["fileTransfer", "Allow File Transfer"],
                  ["clipboard", "Allow Clipboard"],
                  ["restart", "Allow Remote Restart"],
                  ["shutdown", "Allow Shutdown"],
                  ["forceDisc", "Allow Force Disconnect"],
                ].map(([k, l]) => (
                  <label key={k} className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={perms[k as keyof typeof perms]}
                      onCheckedChange={(v) => setPerms((p) => ({ ...p, [k]: !!v }))}
                    />
                    {l}
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Tooltip>
            <TooltipTrigger asChild>
              <span>
                <Button disabled={!canSave} onClick={() => {
                  if (user) {
                    logAudit({
                      actor: viewerName,
                      actorRole: viewerRole,
                      category: "role",
                      action: "role_change",
                      target: user.fullName,
                      targetId: user.id,
                      status: "success",
                      details: `${ROLE_LABELS[user.role]} → ${ROLE_LABELS[newRole]} · ${branch} / ${dept}`,
                    });
                    logAudit({
                      actor: viewerName,
                      actorRole: viewerRole,
                      category: "user",
                      action: "edit_user",
                      target: user.fullName,
                      targetId: user.id,
                      status: "success",
                      details: "Session permissions updated",
                    });
                  }
                  toast.success(`Role updated for ${user?.fullName}`);
                  onClose();
                }}>Save</Button>
              </span>
            </TooltipTrigger>
            {!canSave && <TooltipContent>Requires Manage Users permission</TooltipContent>}
          </Tooltip>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------- Roles ----------

function RolesTab({ canManage }: { canManage: boolean }) {
  const roles = Object.keys(ROLE_LABELS) as ErapRole[];
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {roles.map((r) => (
        <Card key={r} className="flex flex-col">
          <CardHeader>
            <div className="flex items-start justify-between gap-2">
              <div>
                <CardTitle className="text-base">{ROLE_LABELS[r]}</CardTitle>
                <CardDescription className="mt-1">{ROLE_DESCRIPTIONS[r]}</CardDescription>
              </div>
              <ShieldCheck className="h-5 w-5 text-primary shrink-0" />
            </div>
          </CardHeader>
          <CardContent className="flex-1">
            <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Permissions</div>
            <div className="flex flex-wrap gap-1.5">
              {ROLE_PERMISSIONS[r].map((p) => (
                <Badge key={p} variant="secondary" className="font-normal">{PERMISSION_LABELS[p]}</Badge>
              ))}
            </div>
            {r === "Viewer" && (
              <div className="mt-3 flex items-start gap-2 rounded-md border border-amber-500/30 bg-amber-500/5 p-2 text-xs text-amber-700 dark:text-amber-400">
                <ShieldAlert className="mt-0.5 h-3.5 w-3.5" />
                Cannot initiate remote desktop sessions.
              </div>
            )}
          </CardContent>
          <div className="border-t p-3">
            <Tooltip>
              <TooltipTrigger asChild>
                <span>
                  <Button variant="outline" size="sm" disabled={!canManage} onClick={() => toast("Edit role permissions…")}>
                    Edit permissions
                  </Button>
                </span>
              </TooltipTrigger>
              {!canManage && <TooltipContent>Requires Manage Roles</TooltipContent>}
            </Tooltip>
          </div>
        </Card>
      ))}
    </div>
  );
}

// ---------- Matrix ----------

function MatrixTab() {
  const perms = Object.keys(PERMISSION_LABELS) as Permission[];
  const roles = Object.keys(ROLE_LABELS) as ErapRole[];
  return (
    <div className="overflow-hidden rounded-lg border bg-card">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40">
              <TableHead className="min-w-[220px]">Permission</TableHead>
              {roles.map((r) => (
                <TableHead key={r} className="text-center whitespace-nowrap">{ROLE_LABELS[r]}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {perms.map((p) => (
              <TableRow key={p}>
                <TableCell className="font-medium">{PERMISSION_LABELS[p]}</TableCell>
                {roles.map((r) => (
                  <TableCell key={r} className="text-center">
                    {ROLE_PERMISSIONS[r].includes(p) ? (
                      <Check className="mx-auto h-4 w-4 text-emerald-600" />
                    ) : (
                      <X className="mx-auto h-4 w-4 text-muted-foreground/40" />
                    )}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

// ---------- Device Access ----------

const SAMPLE_DEVICES = [
  { id: "DEV-10241", hostname: "NYC-FIN-WS01", branch: "New York", department: "Finance" },
  { id: "DEV-10242", hostname: "LON-HR-LT14", branch: "London", department: "HR" },
  { id: "DEV-10243", hostname: "BER-ENG-WS22", branch: "Berlin", department: "Engineering" },
  { id: "DEV-10244", hostname: "SFO-DES-MB08", branch: "San Francisco", department: "Design" },
  { id: "DEV-10245", hostname: "TOK-OPS-WS05", branch: "Tokyo", department: "Operations" },
  { id: "DEV-10246", hostname: "NYC-ENG-WS31", branch: "New York", department: "Engineering" },
  { id: "DEV-10247", hostname: "LON-FIN-LT02", branch: "London", department: "Finance" },
  { id: "DEV-10248", hostname: "BER-HR-WS10", branch: "Berlin", department: "HR" },
];

function AccessTab({ canManage }: { canManage: boolean }) {
  const [scope, setScope] = useState("branch");
  const [branch, setBranch] = useState("New York");
  const [dept, setDept] = useState("Finance");
  const [allowAll, setAllowAll] = useState(false);
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<Record<string, boolean>>({ "DEV-10241": true, "DEV-10246": true });
  const [denied, setDenied] = useState<Record<string, boolean>>({ "DEV-10243": true });

  const filtered = SAMPLE_DEVICES.filter((d) =>
    !q ? true : (d.id + d.hostname + d.branch + d.department).toLowerCase().includes(q.toLowerCase()),
  );

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[360px_1fr]">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Access scope</CardTitle>
          <CardDescription>Choose how devices are granted to this user or role.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-xs">Assign By</Label>
            <Select value={scope} onValueChange={setScope}>
              <SelectTrigger className="mt-1 h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="branch">Branch</SelectItem>
                <SelectItem value="department">Department</SelectItem>
                <SelectItem value="individual">Individual Devices</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {scope === "branch" && (
            <div>
              <Label className="text-xs">Branch</Label>
              <Select value={branch} onValueChange={setBranch}>
                <SelectTrigger className="mt-1 h-9"><SelectValue /></SelectTrigger>
                <SelectContent>{BRANCHES.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          )}
          {scope === "department" && (
            <div>
              <Label className="text-xs">Department</Label>
              <Select value={dept} onValueChange={setDept}>
                <SelectTrigger className="mt-1 h-9"><SelectValue /></SelectTrigger>
                <SelectContent>{DEPARTMENTS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          )}
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium">Allow All Devices</div>
              <div className="text-xs text-muted-foreground">Grants access to every managed endpoint.</div>
            </div>
            <Switch checked={allowAll} onCheckedChange={setAllowAll} disabled={!canManage} />
          </div>
          <div className="rounded-md border p-3 text-xs">
            <div className="mb-1 font-semibold">Deny Specific Devices</div>
            <div className="text-muted-foreground">{Object.values(denied).filter(Boolean).length} denied · overrides scope</div>
          </div>
          <Button className="w-full" disabled={!canManage} onClick={() => toast.success("Access rules saved")}>Save rules</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="text-base">Devices</CardTitle>
            <CardDescription>Select devices to allow, or mark them to deny.</CardDescription>
          </div>
          <div className="relative w-72">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search devices…" className="h-9 pl-9" />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead className="w-[52px]">Allow</TableHead>
                <TableHead>Device ID</TableHead>
                <TableHead>Hostname</TableHead>
                <TableHead>Branch</TableHead>
                <TableHead>Department</TableHead>
                <TableHead className="w-[80px] text-center">Deny</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((d) => (
                <TableRow key={d.id}>
                  <TableCell>
                    <Checkbox
                      checked={allowAll || !!selected[d.id]}
                      disabled={!canManage || allowAll}
                      onCheckedChange={(v) => setSelected((s) => ({ ...s, [d.id]: !!v }))}
                    />
                  </TableCell>
                  <TableCell className="font-mono text-xs">{d.id}</TableCell>
                  <TableCell className="font-medium">{d.hostname}</TableCell>
                  <TableCell>{d.branch}</TableCell>
                  <TableCell>{d.department}</TableCell>
                  <TableCell className="text-center">
                    <Checkbox
                      checked={!!denied[d.id]}
                      disabled={!canManage}
                      onCheckedChange={(v) => setDenied((s) => ({ ...s, [d.id]: !!v }))}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

// ---------- Approval Policies ----------

function PoliciesTab({ canManage }: { canManage: boolean }) {
  const [state, setState] = useState({
    requireApproval: true,
    unattendedServers: true,
    unattendedDepts: false,
    afterHours: true,
    sensitiveDepts: true,
  });
  const set = (k: keyof typeof state) => (v: boolean) => setState((s) => ({ ...s, [k]: v }));

  const rows: { key: keyof typeof state; title: string; desc: string }[] = [
    { key: "requireApproval", title: "Always require end-user approval", desc: "User at the endpoint must accept before any session starts." },
    { key: "unattendedServers", title: "Allow unattended access for servers", desc: "Skip approval for devices tagged as servers or infrastructure." },
    { key: "unattendedDepts", title: "Allow unattended access for specific departments", desc: "Applies to IT Operations and Engineering by default." },
    { key: "afterHours", title: "Require approval outside business hours", desc: "08:00 – 18:00 local time defines business hours." },
    { key: "sensitiveDepts", title: "Require approval for sensitive departments", desc: "Finance, HR and Legal always require explicit approval." },
  ];

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {rows.map((r) => (
        <Card key={r.key}>
          <CardContent className="flex items-start justify-between gap-4 p-4">
            <div>
              <div className="text-sm font-medium">{r.title}</div>
              <div className="mt-1 text-xs text-muted-foreground">{r.desc}</div>
            </div>
            <Switch checked={state[r.key]} onCheckedChange={set(r.key)} disabled={!canManage} />
          </CardContent>
        </Card>
      ))}
      {!canManage && (
        <div className="lg:col-span-2 rounded-md border border-amber-500/30 bg-amber-500/5 p-3 text-xs text-amber-700 dark:text-amber-400">
          Read-only. Manage Policies permission is required to change approval rules.
        </div>
      )}
    </div>
  );
}

// ---------- Activity ----------

interface ActivityEvent { icon: React.ComponentType<{ className?: string }>; title: string; meta: string; when: string; tone: string; }

const ACTIVITY: ActivityEvent[] = [
  { icon: DeviceIcon, title: "Remote session started · NYC-FIN-WS01", meta: "RustDesk · duration 24m", when: "Today · 14:22", tone: "text-primary" },
  { icon: UserCheck, title: "Successful login", meta: "IP 10.24.11.42 · Windows client", when: "Today · 14:00", tone: "text-emerald-600" },
  { icon: AlertTriangle, title: "Failed login attempt", meta: "3 attempts · account temporarily locked", when: "Today · 09:14", tone: "text-red-600" },
  { icon: KeyIcon, title: "Password changed", meta: "Self-service reset via MFA challenge", when: "Yesterday · 17:41", tone: "text-blue-600" },
  { icon: DeviceIcon, title: "Device accessed · LON-HR-LT14", meta: "Approval granted by end user", when: "Yesterday · 11:03", tone: "text-primary" },
  { icon: UserCog, title: "Account status changed", meta: "Set to Active by Alex Morgan", when: "Jul 12 · 08:20", tone: "text-slate-600" },
  { icon: Clock, title: "Session ended · BER-ENG-WS22", meta: "Duration 1h 12m · files transferred: 2", when: "Jul 11 · 16:55", tone: "text-primary" },
];

function ActivityTab() {
  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
      <Card>
        <CardHeader><CardTitle className="text-base">Activity Timeline</CardTitle><CardDescription>Recent sessions, logins, password changes and status updates.</CardDescription></CardHeader>
        <CardContent>
          <ol className="relative space-y-4 border-l pl-6">
            {ACTIVITY.map((e, i) => {
              const Icon = e.icon;
              return (
                <li key={i} className="relative">
                  <span className={cn("absolute -left-[30px] grid h-6 w-6 place-items-center rounded-full border bg-background", e.tone)}>
                    <Icon className="h-3.5 w-3.5" />
                  </span>
                  <div className="text-sm font-medium">{e.title}</div>
                  <div className="text-xs text-muted-foreground">{e.meta}</div>
                  <div className="mt-0.5 text-[11px] uppercase tracking-wide text-muted-foreground">{e.when}</div>
                </li>
              );
            })}
          </ol>
        </CardContent>
      </Card>
      <div className="space-y-4">
        {[
          { label: "Recent Sessions", value: 12, icon: Radio },
          { label: "Login History (30d)", value: 84, icon: UserCheck },
          { label: "Failed Login Attempts", value: 3, icon: AlertTriangle },
          { label: "Devices Accessed", value: 18, icon: DeviceIcon },
          { label: "Password Changes", value: 2, icon: KeyIcon },
          { label: "Account Status Changes", value: 1, icon: UserCog },
        ].map((k) => {
          const Icon = k.icon;
          return (
            <Card key={k.label}>
              <CardContent className="flex items-center justify-between p-4">
                <div>
                  <div className="text-xs text-muted-foreground">{k.label}</div>
                  <div className="text-2xl font-semibold">{k.value}</div>
                </div>
                <Icon className="h-5 w-5 text-muted-foreground" />
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}