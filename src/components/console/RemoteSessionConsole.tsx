import { useEffect, useMemo, useRef, useState } from "react";
import {
  LayoutDashboard,
  MonitorSmartphone,
  Radio,
  History,
  Settings as SettingsIcon,
  Search,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Wifi,
  Lock,
  Power,
  RotateCw,
  Terminal as TerminalIcon,
  FolderUp,
  Camera,
  Video,
  MessageSquare,
  ClipboardList,
  Users as UsersIcon,
  AlertTriangle,
  Play,
  Square,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  Circle,
  X,
  KeyRound,
  FileText,
  Upload,
  Download,
  FolderPlus,
  Trash2,
  ScrollText,
  Bell,
  Activity,
  Cpu,
  MemoryStick,
  HardDrive,
  Network,
  Gauge,
  Siren,
  PauseCircle,
  UserPlus,
  Sparkles,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
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
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { ErapRole, ROLE_LABELS, hasPermission } from "@/lib/erap-roles";
import { getViewerName } from "@/lib/auth";
import { AccountBadge } from "@/components/shell/AccountBadge";
import { logAudit } from "@/lib/audit-log";
import { useNavigate } from "@tanstack/react-router";

// ─── Types & sample data ────────────────────────────────────────────────

type SessionStatus =
  | "Connected"
  | "Waiting Approval"
  | "Authentication Failed"
  | "Disconnected"
  | "Terminated"
  | "Under Investigation";

type ConnectionType = "Attended" | "Unattended" | "Emergency";

interface ConsoleDevice {
  id: string;
  hostname: string;
  ip: string;
  os: string;
  user: string;
  branch: string;
  department: string;
  status: "online" | "offline";
  agent: string;
  lastSeen: string;
  security: "Compliant" | "Warning" | "Non-compliant";
}

interface SessionRow {
  id: string;
  device: ConsoleDevice;
  technician: string;
  type: ConnectionType;
  startedAt: number;
  duration: string;
  status: SessionStatus;
}

const DEVICES: ConsoleDevice[] = [
  { id: "DEV-10241", hostname: "NYC-FIN-WS01", ip: "10.24.11.42", os: "Windows 11 Pro 23H2", user: "a.morgan", branch: "New York", department: "Finance", status: "online", agent: "3.4.2", lastSeen: "just now", security: "Compliant" },
  { id: "DEV-10242", hostname: "LON-HR-LT14", ip: "10.44.9.18", os: "Windows 11 Pro 23H2", user: "s.patel", branch: "London", department: "HR", status: "online", agent: "3.4.2", lastSeen: "2 min", security: "Compliant" },
  { id: "DEV-10244", hostname: "SFO-DES-MB08", ip: "10.12.7.66", os: "Windows 11 Pro 24H2", user: "j.nguyen", branch: "San Francisco", department: "Design", status: "online", agent: "3.4.1", lastSeen: "5 min", security: "Warning" },
  { id: "DEV-10246", hostname: "NYC-ENG-WS31", ip: "10.24.11.77", os: "Windows 11 Pro 24H2", user: "r.silva", branch: "New York", department: "Engineering", status: "online", agent: "3.4.2", lastSeen: "1 min", security: "Compliant" },
  { id: "DEV-10247", hostname: "LON-FIN-LT02", ip: "10.44.9.44", os: "Windows 11 Pro 23H2", user: "e.brown", branch: "London", department: "Finance", status: "online", agent: "3.4.2", lastSeen: "8 min", security: "Compliant" },
  { id: "DEV-10249", hostname: "SFO-OPS-WS17", ip: "10.12.7.88", os: "Windows 11 Pro 24H2", user: "l.chen", branch: "San Francisco", department: "Operations", status: "online", agent: "3.3.9", lastSeen: "12 min", security: "Warning" },
  { id: "DEV-10245", hostname: "TOK-OPS-WS05", ip: "10.88.2.9", os: "Windows Server 2022", user: "y.tanaka", branch: "Tokyo", department: "Operations", status: "offline", agent: "3.4.0", lastSeen: "1 d", security: "Non-compliant" },
  { id: "DEV-10248", hostname: "BER-HR-WS10", ip: "10.61.4.115", os: "Windows 10 Ent 22H2", user: "k.mueller", branch: "Berlin", department: "HR", status: "offline", agent: "3.3.7", lastSeen: "5 h", security: "Warning" },
];

const INITIAL_SESSIONS: SessionRow[] = [
  { id: "SES-7042", device: DEVICES[0], technician: "Alex Morgan", type: "Attended", startedAt: Date.now() - 12 * 60_000, duration: "00:12:41", status: "Connected" },
  { id: "SES-7043", device: DEVICES[3], technician: "Rafa Silva", type: "Unattended", startedAt: Date.now() - 5 * 60_000, duration: "00:05:02", status: "Connected" },
  { id: "SES-7044", device: DEVICES[1], technician: "Sara Patel", type: "Attended", startedAt: Date.now() - 2 * 60_000, duration: "00:02:18", status: "Waiting Approval" },
  { id: "SES-7040", device: DEVICES[6], technician: "Yuki Tanaka", type: "Attended", startedAt: Date.now() - 30 * 60_000, duration: "00:00:22", status: "Authentication Failed" },
  { id: "SES-7039", device: DEVICES[2], technician: "Jamie Nguyen", type: "Attended", startedAt: Date.now() - 45 * 60_000, duration: "00:18:07", status: "Disconnected" },
  { id: "SES-7038", device: DEVICES[5], technician: "Lin Chen", type: "Emergency", startedAt: Date.now() - 70 * 60_000, duration: "00:24:55", status: "Under Investigation" },
  { id: "SES-7037", device: DEVICES[4], technician: "Emma Brown", type: "Attended", startedAt: Date.now() - 120 * 60_000, duration: "00:09:11", status: "Terminated" },
];

const STATUS_STYLE: Record<SessionStatus, string> = {
  "Connected": "bg-emerald-50 text-emerald-700 border-emerald-200",
  "Waiting Approval": "bg-amber-50 text-amber-700 border-amber-200",
  "Authentication Failed": "bg-red-50 text-red-700 border-red-200",
  "Disconnected": "bg-slate-100 text-slate-700 border-slate-200",
  "Terminated": "bg-slate-100 text-slate-700 border-slate-200",
  "Under Investigation": "bg-purple-50 text-purple-700 border-purple-200",
};

// ─── Root component ─────────────────────────────────────────────────────

type View = "dashboard" | "start" | "live" | "history" | "incident" | "audit";

const CURRENT_ROLE: ErapRole = "Support Officer";

export function RemoteSessionConsole() {
  const navigate = useNavigate();
  const [view, setView] = useState<View>("dashboard");
  const [sessions, setSessions] = useState<SessionRow[]>(INITIAL_SESSIONS);
  const [activeSession, setActiveSession] = useState<SessionRow | null>(null);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [emergencyOpen, setEmergencyOpen] = useState(false);

  const openLive = (row: SessionRow) => {
    setActiveSession(row);
    setView("live");
  };

  const handleWizardComplete = (device: ConsoleDevice, type: ConnectionType) => {
    const id = `SES-${7050 + sessions.length}`;
    const row: SessionRow = {
      id,
      device,
      technician: getViewerName(),
      type,
      startedAt: Date.now(),
      duration: "00:00:00",
      status: "Connected",
    };
    setSessions((s) => [row, ...s]);
    logAudit({
      actor: getViewerName(), actorRole: CURRENT_ROLE, category: "session",
      action: "session_started", target: device.hostname, targetId: device.id,
      status: "success", details: `${type} session via ERAP secure channel`,
    });
    setWizardOpen(false);
    openLive(row);
  };

  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex min-h-screen bg-slate-50">
        <ConsoleSidebar view={view} setView={setView} onStart={() => setWizardOpen(true)} onEmergency={() => setEmergencyOpen(true)} navigate={navigate} />

        <div className="flex min-w-0 flex-1 flex-col">
          <ConsoleTopBar view={view} onStart={() => setWizardOpen(true)} />

          <div className="min-w-0 flex-1 overflow-auto">
            {view === "dashboard" && (
              <TechnicianDashboard sessions={sessions} onOpen={openLive} onStart={() => setWizardOpen(true)} />
            )}
            {view === "history" && <SessionHistoryView sessions={sessions} onOpen={openLive} />}
            {view === "audit" && <AuditTimelineView sessions={sessions} />}
            {view === "incident" && <IncidentSupportView onEmergency={() => setEmergencyOpen(true)} />}
            {view === "live" && activeSession && (
              <LiveConsole session={activeSession} onEnd={(reason) => {
                setSessions((rows) => rows.map((r) => r.id === activeSession.id ? { ...r, status: "Terminated" } : r));
                logAudit({
                  actor: getViewerName(), actorRole: CURRENT_ROLE, category: "session",
                  action: "session_ended", target: activeSession.device.hostname, targetId: activeSession.device.id,
                  status: "info", details: reason,
                });
                setActiveSession(null);
                setView("history");
              }} />
            )}
            {view === "live" && !activeSession && (
              <EmptyLive onStart={() => setWizardOpen(true)} />
            )}
          </div>
        </div>

        <StartSessionWizard open={wizardOpen} onOpenChange={setWizardOpen} onComplete={handleWizardComplete} />
        <EmergencyDialog open={emergencyOpen} onOpenChange={setEmergencyOpen} onGranted={(dev) => {
          setEmergencyOpen(false);
          handleWizardComplete(dev, "Emergency");
        }} />
      </div>
    </TooltipProvider>
  );
}

// ─── Sidebar & top bar ──────────────────────────────────────────────────

function ConsoleSidebar({
  view, setView, onStart, onEmergency, navigate,
}: {
  view: View; setView: (v: View) => void; onStart: () => void; onEmergency: () => void; navigate: ReturnType<typeof useNavigate>;
}) {
  const [devicesOpen, setDevicesOpen] = useState(true);
  const [opsOpen, setOpsOpen] = useState(true);
  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-slate-800 bg-slate-950 text-slate-200 md:flex">
      <div className="flex items-center gap-2 border-b border-slate-800 px-4 py-4">
        <div className="grid h-8 w-8 place-items-center rounded-md bg-primary text-primary-foreground">
          <Shield className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold">ERAP Console</div>
          <div className="truncate text-[10px] uppercase tracking-wider text-slate-400">Private WAN · Secure</div>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-auto p-3 text-sm">
        <SidebarLink icon={LayoutDashboard} label="Dashboard" active={view === "dashboard"} onClick={() => setView("dashboard")} />

        <SidebarGroup label="Devices" open={devicesOpen} setOpen={setDevicesOpen}>
          <SidebarSub icon={MonitorSmartphone} label="Device Inventory" onClick={() => navigate({ to: "/" })} />
          <SidebarSub icon={Radio} label="Remote Sessions" onClick={() => navigate({ to: "/sessions" })} />
          <SidebarSub icon={Activity} label="Agent Management" onClick={() => navigate({ to: "/agents" })} />
          <SidebarSub icon={UsersIcon} label="Device Groups" onClick={() => toast("Device Groups opens from Devices module.")} />
          <SidebarSub icon={ClipboardList} label="Policies" onClick={() => navigate({ to: "/users" })} />
          <SidebarSub icon={ShieldCheck} label="Compliance" onClick={() => toast("Compliance dashboard is being rolled out.")} />
        </SidebarGroup>

        <SidebarGroup label="Operations" open={opsOpen} setOpen={setOpsOpen}>
          <SidebarSub icon={TerminalIcon} label="Session Console" active={view === "live" || view === "start" || view === "dashboard"} onClick={() => setView("dashboard")} />
          <SidebarSub icon={History} label="Session History" active={view === "history"} onClick={() => setView("history")} />
          <SidebarSub icon={Siren} label="Incident Support" active={view === "incident"} onClick={() => setView("incident")} />
          <SidebarSub icon={ScrollText} label="Audit Logs" active={view === "audit"} onClick={() => setView("audit")} />
        </SidebarGroup>

        <Separator className="my-3 bg-slate-800" />
        <SidebarLink icon={SettingsIcon} label="Settings" onClick={() => toast("Console settings are managed in Admin.")} />
      </nav>

      <div className="space-y-2 border-t border-slate-800 p-3">
        <Button className="w-full justify-start gap-2" onClick={onStart}>
          <Play className="h-4 w-4" /> Start Remote Session
        </Button>
        <Button variant="outline" className="w-full justify-start gap-2 border-red-900/60 bg-red-950/40 text-red-200 hover:bg-red-900/40 hover:text-red-100" onClick={onEmergency}>
          <Siren className="h-4 w-4" /> Emergency Access
        </Button>
        <div className="mt-2 rounded-md border border-slate-800 bg-slate-900/60 p-2 text-[11px] text-slate-400">
          Signed in as <span className="text-slate-200">{getViewerName()}</span><br />
          <span className="text-slate-500">{ROLE_LABELS[CURRENT_ROLE]}</span>
        </div>
      </div>
    </aside>
  );
}

function SidebarLink({ icon: Icon, label, active, onClick }: { icon: typeof LayoutDashboard; label: string; active?: boolean; onClick?: () => void }) {
  return (
    <button onClick={onClick} className={cn("flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left transition-colors", active ? "bg-primary/15 text-primary-foreground" : "text-slate-300 hover:bg-slate-800/70 hover:text-white")}>
      <Icon className={cn("h-4 w-4", active ? "text-primary" : "text-slate-400")} />
      <span className="truncate">{label}</span>
    </button>
  );
}

function SidebarGroup({ label, open, setOpen, children }: { label: string; open: boolean; setOpen: (v: boolean) => void; children: React.ReactNode }) {
  return (
    <div>
      <button onClick={() => setOpen(!open)} className="flex w-full items-center justify-between rounded-md px-2.5 py-2 text-xs font-semibold uppercase tracking-wider text-slate-400 hover:text-slate-200">
        <span>{label}</span>
        <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", open ? "" : "-rotate-90")} />
      </button>
      {open && <div className="mt-0.5 space-y-0.5 pl-1">{children}</div>}
    </div>
  );
}

function SidebarSub({ icon: Icon, label, active, onClick }: { icon: typeof LayoutDashboard; label: string; active?: boolean; onClick?: () => void }) {
  return (
    <button onClick={onClick} className={cn("flex w-full items-center gap-2 rounded-md py-1.5 pl-6 pr-2 text-left text-[13px] transition-colors", active ? "bg-slate-800 text-white" : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-100")}>
      <Icon className="h-3.5 w-3.5" />
      <span className="truncate">{label}</span>
    </button>
  );
}

function ConsoleTopBar({ view, onStart }: { view: View; onStart: () => void }) {
  const titles: Record<View, string> = {
    dashboard: "Technician Session Dashboard",
    start: "Start Remote Session",
    live: "Live Remote Console",
    history: "Session History",
    incident: "Incident Support",
    audit: "Audit & Session Recording",
  };
  return (
    <header className="flex h-14 items-center gap-3 border-b border-slate-200 bg-white px-4 md:px-6">
      <div className="min-w-0">
        <div className="text-[11px] uppercase tracking-wider text-slate-500">Operations · Remote Session Console</div>
        <div className="truncate text-sm font-semibold text-slate-900">{titles[view]}</div>
      </div>
      <div className="ml-auto flex items-center gap-2">
        <div className="hidden items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1 text-[11px] text-emerald-700 md:flex">
          <Wifi className="h-3 w-3" /> Private WAN online
        </div>
        <div className="hidden items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] text-slate-600 md:flex">
          <Lock className="h-3 w-3" /> AES-256 · mTLS
        </div>
        <Button size="sm" variant="outline" className="gap-1"><Bell className="h-3.5 w-3.5" /> 3</Button>
        <Button size="sm" className="gap-1" onClick={onStart}><Play className="h-3.5 w-3.5" /> Start session</Button>
        <AccountBadge />
      </div>
    </header>
  );
}

// ─── Dashboard view ─────────────────────────────────────────────────────

function TechnicianDashboard({ sessions, onOpen, onStart }: { sessions: SessionRow[]; onOpen: (row: SessionRow) => void; onStart: () => void }) {
  const stats = useMemo(() => {
    const active = sessions.filter((s) => s.status === "Connected").length;
    const pending = sessions.filter((s) => s.status === "Waiting Approval").length;
    const done = sessions.filter((s) => ["Disconnected", "Terminated"].includes(s.status)).length;
    const failed = sessions.filter((s) => s.status === "Authentication Failed").length;
    return { active, pending, done, failed };
  }, [sessions]);

  return (
    <div className="space-y-4 p-4 md:p-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-6">
        <Kpi label="Active Sessions" value={stats.active} icon={Radio} tone="emerald" />
        <Kpi label="Pending Requests" value={stats.pending} icon={AlertTriangle} tone="amber" />
        <Kpi label="Today Completed" value={stats.done} icon={CheckCircle2} tone="slate" />
        <Kpi label="Avg Resolution" value="14 min" icon={Gauge} tone="primary" />
        <Kpi label="Failed Connections" value={stats.failed} icon={ShieldAlert} tone="red" />
        <Kpi label="Technicians Online" value={6} icon={UsersIcon} tone="primary" />
      </div>

      <div className="rounded-lg border border-slate-200 bg-white">
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 px-4 py-3">
          <div className="font-semibold text-slate-900">Session activity</div>
          <Badge variant="outline" className="text-[10px]">Live · private WAN</Badge>
          <div className="ml-auto flex items-center gap-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <Input className="h-8 w-56 pl-7 text-xs" placeholder="Filter by device, tech, branch…" />
            </div>
            <Button size="sm" onClick={onStart} className="gap-1"><Play className="h-3.5 w-3.5" /> New session</Button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/60 text-[11px] uppercase tracking-wider text-slate-500">
                <TableHead>Session</TableHead>
                <TableHead>Device</TableHead>
                <TableHead>Branch / Dept</TableHead>
                <TableHead>Technician</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Started</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sessions.map((s) => (
                <TableRow key={s.id} className="text-sm">
                  <TableCell className="font-mono text-xs">{s.id}</TableCell>
                  <TableCell>
                    <div className="font-medium text-slate-900">{s.device.hostname}</div>
                    <div className="font-mono text-[11px] text-slate-500">{s.device.id} · {s.device.ip}</div>
                  </TableCell>
                  <TableCell className="text-slate-600">
                    <div>{s.device.branch}</div>
                    <div className="text-[11px] text-slate-500">{s.device.department}</div>
                  </TableCell>
                  <TableCell className="text-slate-700">{s.technician}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={cn("text-[10px]", s.type === "Emergency" && "border-red-300 bg-red-50 text-red-700")}>{s.type}</Badge>
                  </TableCell>
                  <TableCell className="text-xs text-slate-600">{new Date(s.startedAt).toLocaleTimeString()}</TableCell>
                  <TableCell className="font-mono text-xs">{s.duration}</TableCell>
                  <TableCell><StatusPill status={s.status} /></TableCell>
                  <TableCell className="text-right">
                    <div className="inline-flex gap-1">
                      <Button size="sm" variant="outline" className="h-7 gap-1 text-xs" onClick={() => onOpen(s)}><MonitorSmartphone className="h-3 w-3" /> Open</Button>
                      {s.status === "Connected" && (
                        <Button size="sm" variant="ghost" className="h-7 gap-1 text-xs text-red-600 hover:text-red-700"><X className="h-3 w-3" /> End</Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}

function Kpi({ label, value, icon: Icon, tone }: { label: string; value: number | string; icon: typeof LayoutDashboard; tone: "emerald" | "amber" | "red" | "slate" | "primary" }) {
  const tones: Record<typeof tone, string> = {
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-200",
    amber: "bg-amber-50 text-amber-700 border-amber-200",
    red: "bg-red-50 text-red-700 border-red-200",
    slate: "bg-slate-100 text-slate-700 border-slate-200",
    primary: "bg-primary/10 text-primary border-primary/20",
  };
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3">
      <div className="flex items-center justify-between">
        <div className="text-[11px] uppercase tracking-wider text-slate-500">{label}</div>
        <div className={cn("grid h-7 w-7 place-items-center rounded-md border", tones[tone])}>
          <Icon className="h-3.5 w-3.5" />
        </div>
      </div>
      <div className="mt-2 text-2xl font-semibold text-slate-900">{value}</div>
    </div>
  );
}

function StatusPill({ status }: { status: SessionStatus }) {
  return <Badge variant="outline" className={cn("gap-1 text-[10px]", STATUS_STYLE[status])}>
    <Circle className="h-2 w-2 fill-current" /> {status}
  </Badge>;
}

// ─── Start session wizard ───────────────────────────────────────────────

function StartSessionWizard({ open, onOpenChange, onComplete }: { open: boolean; onOpenChange: (v: boolean) => void; onComplete: (d: ConsoleDevice, t: ConnectionType) => void }) {
  const [step, setStep] = useState(1);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<ConsoleDevice | null>(null);
  const [mfa, setMfa] = useState(true);
  const [approval, setApproval] = useState(true);
  const [override, setOverride] = useState(false);
  const [type, setType] = useState<ConnectionType>("Attended");
  const [progress, setProgress] = useState(0);
  const [progressLabel, setProgressLabel] = useState("Initializing connection…");

  useEffect(() => {
    if (!open) { setStep(1); setSelected(null); setProgress(0); setProgressLabel("Initializing connection…"); }
  }, [open]);

  useEffect(() => {
    if (step !== 3) return;
    const stages = [
      { label: "Initializing connection…", pct: 20 },
      { label: "Authenticating device certificate…", pct: 45 },
      { label: "Establishing AES-256 encrypted channel…", pct: 75 },
      { label: "Connected successfully", pct: 100 },
    ];
    let i = 0;
    const t = setInterval(() => {
      i++;
      const s = stages[i - 1];
      if (!s) { clearInterval(t); return; }
      setProgress(s.pct); setProgressLabel(s.label);
      if (i === stages.length && selected) {
        setTimeout(() => onComplete(selected, override ? "Emergency" : type), 500);
      }
    }, 700);
    return () => clearInterval(t);
  }, [step, selected, type, override, onComplete]);

  const filtered = DEVICES.filter((d) => {
    const q = query.toLowerCase();
    return !q || [d.id, d.hostname, d.ip, d.user, d.branch, d.department].some((v) => v.toLowerCase().includes(q));
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Start Remote Session</DialogTitle>
          <DialogDescription>
            Guided workflow · target device → authentication → encrypted channel over private WAN.
          </DialogDescription>
        </DialogHeader>

        <StepIndicator step={step} labels={["Target device", "Authentication", "Session initiation"]} />

        {step === 1 && (
          <div className="space-y-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2 top-2.5 h-4 w-4 text-slate-400" />
              <Input value={query} onChange={(e) => setQuery(e.target.value)} className="pl-8" placeholder="Search by Device ID, hostname, IP, user, branch or department…" />
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <ScrollArea className="h-64 rounded-md border">
                <div className="divide-y">
                  {filtered.map((d) => (
                    <button key={d.id} onClick={() => setSelected(d)} className={cn("flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-slate-50", selected?.id === d.id && "bg-primary/5")}>
                      <span className={cn("h-2 w-2 rounded-full", d.status === "online" ? "bg-emerald-500" : "bg-slate-300")} />
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-medium text-slate-900">{d.hostname}</div>
                        <div className="truncate font-mono text-[11px] text-slate-500">{d.id} · {d.ip}</div>
                      </div>
                      <span className="text-[11px] text-slate-500">{d.branch}</span>
                    </button>
                  ))}
                </div>
              </ScrollArea>
              <div className="rounded-md border p-3 text-sm">
                {selected ? <DeviceInfoCard device={selected} /> : <div className="grid h-full place-items-center text-xs text-slate-500">Select a device to view its details.</div>}
              </div>
            </div>
          </div>
        )}

        {step === 2 && selected && (
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-3">
              <SectionTitle icon={KeyRound}>Technician identity verification</SectionTitle>
              <div className="rounded-md border p-3 text-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{getViewerName()}</div>
                    <div className="text-xs text-slate-500">{ROLE_LABELS[CURRENT_ROLE]}</div>
                  </div>
                  <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700">Role verified</Badge>
                </div>
                <Separator className="my-2" />
                <label className="flex items-center gap-2 text-xs"><Checkbox checked={mfa} onCheckedChange={(v) => setMfa(!!v)} /> Multi-factor authentication</label>
                <label className="mt-1.5 flex items-center gap-2 text-xs"><Checkbox checked={approval} onCheckedChange={(v) => setApproval(!!v)} /> Request end-user approval</label>
                <label className="mt-1.5 flex items-center gap-2 text-xs"><Checkbox checked={override} onCheckedChange={(v) => setOverride(!!v)} /> Emergency access override (audited)</label>
              </div>
              <div className="rounded-md border p-3">
                <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Connection type</div>
                <Select value={type} onValueChange={(v) => setType(v as ConnectionType)}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Attended">Attended (user approval)</SelectItem>
                    <SelectItem value="Unattended">Unattended (policy-gated)</SelectItem>
                    <SelectItem value="Emergency">Emergency (audited override)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="rounded-md border p-3">
              <SectionTitle icon={Shield}>Requested permissions</SectionTitle>
              <ul className="mt-2 space-y-1.5 text-sm">
                {[
                  ["View Screen", true],
                  ["Control Keyboard / Mouse", true],
                  ["Transfer Files", hasPermission(CURRENT_ROLE, "file_transfer")],
                  ["Remote Terminal", true],
                  ["System Information", true],
                  ["Restart Device", hasPermission(CURRENT_ROLE, "restart")],
                ].map(([label, ok]) => (
                  <li key={String(label)} className="flex items-center gap-2">
                    {ok ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <X className="h-4 w-4 text-slate-400" />}
                    <span className={cn(!ok && "text-slate-400 line-through")}>{label as string}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-3 rounded-md bg-amber-50 p-2 text-[11px] text-amber-800">
                All actions are audit-logged with actor, target, and timestamp.
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4 py-4">
            <div className="text-center">
              <div className="mx-auto grid h-12 w-12 place-items-center rounded-full border border-primary/30 bg-primary/10 text-primary">
                <Wifi className="h-5 w-5" />
              </div>
              <div className="mt-3 text-sm font-medium">{progressLabel}</div>
              <div className="mt-1 text-xs text-slate-500">Private WAN · no Internet route used</div>
            </div>
            <Progress value={progress} />
            <div className="mx-auto grid max-w-md grid-cols-4 gap-2 text-[11px]">
              {["Init", "Auth", "Encrypt", "Ready"].map((l, i) => (
                <div key={l} className={cn("rounded border p-1.5 text-center", progress >= (i + 1) * 25 ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-slate-50 text-slate-500")}>{l}</div>
              ))}
            </div>
          </div>
        )}

        <DialogFooter className="flex items-center justify-between gap-2 sm:justify-between">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <div className="flex gap-2">
            {step > 1 && step < 3 && <Button variant="outline" onClick={() => setStep((s) => s - 1)}><ChevronLeft className="mr-1 h-4 w-4" /> Back</Button>}
            {step === 1 && <Button disabled={!selected} onClick={() => setStep(2)}>Continue <ChevronRight className="ml-1 h-4 w-4" /></Button>}
            {step === 2 && <Button onClick={() => setStep(3)}>Initiate session <ChevronRight className="ml-1 h-4 w-4" /></Button>}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function SectionTitle({ icon: Icon, children }: { icon: typeof LayoutDashboard; children: React.ReactNode }) {
  return <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500"><Icon className="h-3.5 w-3.5" /> {children}</div>;
}

function StepIndicator({ step, labels }: { step: number; labels: string[] }) {
  return (
    <ol className="flex items-center gap-2 rounded-md border bg-slate-50/60 p-2 text-xs">
      {labels.map((l, i) => {
        const n = i + 1;
        const active = n === step;
        const done = n < step;
        return (
          <li key={l} className="flex flex-1 items-center gap-2">
            <span className={cn("grid h-5 w-5 place-items-center rounded-full border text-[10px] font-semibold", done ? "border-emerald-500 bg-emerald-500 text-white" : active ? "border-primary bg-primary text-primary-foreground" : "border-slate-300 bg-white text-slate-500")}>{done ? "✓" : n}</span>
            <span className={cn(active ? "text-slate-900 font-medium" : "text-slate-500")}>{l}</span>
            {i < labels.length - 1 && <span className="mx-1 h-px flex-1 bg-slate-200" />}
          </li>
        );
      })}
    </ol>
  );
}

function DeviceInfoCard({ device }: { device: ConsoleDevice }) {
  return (
    <div className="space-y-2 text-sm">
      <div className="flex items-center justify-between">
        <div className="font-medium text-slate-900">{device.hostname}</div>
        <Badge variant="outline" className={cn("text-[10px]", device.status === "online" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-slate-100 text-slate-600")}>
          {device.status.toUpperCase()}
        </Badge>
      </div>
      <dl className="grid grid-cols-2 gap-y-1.5 text-xs text-slate-600">
        <dt>OS</dt><dd className="text-right text-slate-800">{device.os}</dd>
        <dt>Current user</dt><dd className="text-right text-slate-800">{device.user}</dd>
        <dt>Branch</dt><dd className="text-right text-slate-800">{device.branch}</dd>
        <dt>Department</dt><dd className="text-right text-slate-800">{device.department}</dd>
        <dt>Agent</dt><dd className="text-right text-slate-800">v{device.agent}</dd>
        <dt>Last check-in</dt><dd className="text-right text-slate-800">{device.lastSeen}</dd>
        <dt>Security</dt>
        <dd className="text-right">
          <Badge variant="outline" className={cn("text-[10px]",
            device.security === "Compliant" && "border-emerald-200 bg-emerald-50 text-emerald-700",
            device.security === "Warning" && "border-amber-200 bg-amber-50 text-amber-700",
            device.security === "Non-compliant" && "border-red-200 bg-red-50 text-red-700",
          )}>{device.security}</Badge>
        </dd>
      </dl>
    </div>
  );
}

// ─── Live console ───────────────────────────────────────────────────────

function LiveConsole({ session, onEnd }: { session: SessionRow; onEnd: (reason: string) => void }) {
  const [tick, setTick] = useState(0);
  const [paused, setPaused] = useState(false);
  const [recording, setRecording] = useState(true);
  const [rightTab, setRightTab] = useState<"security" | "info" | "chat" | "notes">("security");
  const [infoTab, setInfoTab] = useState("overview");
  const [showTerminal, setShowTerminal] = useState(false);
  const [showFiles, setShowFiles] = useState(false);
  const [confirmEnd, setConfirmEnd] = useState(false);

  useEffect(() => {
    if (paused) return;
    const t = setInterval(() => setTick((n) => n + 1), 1000);
    return () => clearInterval(t);
  }, [paused]);
  const elapsed = Math.floor((Date.now() - session.startedAt + tick * 1000) / 1000);
  const hh = String(Math.floor(elapsed / 3600)).padStart(2, "0");
  const mm = String(Math.floor((elapsed % 3600) / 60)).padStart(2, "0");
  const ss = String(elapsed % 60).padStart(2, "0");

  const latency = 18 + (tick % 6);
  const quality = latency < 25 ? "Excellent" : latency < 45 ? "Good" : "Fair";

  return (
    <div className="flex h-[calc(100vh-3.5rem)] min-h-[600px]">
      {/* Left toolbar */}
      <div className="hidden w-14 flex-col items-center gap-1 border-r border-slate-200 bg-white py-3 md:flex">
        <ToolbarBtn icon={Power} label="Disconnect" onClick={() => setConfirmEnd(true)} tone="red" />
        <ToolbarBtn icon={Lock} label="Lock screen" onClick={() => toast.success("Lock command sent")} />
        <ToolbarBtn icon={RotateCw} label="Restart device" onClick={() => toast("Restart requires admin confirmation.")} />
        <ToolbarBtn icon={KeyRound} label="Ctrl+Alt+Del" onClick={() => toast.success("Sent Ctrl+Alt+Del")} />
        <Separator className="my-1 w-6" />
        <ToolbarBtn icon={TerminalIcon} label="Terminal" active={showTerminal} onClick={() => setShowTerminal((v) => !v)} />
        <ToolbarBtn icon={FolderUp} label="File transfer" active={showFiles} onClick={() => setShowFiles((v) => !v)} />
        <ToolbarBtn icon={Camera} label="Screenshot" onClick={() => toast.success("Screenshot saved to audit vault")} />
        <ToolbarBtn icon={Video} label={recording ? "Recording" : "Record"} active={recording} onClick={() => setRecording((v) => !v)} tone={recording ? "red" : undefined} />
        <Separator className="my-1 w-6" />
        <ToolbarBtn icon={MessageSquare} label="Chat" onClick={() => setRightTab("chat")} />
        <ToolbarBtn icon={ScrollText} label="View logs" onClick={() => setRightTab("info")} />
      </div>

      {/* Center viewer + drawers */}
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 bg-white px-3 py-2 text-xs">
          <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700"><Circle className="mr-1 h-2 w-2 fill-current" /> Live</Badge>
          <span className="font-mono">{session.id}</span>
          <span className="text-slate-400">·</span>
          <span className="font-medium text-slate-800">{session.device.hostname}</span>
          <span className="font-mono text-slate-500">{session.device.ip}</span>
          <span className="ml-3 flex items-center gap-1 text-slate-600"><Gauge className="h-3 w-3" /> {latency} ms · {quality}</span>
          <span className="flex items-center gap-1 text-slate-600"><Lock className="h-3 w-3" /> AES-256</span>
          <span className="flex items-center gap-1 text-slate-600">1920 × 1080</span>
          <span className="ml-auto font-mono text-slate-700">{hh}:{mm}:{ss}</span>
          <Button size="sm" variant="ghost" className="h-7 gap-1" onClick={() => setPaused((p) => !p)}>
            <PauseCircle className="h-3.5 w-3.5" /> {paused ? "Resume" : "Pause"}
          </Button>
          <Button size="sm" variant="destructive" className="h-7 gap-1" onClick={() => setConfirmEnd(true)}>
            <Power className="h-3.5 w-3.5" /> End session
          </Button>
        </div>

        <div className="relative flex-1 bg-slate-900">
          <RemoteViewerMock device={session.device} paused={paused} />
          {showTerminal && <TerminalDrawer onClose={() => setShowTerminal(false)} />}
          {showFiles && <FileTransferDrawer onClose={() => setShowFiles(false)} device={session.device} />}
        </div>
      </div>

      {/* Right panel */}
      <div className="hidden w-80 shrink-0 flex-col border-l border-slate-200 bg-white lg:flex">
        <Tabs value={rightTab} onValueChange={(v) => setRightTab(v as typeof rightTab)} className="flex min-h-0 flex-1 flex-col">
          <TabsList className="mx-3 mt-3 grid grid-cols-4">
            <TabsTrigger value="security" className="text-xs">Security</TabsTrigger>
            <TabsTrigger value="info" className="text-xs">Device</TabsTrigger>
            <TabsTrigger value="chat" className="text-xs">Chat</TabsTrigger>
            <TabsTrigger value="notes" className="text-xs">Notes</TabsTrigger>
          </TabsList>

          <TabsContent value="security" className="min-h-0 flex-1 overflow-auto p-3">
            <SecuritySidebar onEnd={() => setConfirmEnd(true)} />
          </TabsContent>

          <TabsContent value="info" className="min-h-0 flex-1 overflow-auto p-3">
            <DeviceInfoTabs infoTab={infoTab} setInfoTab={setInfoTab} device={session.device} />
          </TabsContent>

          <TabsContent value="chat" className="min-h-0 flex-1 overflow-hidden p-0">
            <SessionChat sessionId={session.id} />
          </TabsContent>

          <TabsContent value="notes" className="min-h-0 flex-1 overflow-auto p-3">
            <CollabNotes sessionId={session.id} device={session.device} />
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={confirmEnd} onOpenChange={setConfirmEnd}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>End session?</DialogTitle>
            <DialogDescription>Session {session.id} will be closed and the recording sealed to the audit vault.</DialogDescription>
          </DialogHeader>
          <div className="rounded-md border bg-slate-50 p-3 text-xs">
            <div className="text-slate-500">Termination reason</div>
            <Textarea placeholder="e.g. Issue resolved, user session restored." className="mt-1 h-16 bg-white" id="term-reason" />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setConfirmEnd(false)}>Cancel</Button>
            <Button variant="destructive" onClick={() => { setConfirmEnd(false); onEnd((document.getElementById("term-reason") as HTMLTextAreaElement)?.value || "Session ended by technician"); }}>End session</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ToolbarBtn({ icon: Icon, label, onClick, active, tone }: { icon: typeof LayoutDashboard; label: string; onClick?: () => void; active?: boolean; tone?: "red" }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button onClick={onClick} className={cn("grid h-10 w-10 place-items-center rounded-md border text-slate-600 transition-colors hover:bg-slate-100",
          active && "border-primary/40 bg-primary/10 text-primary",
          tone === "red" && "text-red-600 hover:bg-red-50",
        )}>
          <Icon className="h-4 w-4" />
        </button>
      </TooltipTrigger>
      <TooltipContent side="right">{label}</TooltipContent>
    </Tooltip>
  );
}

function RemoteViewerMock({ device, paused }: { device: ConsoleDevice; paused: boolean }) {
  return (
    <div className="relative m-3 flex-1 overflow-hidden rounded-md border border-slate-700 shadow-2xl">
      <div className="absolute inset-0 bg-gradient-to-br from-[#0a3d91] via-[#1155cc] to-[#0f4bb8]" />
      <div className="absolute inset-0 opacity-30" style={{ backgroundImage: "radial-gradient(circle at 30% 30%, rgba(255,255,255,0.35) 0, transparent 40%)" }} />
      {/* Fake Windows taskbar */}
      <div className="absolute inset-x-0 top-0 flex items-center gap-2 border-b border-white/10 bg-black/20 px-3 py-1.5 text-[11px] text-white/80">
        <span className="font-mono">{device.hostname}</span>
        <span className="opacity-60">— {device.user}@{device.ip}</span>
        <span className="ml-auto">Windows Session · Remote</span>
      </div>
      {/* Fake window */}
      <div className="absolute left-8 top-14 w-[46%] rounded-md border border-black/20 bg-white shadow-xl">
        <div className="flex items-center justify-between border-b bg-slate-100 px-3 py-1.5 text-[11px] text-slate-700">
          <div className="flex items-center gap-2"><FileText className="h-3 w-3" /> Event Viewer</div>
          <div className="flex gap-1"><span className="h-2 w-2 rounded-full bg-slate-400" /><span className="h-2 w-2 rounded-full bg-slate-400" /><span className="h-2 w-2 rounded-full bg-red-400" /></div>
        </div>
        <div className="p-3 font-mono text-[11px] text-slate-700">
          <div>Application  ·  Warning  ·  Print Spooler</div>
          <div>Application  ·  Error    ·  spoolsv.exe crash</div>
          <div>Security     ·  Audit    ·  RDP logon success (a.morgan)</div>
          <div>System       ·  Info     ·  Service restart requested</div>
        </div>
      </div>
      {/* Fake terminal window */}
      <div className="absolute bottom-6 right-8 w-[42%] rounded-md border border-black/40 bg-slate-950/95 shadow-xl">
        <div className="flex items-center justify-between border-b border-white/10 bg-slate-900 px-3 py-1.5 text-[11px] text-slate-200">
          <div className="flex items-center gap-2"><TerminalIcon className="h-3 w-3" /> PowerShell</div>
          <span className="text-[10px] text-slate-400">Administrator</span>
        </div>
        <div className="p-3 font-mono text-[11px] leading-5 text-emerald-300">
          <div>PS C:\Windows\System32&gt; Restart-Service Spooler</div>
          <div className="text-slate-300">WARNING: Waiting for service 'Print Spooler (Spooler)' to stop...</div>
          <div className="text-slate-300">WARNING: Service 'Print Spooler' stopped.</div>
          <div>PS C:\Windows\System32&gt; Get-Service Spooler</div>
          <div className="text-slate-100">Status   Name         DisplayName</div>
          <div className="text-slate-100">------   ----         -----------</div>
          <div className="text-slate-100">Running  Spooler      Print Spooler</div>
          <div>PS C:\Windows\System32&gt; <span className="animate-pulse">▍</span></div>
        </div>
      </div>
      {/* Windows taskbar (bottom) */}
      <div className="absolute inset-x-0 bottom-0 flex items-center gap-2 border-t border-white/10 bg-black/40 px-3 py-1.5 text-[11px] text-white/80">
        <div className="grid h-5 w-5 place-items-center rounded bg-white/10">⊞</div>
        <span>Start</span>
        <span className="ml-auto font-mono">{new Date().toLocaleTimeString()}</span>
      </div>
      {paused && (
        <div className="absolute inset-0 grid place-items-center bg-black/60">
          <div className="rounded-md border border-white/20 bg-black/70 px-4 py-2 text-sm text-white">
            <PauseCircle className="mr-2 inline h-4 w-4" /> Session paused — input suspended
          </div>
        </div>
      )}
    </div>
  );
}

function SecuritySidebar({ onEnd }: { onEnd: () => void }) {
  const perms: [string, boolean][] = [
    ["Remote Control", hasPermission(CURRENT_ROLE, "remote_desktop")],
    ["Terminal", true],
    ["File Transfer", hasPermission(CURRENT_ROLE, "file_transfer")],
    ["Restart Device", hasPermission(CURRENT_ROLE, "restart")],
    ["Shutdown Device", hasPermission(CURRENT_ROLE, "shutdown")],
  ];
  return (
    <div className="space-y-3 text-sm">
      <div className="rounded-md border p-3">
        <SectionTitle icon={Lock}>Session encryption</SectionTitle>
        <div className="mt-2 flex items-center justify-between text-xs">
          <span>AES-256-GCM</span>
          <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700">Enabled</Badge>
        </div>
        <div className="mt-1 flex items-center justify-between text-xs">
          <span>Certificate</span>
          <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700">Verified</Badge>
        </div>
        <div className="mt-1 flex items-center justify-between text-xs">
          <span>Channel</span>
          <span className="text-slate-600">Private WAN · mTLS</span>
        </div>
      </div>

      <div className="rounded-md border p-3">
        <SectionTitle icon={UsersIcon}>Access control</SectionTitle>
        <div className="mt-2 text-xs">
          <div className="text-slate-500">Role</div>
          <div className="font-medium">{ROLE_LABELS[CURRENT_ROLE]}</div>
        </div>
        <div className="mt-2 space-y-1 text-xs">
          {perms.map(([label, ok]) => (
            <div key={label} className="flex items-center justify-between">
              <span>{label}</span>
              {ok ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> : <X className="h-3.5 w-3.5 text-slate-400" />}
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Button size="sm" variant="outline" className="gap-1"><PauseCircle className="h-3.5 w-3.5" /> Pause</Button>
        <Button size="sm" variant="outline" className="gap-1"><ShieldCheck className="h-3.5 w-3.5" /> Re-auth</Button>
        <Button size="sm" variant="outline" className="gap-1"><Sparkles className="h-3.5 w-3.5" /> Escalate</Button>
        <Button size="sm" variant="destructive" className="gap-1" onClick={onEnd}><Power className="h-3.5 w-3.5" /> Terminate</Button>
      </div>
    </div>
  );
}

function DeviceInfoTabs({ infoTab, setInfoTab, device }: { infoTab: string; setInfoTab: (v: string) => void; device: ConsoleDevice }) {
  return (
    <Tabs value={infoTab} onValueChange={setInfoTab}>
      <TabsList className="grid grid-cols-3">
        <TabsTrigger value="overview" className="text-xs">Overview</TabsTrigger>
        <TabsTrigger value="perf" className="text-xs">Performance</TabsTrigger>
        <TabsTrigger value="net" className="text-xs">Network</TabsTrigger>
      </TabsList>
      <TabsContent value="overview" className="mt-3">
        <DeviceInfoCard device={device} />
      </TabsContent>
      <TabsContent value="perf" className="mt-3 space-y-2 text-xs">
        <MetricRow icon={Cpu} label="CPU" value="42%" />
        <MetricRow icon={MemoryStick} label="Memory" value="8.1 / 16 GB" />
        <MetricRow icon={HardDrive} label="Disk C:" value="126 / 512 GB" />
        <MetricRow icon={Gauge} label="Latency" value="21 ms" />
      </TabsContent>
      <TabsContent value="net" className="mt-3 space-y-2 text-xs">
        <MetricRow icon={Network} label="Adapter" value="Intel I219-V" />
        <MetricRow icon={Wifi} label="Uplink" value="1 Gbps · Private WAN" />
        <MetricRow icon={Lock} label="mTLS" value="OK · exp 2027-04" />
      </TabsContent>
    </Tabs>
  );
}

function MetricRow({ icon: Icon, label, value }: { icon: typeof LayoutDashboard; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded border p-2">
      <span className="flex items-center gap-2 text-slate-600"><Icon className="h-3.5 w-3.5" /> {label}</span>
      <span className="font-mono text-slate-800">{value}</span>
    </div>
  );
}

function SessionChat({ sessionId }: { sessionId: string }) {
  const [msgs, setMsgs] = useState<{ from: "tech" | "user"; text: string; ts: number; status: "sent" | "delivered" | "read" }[]>([
    { from: "user", text: "Hi, my printer isn't responding.", ts: Date.now() - 5 * 60_000, status: "read" },
    { from: "tech", text: "Connected. I'll restart the print spooler now.", ts: Date.now() - 4 * 60_000, status: "read" },
  ]);
  const [text, setText] = useState("");
  const send = () => {
    if (!text.trim()) return;
    setMsgs((m) => [...m, { from: "tech", text: text.trim(), ts: Date.now(), status: "sent" }]);
    logAudit({ actor: getViewerName(), actorRole: CURRENT_ROLE, category: "session", action: "chat_message", target: sessionId, status: "info" });
    setText("");
  };
  return (
    <div className="flex h-full flex-col">
      <ScrollArea className="flex-1 p-3">
        <div className="space-y-2">
          {msgs.map((m, i) => (
            <div key={i} className={cn("max-w-[80%] rounded-lg px-2.5 py-1.5 text-xs", m.from === "tech" ? "ml-auto bg-primary text-primary-foreground" : "bg-slate-100 text-slate-800")}>
              <div>{m.text}</div>
              <div className={cn("mt-0.5 text-[9px] opacity-70")}>{new Date(m.ts).toLocaleTimeString()} · {m.status}</div>
            </div>
          ))}
        </div>
      </ScrollArea>
      <div className="flex items-center gap-2 border-t p-2">
        <Input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} placeholder="Message end user…" className="h-8 text-xs" />
        <Button size="sm" className="h-8" onClick={send}>Send</Button>
      </div>
    </div>
  );
}

function CollabNotes({ sessionId, device }: { sessionId: string; device: ConsoleDevice }) {
  const [notes, setNotes] = useState<{ ts: number; text: string }[]>([
    { ts: Date.now() - 8 * 60_000, text: "09:42 Technician connected" },
    { ts: Date.now() - 6 * 60_000, text: "09:45 Checked print spooler service" },
    { ts: Date.now() - 3 * 60_000, text: "09:50 Restarted Spooler; job queue cleared" },
  ]);
  const [text, setText] = useState("");
  return (
    <div className="space-y-3">
      <div className="rounded-md border bg-amber-50 p-2 text-[11px] text-amber-800">
        Incident · {device.department} · {device.branch} — Session {sessionId}
      </div>
      <div className="flex gap-2">
        <Button size="sm" variant="outline" className="h-7 gap-1 text-xs"><UserPlus className="h-3 w-3" /> Invite technician</Button>
        <Button size="sm" variant="outline" className="h-7 gap-1 text-xs"><UsersIcon className="h-3 w-3" /> Transfer ownership</Button>
      </div>
      <div className="rounded-md border">
        <div className="border-b px-2 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Troubleshooting checklist</div>
        <ul className="space-y-1 p-2 text-xs">
          <li className="flex items-center gap-2"><Checkbox defaultChecked /> Verify user reproduces issue</li>
          <li className="flex items-center gap-2"><Checkbox defaultChecked /> Restart affected service</li>
          <li className="flex items-center gap-2"><Checkbox /> Confirm resolution with user</li>
          <li className="flex items-center gap-2"><Checkbox /> Capture screenshot for ticket</li>
        </ul>
      </div>
      <div>
        <div className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Internal notes</div>
        <div className="space-y-1">
          {notes.map((n, i) => <div key={i} className="rounded border bg-slate-50 px-2 py-1 text-xs text-slate-700">{n.text}</div>)}
        </div>
        <div className="mt-2 flex gap-2">
          <Input value={text} onChange={(e) => setText(e.target.value)} placeholder="Add a note…" className="h-8 text-xs" />
          <Button size="sm" className="h-8" onClick={() => { if (text.trim()) { setNotes((ns) => [...ns, { ts: Date.now(), text: `${new Date().toLocaleTimeString()} ${text.trim()}` }]); setText(""); } }}>Add</Button>
        </div>
      </div>
    </div>
  );
}

// ─── Terminal drawer ────────────────────────────────────────────────────

function TerminalDrawer({ onClose }: { onClose: () => void }) {
  const [lines, setLines] = useState<string[]>([
    "ERAP Remote Shell · Administrator approval required for destructive commands",
    "C:\\Windows\\System32>",
  ]);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => { scrollRef.current?.scrollTo({ top: 9999 }); }, [lines]);
  const run = () => {
    if (!input.trim()) return;
    const cmd = input.trim();
    const out = simulateCmd(cmd);
    setLines((l) => [...l.slice(0, -1), `C:\\Windows\\System32> ${cmd}`, ...out, "C:\\Windows\\System32>"]);
    logAudit({ actor: getViewerName(), actorRole: CURRENT_ROLE, category: "session", action: "terminal_command", target: cmd, status: "info" });
    setInput("");
  };
  return (
    <div className="absolute inset-x-3 bottom-3 h-64 overflow-hidden rounded-md border border-slate-700 bg-slate-950 text-slate-100 shadow-xl">
      <div className="flex items-center justify-between border-b border-slate-800 px-3 py-1.5 text-xs">
        <div className="flex items-center gap-2"><TerminalIcon className="h-3.5 w-3.5" /> ERAP Remote Shell · elevated</div>
        <div className="flex items-center gap-1">
          <Button size="sm" variant="ghost" className="h-6 gap-1 text-[11px] text-slate-300 hover:bg-slate-800"><Download className="h-3 w-3" /> Export log</Button>
          <button onClick={onClose} className="rounded p-1 hover:bg-slate-800"><X className="h-3.5 w-3.5" /></button>
        </div>
      </div>
      <div ref={scrollRef} className="h-40 overflow-auto p-2 font-mono text-[11px] leading-5">
        {lines.map((l, i) => <div key={i} className={cn(l.startsWith("C:") && "text-emerald-300")}>{l}</div>)}
      </div>
      <div className="flex items-center gap-2 border-t border-slate-800 bg-slate-900 px-2 py-1.5">
        <span className="font-mono text-[11px] text-emerald-300">&gt;</span>
        <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && run()} className="flex-1 bg-transparent font-mono text-[11px] text-slate-100 outline-none" placeholder="Enter command… (try: ipconfig, whoami, get-service spooler)" />
      </div>
    </div>
  );
}

function simulateCmd(cmd: string): string[] {
  const c = cmd.toLowerCase();
  if (c.startsWith("ipconfig")) return ["Windows IP Configuration", "  IPv4 Address . : 10.24.11.42", "  Subnet Mask  . : 255.255.255.0", "  Default Gtwy . : 10.24.11.1"];
  if (c.startsWith("whoami")) return ["nt authority\\system"];
  if (c.includes("get-service")) return ["Status   Name         DisplayName", "------   ----         -----------", "Running  Spooler      Print Spooler"];
  if (c.startsWith("dir")) return ["Volume in drive C is Windows", " Directory of C:\\Windows\\System32", " 04/12/2025  10:14   <DIR>   drivers", " 04/12/2025  10:14   <DIR>   config"];
  return [`'${cmd}' executed. (audit-logged)`];
}

// ─── File transfer drawer ───────────────────────────────────────────────

function FileTransferDrawer({ device, onClose }: { device: ConsoleDevice; onClose: () => void }) {
  const [transfers, setTransfers] = useState<{ id: string; name: string; direction: "up" | "down"; size: string; progress: number; scan: "clean" | "pending" }[]>([
    { id: "T1", name: "spooler-fix.ps1", direction: "up", size: "12 KB", progress: 100, scan: "clean" },
    { id: "T2", name: "eventlog-export.evtx", direction: "down", size: "3.4 MB", progress: 62, scan: "pending" },
  ]);
  const push = (direction: "up" | "down") => {
    const id = `T${transfers.length + 1}`;
    const name = direction === "up" ? "diag-toolkit.zip" : "system-report.txt";
    setTransfers((t) => [{ id, name, direction, size: "1.2 MB", progress: 0, scan: "pending" }, ...t]);
    logAudit({ actor: getViewerName(), actorRole: CURRENT_ROLE, category: "session", action: direction === "up" ? "file_upload" : "file_download", target: name, targetId: device.id, status: "info" });
    let p = 0;
    const iv = setInterval(() => {
      p += 20;
      setTransfers((ts) => ts.map((x) => x.id === id ? { ...x, progress: Math.min(100, p), scan: p >= 100 ? "clean" : "pending" } : x));
      if (p >= 100) clearInterval(iv);
    }, 400);
  };
  return (
    <div className="absolute inset-3 overflow-hidden rounded-md border border-slate-200 bg-white shadow-xl">
      <div className="flex items-center justify-between border-b px-3 py-2 text-xs">
        <div className="flex items-center gap-2 font-medium"><FolderUp className="h-3.5 w-3.5" /> Secure File Transfer · {device.hostname}</div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-[10px] text-emerald-700">Malware scan · active</Badge>
          <button onClick={onClose} className="rounded p-1 hover:bg-slate-100"><X className="h-3.5 w-3.5" /></button>
        </div>
      </div>
      <div className="grid h-[calc(100%-3.6rem)] grid-cols-2 divide-x">
        <FilePane title="Technician workstation" path="C:\Support\Toolkit" items={["diag-toolkit.zip", "spooler-fix.ps1", "erap-notes.md"]} action={() => push("up")} actionLabel="Upload →" />
        <FilePane title={`Remote · ${device.hostname}`} path="C:\Users\a.morgan\Downloads" items={["system-report.txt", "eventlog-export.evtx", "profile.xml"]} action={() => push("down")} actionLabel="← Download" />
      </div>
      <div className="border-t px-3 py-2">
        <div className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Transfers</div>
        <div className="max-h-24 space-y-1 overflow-auto">
          {transfers.map((t) => (
            <div key={t.id} className="flex items-center gap-2 rounded border px-2 py-1 text-xs">
              {t.direction === "up" ? <Upload className="h-3 w-3 text-primary" /> : <Download className="h-3 w-3 text-primary" />}
              <span className="font-mono">{t.name}</span>
              <span className="text-slate-500">{t.size}</span>
              <div className="ml-2 flex-1"><Progress value={t.progress} className="h-1" /></div>
              <Badge variant="outline" className={cn("text-[10px]", t.scan === "clean" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-amber-200 bg-amber-50 text-amber-700")}>{t.scan === "clean" ? "Clean" : "Scanning"}</Badge>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function FilePane({ title, path, items, action, actionLabel }: { title: string; path: string; items: string[]; action: () => void; actionLabel: string }) {
  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between border-b bg-slate-50 px-3 py-1.5 text-[11px]">
        <div>
          <div className="font-semibold text-slate-800">{title}</div>
          <div className="font-mono text-slate-500">{path}</div>
        </div>
        <div className="flex gap-1">
          <Button size="sm" variant="ghost" className="h-6 px-2 text-[11px]"><FolderPlus className="mr-1 h-3 w-3" /> New</Button>
          <Button size="sm" variant="ghost" className="h-6 px-2 text-[11px] text-red-600"><Trash2 className="mr-1 h-3 w-3" /> Delete</Button>
          <Button size="sm" className="h-6 px-2 text-[11px]" onClick={action}>{actionLabel}</Button>
        </div>
      </div>
      <ScrollArea className="flex-1">
        <ul className="divide-y text-xs">
          {items.map((it) => (
            <li key={it} className="flex items-center gap-2 px-3 py-1.5 hover:bg-slate-50">
              <FileText className="h-3.5 w-3.5 text-slate-400" />
              <span className="font-mono">{it}</span>
            </li>
          ))}
        </ul>
      </ScrollArea>
    </div>
  );
}

// ─── History / audit / incident views ───────────────────────────────────

function EmptyLive({ onStart }: { onStart: () => void }) {
  return (
    <div className="grid h-full place-items-center p-8">
      <div className="max-w-md text-center">
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-full border bg-white">
          <MonitorSmartphone className="h-5 w-5 text-slate-500" />
        </div>
        <div className="mt-3 text-sm font-semibold text-slate-900">No active session</div>
        <div className="mt-1 text-xs text-slate-500">Start a new remote session to open the live console.</div>
        <Button className="mt-4 gap-1" onClick={onStart}><Play className="h-3.5 w-3.5" /> Start session</Button>
      </div>
    </div>
  );
}

function SessionHistoryView({ sessions, onOpen }: { sessions: SessionRow[]; onOpen: (row: SessionRow) => void }) {
  const [q, setQ] = useState("");
  const [statusF, setStatusF] = useState<string>("all");
  const rows = sessions.filter((s) => {
    const matchesQ = !q || [s.id, s.device.hostname, s.device.id, s.technician, s.device.branch].some((v) => v.toLowerCase().includes(q.toLowerCase()));
    const matchesS = statusF === "all" || s.status === statusF;
    return matchesQ && matchesS;
  });
  return (
    <div className="p-4 md:p-6">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2 top-2.5 h-3.5 w-3.5 text-slate-400" />
          <Input className="h-9 w-64 pl-7" placeholder="Search history…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <Select value={statusF} onValueChange={setStatusF}>
          <SelectTrigger className="h-9 w-48"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {(Object.keys(STATUS_STYLE) as SessionStatus[]).map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
        <div className="ml-auto text-xs text-slate-500">{rows.length} sessions</div>
      </div>
      <div className="rounded-lg border bg-white">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50/60 text-[11px] uppercase tracking-wider text-slate-500">
              <TableHead>Session</TableHead>
              <TableHead>Device</TableHead>
              <TableHead>Technician</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Started</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((s) => (
              <TableRow key={s.id}>
                <TableCell className="font-mono text-xs">{s.id}</TableCell>
                <TableCell>
                  <div className="font-medium">{s.device.hostname}</div>
                  <div className="font-mono text-[11px] text-slate-500">{s.device.id}</div>
                </TableCell>
                <TableCell className="text-sm">{s.technician}</TableCell>
                <TableCell><Badge variant="outline" className="text-[10px]">{s.type}</Badge></TableCell>
                <TableCell className="text-xs">{new Date(s.startedAt).toLocaleString()}</TableCell>
                <TableCell><StatusPill status={s.status} /></TableCell>
                <TableCell className="text-right">
                  <Button size="sm" variant="outline" className="h-7 gap-1 text-xs" onClick={() => onOpen(s)}><MonitorSmartphone className="h-3 w-3" /> Details</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function AuditTimelineView({ sessions }: { sessions: SessionRow[] }) {
  const s = sessions[0];
  const events = [
    { ts: "09:30:02", label: "Connection initiated", detail: `${s.technician} → ${s.device.hostname}` },
    { ts: "09:30:05", label: "Certificate & role verified", detail: "mTLS · role=Senior Support Engineer" },
    { ts: "09:30:11", label: "End-user approval granted", detail: `${s.device.user} accepted the request` },
    { ts: "09:30:14", label: "Remote control enabled", detail: "AES-256 channel established" },
    { ts: "09:34:20", label: "Terminal command executed", detail: "Restart-Service Spooler" },
    { ts: "09:41:05", label: "File transferred", detail: "eventlog-export.evtx (down) · scan clean" },
    { ts: "09:52:14", label: "Session closed", detail: "Reason: issue resolved" },
  ];
  return (
    <div className="grid gap-4 p-4 md:grid-cols-3 md:p-6">
      <div className="md:col-span-2 rounded-lg border bg-white p-4">
        <div className="mb-3 flex items-center gap-2">
          <ScrollText className="h-4 w-4 text-primary" />
          <div className="font-semibold">Session recording · {s.id}</div>
          <Badge variant="outline" className="text-[10px]">Sealed to audit vault</Badge>
        </div>
        <ol className="relative ml-2 space-y-3 border-l pl-4">
          {events.map((e, i) => (
            <li key={i} className="relative">
              <span className="absolute -left-[22px] top-0.5 grid h-4 w-4 place-items-center rounded-full border bg-background">
                <Circle className="h-2 w-2 fill-primary text-primary" />
              </span>
              <div className="flex items-baseline gap-2 text-xs">
                <span className="font-mono text-slate-500">{e.ts}</span>
                <span className="font-medium">{e.label}</span>
              </div>
              <div className="text-xs text-slate-500">{e.detail}</div>
            </li>
          ))}
        </ol>
      </div>
      <div className="space-y-3">
        <div className="rounded-lg border bg-white p-3 text-sm">
          <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Audit details</div>
          <dl className="grid grid-cols-2 gap-y-1.5 text-xs text-slate-600">
            <dt>Technician</dt><dd className="text-right text-slate-800">{s.technician}</dd>
            <dt>Device</dt><dd className="text-right text-slate-800">{s.device.hostname}</dd>
            <dt>Duration</dt><dd className="text-right text-slate-800">{s.duration}</dd>
            <dt>Files transferred</dt><dd className="text-right text-slate-800">1</dd>
            <dt>Commands</dt><dd className="text-right text-slate-800">3</dd>
            <dt>Termination</dt><dd className="text-right text-slate-800">Resolved</dd>
          </dl>
        </div>
        <div className="rounded-lg border bg-white p-3">
          <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Recording</div>
          <div className="grid h-24 place-items-center rounded border bg-slate-50 text-xs text-slate-500">Encrypted MP4 · 12.4 MB</div>
          <div className="mt-2 flex gap-2">
            <Button size="sm" variant="outline" className="h-7 gap-1 text-xs"><Play className="h-3 w-3" /> Play</Button>
            <Button size="sm" variant="outline" className="h-7 gap-1 text-xs"><Download className="h-3 w-3" /> Export</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function IncidentSupportView({ onEmergency }: { onEmergency: () => void }) {
  const incidents = [
    { id: "INC-4021", title: "Domain controller unreachable — Berlin", priority: "P1", branch: "Berlin", opened: "12 min ago" },
    { id: "INC-4018", title: "Finance printer queue stuck — NYC", priority: "P2", branch: "New York", opened: "38 min ago" },
    { id: "INC-4015", title: "VPN handshake failing — Tokyo", priority: "P2", branch: "Tokyo", opened: "1 h ago" },
  ];
  return (
    <div className="space-y-4 p-4 md:p-6">
      <div className="rounded-lg border border-red-200 bg-red-50 p-4">
        <div className="flex items-center gap-2">
          <Siren className="h-5 w-5 text-red-600" />
          <div>
            <div className="font-semibold text-red-800">Emergency Support Mode</div>
            <div className="text-xs text-red-700">Grants temporary elevated privileges to respond to critical incidents. Every action is fully audited and expires automatically.</div>
          </div>
          <Button className="ml-auto gap-1 bg-red-600 hover:bg-red-700" onClick={onEmergency}><Siren className="h-3.5 w-3.5" /> Request emergency access</Button>
        </div>
      </div>

      <div className="rounded-lg border bg-white">
        <div className="border-b px-4 py-3 font-semibold">Open incidents</div>
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50/60 text-[11px] uppercase tracking-wider text-slate-500">
              <TableHead>Incident</TableHead><TableHead>Title</TableHead><TableHead>Branch</TableHead><TableHead>Priority</TableHead><TableHead>Opened</TableHead><TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {incidents.map((i) => (
              <TableRow key={i.id}>
                <TableCell className="font-mono text-xs">{i.id}</TableCell>
                <TableCell className="text-sm">{i.title}</TableCell>
                <TableCell className="text-sm text-slate-600">{i.branch}</TableCell>
                <TableCell>
                  <Badge variant="outline" className={cn("text-[10px]", i.priority === "P1" ? "border-red-200 bg-red-50 text-red-700" : "border-amber-200 bg-amber-50 text-amber-700")}>{i.priority}</Badge>
                </TableCell>
                <TableCell className="text-xs text-slate-500">{i.opened}</TableCell>
                <TableCell className="text-right">
                  <Button size="sm" variant="outline" className="h-7 gap-1 text-xs" onClick={onEmergency}><Play className="h-3 w-3" /> Respond</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function EmergencyDialog({ open, onOpenChange, onGranted }: { open: boolean; onOpenChange: (v: boolean) => void; onGranted: (d: ConsoleDevice) => void }) {
  const [device, setDevice] = useState<string>(DEVICES[0].id);
  const [reason, setReason] = useState("");
  const [approver, setApprover] = useState("On-call Manager (auto-page)");
  const [expires, setExpires] = useState("30");
  const submit = () => {
    const dev = DEVICES.find((d) => d.id === device)!;
    logAudit({ actor: getViewerName(), actorRole: CURRENT_ROLE, category: "session", action: "emergency_access_granted", target: dev.hostname, targetId: dev.id, status: "success", details: `Approver: ${approver}, expires in ${expires}m — ${reason || "critical incident"}` });
    toast.success("Emergency access granted — session monitored");
    onGranted(dev);
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Siren className="h-4 w-4 text-red-600" /> Emergency Support Access</DialogTitle>
          <DialogDescription>Temporary elevated privileges for critical incident response. All actions are fully audited.</DialogDescription>
        </DialogHeader>
        <div className="rounded-md border border-red-200 bg-red-50 p-2 text-[11px] text-red-800">
          Emergency access is monitored and fully audited. Access expires automatically at the end of the window.
        </div>
        <div className="space-y-3 text-sm">
          <div>
            <label className="text-xs text-slate-500">Target device</label>
            <Select value={device} onValueChange={setDevice}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>{DEVICES.map((d) => <SelectItem key={d.id} value={d.id}>{d.hostname} · {d.id}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs text-slate-500">Approver chain</label>
            <Select value={approver} onValueChange={setApprover}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="On-call Manager (auto-page)">On-call Manager (auto-page)</SelectItem>
                <SelectItem value="Security Officer">Security Officer</SelectItem>
                <SelectItem value="Regional Administrator">Regional Administrator</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs text-slate-500">Expires in (minutes)</label>
            <Select value={expires} onValueChange={setExpires}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="15">15 minutes</SelectItem>
                <SelectItem value="30">30 minutes</SelectItem>
                <SelectItem value="60">60 minutes</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs text-slate-500">Justification</label>
            <Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Describe the critical incident and impact…" className="mt-1 h-20" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button className="bg-red-600 hover:bg-red-700" onClick={submit}>Grant emergency access</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}