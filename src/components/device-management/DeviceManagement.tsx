import { useMemo, useState } from "react";
import {
  LayoutDashboard,
  MonitorSmartphone,
  Radio,
  History,
  Settings as SettingsIcon,
  Search,
  Power,
  RotateCw,
  Copy,
  Plug,
  ClipboardList,
  X,
  Bell,
  ChevronDown,
  Circle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { ErapRole, ROLE_LABELS, hasPermission, Permission } from "@/lib/erap-roles";
import { logAudit } from "@/lib/audit-log";
import { useNavigate } from "@tanstack/react-router";
import { SessionWorkflow, type ConnectTarget } from "@/components/sessions/SessionWorkflow";

type Status = "online" | "offline";

interface Device {
  id: string;
  hostname: string;
  currentUser: string;
  branch: string;
  department: string;
  status: Status;
  lastSeen: string;
  os: string;
  ip: string;
  rustDeskPort: number;
}

const DEVICES: Device[] = [
  { id: "DEV-10241", hostname: "NYC-FIN-WS01", currentUser: "a.morgan", branch: "New York", department: "Finance", status: "online", lastSeen: "2 min ago", os: "Windows 11 Pro 23H2", ip: "10.24.11.42", rustDeskPort: 21118 },
  { id: "DEV-10242", hostname: "LON-HR-LT14", currentUser: "s.patel", branch: "London", department: "HR", status: "online", lastSeen: "just now", os: "Windows 11 Pro 23H2", ip: "10.44.9.18", rustDeskPort: 21118 },
  { id: "DEV-10243", hostname: "BER-ENG-WS22", currentUser: "m.klein", branch: "Berlin", department: "Engineering", status: "offline", lastSeen: "3 h ago", os: "Windows 10 Enterprise 22H2", ip: "10.61.4.201", rustDeskPort: 21118 },
  { id: "DEV-10244", hostname: "SFO-DES-MB08", currentUser: "j.nguyen", branch: "San Francisco", department: "Design", status: "online", lastSeen: "5 min ago", os: "Windows 11 Pro 24H2", ip: "10.12.7.66", rustDeskPort: 21118 },
  { id: "DEV-10245", hostname: "TOK-OPS-WS05", currentUser: "y.tanaka", branch: "Tokyo", department: "Operations", status: "offline", lastSeen: "1 d ago", os: "Windows Server 2022", ip: "10.88.2.9", rustDeskPort: 21118 },
  { id: "DEV-10246", hostname: "NYC-ENG-WS31", currentUser: "r.silva", branch: "New York", department: "Engineering", status: "online", lastSeen: "1 min ago", os: "Windows 11 Pro 24H2", ip: "10.24.11.77", rustDeskPort: 21118 },
  { id: "DEV-10247", hostname: "LON-FIN-LT02", currentUser: "e.brown", branch: "London", department: "Finance", status: "online", lastSeen: "8 min ago", os: "Windows 11 Pro 23H2", ip: "10.44.9.44", rustDeskPort: 21118 },
  { id: "DEV-10248", hostname: "BER-HR-WS10", currentUser: "k.mueller", branch: "Berlin", department: "HR", status: "offline", lastSeen: "5 h ago", os: "Windows 10 Enterprise 22H2", ip: "10.61.4.115", rustDeskPort: 21118 },
  { id: "DEV-10249", hostname: "SFO-OPS-WS17", currentUser: "l.chen", branch: "San Francisco", department: "Operations", status: "online", lastSeen: "12 min ago", os: "Windows 11 Pro 24H2", ip: "10.12.7.88", rustDeskPort: 21118 },
  { id: "DEV-10250", hostname: "TOK-DES-MB03", currentUser: "h.sato", branch: "Tokyo", department: "Design", status: "online", lastSeen: "just now", os: "Windows 11 Pro 23H2", ip: "10.88.2.31", rustDeskPort: 21118 },
];

const NAV: { key: string; label: string; icon: typeof LayoutDashboard; perm?: Permission }[] = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { key: "devices", label: "Devices", icon: MonitorSmartphone, perm: "view_devices" },
  { key: "sessions", label: "Sessions", icon: Radio, perm: "remote_desktop" },
  { key: "history", label: "My History", icon: History },
  { key: "reports", label: "Reports", icon: ClipboardList, perm: "view_reports" },
  { key: "settings", label: "Settings", icon: SettingsIcon },
];

const UNIQUE = <K extends keyof Device>(k: K) => Array.from(new Set(DEVICES.map((d) => String(d[k]))));

export function DeviceManagement() {
  const [active, setActive] = useState("devices");
  const [role, setRole] = useState<ErapRole>("system_admin");
  const [q, setQ] = useState("");
  const [branch, setBranch] = useState("all");
  const [department, setDepartment] = useState("all");
  const [status, setStatus] = useState("all");
  const [os, setOs] = useState("all");
  const [selectedId, setSelectedId] = useState<string | null>(DEVICES[0].id);
  const [connectDevice, setConnectDevice] = useState<ConnectTarget | null>(null);
  const navigate = useNavigate();

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return DEVICES.filter((d) => {
      if (branch !== "all" && d.branch !== branch) return false;
      if (department !== "all" && d.department !== department) return false;
      if (status !== "all" && d.status !== status) return false;
      if (os !== "all" && d.os !== os) return false;
      if (!term) return true;
      return (
        d.id.toLowerCase().includes(term) ||
        d.hostname.toLowerCase().includes(term) ||
        d.currentUser.toLowerCase().includes(term)
      );
    });
  }, [q, branch, department, status, os]);

  const selected = filtered.find((d) => d.id === selectedId) ?? DEVICES.find((d) => d.id === selectedId) ?? null;
  const viewerName = "Alex Morgan";

  const can = {
    connect: hasPermission(role, "remote_desktop"),
    history: hasPermission(role, "view_audit") || hasPermission(role, "view_devices"),
    restart: hasPermission(role, "restart"),
    shutdown: hasPermission(role, "shutdown"),
    copyIp: hasPermission(role, "view_devices"),
    reports: hasPermission(role, "view_reports"),
  };

  const logDevice = (
    action: string,
    d: { id: string; hostname: string },
    status: "success" | "denied" | "info",
    details?: string,
    category: "session" | "device" | "report" = "session",
  ) =>
    logAudit({
      actor: viewerName,
      actorRole: role,
      category,
      action,
      target: d.hostname,
      targetId: d.id,
      status,
      details,
    });

  const doConnect = (d: { id: string; hostname: string; status: Status }) => {
    if (!can.connect) {
      logDevice("connect_attempt", d, "denied", "Role lacks Remote Desktop");
      toast.error("Your role can't start remote sessions");
      return;
    }
    const full = DEVICES.find((x) => x.id === d.id);
    if (!full) return;
    setConnectDevice(full);
  };
  const doRestart = (d: { id: string; hostname: string }) => {
    if (!can.restart) {
      logDevice("restart_device", d, "denied", "Role lacks Restart Device");
      toast.error("Your role can't restart this device");
      return;
    }
    logDevice("restart_device", d, "success");
    toast.success(`Restart sent to ${d.hostname}`);
  };
  const doShutdown = (d: { id: string; hostname: string }) => {
    if (!can.shutdown) {
      logDevice("shutdown_device", d, "denied", "Role lacks Shutdown Device");
      toast.error("Your role can't shut down this device");
      return;
    }
    logDevice("shutdown_device", d, "success");
    toast.success(`Shutdown sent to ${d.hostname}`);
  };
  const doCopyIp = (d: { id: string; hostname: string; ip: string }) => {
    navigator.clipboard?.writeText(d.ip);
    logDevice("copy_ip", d, "info", d.ip, "device");
    toast.success(`Copied ${d.ip}`);
  };

  const onNavClick = (n: { key: string; label: string; perm?: Permission }) => {
    if (n.perm && !hasPermission(role, n.perm)) {
      logAudit({
        actor: viewerName,
        actorRole: role,
        category: n.key === "reports" ? "report" : n.key === "sessions" ? "session" : "device",
        action: "access_denied",
        target: n.label,
        status: "denied",
        details: `Missing ${n.perm} permission`,
      });
      toast.error(`Your role can't open ${n.label}`);
      return;
    }
    setActive(n.key);
    if (n.key === "sessions") logAudit({ actor: viewerName, actorRole: role, category: "session", action: "view_sessions", status: "info" });
    if (n.key === "reports") logAudit({ actor: viewerName, actorRole: role, category: "report", action: "view_report", status: "info" });
    if (n.key === "sessions" || n.key === "history") navigate({ to: "/sessions" });
  };

  return (
   <TooltipProvider delayDuration={200}>
    <>
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
          {NAV.map((n) => {
            const Icon = n.icon;
            const isActive = active === n.key;
            const disabled = !!n.perm && !hasPermission(role, n.perm);
            const btn = (
              <button
                key={n.key}
                onClick={() => onNavClick(n)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                  isActive
                    ? "bg-sidebar-primary text-sidebar-primary-foreground"
                    : disabled
                      ? "cursor-not-allowed text-sidebar-foreground/40"
                      : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                )}
              >
                <Icon className="h-4 w-4" />
                {n.label}
              </button>
            );
            return disabled ? (
              <Tooltip key={n.key}>
                <TooltipTrigger asChild><span>{btn}</span></TooltipTrigger>
                <TooltipContent side="right">Requires {n.perm} permission</TooltipContent>
              </Tooltip>
            ) : btn;
          })}
        </nav>
        <div className="border-t border-sidebar-border p-3 text-xs text-sidebar-foreground/60">
          v2.4.1 · Build 20260717
        </div>
      </aside>

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top bar */}
        <header className="flex h-14 items-center gap-3 border-b bg-card px-4">
          <div className="min-w-0">
            <h1 className="truncate text-sm font-semibold">Devices</h1>
            <p className="text-[11px] text-muted-foreground">All managed Windows endpoints</p>
          </div>
          <div className="relative ml-4 hidden max-w-md flex-1 md:block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search Device ID, Hostname, or Current User…"
              className="h-9 pl-9"
            />
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Select value={role} onValueChange={(v) => setRole(v as ErapRole)}>
              <SelectTrigger className="h-9 w-[200px]">
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
              <div className="grid h-6 w-6 place-items-center rounded-full bg-primary text-primary-foreground text-[10px] font-semibold">
                AM
              </div>
              <span className="hidden sm:inline">Alex Morgan</span>
              <ChevronDown className="h-3 w-3 text-muted-foreground" />
            </div>
          </div>
        </header>

        {/* Filters + Content */}
        <div className="flex min-h-0 flex-1">
          <section className="flex min-w-0 flex-1 flex-col">
            <div className="flex flex-wrap items-center gap-2 border-b bg-card px-4 py-3">
              <FilterSelect label="Branch" value={branch} onChange={setBranch} options={UNIQUE("branch")} />
              <FilterSelect label="Department" value={department} onChange={setDepartment} options={UNIQUE("department")} />
              <FilterSelect
                label="Status"
                value={status}
                onChange={setStatus}
                options={["online", "offline"]}
                render={(v) => (v === "online" ? "Online" : "Offline")}
              />
              <FilterSelect label="Operating System" value={os} onChange={setOs} options={UNIQUE("os")} />
              <div className="ml-auto text-xs text-muted-foreground">
                {filtered.length} of {DEVICES.length} devices
              </div>
            </div>

            <ScrollArea className="flex-1">
              <div className="p-4">
                <div className="overflow-hidden rounded-lg border bg-card">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/40">
                        <TableHead className="w-[120px]">Device ID</TableHead>
                        <TableHead>Hostname</TableHead>
                        <TableHead>Current User</TableHead>
                        <TableHead>Branch</TableHead>
                        <TableHead>Department</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Last Seen</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filtered.map((d) => (
                        <TableRow
                          key={d.id}
                          data-state={selectedId === d.id ? "selected" : undefined}
                          className="cursor-pointer"
                          onClick={() => setSelectedId(d.id)}
                        >
                          <TableCell className="font-mono text-xs">{d.id}</TableCell>
                          <TableCell className="font-medium">{d.hostname}</TableCell>
                          <TableCell className="text-muted-foreground">{d.currentUser}</TableCell>
                          <TableCell>{d.branch}</TableCell>
                          <TableCell>{d.department}</TableCell>
                          <TableCell>
                            <StatusPill status={d.status} />
                          </TableCell>
                          <TableCell className="text-muted-foreground">{d.lastSeen}</TableCell>
                          <TableCell className="text-right">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span>
                                  <Button
                                    size="sm"
                                    disabled={!can.connect || d.status === "offline"}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      doConnect(d);
                                    }}
                                  >
                                    Connect
                                  </Button>
                                </span>
                              </TooltipTrigger>
                              <TooltipContent>
                                {!can.connect ? "Role lacks Remote Desktop permission" : d.status === "offline" ? "Device offline" : "Start remote session"}
                              </TooltipContent>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      ))}
                      {filtered.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={8} className="h-32 text-center text-sm text-muted-foreground">
                            No devices match the current filters.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </ScrollArea>
          </section>

          {/* Details panel */}
          {selected && (
            <aside className="hidden w-[380px] shrink-0 border-l bg-card lg:flex lg:flex-col">
              <div className="flex items-start justify-between border-b p-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <StatusPill status={selected.status} />
                    <span className="text-xs text-muted-foreground">{selected.lastSeen}</span>
                  </div>
                  <h2 className="mt-1 truncate text-base font-semibold">{selected.hostname}</h2>
                  <p className="font-mono text-xs text-muted-foreground">{selected.id}</p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setSelectedId(null)} aria-label="Close">
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-2 p-4">
                <GuardedButton
                  className="col-span-2"
                  disabled={!can.connect || selected.status === "offline"}
                  tip={!can.connect ? "Role lacks Remote Desktop permission" : selected.status === "offline" ? "Device offline" : "Start remote session"}
                  onClick={() => doConnect(selected)}
                >
                  <Plug className="mr-2 h-4 w-4" /> Connect
                </GuardedButton>
                <GuardedButton
                  variant="outline"
                  disabled={!can.history}
                  tip={can.history ? "Show recent sessions" : "Role lacks View Devices"}
                  onClick={() => { logDevice("view_sessions", selected, "info", undefined, "session"); toast("Opening session history…"); }}
                >
                  <ClipboardList className="mr-2 h-4 w-4" /> View History
                </GuardedButton>
                <GuardedButton
                  variant="outline"
                  disabled={!can.restart || selected.status === "offline"}
                  tip={!can.restart ? "Role lacks Restart Device" : selected.status === "offline" ? "Device offline" : "Restart the endpoint"}
                  onClick={() => doRestart(selected)}
                >
                  <RotateCw className="mr-2 h-4 w-4" /> Restart
                </GuardedButton>
                <GuardedButton
                  variant="outline"
                  disabled={!can.shutdown || selected.status === "offline"}
                  tip={!can.shutdown ? "Role lacks Shutdown Device" : selected.status === "offline" ? "Device offline" : "Shut the endpoint down"}
                  onClick={() => doShutdown(selected)}
                >
                  <Power className="mr-2 h-4 w-4" /> Shutdown
                </GuardedButton>
                <GuardedButton
                  variant="outline"
                  disabled={!can.copyIp}
                  tip={can.copyIp ? "Copy IP to clipboard" : "Role lacks View Devices"}
                  onClick={() => doCopyIp(selected)}
                >
                  <Copy className="mr-2 h-4 w-4" /> Copy IP
                </GuardedButton>
              </div>

              <Separator />

              <ScrollArea className="flex-1">
                <div className="p-4">
                  <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Device details
                  </h3>
                  <dl className="divide-y">
                    <Detail label="Device ID" value={selected.id} mono />
                    <Detail label="Hostname" value={selected.hostname} />
                    <Detail label="Current User" value={selected.currentUser} />
                    <Detail label="Branch" value={selected.branch} />
                    <Detail label="Department" value={selected.department} />
                    <Detail label="Operating System" value={selected.os} />
                    <Detail label="IP Address" value={selected.ip} mono />
                    <Detail label="RustDesk Port" value={String(selected.rustDeskPort)} mono />
                    <Detail
                      label="Status"
                      value={
                        <span className="capitalize">
                          <StatusPill status={selected.status} />
                        </span>
                      }
                    />
                    <Detail label="Last Seen" value={selected.lastSeen} />
                  </dl>
                </div>
              </ScrollArea>
            </aside>
          )}
        </div>
      </div>
    </div>
   </TooltipProvider>
    );
}

function DeviceManagementFooter() { return null; }

function GuardedButton({
  children, disabled, onClick, tip, variant, className,
}: {
  children: React.ReactNode;
  disabled?: boolean;
  onClick: () => void;
  tip: string;
  variant?: "outline";
  className?: string;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className={className}>
          <Button
            variant={variant}
            disabled={disabled}
            onClick={onClick}
            className={cn(className, "w-full")}
          >
            {children}
          </Button>
        </span>
      </TooltipTrigger>
      <TooltipContent>{tip}</TooltipContent>
    </Tooltip>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
  render,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
  render?: (v: string) => string;
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="h-9 w-[180px]">
        <SelectValue placeholder={label} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All {label}</SelectItem>
        {options.map((o) => (
          <SelectItem key={o} value={o}>
            {render ? render(o) : o}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function StatusPill({ status }: { status: Status }) {
  const online = status === "online";
  return (
    <Badge
      variant="outline"
      className={cn(
        "gap-1.5 border-transparent font-medium",
        online
          ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
          : "bg-red-500/10 text-red-700 dark:text-red-400",
      )}
    >
      <Circle className={cn("h-2 w-2 fill-current", online ? "text-emerald-500" : "text-red-500")} />
      {online ? "Online" : "Offline"}
    </Badge>
  );
}

function Detail({
  label,
  value,
  mono,
}: {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5 text-sm">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className={cn("text-right", mono && "font-mono text-xs")}>{value}</dd>
    </div>
  );
}