import { useEffect, useMemo, useState } from "react";
import {
  LayoutDashboard, MonitorSmartphone, Radio, History, Settings as SettingsIcon,
  Plug, Bell, ChevronDown, Search, Users as UsersIcon, ShieldCheck, XCircle,
  Eye, Ban, Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { ErapRole, ROLE_LABELS, hasPermission } from "@/lib/erap-roles";
import { logAudit } from "@/lib/audit-log";
import {
  useSessions, endSession, SESSION_STATUS_META, formatDuration, formatTime,
  type SessionRecord, type SessionStatus,
} from "@/lib/sessions";
import { SessionTimeline } from "./SessionTimeline";
import { SessionWorkflow, type ConnectTarget } from "./SessionWorkflow";
import { PlugZap } from "lucide-react";
import { PageHeader } from "@/components/ui-ext/PageHeader";

const CURRENT_USER = "Alex Morgan";

export function SessionsModule() {
  const [role, setRole] = useState<ErapRole>("system_admin");
  const [tab, setTab] = useState<"active" | "history">("active");
  const [reconnectDevice, setReconnectDevice] = useState<ConnectTarget | null>(null);
  const isAdmin = role === "system_admin" || role === "regional_admin";

  useEffect(() => {
    if (!isAdmin && tab === "active") setTab("history");
  }, [isAdmin, tab]);

  return (
    <>
      <PageHeader
        title="Remote Sessions"
        description="Live remote sessions and technician history."
        actions={
          <Select value={role} onValueChange={(v) => setRole(v as ErapRole)}>
            <SelectTrigger className="h-9 w-[200px]" aria-label="Active role">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(ROLE_LABELS) as ErapRole[]).map((r) => (
                <SelectItem key={r} value={r}>Role: {ROLE_LABELS[r]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
      />
      <div className="flex min-h-0 flex-1 flex-col overflow-auto p-4">
            <Tabs value={tab} onValueChange={(v) => setTab(v as "active" | "history")}>
              <TabsList>
                {isAdmin && <TabsTrigger value="active">Active sessions</TabsTrigger>}
                <TabsTrigger value="history">My session history</TabsTrigger>
              </TabsList>
              {isAdmin && (
                <TabsContent value="active" className="mt-4">
                  <ActiveSessionsView role={role} onReconnect={setReconnectDevice} />
                </TabsContent>
              )}
              <TabsContent value="history" className="mt-4">
                <MyHistoryView technician={CURRENT_USER} role={role} onReconnect={setReconnectDevice} />
              </TabsContent>
            </Tabs>
      </div>
      <SessionWorkflow
          open={!!reconnectDevice}
          onOpenChange={(v) => !v && setReconnectDevice(null)}
          device={reconnectDevice}
          role={role}
          actor={CURRENT_USER}
      />
    </>
  );
}

function Sidebar() {
  const items = [
    { key: "dashboard", label: "Dashboard", icon: LayoutDashboard, to: "/" as const },
    { key: "devices", label: "Devices", icon: MonitorSmartphone, to: "/" as const },
    { key: "sessions", label: "Sessions", icon: Radio, to: "/sessions" as const },
    { key: "history", label: "My History", icon: History, to: "/sessions" as const },
    { key: "settings", label: "Settings", icon: SettingsIcon, to: "/" as const },
  ];
  return (
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
        {items.map((n) => {
          const Icon = n.icon;
          const active = n.key === "sessions" || n.key === "history";
          return (
            <Link
              key={n.key}
              to={n.to}
              className={cn(
                "flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-sidebar-primary text-sidebar-primary-foreground"
                  : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              )}
            >
              <Icon className="h-4 w-4" /> {n.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-sidebar-border p-3 text-xs text-sidebar-foreground/60">
        v2.4.1 · Build 20260717
      </div>
    </aside>
  );
}

function TopBar({ role, setRole }: { role: ErapRole; setRole: (r: ErapRole) => void }) {
  return (
    <header className="flex h-14 items-center gap-3 border-b bg-card px-4">
      <div className="min-w-0">
        <h1 className="truncate text-sm font-semibold">Remote Sessions</h1>
        <p className="text-[11px] text-muted-foreground">Live sessions and technician history across the private WAN</p>
      </div>
      <div className="ml-auto flex items-center gap-2">
        <Select value={role} onValueChange={(v) => setRole(v as ErapRole)}>
          <SelectTrigger className="h-9 w-[220px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            {(Object.keys(ROLE_LABELS) as ErapRole[]).map((r) => (
              <SelectItem key={r} value={r}>Role: {ROLE_LABELS[r]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="ghost" size="icon" aria-label="Notifications"><Bell className="h-4 w-4" /></Button>
        <div className="flex items-center gap-2 rounded-md border px-2 py-1 text-xs">
          <div className="grid h-6 w-6 place-items-center rounded-full bg-primary text-primary-foreground text-[10px] font-semibold">AM</div>
          <span className="hidden sm:inline">{CURRENT_USER}</span>
          <ChevronDown className="h-3 w-3 text-muted-foreground" />
        </div>
      </div>
    </header>
  );
}

function ActiveSessionsView({ role, onReconnect }: { role: ErapRole; onReconnect: (d: ConnectTarget) => void }) {
  const all = useSessions();
  const [detail, setDetail] = useState<SessionRecord | null>(null);
  const active = useMemo(
    () => all.filter((s) => s.status === "connected" || s.status === "awaiting_approval" || s.status === "requesting"),
    [all],
  );
  const canTerminate = hasPermission(role, "force_disconnect") || role === "system_admin" || role === "regional_admin";

  const kpi = {
    total: active.length,
    connected: active.filter((s) => s.status === "connected").length,
    pending: active.filter((s) => s.status !== "connected").length,
    branches: new Set(active.map((s) => s.branch)).size,
  };

  const terminate = (s: SessionRecord) => {
    if (!canTerminate) {
      logAudit({ actor: CURRENT_USER, actorRole: role, category: "session", action: "terminate_session", target: s.hostname, targetId: s.deviceId, status: "denied", details: "Role lacks Force Disconnect" });
      toast.error("Your role can't terminate sessions");
      return;
    }
    endSession(s.id, "Cancelled", "Terminated by administrator");
    logAudit({ actor: CURRENT_USER, actorRole: role, category: "session", action: "terminate_session", target: s.hostname, targetId: s.deviceId, status: "success", details: `Session ${s.id}` });
    toast.success(`Terminated session on ${s.hostname}`);
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-4">
        <Kpi label="Active sessions" value={kpi.total} icon={Radio} />
        <Kpi label="Connected" value={kpi.connected} icon={ShieldCheck} tone="green" />
        <Kpi label="Pending / awaiting" value={kpi.pending} icon={Clock} tone="yellow" />
        <Kpi label="Branches involved" value={kpi.branches} icon={UsersIcon} />
      </div>

      <div className="overflow-hidden rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40">
              <TableHead>Technician</TableHead>
              <TableHead>Target device</TableHead>
              <TableHead>Branch</TableHead>
              <TableHead>Start time</TableHead>
              <TableHead>Live duration</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {active.map((s) => (
              <ActiveRow key={s.id} s={s} onView={setDetail} onTerminate={terminate} canTerminate={canTerminate} />
            ))}
            {active.length === 0 && (
              <TableRow><TableCell colSpan={7} className="h-24 text-center text-sm text-muted-foreground">No active sessions right now.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <SessionDetailSheet session={detail} onClose={() => setDetail(null)} role={role} onReconnect={(d) => { onReconnect(d); setDetail(null); }} />
    </div>
  );
}

function ActiveRow({
  s, onView, onTerminate, canTerminate,
}: { s: SessionRecord; onView: (s: SessionRecord) => void; onTerminate: (s: SessionRecord) => void; canTerminate: boolean }) {
  const [, force] = useState(0);
  useEffect(() => {
    const i = setInterval(() => force((n) => n + 1), 1000);
    return () => clearInterval(i);
  }, []);
  return (
    <TableRow>
      <TableCell>
        <div className="text-sm font-medium">{s.technician}</div>
        <div className="text-[11px] text-muted-foreground">{ROLE_LABELS[s.technicianRole]}</div>
      </TableCell>
      <TableCell>
        <div className="text-sm">{s.hostname}</div>
        <div className="font-mono text-[11px] text-muted-foreground">{s.deviceId}</div>
      </TableCell>
      <TableCell className="text-sm">{s.branch}</TableCell>
      <TableCell className="whitespace-nowrap text-xs text-muted-foreground">{formatTime(s.startedAt)}</TableCell>
      <TableCell className="font-mono text-xs">{formatDuration(Date.now() - s.startedAt)}</TableCell>
      <TableCell><StatusPill status={s.status} /></TableCell>
      <TableCell className="text-right">
        <div className="flex justify-end gap-1">
          <Button variant="ghost" size="sm" onClick={() => onView(s)}><Eye className="mr-1 h-3.5 w-3.5" /> View</Button>
          <Tooltip>
            <TooltipTrigger asChild>
              <span>
                <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700" disabled={!canTerminate} onClick={() => onTerminate(s)}>
                  <Ban className="mr-1 h-3.5 w-3.5" /> Terminate
                </Button>
              </span>
            </TooltipTrigger>
            <TooltipContent>{canTerminate ? "Force-disconnect this session" : "Requires Force Disconnect permission"}</TooltipContent>
          </Tooltip>
        </div>
      </TableCell>
    </TableRow>
  );
}

function MyHistoryView({ technician, role, onReconnect }: { technician: string; role: ErapRole; onReconnect: (d: ConnectTarget) => void }) {
  const all = useSessions();
  const [q, setQ] = useState("");
  const [branch, setBranch] = useState("all");
  const [status, setStatus] = useState<string>("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [detail, setDetail] = useState<SessionRecord | null>(null);

  const mine = useMemo(() => all.filter((s) => s.technician === technician), [all, technician]);
  const branches = Array.from(new Set(mine.map((s) => s.branch)));

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    const fromTs = from ? new Date(from).getTime() : -Infinity;
    const toTs = to ? new Date(to).getTime() + 86_400_000 : Infinity;
    return mine.filter((s) => {
      if (branch !== "all" && s.branch !== branch) return false;
      if (status !== "all" && s.status !== status) return false;
      if (s.startedAt < fromTs || s.startedAt > toTs) return false;
      if (!term) return true;
      return (
        s.hostname.toLowerCase().includes(term) ||
        s.currentUser.toLowerCase().includes(term) ||
        s.reason.toLowerCase().includes(term)
      );
    });
  }, [mine, q, branch, status, from, to]);

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-[260px] flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search device, user, or reason…" className="h-9 pl-9" />
            </div>
            <Select value={branch} onValueChange={setBranch}>
              <SelectTrigger className="h-9 w-[160px]"><SelectValue placeholder="Branch" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All branches</SelectItem>
                {branches.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="h-9 w-[160px]"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="connected">Connected</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
            <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="h-9 w-[150px]" aria-label="From" />
            <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="h-9 w-[150px]" aria-label="To" />
            <div className="ml-auto text-xs text-muted-foreground">{filtered.length} of {mine.length} sessions</div>
          </div>
        </CardContent>
      </Card>

      <div className="overflow-hidden rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40">
              <TableHead className="w-[170px]">Date</TableHead>
              <TableHead>Device</TableHead>
              <TableHead>Branch</TableHead>
              <TableHead>Current user</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((s) => (
              <TableRow key={s.id}>
                <TableCell className="whitespace-nowrap text-xs text-muted-foreground">{formatTime(s.startedAt)}</TableCell>
                <TableCell>
                  <div className="text-sm">{s.hostname}</div>
                  <div className="font-mono text-[11px] text-muted-foreground">{s.deviceId}</div>
                </TableCell>
                <TableCell>{s.branch}</TableCell>
                <TableCell className="text-muted-foreground">{s.currentUser}</TableCell>
                <TableCell className="font-mono text-xs">
                  {s.endedAt ? formatDuration(s.endedAt - s.startedAt) : formatDuration(Date.now() - s.startedAt)}
                </TableCell>
                <TableCell><StatusPill status={s.status} /></TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm" onClick={() => setDetail(s)}>
                    <Eye className="mr-1 h-3.5 w-3.5" /> View details
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow><TableCell colSpan={7} className="h-24 text-center text-sm text-muted-foreground">No sessions match the filters.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <SessionDetailSheet session={detail} onClose={() => setDetail(null)} role={role} onReconnect={(d) => { onReconnect(d); setDetail(null); }} />
    </div>
  );
}

function SessionDetailSheet({ session, onClose, role, onReconnect }: { session: SessionRecord | null; onClose: () => void; role?: ErapRole; onReconnect?: (d: ConnectTarget) => void }) {
  const open = !!session;
  const canReconnect =
    !!session && !!role &&
    hasPermission(role, "remote_desktop") &&
    (session.status === "completed" || session.status === "cancelled" || session.status === "failed");
  const target = deriveConnectTarget(session);
  return (
    <Sheet open={open} onOpenChange={(v) => (!v ? onClose() : null)}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        {session && (
          <>
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2">
                <span className="truncate">{session.hostname}</span>
                <StatusPill status={session.status} />
              </SheetTitle>
              <SheetDescription className="font-mono text-xs">{session.id}</SheetDescription>
            </SheetHeader>
            <div className="mt-4 space-y-4 text-sm">
              <Card>
                <CardContent className="p-4">
                  <dl className="grid grid-cols-2 gap-y-2 text-xs">
                    <Row label="Device ID" value={session.deviceId} mono />
                    <Row label="Branch" value={session.branch} />
                    <Row label="Department" value={session.department} />
                    <Row label="Current user" value={session.currentUser} />
                    <Row label="Technician" value={session.technician} />
                    <Row label="Role" value={ROLE_LABELS[session.technicianRole]} />
                    <Row label="Mode" value={session.mode === "unattended" ? "Unattended" : "Approval"} />
                    <Row label="Start" value={formatTime(session.startedAt)} />
                    <Row label="End" value={session.endedAt ? formatTime(session.endedAt) : "—"} />
                    <Row label="Duration" value={session.endedAt ? formatDuration(session.endedAt - session.startedAt) : formatDuration(Date.now() - session.startedAt)} />
                    <Row label="Result" value={session.result ?? "—"} />
                  </dl>
                </CardContent>
              </Card>
              <div className="rounded-md border bg-muted/30 p-3 text-xs">
                <div className="font-semibold">Reason for connection</div>
                <p className="mt-1 text-muted-foreground">{session.reason}</p>
              </div>
              {session.failure && (
                <div className="rounded-md border bg-red-500/5 p-3 text-xs">
                  <div className="flex items-center gap-1 font-semibold text-red-700 dark:text-red-400">
                    <XCircle className="h-3.5 w-3.5" /> Failure reason
                  </div>
                  <p className="mt-1 text-muted-foreground">{session.failure}</p>
                </div>
              )}
              <Card>
                <CardContent className="p-4">
                  <div className="mb-3 text-xs font-semibold text-muted-foreground">Session timeline</div>
                  <SessionTimeline events={session.events} />
                </CardContent>
              </Card>
              {onReconnect && (
                <div className="flex flex-col gap-2 rounded-md border p-3">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span>
                        <Button
                          className="w-full"
                          disabled={!canReconnect || !target}
                          onClick={() => target && onReconnect(target)}
                        >
                          <PlugZap className="mr-2 h-4 w-4" /> Reconnect to {session.hostname}
                        </Button>
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>
                      {!canReconnect ? "Your role or the current session status blocks reconnect."
                        : !target ? "Reconnect target unavailable for this record."
                        : "Launch the connection workflow against this device."}
                    </TooltipContent>
                  </Tooltip>
                  <p className="text-[11px] text-muted-foreground">Reconnecting starts a brand-new session and re-runs approval unless the endpoint policy permits unattended access.</p>
                </div>
              )}
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

function deriveConnectTarget(session: SessionRecord | null): ConnectTarget | null {
  if (!session) return null;
  if (session.deviceSnapshot) return session.deviceSnapshot;
  return {
    id: session.deviceId,
    hostname: session.hostname,
    currentUser: session.currentUser,
    branch: session.branch,
    department: session.department,
    status: "online",
    os: "Windows",
    ip: "10.0.0.0",
    rustDeskPort: 21118,
  };
}

function Row({ label, value, mono }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className={cn("text-right", mono && "font-mono")}>{value}</dd>
    </>
  );
}

function Kpi({ label, value, icon: Icon, tone }: {
  label: string; value: number;
  icon: React.ComponentType<{ className?: string }>;
  tone?: "green" | "yellow";
}) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between p-4">
        <div>
          <div className="text-xs text-muted-foreground">{label}</div>
          <div className="text-2xl font-semibold">{value}</div>
        </div>
        <div className={cn(
          "grid h-10 w-10 place-items-center rounded-md",
          tone === "green" ? "bg-emerald-500/10 text-emerald-600"
          : tone === "yellow" ? "bg-amber-500/10 text-amber-600"
          : "bg-primary/10 text-primary",
        )}>
          <Icon className="h-5 w-5" />
        </div>
      </CardContent>
    </Card>
  );
}

function StatusPill({ status }: { status: SessionStatus }) {
  const meta = SESSION_STATUS_META[status];
  const cls =
    meta.tone === "green" ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" :
    meta.tone === "yellow" ? "bg-amber-500/10 text-amber-700 dark:text-amber-400" :
    meta.tone === "red" ? "bg-red-500/10 text-red-700 dark:text-red-400" :
    "bg-slate-500/10 text-slate-700 dark:text-slate-300";
  return <Badge variant="outline" className={cn("gap-1.5 border-transparent font-medium", cls)}>{meta.label}</Badge>;
}