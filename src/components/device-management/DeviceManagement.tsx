import { useEffect, useMemo, useState } from "react";
import { getDevices } from "@/features/devices/deviceService";
import type { Device as ApiDevice } from "@/features/devices/device.types";
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
  Plus,
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
import { getViewerName } from "@/lib/auth";
import { AccountBadge } from "@/components/shell/AccountBadge";
import { useAppRole } from "@/components/shell/AppShell";
import { logAudit } from "@/lib/audit-log";
import { useNavigate } from "@tanstack/react-router";
import { type ConnectTarget } from "@/components/sessions/SessionWorkflow";
import { ConnectDialog } from "@/features/sessions/ConnectDialog";
import { AddDeviceDialog } from "@/features/devices/AddDeviceDialog";

type Status = "online" | "offline";

interface Device {
  id: string;
  deviceIdNum: number;
  hostname: string;
  currentUser: string;
  branch: string;
  unit: string;
  rawStatus: string;
  statusReason: string;
  department: string;
  status: Status;
  lastSeen: string;
  os: string;
  ip: string;
  rustDeskPort: number;
}

// Maps a backend DeviceDto (camelCase, straight from Oracle) into the shape
// this UI already uses. This is the ONLY translation layer — everything below
// keeps working unchanged because it still sees the same `Device` interface.
function toUiDevice(d: ApiDevice): Device {
  return {
    id: `DEV-${d.deviceId}`,
    deviceIdNum: d.deviceId,
    hostname: d.hostname,
    currentUser: d.currentUsername ?? "—",
    branch: d.branch ?? "—",
    unit: d.unit ?? d.branch ?? "—",
    rawStatus: d.status,
    statusReason: d.statusReason ?? "",
    department: d.department ?? "—",
    // The UI only knows online/offline, so fold the backend's four states down.
    status: d.status === "Online" || d.status === "In Session" ? "online" : "offline",
    lastSeen: d.lastSeen ? new Date(d.lastSeen).toLocaleString() : "—",
    os: d.osVersion ?? "—",
    ip: d.ipAddress ?? "—",
    rustDeskPort: d.rustDeskPort,
  };
}

const NAV: { key: string; label: string; icon: typeof LayoutDashboard; perm?: Permission }[] = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { key: "devices", label: "Devices", icon: MonitorSmartphone, perm: "view_devices" },
  { key: "sessions", label: "Sessions", icon: Radio, perm: "remote_desktop" },
  { key: "history", label: "My History", icon: History },
  { key: "reports", label: "Reports", icon: ClipboardList, perm: "view_reports" },
  { key: "settings", label: "Settings", icon: SettingsIcon },
];

export function DeviceManagement() {
  const [active, setActive] = useState("devices");
  const [role] = useAppRole();
  const [q, setQ] = useState("");
  const [branch, setBranch] = useState("all");
  const [department, setDepartment] = useState("all");
  const [status, setStatus] = useState("all");
  const [os, setOs] = useState("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [connectDevice, setConnectDevice] = useState<ConnectTarget | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const navigate = useNavigate();

  // --- Real device inventory, loaded from the ERAP API on mount ---
  const [devices, setDevices] = useState<Device[]>([]);

  const loadDevices = () =>
    getDevices()
      .then((rows) => setDevices(rows.map(toUiDevice)))
      .catch((err) => toast.error(err?.message ?? "Failed to load devices"));

  useEffect(() => {
    void loadDevices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Distinct values for the filter dropdowns, derived from what actually loaded.
  const UNIQUE = <K extends keyof Device>(k: K) =>
    Array.from(new Set(devices.map((d) => String(d[k]))));

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return devices.filter((d) => {
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
  }, [q, branch, department, status, os, devices]);

  const selected = filtered.find((d) => d.id === selectedId) ?? devices.find((d) => d.id === selectedId) ?? null;
  const viewerName = getViewerName();

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
    const full = devices.find((x) => x.id === d.id);
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
    <div className="flex h-full min-h-0 flex-col">
      {/* Search (moved out of the old top bar; the shared AppShell now provides the chrome) */}
      <div className="flex items-center gap-2 border-b bg-card px-4 py-3">
        <div className="relative max-w-xl flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search Kit ID, Hostname, or Current User…"
            className="h-9 pl-9"
          />
        </div>
        <Button className="ml-auto shrink-0" onClick={() => setAddOpen(true)}>
          <Plus className="mr-1 h-4 w-4" /> Add kit
        </Button>
      </div>

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
                {filtered.length} of {devices.length} devices
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
                        <TableHead>Unit</TableHead>
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
                          <TableCell>{d.unit}</TableCell>
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
                            {devices.length === 0
                              ? "Loading devices… (or none registered yet)"
                              : "No devices match the current filters."}
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
    <AddDeviceDialog open={addOpen} onOpenChange={setAddOpen} onAdded={() => void loadDevices()} />
    <ConnectDialog
      open={!!connectDevice}
      onOpenChange={(v) => !v && setConnectDevice(null)}
      device={connectDevice}
      onConnected={() => void loadDevices()}
    />
    </>
   </TooltipProvider>
    );
}

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
