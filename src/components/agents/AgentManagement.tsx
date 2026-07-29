import { useMemo, useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  MonitorSmartphone,
  Radio,
  Boxes,
  ShieldCheck,
  ScrollText,
  Settings as SettingsIcon,
  Plug,
  Bell,
  ChevronDown,
  ChevronRight,
  Search,
  Download,
  Upload,
  Play,
  RotateCcw,
  RefreshCw,
  Package,
  Terminal,
  Cpu,
  MemoryStick,
  HardDrive,
  Activity,
  Wifi,
  Lock,
  KeyRound,
  FileCheck2,
  Server,
  Users as UsersIcon,
  MoreHorizontal,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  ChevronLeft,
  Circle,
  X,
  ClipboardList,
  ShieldAlert,
  Trash2,
  Power,
  HeartPulse,
  History,
  AlertOctagon,
  Lightbulb,
  Loader2,
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { ErapRole, ROLE_LABELS, hasPermission } from "@/lib/erap-roles";
import { getViewerName } from "@/lib/auth";
import { AccountBadge } from "@/components/shell/AccountBadge";
import { logAudit } from "@/lib/audit-log";

// ────────────────────────────────────────────────────────────────────────────
// Types & sample data
// ────────────────────────────────────────────────────────────────────────────

type AgentStatus = "online" | "offline" | "updating" | "install_failed" | "disabled";

interface Agent {
  id: string;
  hostname: string;
  branch: string;
  department: string;
  agentVersion: string;
  os: string;
  lastCheckIn: string;
  status: AgentStatus;
  policy: string;
  ip: string;
  cpu: number;
  mem: number;
  disk: number;
  latencyMs: number;
  heartbeat: string;
  encryption: "AES-256" | "AES-128";
  cert: "valid" | "expiring" | "expired";
  authOk: boolean;
  compliant: boolean;
}

const CURRENT_VERSION = "ERAP Agent v3.2.1";

const AGENTS: Agent[] = [
  { id: "DEV-10241", hostname: "NYC-FIN-WS01", branch: "New York", department: "Finance",     agentVersion: "3.2.1", os: "Windows 11 Pro 23H2",        lastCheckIn: "2 min ago",  status: "online",         policy: "Default Technician",  ip: "10.24.11.42",  cpu: 18, mem: 46, disk: 61, latencyMs: 12, heartbeat: "2s ago",   encryption: "AES-256", cert: "valid",    authOk: true,  compliant: true  },
  { id: "DEV-10242", hostname: "LON-HR-LT14",  branch: "London",   department: "HR",          agentVersion: "3.2.1", os: "Windows 11 Pro 23H2",        lastCheckIn: "just now",   status: "online",         policy: "Branch Support",      ip: "10.44.9.18",   cpu: 9,  mem: 38, disk: 74, latencyMs: 22, heartbeat: "1s ago",   encryption: "AES-256", cert: "valid",    authOk: true,  compliant: true  },
  { id: "DEV-10243", hostname: "BER-ENG-WS22", branch: "Berlin",   department: "Engineering", agentVersion: "3.1.6", os: "Windows 10 Enterprise 22H2", lastCheckIn: "3 h ago",    status: "offline",        policy: "Default Technician",  ip: "10.61.4.201",  cpu: 0,  mem: 0,  disk: 55, latencyMs: 0,  heartbeat: "3 h ago",  encryption: "AES-256", cert: "expiring", authOk: true,  compliant: false },
  { id: "DEV-10244", hostname: "SFO-DES-MB08", branch: "San Francisco", department: "Design", agentVersion: "3.2.1", os: "Windows 11 Pro 24H2",        lastCheckIn: "5 min ago",  status: "online",         policy: "Default Technician",  ip: "10.12.7.66",   cpu: 24, mem: 52, disk: 41, latencyMs: 9,  heartbeat: "3s ago",   encryption: "AES-256", cert: "valid",    authOk: true,  compliant: true  },
  { id: "DEV-10245", hostname: "TOK-OPS-WS05", branch: "Tokyo",    department: "Operations",  agentVersion: "3.0.4", os: "Windows Server 2022",         lastCheckIn: "1 d ago",    status: "offline",        policy: "Security Admin",      ip: "10.88.2.9",    cpu: 0,  mem: 0,  disk: 88, latencyMs: 0,  heartbeat: "1 d ago",  encryption: "AES-256", cert: "expired",  authOk: false, compliant: false },
  { id: "DEV-10246", hostname: "NYC-ENG-WS31", branch: "New York", department: "Engineering", agentVersion: "3.2.1", os: "Windows 11 Pro 24H2",        lastCheckIn: "1 min ago",  status: "updating",       policy: "Default Technician",  ip: "10.24.11.77",  cpu: 62, mem: 71, disk: 33, latencyMs: 14, heartbeat: "1s ago",   encryption: "AES-256", cert: "valid",    authOk: true,  compliant: true  },
  { id: "DEV-10247", hostname: "LON-FIN-LT02", branch: "London",   department: "Finance",     agentVersion: "3.2.0", os: "Windows 11 Pro 23H2",        lastCheckIn: "8 min ago",  status: "online",         policy: "Branch Support",      ip: "10.44.9.44",   cpu: 14, mem: 41, disk: 70, latencyMs: 19, heartbeat: "4s ago",   encryption: "AES-256", cert: "valid",    authOk: true,  compliant: true  },
  { id: "DEV-10248", hostname: "BER-HR-WS10",  branch: "Berlin",   department: "HR",          agentVersion: "3.1.6", os: "Windows 10 Enterprise 22H2", lastCheckIn: "5 h ago",    status: "install_failed", policy: "Branch Support",      ip: "10.61.4.115",  cpu: 0,  mem: 0,  disk: 62, latencyMs: 0,  heartbeat: "n/a",      encryption: "AES-128", cert: "expiring", authOk: false, compliant: false },
  { id: "DEV-10249", hostname: "SFO-OPS-WS17", branch: "San Francisco", department: "Operations", agentVersion: "3.2.1", os: "Windows 11 Pro 24H2",    lastCheckIn: "12 min ago", status: "online",         policy: "Security Admin",      ip: "10.12.7.88",   cpu: 33, mem: 58, disk: 27, latencyMs: 11, heartbeat: "2s ago",   encryption: "AES-256", cert: "valid",    authOk: true,  compliant: true  },
  { id: "DEV-10250", hostname: "TOK-DES-MB03", branch: "Tokyo",    department: "Design",      agentVersion: "3.2.1", os: "Windows 11 Pro 23H2",        lastCheckIn: "just now",   status: "online",         policy: "Default Technician",  ip: "10.88.2.31",   cpu: 21, mem: 44, disk: 51, latencyMs: 24, heartbeat: "1s ago",   encryption: "AES-256", cert: "valid",    authOk: true,  compliant: true  },
  { id: "DEV-10251", hostname: "NYC-OPS-WS44", branch: "New York", department: "Operations",  agentVersion: "3.2.1", os: "Windows 11 Pro 23H2",        lastCheckIn: "just now",   status: "disabled",       policy: "Default Technician",  ip: "10.24.11.99",  cpu: 0,  mem: 0,  disk: 44, latencyMs: 0,  heartbeat: "paused",   encryption: "AES-256", cert: "valid",    authOk: true,  compliant: true  },
  { id: "DEV-10252", hostname: "LON-ENG-WS08", branch: "London",   department: "Engineering", agentVersion: "3.1.6", os: "Windows 10 Enterprise 22H2", lastCheckIn: "45 min ago", status: "online",         policy: "Default Technician",  ip: "10.44.9.201",  cpu: 27, mem: 63, disk: 39, latencyMs: 17, heartbeat: "6s ago",   encryption: "AES-256", cert: "valid",    authOk: true,  compliant: false },
];

const PENDING_APPROVALS = 4;

// ────────────────────────────────────────────────────────────────────────────
// Deployment batches with per-device step progress
// ────────────────────────────────────────────────────────────────────────────

type BatchStepStatus = "pending" | "running" | "success" | "failed" | "skipped";

interface BatchDeviceStep {
  key: string;
  label: string;
  status: BatchStepStatus;
  detail?: string;
}

interface BatchDevice {
  hostname: string;
  ip: string;
  status: "queued" | "in_progress" | "completed" | "failed" | "retrying";
  steps: BatchDeviceStep[];
}

interface DeploymentBatch {
  id: string;
  title: string;
  when: string;
  status: "Completed" | "In progress" | "Staged" | "Failed";
  devices: BatchDevice[];
}

const BATCH_STEP_TEMPLATE = [
  "Queued",
  "Package fetched",
  "MSI signature verified",
  "Installer executed",
  "Post-install checks",
  "Registered with broker",
];

function mkSteps(upTo: number, failAt?: number): BatchDeviceStep[] {
  return BATCH_STEP_TEMPLATE.map((label, i) => {
    let status: BatchStepStatus = "pending";
    if (failAt !== undefined && i === failAt) status = "failed";
    else if (failAt !== undefined && i > failAt) status = "skipped";
    else if (i < upTo) status = "success";
    else if (i === upTo) status = "running";
    return {
      key: `${i}-${label}`,
      label,
      status,
      detail: status === "failed" ? "MSI exit 1603 — access denied on target" : undefined,
    };
  });
}

const DEPLOYMENT_BATCHES: DeploymentBatch[] = [
  {
    id: "BATCH-2148", title: "3.2.1 → New York Finance", when: "Today 09:12", status: "Completed",
    devices: [
      { hostname: "NYC-FIN-WS01", ip: "10.24.11.42", status: "completed", steps: mkSteps(6) },
      { hostname: "NYC-FIN-WS02", ip: "10.24.11.43", status: "completed", steps: mkSteps(6) },
      { hostname: "NYC-FIN-WS03", ip: "10.24.11.44", status: "completed", steps: mkSteps(6) },
    ],
  },
  {
    id: "BATCH-2147", title: "3.2.1 → London Support", when: "Today 08:55", status: "In progress",
    devices: [
      { hostname: "LON-HR-LT14", ip: "10.44.9.18",   status: "completed",   steps: mkSteps(6) },
      { hostname: "LON-FIN-LT02", ip: "10.44.9.44",  status: "in_progress", steps: mkSteps(3) },
      { hostname: "LON-ENG-WS08", ip: "10.44.9.201", status: "in_progress", steps: mkSteps(2) },
      { hostname: "LON-OPS-WS41", ip: "10.44.9.87",  status: "queued",      steps: mkSteps(0) },
    ],
  },
  {
    id: "BATCH-2146", title: "3.2.0 Staged → Berlin Eng lab", when: "Yesterday", status: "Failed",
    devices: [
      { hostname: "BER-ENG-WS22", ip: "10.61.4.201", status: "completed", steps: mkSteps(6) },
      { hostname: "BER-HR-WS10",  ip: "10.61.4.115", status: "failed",    steps: mkSteps(0, 3) },
      { hostname: "BER-ENG-WS23", ip: "10.61.4.202", status: "failed",    steps: mkSteps(0, 2) },
    ],
  },
  {
    id: "BATCH-2145", title: "Rollback → Tokyo Ops", when: "2 days ago", status: "Completed",
    devices: [
      { hostname: "TOK-OPS-WS05", ip: "10.88.2.9",  status: "completed", steps: mkSteps(6) },
      { hostname: "TOK-DES-MB03", ip: "10.88.2.31", status: "completed", steps: mkSteps(6) },
    ],
  },
];

interface Version {
  version: string;
  releaseDate: string;
  changes: string;
  deploymentStatus: "Production" | "Staged" | "Testing" | "Deprecated" | "Rolled Back";
  coverage: number;
}

const VERSIONS: Version[] = [
  { version: "3.2.1", releaseDate: "2026-06-14", changes: "Hardened TLS handshake, faster reconnect on WAN jitter, fixes for HiDPI cursor.",   deploymentStatus: "Production", coverage: 78 },
  { version: "3.2.0", releaseDate: "2026-05-02", changes: "New session recording pipeline, policy-driven clipboard controls.",                 deploymentStatus: "Staged",     coverage: 12 },
  { version: "3.1.6", releaseDate: "2026-02-10", changes: "Certificate pinning, memory usage improvements on Windows Server 2022.",            deploymentStatus: "Production", coverage: 8  },
  { version: "3.1.0", releaseDate: "2025-11-19", changes: "Introduced Remote Terminal, revised installer signing.",                             deploymentStatus: "Deprecated", coverage: 1  },
  { version: "3.0.4", releaseDate: "2025-08-04", changes: "Baseline release for on-prem WAN. Kerberos-only auth.",                              deploymentStatus: "Deprecated", coverage: 1  },
  { version: "3.2.0-rc1", releaseDate: "2026-04-11", changes: "Release candidate, internal QA lab only.",                                       deploymentStatus: "Testing",    coverage: 0  },
];

interface Policy {
  id: string;
  name: string;
  description: string;
  assignedAgents: number;
  permissions: {
    remoteScreen: boolean;
    keyboardMouse: boolean;
    chat: boolean;
    fileTransfer: boolean;
    remoteTerminal: boolean;
    screenCapture: boolean;
    requireApproval: boolean;
    unattended: boolean;
    admin: boolean;
    audit: boolean;
  };
  updated: string;
}

const POLICIES: Policy[] = [
  {
    id: "POL-001",
    name: "Default Technician",
    description: "Baseline policy for first-line support technicians.",
    assignedAgents: 612,
    permissions: { remoteScreen: true, keyboardMouse: true, chat: true, fileTransfer: false, remoteTerminal: false, screenCapture: false, requireApproval: true, unattended: false, admin: false, audit: false },
    updated: "2026-07-02",
  },
  {
    id: "POL-002",
    name: "Branch Support",
    description: "Regional support with diagnostics and limited administration.",
    assignedAgents: 284,
    permissions: { remoteScreen: true, keyboardMouse: true, chat: true, fileTransfer: true, remoteTerminal: true, screenCapture: false, requireApproval: true, unattended: true, admin: false, audit: false },
    updated: "2026-06-28",
  },
  {
    id: "POL-003",
    name: "Security Admin",
    description: "Full administration and audit access for security operations.",
    assignedAgents: 47,
    permissions: { remoteScreen: true, keyboardMouse: true, chat: true, fileTransfer: true, remoteTerminal: true, screenCapture: true, requireApproval: false, unattended: true, admin: true, audit: true },
    updated: "2026-07-10",
  },
];

interface AgentLog {
  ts: string;
  device: string;
  action: "Installed" | "Updated" | "Disabled" | "Removed" | "Policy changed" | "Install failed" | "Rollback";
  user: string;
  result: "success" | "denied" | "failed" | "info";
  detail: string;
}

const AGENT_LOGS: AgentLog[] = [
  { ts: "2026-07-17 09:12", device: "NYC-ENG-WS31", action: "Updated",        user: "a.morgan",  result: "success", detail: "3.2.0 → 3.2.1 via Network Push" },
  { ts: "2026-07-17 09:08", device: "BER-HR-WS10",  action: "Install failed", user: "s.patel",   result: "failed",  detail: "MSI exit 1603 — access denied on target" },
  { ts: "2026-07-17 08:41", device: "NYC-OPS-WS44", action: "Disabled",       user: "a.morgan",  result: "success", detail: "Agent paused pending investigation" },
  { ts: "2026-07-17 08:12", device: "SFO-DES-MB08", action: "Policy changed", user: "s.patel",   result: "success", detail: "Assigned Default Technician" },
  { ts: "2026-07-16 22:03", device: "LON-FIN-LT02", action: "Installed",      user: "system",    result: "success", detail: "Group Deployment / batch #48" },
  { ts: "2026-07-16 19:44", device: "TOK-OPS-WS05", action: "Rollback",       user: "a.morgan",  result: "info",    detail: "Version pinned to 3.0.4 for OS compatibility" },
  { ts: "2026-07-16 15:20", device: "LON-ENG-WS08", action: "Policy changed", user: "system",    result: "info",    detail: "Compliance drift detected — flagged" },
  { ts: "2026-07-15 11:07", device: "DEV-10230",    action: "Removed",        user: "a.morgan",  result: "success", detail: "Device decommissioned" },
];

// ────────────────────────────────────────────────────────────────────────────
// Nav config
// ────────────────────────────────────────────────────────────────────────────

const NAV = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard, to: "/" as const, parent: null as string | null },
  {
    key: "devices",
    label: "Devices",
    icon: MonitorSmartphone,
    to: undefined,
    parent: null,
    children: [
      { key: "inventory", label: "Device Inventory", to: "/" as const },
      { key: "sessions",  label: "Remote Sessions", to: undefined },
      { key: "agents",    label: "Agent Management", to: "/agents" as const },
      { key: "groups",    label: "Device Groups", to: undefined },
      { key: "policies",  label: "Policies", to: undefined },
      { key: "compliance",label: "Compliance", to: undefined },
    ],
  },
  { key: "users",    label: "Users",       icon: UsersIcon,    to: "/users" as const, parent: null },
  { key: "audit",    label: "Audit Logs",  icon: ScrollText,   to: undefined, parent: null },
  { key: "reports",  label: "Reports",     icon: ClipboardList,to: undefined, parent: null },
  { key: "settings", label: "Settings",    icon: SettingsIcon, to: undefined, parent: null },
];

// ────────────────────────────────────────────────────────────────────────────
// Component
// ────────────────────────────────────────────────────────────────────────────

export function AgentManagement() {
  const [role, setRole] = useState<ErapRole>("Administrator");
  const [tab, setTab] = useState("dashboard");
  const [wizardOpen, setWizardOpen] = useState(false);

  const viewerName = getViewerName();
  const canManage = hasPermission(role, "manage_policies") || hasPermission(role, "manage_users");

  return (
    <TooltipProvider delayDuration={150}>
      <div className="flex h-screen w-full bg-background text-foreground">
        <AgentSidebar />

        <div className="flex min-w-0 flex-1 flex-col">
          <TopBar role={role} setRole={setRole} />

          <div className="flex min-h-0 flex-1 flex-col">
            {/* Page header */}
            <div className="flex flex-wrap items-center gap-3 border-b bg-card px-6 py-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Link to="/" className="hover:text-foreground">Devices</Link>
                  <ChevronRight className="h-3 w-3" />
                  <span>Agent Management</span>
                </div>
                <h1 className="mt-1 text-lg font-semibold leading-tight">Device Agent Management</h1>
                <p className="text-xs text-muted-foreground">
                  Deploy, monitor and update the ERAP agent across the private enterprise WAN. Offline-only, no external relays.
                </p>
              </div>
              <div className="ml-auto flex items-center gap-2">
                <Badge variant="outline" className="gap-1 border-border/60 bg-muted/40 font-normal">
                  <Server className="h-3 w-3" /> Private WAN
                </Badge>
                <Badge variant="outline" className="gap-1 border-border/60 bg-muted/40 font-normal">
                  <Lock className="h-3 w-3" /> Offline / air-gapped
                </Badge>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span>
                      <Button
                        onClick={() => {
                          if (!canManage) {
                            toast.error("Your role can't deploy agents");
                            logAudit({ actor: viewerName, actorRole: role, category: "device", action: "deploy_wizard_open", status: "denied", details: "Role lacks manage permissions" });
                            return;
                          }
                          setWizardOpen(true);
                          logAudit({ actor: viewerName, actorRole: role, category: "device", action: "deploy_wizard_open", status: "info" });
                        }}
                        disabled={!canManage}
                        className="gap-2"
                      >
                        <Download className="h-4 w-4" /> Deploy New Agent
                      </Button>
                    </span>
                  </TooltipTrigger>
                  {!canManage && <TooltipContent>Requires manage_policies permission</TooltipContent>}
                </Tooltip>
              </div>
            </div>

            {/* Tabs */}
            <Tabs value={tab} onValueChange={setTab} className="flex min-h-0 flex-1 flex-col">
              <div className="border-b bg-card px-6">
                <TabsList className="h-11 bg-transparent p-0">
                  <SubTab value="dashboard" label="Deployment Dashboard" />
                  <SubTab value="versions"  label="Version Management" />
                  <SubTab value="health"    label="Health Monitoring" />
                  <SubTab value="policies"  label="Configuration Policies" />
                  <SubTab value="audit"     label="Audit & Compliance" />
                </TabsList>
              </div>

              <ScrollArea className="flex-1">
                <div className="p-6">
                  <TabsContent value="dashboard" className="mt-0 space-y-6">
                    <DashboardTab role={role} setWizardOpen={setWizardOpen} canManage={canManage} viewerName={viewerName} />
                  </TabsContent>
                  <TabsContent value="versions" className="mt-0 space-y-6">
                    <VersionsTab role={role} viewerName={viewerName} />
                  </TabsContent>
                  <TabsContent value="health" className="mt-0 space-y-6">
                    <HealthTab />
                  </TabsContent>
                  <TabsContent value="policies" className="mt-0 space-y-6">
                    <PoliciesTab role={role} viewerName={viewerName} />
                  </TabsContent>
                  <TabsContent value="audit" className="mt-0 space-y-6">
                    <AuditTab />
                  </TabsContent>
                </div>
              </ScrollArea>
            </Tabs>
          </div>
        </div>

        <DeployWizard open={wizardOpen} onOpenChange={setWizardOpen} role={role} viewerName={viewerName} />
      </div>
    </TooltipProvider>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Sidebar / top bar
// ────────────────────────────────────────────────────────────────────────────

function AgentSidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <aside className="hidden w-64 flex-col bg-sidebar text-sidebar-foreground md:flex">
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
          const isActive = n.to ? pathname === n.to : false;
          const hasChildren = "children" in n && n.children && n.children.length > 0;
          const parentOpen = hasChildren && n.children!.some((c) => c.to === pathname);

          if (hasChildren) {
            return (
              <div key={n.key} className="space-y-1">
                <div
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm",
                    parentOpen ? "text-sidebar-foreground" : "text-sidebar-foreground/80",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span className="flex-1">{n.label}</span>
                  <ChevronDown className="h-3 w-3 opacity-60" />
                </div>
                <div className="ml-4 space-y-0.5 border-l border-sidebar-border/60 pl-3">
                  {n.children!.map((c) => {
                    const active = c.to ? pathname === c.to : false;
                    const inner = (
                      <span
                        className={cn(
                          "block truncate rounded-md px-2 py-1.5 text-[13px] transition-colors",
                          active
                            ? "bg-sidebar-primary text-sidebar-primary-foreground"
                            : c.to
                              ? "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                              : "text-sidebar-foreground/40",
                        )}
                      >
                        {c.label}
                      </span>
                    );
                    return c.to ? (
                      <Link key={c.key} to={c.to}>{inner}</Link>
                    ) : (
                      <Tooltip key={c.key}>
                        <TooltipTrigger asChild><div>{inner}</div></TooltipTrigger>
                        <TooltipContent side="right">Coming soon</TooltipContent>
                      </Tooltip>
                    );
                  })}
                </div>
              </div>
            );
          }

          const inner = (
            <span
              className={cn(
                "flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                isActive
                  ? "bg-sidebar-primary text-sidebar-primary-foreground"
                  : n.to
                    ? "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/40",
              )}
            >
              <Icon className="h-4 w-4" />
              {n.label}
            </span>
          );
          return n.to ? (
            <Link key={n.key} to={n.to}>{inner}</Link>
          ) : (
            <Tooltip key={n.key}>
              <TooltipTrigger asChild><div>{inner}</div></TooltipTrigger>
              <TooltipContent side="right">Coming soon</TooltipContent>
            </Tooltip>
          );
        })}
      </nav>
      <div className="border-t border-sidebar-border p-3 text-xs text-sidebar-foreground/60">
        <div className="flex items-center gap-2">
          <Circle className="h-2 w-2 fill-emerald-400 text-emerald-400" />
          Broker: 10.0.0.4 · healthy
        </div>
        <div className="mt-1">v2.4.1 · Build 20260717</div>
      </div>
    </aside>
  );
}

function TopBar({ role, setRole }: { role: ErapRole; setRole: (r: ErapRole) => void }) {
  return (
    <header className="flex h-14 items-center gap-3 border-b bg-card px-4">
      <div className="min-w-0">
        <h1 className="truncate text-sm font-semibold">Agent Management</h1>
        <p className="text-[11px] text-muted-foreground">Windows endpoint agent lifecycle</p>
      </div>
      <div className="relative ml-4 hidden max-w-md flex-1 md:block">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search agents, policies, versions…" className="h-9 pl-9" />
      </div>
      <div className="ml-auto flex items-center gap-2">
        <Select value={role} onValueChange={(v) => setRole(v as ErapRole)}>
          <SelectTrigger className="h-9 w-[200px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            {(Object.keys(ROLE_LABELS) as ErapRole[]).map((r) => (
              <SelectItem key={r} value={r}>Role: {ROLE_LABELS[r]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="ghost" size="icon" aria-label="Notifications">
          <Bell className="h-4 w-4" />
        </Button>
        <AccountBadge />
      </div>
    </header>
  );
}

function SubTab({ value, label }: { value: string; label: string }) {
  return (
    <TabsTrigger
      value={value}
      className="relative h-11 rounded-none border-b-2 border-transparent bg-transparent px-4 text-sm font-medium text-muted-foreground data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none"
    >
      {label}
    </TabsTrigger>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Dashboard tab
// ────────────────────────────────────────────────────────────────────────────

function DashboardTab({
  role,
  setWizardOpen,
  canManage,
  viewerName,
}: {
  role: ErapRole;
  setWizardOpen: (v: boolean) => void;
  canManage: boolean;
  viewerName: string;
}) {
  const [q, setQ] = useState("");
  const [branch, setBranch] = useState("all");
  const [department, setDepartment] = useState("all");
  const [status, setStatus] = useState<string>("all");
  const [version, setVersion] = useState("all");
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [bulkAction, setBulkAction] = useState<null | "enable" | "disable" | "update" | "remove">(null);
  const [diagnosticsId, setDiagnosticsId] = useState<string | null>(null);
  const [openBatch, setOpenBatch] = useState<DeploymentBatch | null>(null);

  const branches = useMemo(() => Array.from(new Set(AGENTS.map((a) => a.branch))), []);
  const departments = useMemo(() => Array.from(new Set(AGENTS.map((a) => a.department))), []);
  const versions = useMemo(() => Array.from(new Set(AGENTS.map((a) => a.agentVersion))), []);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return AGENTS.filter((a) => {
      if (branch !== "all" && a.branch !== branch) return false;
      if (department !== "all" && a.department !== department) return false;
      if (status !== "all" && a.status !== status) return false;
      if (version !== "all" && a.agentVersion !== version) return false;
      if (!term) return true;
      return (
        a.hostname.toLowerCase().includes(term) ||
        a.id.toLowerCase().includes(term) ||
        a.ip.includes(term)
      );
    });
  }, [q, branch, department, status, version]);

  const kpis = useMemo(() => {
    const total = AGENTS.length;
    const online = AGENTS.filter((a) => a.status === "online" || a.status === "updating").length;
    const offline = AGENTS.filter((a) => a.status === "offline").length;
    const outdated = AGENTS.filter((a) => a.agentVersion !== "3.2.1").length;
    const failed = AGENTS.filter((a) => a.status === "install_failed").length;
    return { total, online, offline, outdated, failed, pending: PENDING_APPROVALS };
  }, []);

  const doAction = (action: string, a: Agent, ok: boolean, note?: string) => {
    logAudit({
      actor: viewerName, actorRole: role, category: "device",
      action, target: a.hostname, targetId: a.id,
      status: ok ? "success" : "denied", details: note,
    });
    if (ok) toast.success(`${labelForAction(action)} — ${a.hostname}`);
    else toast.error(`Blocked: ${note ?? "insufficient permissions"}`);
  };

  const selectedAgents = useMemo(
    () => AGENTS.filter((a) => selectedRows.has(a.id)),
    [selectedRows],
  );
  const allShownSelected = filtered.length > 0 && filtered.every((a) => selectedRows.has(a.id));
  const someShownSelected = filtered.some((a) => selectedRows.has(a.id));

  const toggleAll = (v: boolean) => {
    const next = new Set(selectedRows);
    if (v) filtered.forEach((a) => next.add(a.id));
    else filtered.forEach((a) => next.delete(a.id));
    setSelectedRows(next);
  };
  const toggleOne = (id: string, v: boolean) => {
    const next = new Set(selectedRows);
    if (v) next.add(id); else next.delete(id);
    setSelectedRows(next);
  };

  const openBulk = (a: "enable" | "disable" | "update" | "remove") => {
    if (!canManage) {
      toast.error("Your role can't perform bulk agent actions");
      logAudit({ actor: viewerName, actorRole: role, category: "device", action: `bulk_${a}`, status: "denied", details: "Role lacks manage_policies" });
      return;
    }
    if (selectedRows.size === 0) return;
    setBulkAction(a);
  };

  const runBulk = (a: "enable" | "disable" | "update" | "remove") => {
    logAudit({
      actor: viewerName, actorRole: role, category: "device",
      action: `bulk_${a}`,
      target: `${selectedRows.size} devices`,
      status: "success",
      details: selectedAgents.map((x) => x.hostname).join(", ").slice(0, 200),
    });
    toast.success(`${labelForBulk(a)} queued for ${selectedRows.size} device${selectedRows.size === 1 ? "" : "s"}`);
    setBulkAction(null);
    setSelectedRows(new Set());
  };

  return (
    <>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <KpiCard icon={Server}         label="Total Managed"     value={kpis.total} tone="default" />
        <KpiCard icon={CheckCircle2}   label="Online Agents"     value={kpis.online} tone="success" />
        <KpiCard icon={XCircle}        label="Offline Agents"    value={kpis.offline} tone="muted" />
        <KpiCard icon={AlertTriangle}  label="Outdated Versions" value={kpis.outdated} tone="warn" />
        <KpiCard icon={ShieldAlert}    label="Failed Installs"   value={kpis.failed} tone="danger" />
        <KpiCard icon={Clock}          label="Pending Approvals" value={kpis.pending} tone="info" />
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-[240px] flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filter by hostname, device ID, or IP…" className="h-9 pl-9" />
            </div>
            <FilterSelect label="Branch" value={branch} onChange={setBranch} options={branches} />
            <FilterSelect label="Department" value={department} onChange={setDepartment} options={departments} />
            <FilterSelect
              label="Status"
              value={status}
              onChange={setStatus}
              options={["online","offline","updating","install_failed","disabled"]}
              render={statusLabel}
            />
            <FilterSelect label="Agent Version" value={version} onChange={setVersion} options={versions} />
            <div className="ml-auto text-xs text-muted-foreground">{filtered.length} of {AGENTS.length}</div>
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden">
        {selectedRows.size > 0 && (
          <div className="flex flex-wrap items-center gap-2 border-b bg-primary/5 px-4 py-2">
            <span className="text-sm font-medium">{selectedRows.size} selected</span>
            <span className="text-xs text-muted-foreground">Bulk actions apply to every selected agent.</span>
            <div className="ml-auto flex flex-wrap items-center gap-2">
              <GuardedBulkButton canManage={canManage} onClick={() => openBulk("enable")} icon={Play} label="Enable" />
              <GuardedBulkButton canManage={canManage} onClick={() => openBulk("disable")} icon={Power} label="Disable" />
              <GuardedBulkButton canManage={canManage} onClick={() => openBulk("update")} icon={RefreshCw} label="Push Update" />
              <GuardedBulkButton canManage={canManage} onClick={() => openBulk("remove")} icon={Trash2} label="Remove" tone="danger" />
              <Button size="sm" variant="ghost" onClick={() => setSelectedRows(new Set())}>Clear</Button>
            </div>
          </div>
        )}
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40">
              <TableHead className="w-10">
                <Checkbox
                  checked={allShownSelected ? true : someShownSelected ? "indeterminate" : false}
                  onCheckedChange={(v) => toggleAll(!!v)}
                  aria-label="Select all shown"
                />
              </TableHead>
              <TableHead>Device Name</TableHead>
              <TableHead className="w-[120px]">Device ID</TableHead>
              <TableHead>Branch</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Agent Version</TableHead>
              <TableHead>OS Version</TableHead>
              <TableHead>Last Check-in</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((a) => (
              <TableRow
                key={a.id}
                data-state={diagnosticsId === a.id ? "selected" : undefined}
                className="cursor-pointer"
                onClick={() => setDiagnosticsId(a.id)}
              >
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <Checkbox
                    checked={selectedRows.has(a.id)}
                    onCheckedChange={(v) => toggleOne(a.id, !!v)}
                    aria-label={`Select ${a.hostname}`}
                  />
                </TableCell>
                <TableCell className="font-medium">
                  <button type="button" className="text-left hover:underline" onClick={(e) => { e.stopPropagation(); setDiagnosticsId(a.id); }}>
                    {a.hostname}
                  </button>
                </TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">{a.id}</TableCell>
                <TableCell>{a.branch}</TableCell>
                <TableCell>{a.department}</TableCell>
                <TableCell>
                  <span className={cn("font-mono text-xs", a.agentVersion !== "3.2.1" && "text-amber-600 dark:text-amber-400")}>
                    {a.agentVersion}
                  </span>
                </TableCell>
                <TableCell className="text-muted-foreground">{a.os}</TableCell>
                <TableCell className="text-muted-foreground">{a.lastCheckIn}</TableCell>
                <TableCell><AgentStatusPill status={a.status} /></TableCell>
                <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                  <div className="inline-flex items-center gap-1">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button size="sm" variant="outline" className="h-8 px-2" onClick={() => setDiagnosticsId(a.id)}>
                          <Activity className="h-3.5 w-3.5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Diagnostics</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 px-2"
                            disabled={!canManage || a.status === "install_failed"}
                            onClick={() => doAction("agent_update", a, canManage && a.status !== "install_failed", !canManage ? "Role lacks manage_policies" : "Installer error state")}
                          >
                            <RefreshCw className="h-3.5 w-3.5" />
                          </Button>
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>Push update</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 px-2"
                            disabled={!canManage}
                            onClick={() => doAction(a.status === "disabled" ? "agent_enable" : "agent_disable", a, canManage, "Role lacks manage_policies")}
                          >
                            {a.status === "disabled" ? <Play className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />}
                          </Button>
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>{a.status === "disabled" ? "Enable agent" : "Disable agent"}</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 px-2"
                            disabled={!canManage}
                            onClick={() => doAction("agent_reinstall", a, canManage, "Role lacks manage_policies")}
                          >
                            <RotateCcw className="h-3.5 w-3.5" />
                          </Button>
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>Reinstall</TooltipContent>
                    </Tooltip>
                    <Button size="sm" variant="ghost" className="h-8 px-2"><MoreHorizontal className="h-3.5 w-3.5" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={10} className="h-24 text-center text-sm text-muted-foreground">No agents match the current filters.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Pending Installation Approvals</CardTitle>
            <CardDescription>Devices awaiting operator sign-off before agent installation</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {[
              { host: "NYC-FIN-WS45", by: "s.patel",  when: "12 min ago" },
              { host: "LON-ENG-WS55", by: "a.morgan", when: "38 min ago" },
              { host: "TOK-HR-LT09",  by: "y.tanaka", when: "1 h ago"    },
              { host: "BER-OPS-WS12", by: "m.klein",  when: "2 h ago"    },
            ].map((p) => (
              <div key={p.host} className="flex items-center justify-between rounded-md border bg-muted/20 px-3 py-2">
                <div>
                  <div className="text-sm font-medium">{p.host}</div>
                  <div className="text-xs text-muted-foreground">Requested by {p.by} · {p.when}</div>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" onClick={() => toast.success(`Approved ${p.host}`)}>Approve</Button>
                  <Button size="sm" variant="ghost" onClick={() => toast(`Rejected ${p.host}`)}>Reject</Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Recent Deployment Batches</CardTitle>
            <CardDescription>Last operations across the private WAN</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {DEPLOYMENT_BATCHES.map((b) => {
              const done = b.devices.filter((d) => d.status === "completed").length;
              const failed = b.devices.filter((d) => d.status === "failed").length;
              const pct = Math.round((done / b.devices.length) * 100);
              return (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => setOpenBatch(b)}
                  className="w-full rounded-md border bg-muted/20 px-3 py-2 text-left transition-colors hover:bg-muted/40"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium">{b.title}</div>
                      <div className="text-xs text-muted-foreground">
                        {b.id} · {b.when} · {b.devices.length} devices · {done} done{failed ? ` · ${failed} failed` : ""}
                      </div>
                    </div>
                    <BatchStatusPill status={b.status} />
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <Progress value={pct} className="h-1.5 flex-1" />
                    <span className="w-10 text-right font-mono text-xs text-muted-foreground">{pct}%</span>
                  </div>
                </button>
              );
            })}
            <div className="pt-1">
              <Button variant="outline" size="sm" onClick={() => setWizardOpen(true)} disabled={!canManage}>
                <Download className="mr-2 h-3.5 w-3.5" /> New deployment
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <BulkActionConfirm
        action={bulkAction}
        agents={selectedAgents}
        onCancel={() => setBulkAction(null)}
        onConfirm={runBulk}
      />
      <BatchProgressDialog
        batch={openBatch}
        onClose={() => setOpenBatch(null)}
        role={role}
        viewerName={viewerName}
      />
      <DiagnosticsPanel
        agent={diagnosticsId ? AGENTS.find((a) => a.id === diagnosticsId) ?? null : null}
        onClose={() => setDiagnosticsId(null)}
      />
    </>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Versions tab
// ────────────────────────────────────────────────────────────────────────────

function VersionsTab({ role, viewerName }: { role: ErapRole; viewerName: string }) {
  const canManage = hasPermission(role, "manage_policies");
  const act = (a: string, v: string, ok: boolean, note?: string) => {
    logAudit({ actor: viewerName, actorRole: role, category: "device", action: a, target: `Agent ${v}`, status: ok ? "success" : "denied", details: note });
    if (ok) toast.success(`${labelForAction(a)} — ${v}`);
    else toast.error(`Blocked: ${note ?? "insufficient permissions"}`);
  };

  return (
    <>
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Current Production Version</CardTitle>
            <CardDescription>Deployed across the enterprise WAN</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap items-center gap-4">
              <div className="grid h-14 w-14 place-items-center rounded-lg bg-primary/10 text-primary">
                <Package className="h-7 w-7" />
              </div>
              <div className="min-w-0">
                <div className="text-lg font-semibold">{CURRENT_VERSION}</div>
                <div className="text-xs text-muted-foreground">Released 2026-06-14 · Signed by ERAP Code Signing CA · SHA-256 verified</div>
              </div>
              <div className="ml-auto grid grid-cols-3 gap-6 rounded-md border bg-muted/20 px-4 py-3 text-center">
                <Stat label="Rollout" value="78%" />
                <Stat label="Failures" value="0.4%" />
                <Stat label="Rollback avail" value="Yes" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Package Operations</CardTitle>
            <CardDescription>Signed MSI / offline package</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button className="w-full justify-start gap-2" variant="outline" disabled={!canManage} onClick={() => act("agent_upload_package", "package", canManage, "Role lacks manage_policies")}>
              <Upload className="h-4 w-4" /> Upload Package
            </Button>
            <Button className="w-full justify-start gap-2" variant="outline" disabled={!canManage} onClick={() => act("agent_test_version", "candidate", canManage, "Role lacks manage_policies")}>
              <Terminal className="h-4 w-4" /> Test Version (QA lab)
            </Button>
            <Button className="w-full justify-start gap-2" disabled={!canManage} onClick={() => act("agent_deploy_update", CURRENT_VERSION, canManage, "Role lacks manage_policies")}>
              <Download className="h-4 w-4" /> Deploy Update
            </Button>
            <Button className="w-full justify-start gap-2" variant="outline" disabled={!canManage} onClick={() => act("agent_rollback", CURRENT_VERSION, canManage, "Role lacks manage_policies")}>
              <RotateCcw className="h-4 w-4" /> Rollback Version
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card className="overflow-hidden">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Release History</CardTitle>
          <CardDescription>Signed packages available in the offline repository</CardDescription>
        </CardHeader>
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40">
              <TableHead>Version</TableHead>
              <TableHead>Release Date</TableHead>
              <TableHead>Changes</TableHead>
              <TableHead>Deployment Status</TableHead>
              <TableHead>Coverage</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {VERSIONS.map((v) => (
              <TableRow key={v.version}>
                <TableCell className="font-mono text-xs font-semibold">{v.version}</TableCell>
                <TableCell className="text-muted-foreground">{v.releaseDate}</TableCell>
                <TableCell className="max-w-[380px] text-xs text-muted-foreground">{v.changes}</TableCell>
                <TableCell><VersionStatusPill status={v.deploymentStatus} /></TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Progress value={v.coverage} className="h-1.5 w-24" />
                    <span className="text-xs text-muted-foreground">{v.coverage}%</span>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="inline-flex items-center gap-1">
                    <Button size="sm" variant="ghost" className="h-8" disabled={!canManage} onClick={() => act("agent_deploy_update", v.version, canManage, "Role lacks manage_policies")}>Deploy</Button>
                    <Button size="sm" variant="ghost" className="h-8" disabled={!canManage} onClick={() => act("agent_rollback", v.version, canManage, "Role lacks manage_policies")}>Rollback</Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Health tab
// ────────────────────────────────────────────────────────────────────────────

function HealthTab() {
  const [selectedId, setSelectedId] = useState<string>(AGENTS[0].id);
  const selected = AGENTS.find((a) => a.id === selectedId) ?? AGENTS[0];

  const avg = (fn: (a: Agent) => number) =>
    Math.round(AGENTS.filter((a) => a.status !== "offline" && a.status !== "disabled").reduce((s, a) => s + fn(a), 0) /
      Math.max(1, AGENTS.filter((a) => a.status !== "offline" && a.status !== "disabled").length));

  return (
    <>
      <div className="grid gap-3 md:grid-cols-4">
        <MetricCard icon={Cpu}         label="Avg CPU"        value={`${avg((a) => a.cpu)}%`} />
        <MetricCard icon={MemoryStick} label="Avg Memory"     value={`${avg((a) => a.mem)}%`} />
        <MetricCard icon={HardDrive}   label="Avg Disk Used"  value={`${avg((a) => a.disk)}%`} />
        <MetricCard icon={Wifi}        label="Avg Latency"    value={`${avg((a) => a.latencyMs)} ms`} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Agent Health — Live</CardTitle>
            <CardDescription>Select a device to inspect telemetry</CardDescription>
          </CardHeader>
          <div className="max-h-[420px] overflow-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead>Device</TableHead>
                  <TableHead>CPU</TableHead>
                  <TableHead>Memory</TableHead>
                  <TableHead>Disk</TableHead>
                  <TableHead>Latency</TableHead>
                  <TableHead>Heartbeat</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {AGENTS.map((a) => (
                  <TableRow
                    key={a.id}
                    data-state={selectedId === a.id ? "selected" : undefined}
                    className="cursor-pointer"
                    onClick={() => setSelectedId(a.id)}
                  >
                    <TableCell>
                      <div className="font-medium">{a.hostname}</div>
                      <div className="text-xs text-muted-foreground">{a.ip}</div>
                    </TableCell>
                    <TableCell><MiniBar value={a.cpu} tone={a.cpu > 80 ? "danger" : a.cpu > 60 ? "warn" : "ok"} /></TableCell>
                    <TableCell><MiniBar value={a.mem} tone={a.mem > 80 ? "danger" : a.mem > 60 ? "warn" : "ok"} /></TableCell>
                    <TableCell><MiniBar value={a.disk} tone={a.disk > 85 ? "danger" : a.disk > 70 ? "warn" : "ok"} /></TableCell>
                    <TableCell className="text-xs text-muted-foreground">{a.status === "offline" ? "—" : `${a.latencyMs} ms`}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{a.heartbeat}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Security Status — {selected.hostname}</CardTitle>
            <CardDescription>Cryptographic and policy posture</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <SecurityRow icon={Lock}       label="Encryption"           value={selected.encryption}      ok={selected.encryption === "AES-256"} />
            <SecurityRow icon={FileCheck2} label="Agent Certificate"    value={selected.cert === "valid" ? "Valid" : selected.cert === "expiring" ? "Expiring < 30d" : "Expired"} ok={selected.cert === "valid"} warn={selected.cert === "expiring"} />
            <SecurityRow icon={KeyRound}   label="Authentication"       value={selected.authOk ? "Kerberos OK" : "Auth failure"} ok={selected.authOk} />
            <SecurityRow icon={ShieldCheck} label="Policy Compliance"   value={selected.compliant ? "Compliant" : "Drift detected"} ok={selected.compliant} />
            <Separator />
            <div className="grid grid-cols-2 gap-2 text-xs">
              <Metric label="CPU"     value={`${selected.cpu}%`} />
              <Metric label="Memory"  value={`${selected.mem}%`} />
              <Metric label="Disk"    value={`${selected.disk}%`} />
              <Metric label="Latency" value={`${selected.latencyMs} ms`} />
              <Metric label="Heartbeat" value={selected.heartbeat} />
              <Metric label="Policy"    value={selected.policy} />
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Policies tab
// ────────────────────────────────────────────────────────────────────────────

function PoliciesTab({ role, viewerName }: { role: ErapRole; viewerName: string }) {
  const canManage = hasPermission(role, "manage_policies");
  const [editing, setEditing] = useState<Policy | null>(null);
  const [assigning, setAssigning] = useState<Policy | null>(null);

  const act = (a: string, target: string, ok: boolean, note?: string) => {
    logAudit({ actor: viewerName, actorRole: role, category: "policy", action: a, target, status: ok ? "success" : "denied", details: note });
    if (ok) toast.success(`${labelForAction(a)} — ${target}`);
    else toast.error(`Blocked: ${note ?? "insufficient permissions"}`);
  };

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold">Agent Configuration Policies</h2>
          <p className="text-xs text-muted-foreground">Policies determine what the agent allows on each endpoint.</p>
        </div>
        <Tooltip>
          <TooltipTrigger asChild>
            <span>
              <Button className="gap-2" disabled={!canManage} onClick={() => act("policy_create", "New Policy", canManage, "Role lacks manage_policies")}>
                <Boxes className="h-4 w-4" /> Create Policy
              </Button>
            </span>
          </TooltipTrigger>
          {!canManage && <TooltipContent>Requires manage_policies permission</TooltipContent>}
        </Tooltip>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {POLICIES.map((p) => (
          <Card key={p.id} className="flex flex-col">
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <CardTitle className="text-sm">{p.name}</CardTitle>
                  <CardDescription className="text-xs">{p.description}</CardDescription>
                </div>
                <Badge variant="outline" className="font-normal">{p.assignedAgents} agents</Badge>
              </div>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col gap-3">
              <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs">
                <PermRow label="Remote screen" on={p.permissions.remoteScreen} />
                <PermRow label="Keyboard / mouse" on={p.permissions.keyboardMouse} />
                <PermRow label="Chat" on={p.permissions.chat} />
                <PermRow label="File transfer" on={p.permissions.fileTransfer} />
                <PermRow label="Remote terminal" on={p.permissions.remoteTerminal} />
                <PermRow label="Screen capture" on={p.permissions.screenCapture} />
                <PermRow label="User approval" on={p.permissions.requireApproval} />
                <PermRow label="Unattended access" on={p.permissions.unattended} />
                <PermRow label="Administration" on={p.permissions.admin} />
                <PermRow label="Audit access" on={p.permissions.audit} />
              </div>
              <div className="mt-auto flex items-center justify-between border-t pt-3 text-xs text-muted-foreground">
                <span>Updated {p.updated}</span>
                <div className="flex items-center gap-1">
                  <Button size="sm" variant="ghost" className="h-7" disabled={!canManage} onClick={() => { setEditing(p); }}>Edit</Button>
                  <Button size="sm" variant="ghost" className="h-7" disabled={!canManage} onClick={() => { setAssigning(p); }}>Assign</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Policy Audit History</CardTitle>
          <CardDescription>Recent policy changes across the environment</CardDescription>
        </CardHeader>
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40">
              <TableHead>When</TableHead>
              <TableHead>Policy</TableHead>
              <TableHead>Change</TableHead>
              <TableHead>By</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[
              { ts: "2026-07-10 14:22", pol: "Security Admin",     change: "Enabled screen capture",             by: "a.morgan" },
              { ts: "2026-07-02 11:05", pol: "Default Technician", change: "Require user approval → on",         by: "a.morgan" },
              { ts: "2026-06-28 09:14", pol: "Branch Support",     change: "Enabled remote terminal",            by: "s.patel"  },
              { ts: "2026-06-14 16:41", pol: "Default Technician", change: "Baseline for 3.2.1 rollout",         by: "system"   },
            ].map((r, i) => (
              <TableRow key={i}>
                <TableCell className="font-mono text-xs text-muted-foreground">{r.ts}</TableCell>
                <TableCell className="font-medium">{r.pol}</TableCell>
                <TableCell className="text-sm">{r.change}</TableCell>
                <TableCell className="text-muted-foreground">{r.by}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <EditPolicyDialog policy={editing} onClose={() => setEditing(null)} onSave={(name) => act("policy_update", name, true)} />
      <AssignPolicyDialog policy={assigning} onClose={() => setAssigning(null)} onSave={(name) => act("policy_assign", name, true)} />
    </>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Audit tab
// ────────────────────────────────────────────────────────────────────────────

function AuditTab() {
  const [q, setQ] = useState("");
  const [action, setAction] = useState("all");
  const [result, setResult] = useState("all");

  const filtered = AGENT_LOGS.filter((l) => {
    if (action !== "all" && l.action !== action) return false;
    if (result !== "all" && l.result !== result) return false;
    const term = q.trim().toLowerCase();
    if (!term) return true;
    return `${l.device} ${l.user} ${l.detail}`.toLowerCase().includes(term);
  });

  return (
    <>
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-[240px] flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search device, user, or details…" className="h-9 pl-9" />
            </div>
            <FilterSelect label="Action" value={action} onChange={setAction} options={["Installed","Updated","Disabled","Removed","Policy changed","Install failed","Rollback"]} />
            <FilterSelect label="Result" value={result} onChange={setResult} options={["success","failed","denied","info"]} render={(v) => v[0].toUpperCase() + v.slice(1)} />
            <div className="ml-auto text-xs text-muted-foreground">{filtered.length} entries</div>
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Agent Installation & Activity Logs</CardTitle>
          <CardDescription>Immutable record of agent lifecycle events on this WAN segment</CardDescription>
        </CardHeader>
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40">
              <TableHead>Date</TableHead>
              <TableHead>Device</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Result</TableHead>
              <TableHead>Detail</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((l, i) => (
              <TableRow key={i}>
                <TableCell className="font-mono text-xs text-muted-foreground">{l.ts}</TableCell>
                <TableCell className="font-medium">{l.device}</TableCell>
                <TableCell>{l.action}</TableCell>
                <TableCell className="text-muted-foreground">{l.user}</TableCell>
                <TableCell><ResultPill result={l.result} /></TableCell>
                <TableCell className="text-xs text-muted-foreground">{l.detail}</TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow><TableCell colSpan={6} className="h-24 text-center text-sm text-muted-foreground">No entries match.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Deploy wizard
// ────────────────────────────────────────────────────────────────────────────

type DeployMethod = "manual" | "network" | "remote" | "group";

const METHODS: { key: DeployMethod; label: string; desc: string; icon: typeof Download }[] = [
  { key: "manual",  label: "Manual Installer Package", desc: "Download a signed MSI to install manually on the endpoint.",       icon: Package },
  { key: "network", label: "Network Push Deployment",  desc: "SMB / GPO / SCCM push to targets on the private WAN.",             icon: Server  },
  { key: "remote",  label: "Remote Installation",      desc: "Install over an existing authenticated remote channel.",           icon: Terminal},
  { key: "group",   label: "Group Deployment",         desc: "Batch install to an entire device group with schedule.",           icon: Boxes   },
];

function DeployWizard({
  open, onOpenChange, role, viewerName,
}: { open: boolean; onOpenChange: (v: boolean) => void; role: ErapRole; viewerName: string }) {
  const [step, setStep] = useState(1);
  const [method, setMethod] = useState<DeployMethod>("network");

  const [branch, setBranch] = useState("all");
  const [department, setDepartment] = useState("all");
  const [osFilter, setOsFilter] = useState("all");
  const [group, setGroup] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selected, setSelected] = useState<Set<string>>(new Set(AGENTS.slice(0, 3).map((a) => a.id)));

  const [cfg, setCfg] = useState({
    remoteControl: true,
    fileTransfer: true,
    remoteTerminal: false,
    screenCapture: false,
    requireApproval: true,
    unattended: false,
  });

  const [schedule, setSchedule] = useState<"now" | "off_hours" | "custom">("off_hours");

  const targets = useMemo(() => AGENTS.filter((a) => {
    if (branch !== "all" && a.branch !== branch) return false;
    if (department !== "all" && a.department !== department) return false;
    if (osFilter !== "all" && a.os !== osFilter) return false;
    if (statusFilter !== "all" && a.status !== statusFilter) return false;
    return true;
  }), [branch, department, osFilter, statusFilter]);

  const branches = Array.from(new Set(AGENTS.map((a) => a.branch)));
  const departments = Array.from(new Set(AGENTS.map((a) => a.department)));
  const oses = Array.from(new Set(AGENTS.map((a) => a.os)));

  const reset = () => { setStep(1); };

  const start = () => {
    logAudit({
      actor: viewerName, actorRole: role, category: "device",
      action: "deploy_batch_start",
      target: `${selected.size} devices`, status: "success",
      details: `${METHODS.find((m) => m.key === method)?.label} · schedule=${schedule}`,
    });
    toast.success(`Deployment queued for ${selected.size} device${selected.size === 1 ? "" : "s"}`);
    onOpenChange(false);
    reset();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) reset(); }}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Deploy New Agent</DialogTitle>
          <DialogDescription>Guided workflow to install the ERAP agent on Windows endpoints across the private WAN.</DialogDescription>
        </DialogHeader>

        <Stepper step={step} labels={["Method","Targets","Configuration","Review"]} />

        {step === 1 && (
          <div className="grid gap-3 md:grid-cols-2">
            {METHODS.map((m) => {
              const Icon = m.icon;
              const active = method === m.key;
              return (
                <button key={m.key} type="button" onClick={() => setMethod(m.key)}
                  className={cn(
                    "flex items-start gap-3 rounded-lg border p-4 text-left transition-colors",
                    active ? "border-primary bg-primary/5 ring-2 ring-primary/20" : "border-border hover:bg-muted/40",
                  )}
                >
                  <div className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-md", active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold">{m.label}</div>
                    <p className="mt-0.5 text-xs text-muted-foreground">{m.desc}</p>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {step === 2 && (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <FilterSelect label="Branch" value={branch} onChange={setBranch} options={branches} />
              <FilterSelect label="Department" value={department} onChange={setDepartment} options={departments} />
              <FilterSelect label="OS" value={osFilter} onChange={setOsFilter} options={oses} />
              <FilterSelect label="Device Group" value={group} onChange={setGroup} options={["Finance WS","Engineering WS","Executive LT","Kiosks"]} />
              <FilterSelect label="Status" value={statusFilter} onChange={setStatusFilter} options={["online","offline","updating","install_failed","disabled"]} render={statusLabel} />
              <div className="ml-auto text-xs text-muted-foreground">{selected.size} selected · {targets.length} match</div>
            </div>
            <div className="max-h-[300px] overflow-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40">
                    <TableHead className="w-10">
                      <Checkbox
                        checked={targets.length > 0 && targets.every((t) => selected.has(t.id))}
                        onCheckedChange={(v) => {
                          const next = new Set(selected);
                          if (v) targets.forEach((t) => next.add(t.id));
                          else targets.forEach((t) => next.delete(t.id));
                          setSelected(next);
                        }}
                      />
                    </TableHead>
                    <TableHead>Device</TableHead>
                    <TableHead>Branch</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>OS</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {targets.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell>
                        <Checkbox
                          checked={selected.has(a.id)}
                          onCheckedChange={(v) => {
                            const next = new Set(selected);
                            if (v) next.add(a.id); else next.delete(a.id);
                            setSelected(next);
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{a.hostname}</div>
                        <div className="text-xs text-muted-foreground">{a.ip}</div>
                      </TableCell>
                      <TableCell>{a.branch}</TableCell>
                      <TableCell>{a.department}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{a.os}</TableCell>
                      <TableCell><AgentStatusPill status={a.status} /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-3">
            <div className="grid gap-2 md:grid-cols-2">
              <CfgSwitch label="Enable Remote Control"   checked={cfg.remoteControl}    onCheckedChange={(v) => setCfg({ ...cfg, remoteControl: v })} />
              <CfgSwitch label="Enable File Transfer"    checked={cfg.fileTransfer}     onCheckedChange={(v) => setCfg({ ...cfg, fileTransfer: v })} />
              <CfgSwitch label="Enable Remote Terminal"  checked={cfg.remoteTerminal}   onCheckedChange={(v) => setCfg({ ...cfg, remoteTerminal: v })} />
              <CfgSwitch label="Enable Screen Capture"   checked={cfg.screenCapture}    onCheckedChange={(v) => setCfg({ ...cfg, screenCapture: v })} />
              <CfgSwitch label="Require User Approval"   checked={cfg.requireApproval}  onCheckedChange={(v) => setCfg({ ...cfg, requireApproval: v })} />
              <CfgSwitch label="Allow Unattended Access" checked={cfg.unattended}       onCheckedChange={(v) => setCfg({ ...cfg, unattended: v })} />
            </div>
            <div className="rounded-md border bg-muted/20 p-3 text-xs text-muted-foreground">
              Configuration is bound to the deployment batch and can be superseded later by an assigned policy.
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-3">
            <div className="grid gap-3 md:grid-cols-3">
              <SummaryCard title="Method" body={METHODS.find((m) => m.key === method)?.label ?? ""} />
              <SummaryCard title="Targets" body={`${selected.size} device${selected.size === 1 ? "" : "s"}`} />
              <SummaryCard title="Package" body={CURRENT_VERSION} />
            </div>
            <div className="rounded-md border">
              <div className="border-b bg-muted/40 px-3 py-2 text-xs font-medium">Configuration summary</div>
              <div className="grid grid-cols-2 gap-2 p-3 text-xs md:grid-cols-3">
                <SumRow label="Remote Control"   on={cfg.remoteControl} />
                <SumRow label="File Transfer"    on={cfg.fileTransfer} />
                <SumRow label="Remote Terminal"  on={cfg.remoteTerminal} />
                <SumRow label="Screen Capture"   on={cfg.screenCapture} />
                <SumRow label="Require Approval" on={cfg.requireApproval} />
                <SumRow label="Unattended"       on={cfg.unattended} />
              </div>
            </div>
            <div className="rounded-md border">
              <div className="border-b bg-muted/40 px-3 py-2 text-xs font-medium">Deployment schedule</div>
              <div className="grid gap-2 p-3 md:grid-cols-3">
                {(["now","off_hours","custom"] as const).map((v) => (
                  <button key={v} type="button" onClick={() => setSchedule(v)}
                    className={cn("rounded-md border p-3 text-left text-sm", schedule === v ? "border-primary bg-primary/5" : "hover:bg-muted/40")}
                  >
                    <div className="font-medium">{v === "now" ? "Deploy immediately" : v === "off_hours" ? "Off-hours window" : "Custom schedule"}</div>
                    <div className="text-xs text-muted-foreground">
                      {v === "now" ? "Rolls out within minutes" : v === "off_hours" ? "Tonight 22:00 – 05:00 local" : "Pick date and time per branch"}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        <DialogFooter className="flex items-center justify-between gap-2 sm:justify-between">
          <Button variant="ghost" onClick={() => (step === 1 ? onOpenChange(false) : setStep(step - 1))}>
            <ChevronLeft className="mr-1 h-4 w-4" /> {step === 1 ? "Cancel" : "Back"}
          </Button>
          {step < 4 ? (
            <Button onClick={() => setStep(step + 1)} disabled={step === 2 && selected.size === 0}>
              Continue <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={start} className="gap-2"><Play className="h-4 w-4" /> Start Deployment</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Policy dialogs
// ────────────────────────────────────────────────────────────────────────────

function EditPolicyDialog({ policy, onClose, onSave }: { policy: Policy | null; onClose: () => void; onSave: (name: string) => void }) {
  return (
    <Dialog open={!!policy} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg">
        {policy && (
          <>
            <DialogHeader>
              <DialogTitle>Edit Policy — {policy.name}</DialogTitle>
              <DialogDescription>{policy.description}</DialogDescription>
            </DialogHeader>
            <div className="space-y-2">
              <Label>Policy name</Label>
              <Input defaultValue={policy.name} />
              <Label>Description</Label>
              <Input defaultValue={policy.description} />
              <div className="grid gap-2 pt-2 md:grid-cols-2">
                {Object.entries(policy.permissions).map(([k, v]) => (
                  <CfgSwitch key={k} label={humanize(k)} checked={v} onCheckedChange={() => {}} />
                ))}
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={onClose}>Cancel</Button>
              <Button onClick={() => { onSave(policy.name); onClose(); }}>Save policy</Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function AssignPolicyDialog({ policy, onClose, onSave }: { policy: Policy | null; onClose: () => void; onSave: (name: string) => void }) {
  const [scope, setScope] = useState<"branch" | "department" | "devices">("branch");
  return (
    <Dialog open={!!policy} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg">
        {policy && (
          <>
            <DialogHeader>
              <DialogTitle>Assign Policy — {policy.name}</DialogTitle>
              <DialogDescription>Select where this policy should apply.</DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-2">
                {(["branch","department","devices"] as const).map((s) => (
                  <button key={s} type="button" onClick={() => setScope(s)}
                    className={cn("rounded-md border p-3 text-sm capitalize", scope === s ? "border-primary bg-primary/5" : "hover:bg-muted/40")}
                  >{s}</button>
                ))}
              </div>
              <Label>Target</Label>
              <Select defaultValue="all">
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All {scope}s</SelectItem>
                  {(scope === "branch" ? ["New York","London","Berlin","San Francisco","Tokyo"] : scope === "department" ? ["Finance","HR","Engineering","Design","Operations"] : AGENTS.map((a) => a.hostname)).map((v) => (
                    <SelectItem key={v} value={v}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={onClose}>Cancel</Button>
              <Button onClick={() => { onSave(policy.name); onClose(); }}>Assign policy</Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Small pieces
// ────────────────────────────────────────────────────────────────────────────

function FilterSelect({
  label, value, onChange, options, render,
}: { label: string; value: string; onChange: (v: string) => void; options: string[]; render?: (v: string) => string }) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="h-9 w-[190px]">
        <SelectValue placeholder={label} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">{label}: All</SelectItem>
        {options.map((o) => (
          <SelectItem key={o} value={o}>{label}: {render ? render(o) : o}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function KpiCard({
  icon: Icon, label, value, tone,
}: { icon: typeof LayoutDashboard; label: string; value: number; tone: "default" | "success" | "muted" | "warn" | "danger" | "info" }) {
  const toneCls =
    tone === "success" ? "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10"
    : tone === "warn"  ? "text-amber-600 dark:text-amber-400 bg-amber-500/10"
    : tone === "danger"? "text-rose-600 dark:text-rose-400 bg-rose-500/10"
    : tone === "info"  ? "text-primary bg-primary/10"
    : tone === "muted" ? "text-muted-foreground bg-muted"
    : "text-foreground bg-muted";
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <div className={cn("grid h-10 w-10 place-items-center rounded-md", toneCls)}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <div className="text-2xl font-semibold leading-none">{value.toLocaleString()}</div>
          <div className="mt-1 text-xs text-muted-foreground">{label}</div>
        </div>
      </CardContent>
    </Card>
  );
}

function AgentStatusPill({ status }: { status: AgentStatus }) {
  const map: Record<AgentStatus, { label: string; cls: string; dot: string }> = {
    online:          { label: "Online",             cls: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300", dot: "bg-emerald-500" },
    offline:         { label: "Offline",            cls: "border-border bg-muted text-muted-foreground",                                   dot: "bg-muted-foreground" },
    updating:        { label: "Updating",           cls: "border-primary/40 bg-primary/10 text-primary",                                    dot: "bg-primary" },
    install_failed:  { label: "Installation Failed",cls: "border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300",              dot: "bg-rose-500" },
    disabled:        { label: "Disabled",           cls: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300",          dot: "bg-amber-500" },
  };
  const s = map[status];
  return (
    <Badge variant="outline" className={cn("gap-1.5 font-normal", s.cls)}>
      <span className={cn("h-1.5 w-1.5 rounded-full", s.dot)} />
      {s.label}
    </Badge>
  );
}

function VersionStatusPill({ status }: { status: Version["deploymentStatus"] }) {
  const cls =
    status === "Production"  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
    : status === "Staged"    ? "border-primary/40 bg-primary/10 text-primary"
    : status === "Testing"   ? "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300"
    : status === "Rolled Back" ? "border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300"
    : "border-border bg-muted text-muted-foreground";
  return <Badge variant="outline" className={cn("font-normal", cls)}>{status}</Badge>;
}

function ResultPill({ result }: { result: AgentLog["result"] }) {
  const map: Record<AgentLog["result"], string> = {
    success: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
    failed:  "border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300",
    denied:  "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300",
    info:    "border-border bg-muted text-muted-foreground",
  };
  return <Badge variant="outline" className={cn("font-normal capitalize", map[result])}>{result}</Badge>;
}

function Stepper({ step, labels }: { step: number; labels: string[] }) {
  return (
    <div className="flex items-center gap-2 rounded-md border bg-muted/20 p-2 text-xs">
      {labels.map((l, i) => {
        const n = i + 1;
        const active = step === n;
        const done = step > n;
        return (
          <div key={l} className="flex flex-1 items-center gap-2">
            <div className={cn(
              "grid h-6 w-6 place-items-center rounded-full text-[11px]",
              done ? "bg-primary text-primary-foreground"
                : active ? "bg-primary/15 text-primary ring-2 ring-primary/40"
                : "bg-muted text-muted-foreground",
            )}>
              {done ? <CheckCircle2 className="h-3.5 w-3.5" /> : n}
            </div>
            <div className={cn("truncate font-medium", active ? "text-foreground" : done ? "text-foreground/80" : "text-muted-foreground")}>{l}</div>
            {i < labels.length - 1 && <div className={cn("mx-1 h-px flex-1", done ? "bg-primary" : "bg-border")} />}
          </div>
        );
      })}
    </div>
  );
}

function CfgSwitch({ label, checked, onCheckedChange }: { label: string; checked: boolean; onCheckedChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center justify-between rounded-md border bg-card px-3 py-2 text-sm">
      <span>{label}</span>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </label>
  );
}

function SummaryCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-md border bg-muted/20 p-3">
      <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{title}</div>
      <div className="mt-1 text-sm font-medium">{body}</div>
    </div>
  );
}

function SumRow({ label, on }: { label: string; on: boolean }) {
  return (
    <div className="flex items-center gap-2">
      {on ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> : <X className="h-3.5 w-3.5 text-muted-foreground" />}
      <span className={cn(on ? "" : "text-muted-foreground")}>{label}</span>
    </div>
  );
}

function PermRow({ label, on }: { label: string; on: boolean }) {
  return (
    <div className="flex items-center gap-1.5">
      {on ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> : <X className="h-3.5 w-3.5 text-muted-foreground" />}
      <span className={cn(on ? "text-foreground" : "text-muted-foreground")}>{label}</span>
    </div>
  );
}

function MiniBar({ value, tone }: { value: number; tone: "ok" | "warn" | "danger" }) {
  const cls = tone === "danger" ? "bg-rose-500" : tone === "warn" ? "bg-amber-500" : "bg-emerald-500";
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-20 overflow-hidden rounded-full bg-muted">
        <div className={cn("h-full", cls)} style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
      </div>
      <span className="w-8 text-right font-mono text-xs text-muted-foreground">{value}%</span>
    </div>
  );
}

function MetricCard({ icon: Icon, label, value }: { icon: typeof Cpu; label: string; value: string }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <div className="grid h-9 w-9 place-items-center rounded-md bg-primary/10 text-primary">
          <Icon className="h-4.5 w-4.5" />
        </div>
        <div>
          <div className="text-lg font-semibold leading-none">{value}</div>
          <div className="mt-1 text-xs text-muted-foreground">{label}</div>
        </div>
      </CardContent>
    </Card>
  );
}

function SecurityRow({ icon: Icon, label, value, ok, warn }: { icon: typeof Lock; label: string; value: string; ok: boolean; warn?: boolean }) {
  const cls = ok ? "text-emerald-600 dark:text-emerald-400" : warn ? "text-amber-600 dark:text-amber-400" : "text-rose-600 dark:text-rose-400";
  const dot = ok ? "bg-emerald-500" : warn ? "bg-amber-500" : "bg-rose-500";
  return (
    <div className="flex items-center gap-3 rounded-md border bg-muted/20 px-3 py-2 text-sm">
      <Icon className={cn("h-4 w-4", cls)} />
      <span className="text-muted-foreground">{label}</span>
      <span className="ml-auto flex items-center gap-2 font-medium">
        <span className={cn("h-1.5 w-1.5 rounded-full", dot)} />
        {value}
      </span>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border bg-muted/20 px-2 py-1.5">
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="text-sm font-medium truncate">{value}</div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-sm font-semibold">{value}</div>
      <div className="text-[11px] text-muted-foreground">{label}</div>
    </div>
  );
}

function statusLabel(v: string) {
  return v === "install_failed" ? "Installation Failed" : v[0].toUpperCase() + v.slice(1);
}

function labelForAction(a: string) {
  const map: Record<string, string> = {
    agent_update: "Update queued",
    agent_reinstall: "Reinstall queued",
    agent_disable: "Agent disabled",
    agent_enable: "Agent enabled",
    agent_upload_package: "Package upload started",
    agent_test_version: "Test job started",
    agent_deploy_update: "Deployment queued",
    agent_rollback: "Rollback queued",
    policy_create: "Policy draft opened",
    policy_update: "Policy updated",
    policy_assign: "Policy assigned",
  };
  return map[a] ?? a;
}

function humanize(k: string) {
  return k.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase());
}

function labelForBulk(a: "enable" | "disable" | "update" | "remove") {
  return a === "enable" ? "Enable" : a === "disable" ? "Disable" : a === "update" ? "Push update" : "Remove";
}

function GuardedBulkButton({
  canManage, onClick, icon: Icon, label, tone,
}: { canManage: boolean; onClick: () => void; icon: typeof Play; label: string; tone?: "danger" }) {
  const btn = (
    <Button
      size="sm"
      variant={tone === "danger" ? "destructive" : "outline"}
      className="h-8 gap-1.5"
      disabled={!canManage}
      onClick={onClick}
    >
      <Icon className="h-3.5 w-3.5" /> {label}
    </Button>
  );
  if (canManage) return btn;
  return (
    <Tooltip>
      <TooltipTrigger asChild><span>{btn}</span></TooltipTrigger>
      <TooltipContent>Requires manage_policies permission</TooltipContent>
    </Tooltip>
  );
}

function BatchStatusPill({ status }: { status: DeploymentBatch["status"] }) {
  const cls =
    status === "Completed" ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
    : status === "In progress" ? "border-primary/40 bg-primary/10 text-primary"
    : status === "Failed" ? "border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300"
    : "border-border bg-muted text-muted-foreground";
  return <Badge variant="outline" className={cn("font-normal", cls)}>{status}</Badge>;
}

// ────────────────────────────────────────────────────────────────────────────
// Bulk action confirmation wizard
// ────────────────────────────────────────────────────────────────────────────

function BulkActionConfirm({
  action, agents, onCancel, onConfirm,
}: {
  action: null | "enable" | "disable" | "update" | "remove";
  agents: Agent[];
  onCancel: () => void;
  onConfirm: (a: "enable" | "disable" | "update" | "remove") => void;
}) {
  const [step, setStep] = useState<1 | 2>(1);
  const [ack, setAck] = useState(false);

  const open = !!action;
  const a = action ?? "disable";
  const isDestructive = a === "remove";
  const label = labelForBulk(a);

  const summary =
    a === "enable"  ? "Selected agents will resume communication with the broker."
    : a === "disable" ? "Selected agents will stop accepting sessions until re-enabled."
    : a === "update"  ? `Selected agents will be scheduled for the current package (${CURRENT_VERSION}).`
    :                   "Selected agents will be uninstalled and removed from inventory. This cannot be undone from this screen.";

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) { onCancel(); setStep(1); setAck(false); } }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isDestructive && <AlertOctagon className="h-4 w-4 text-rose-500" />}
            Bulk action — {label}
          </DialogTitle>
          <DialogDescription>
            {agents.length} agent{agents.length === 1 ? "" : "s"} selected.
          </DialogDescription>
        </DialogHeader>

        <Stepper step={step} labels={["Review targets", "Confirm"]} />

        {step === 1 && (
          <div className="space-y-2">
            <div className="rounded-md border bg-muted/20 p-3 text-xs text-muted-foreground">{summary}</div>
            <div className="max-h-56 overflow-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40">
                    <TableHead>Device</TableHead>
                    <TableHead>Branch</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {agents.map((ag) => (
                    <TableRow key={ag.id}>
                      <TableCell className="font-medium">{ag.hostname}<div className="text-xs text-muted-foreground">{ag.ip}</div></TableCell>
                      <TableCell>{ag.branch}</TableCell>
                      <TableCell><AgentStatusPill status={ag.status} /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-3">
            <div className={cn(
              "rounded-md border p-3 text-xs",
              isDestructive ? "border-rose-500/30 bg-rose-500/5 text-rose-700 dark:text-rose-300" : "bg-muted/20 text-muted-foreground",
            )}>
              You are about to <strong>{label.toLowerCase()}</strong> {agents.length} agent{agents.length === 1 ? "" : "s"}.
              {isDestructive && " An audit entry will be created for every affected endpoint."}
            </div>
            <label className="flex items-start gap-2 text-sm">
              <Checkbox checked={ack} onCheckedChange={(v) => setAck(!!v)} className="mt-0.5" />
              <span>I understand this action will be applied to all selected agents on the private WAN.</span>
            </label>
          </div>
        )}

        <DialogFooter className="flex items-center justify-between gap-2 sm:justify-between">
          <Button variant="ghost" onClick={() => (step === 1 ? (onCancel(), setStep(1), setAck(false)) : setStep(1))}>
            <ChevronLeft className="mr-1 h-4 w-4" /> {step === 1 ? "Cancel" : "Back"}
          </Button>
          {step === 1 ? (
            <Button onClick={() => setStep(2)}>Continue <ChevronRight className="ml-1 h-4 w-4" /></Button>
          ) : (
            <Button variant={isDestructive ? "destructive" : "default"} disabled={!ack} onClick={() => { onConfirm(a); setStep(1); setAck(false); }}>
              Confirm {label}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Per-batch deployment progress dialog
// ────────────────────────────────────────────────────────────────────────────

function BatchProgressDialog({
  batch, onClose, role, viewerName,
}: { batch: DeploymentBatch | null; onClose: () => void; role: ErapRole; viewerName: string }) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const canManage = hasPermission(role, "manage_policies");

  const retry = (device: string, mode: "step" | "device" | "batch") => {
    if (!canManage) {
      toast.error("Your role can't retry installs");
      logAudit({ actor: viewerName, actorRole: role, category: "device", action: "batch_retry", target: device, status: "denied", details: mode });
      return;
    }
    logAudit({ actor: viewerName, actorRole: role, category: "device", action: "batch_retry", target: device, status: "success", details: mode });
    toast.success(`Retry queued — ${device}`);
  };

  return (
    <Dialog open={!!batch} onOpenChange={(v) => !v && (onClose(), setExpanded(null))}>
      <DialogContent className="max-w-3xl">
        {batch && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {batch.title}
                <BatchStatusPill status={batch.status} />
              </DialogTitle>
              <DialogDescription>{batch.id} · {batch.when} · {batch.devices.length} devices</DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-4 gap-3">
              {(() => {
                const done = batch.devices.filter((d) => d.status === "completed").length;
                const running = batch.devices.filter((d) => d.status === "in_progress" || d.status === "retrying").length;
                const failed = batch.devices.filter((d) => d.status === "failed").length;
                const queued = batch.devices.filter((d) => d.status === "queued").length;
                return (
                  <>
                    <SummaryCard title="Completed" body={String(done)} />
                    <SummaryCard title="In progress" body={String(running)} />
                    <SummaryCard title="Failed" body={String(failed)} />
                    <SummaryCard title="Queued" body={String(queued)} />
                  </>
                );
              })()}
            </div>

            <ScrollArea className="max-h-[420px]">
              <div className="space-y-2 pr-2">
                {batch.devices.map((d) => {
                  const isOpen = expanded === d.hostname;
                  const progress = Math.round(
                    (d.steps.filter((s) => s.status === "success").length / d.steps.length) * 100,
                  );
                  return (
                    <div key={d.hostname} className="rounded-md border">
                      <button
                        type="button"
                        onClick={() => setExpanded(isOpen ? null : d.hostname)}
                        className="flex w-full items-center gap-3 px-3 py-2 text-left"
                      >
                        <ChevronRight className={cn("h-3.5 w-3.5 transition-transform", isOpen && "rotate-90")} />
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-medium">{d.hostname}</div>
                          <div className="text-xs text-muted-foreground">{d.ip}</div>
                        </div>
                        <div className="hidden w-40 items-center gap-2 md:flex">
                          <Progress value={progress} className="h-1.5 flex-1" />
                          <span className="w-8 text-right font-mono text-xs text-muted-foreground">{progress}%</span>
                        </div>
                        <DeviceBatchPill status={d.status} />
                        {(d.status === "failed" || d.status === "in_progress") && (
                          <span onClick={(e) => e.stopPropagation()}>
                            <Button size="sm" variant="outline" className="h-7 gap-1" onClick={() => retry(d.hostname, "device")} disabled={!canManage}>
                              <RotateCcw className="h-3 w-3" /> Retry
                            </Button>
                          </span>
                        )}
                      </button>
                      {isOpen && (
                        <div className="border-t bg-muted/10 p-3">
                          <ol className="space-y-2">
                            {d.steps.map((s, i) => (
                              <li key={s.key} className="flex items-start gap-3">
                                <StepIcon status={s.status} />
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-2 text-sm">
                                    <span className="font-medium">{i + 1}. {s.label}</span>
                                    <span className="text-xs text-muted-foreground">{stepStatusLabel(s.status)}</span>
                                  </div>
                                  {s.detail && <div className="mt-0.5 text-xs text-rose-600 dark:text-rose-400">{s.detail}</div>}
                                </div>
                                {s.status === "failed" && (
                                  <Button size="sm" variant="outline" className="h-7 gap-1" onClick={() => retry(d.hostname, "step")} disabled={!canManage}>
                                    <RotateCcw className="h-3 w-3" /> Retry step
                                  </Button>
                                )}
                              </li>
                            ))}
                          </ol>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </ScrollArea>

            <DialogFooter className="justify-between sm:justify-between">
              <div className="text-xs text-muted-foreground">Offline WAN batch · installer logs are pulled on next check-in</div>
              <div className="flex gap-2">
                <Button variant="ghost" onClick={() => (onClose(), setExpanded(null))}>Close</Button>
                <Button
                  variant="outline"
                  className="gap-1"
                  disabled={!canManage || batch.devices.every((d) => d.status !== "failed")}
                  onClick={() => retry(batch.id, "batch")}
                >
                  <RotateCcw className="h-3.5 w-3.5" /> Retry failed
                </Button>
              </div>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function StepIcon({ status }: { status: BatchStepStatus }) {
  if (status === "success") return <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-500" />;
  if (status === "failed")  return <XCircle       className="mt-0.5 h-4 w-4 text-rose-500" />;
  if (status === "running") return <Loader2       className="mt-0.5 h-4 w-4 animate-spin text-primary" />;
  if (status === "skipped") return <X             className="mt-0.5 h-4 w-4 text-muted-foreground" />;
  return <Circle className="mt-0.5 h-4 w-4 text-muted-foreground" />;
}

function stepStatusLabel(s: BatchStepStatus) {
  return s === "success" ? "Done" : s === "failed" ? "Failed" : s === "running" ? "Running…" : s === "skipped" ? "Skipped" : "Pending";
}

function DeviceBatchPill({ status }: { status: BatchDevice["status"] }) {
  const map: Record<BatchDevice["status"], { label: string; cls: string }> = {
    completed:   { label: "Completed",   cls: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" },
    in_progress: { label: "In progress", cls: "border-primary/40 bg-primary/10 text-primary" },
    retrying:    { label: "Retrying",    cls: "border-primary/40 bg-primary/10 text-primary" },
    failed:      { label: "Failed",      cls: "border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300" },
    queued:      { label: "Queued",      cls: "border-border bg-muted text-muted-foreground" },
  };
  const s = map[status];
  return <Badge variant="outline" className={cn("font-normal", s.cls)}>{s.label}</Badge>;
}

// ────────────────────────────────────────────────────────────────────────────
// Right-side diagnostics panel
// ────────────────────────────────────────────────────────────────────────────

function makeSeries(seed: number, base: number, jitter: number, len = 24) {
  const out: number[] = [];
  let v = base;
  let s = seed;
  for (let i = 0; i < len; i++) {
    s = (s * 9301 + 49297) % 233280;
    v = Math.max(0, Math.min(100, v + ((s / 233280) - 0.5) * jitter));
    out.push(Math.round(v));
  }
  return out;
}

function Sparkline({ data, tone = "primary" }: { data: number[]; tone?: "primary" | "warn" | "danger" }) {
  const max = Math.max(1, ...data);
  const min = Math.min(0, ...data);
  const w = 100, h = 28;
  const dx = w / (data.length - 1);
  const norm = (v: number) => h - ((v - min) / (max - min || 1)) * h;
  const d = data.map((v, i) => `${i === 0 ? "M" : "L"}${(i * dx).toFixed(1)},${norm(v).toFixed(1)}`).join(" ");
  const stroke =
    tone === "danger" ? "rgb(244 63 94)" :
    tone === "warn"   ? "rgb(245 158 11)" :
                         "hsl(var(--primary))";
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="h-8 w-full">
      <path d={d} fill="none" stroke={stroke} strokeWidth={1.2} vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

function DiagnosticsPanel({ agent, onClose }: { agent: Agent | null; onClose: () => void }) {
  if (!agent) return null;

  const seed = agent.id.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const cpuSeries = makeSeries(seed,       agent.cpu || 5,   12);
  const memSeries = makeSeries(seed + 11,  agent.mem || 20,  8);
  const latSeries = makeSeries(seed + 23,  agent.latencyMs || 15, 10);

  const offline = agent.status === "offline" || agent.status === "install_failed";
  const outdated = agent.agentVersion !== "3.2.1";

  const heartbeats = Array.from({ length: 12 }).map((_, i) => {
    if (offline && i < 8) return { t: `${(i + 1) * 15}m ago`, ok: false };
    return { t: `${i * 8}s ago`, ok: true };
  });

  const hints: { title: string; body: string; tone: "warn" | "danger" | "info" }[] = [];
  if (offline) {
    hints.push({ title: "No heartbeat for over 3 hours", body: "Broker last saw a hello packet at check-in. Verify WAN link, DNS to broker 10.0.0.4, and Windows service ERAPAgentSvc is running.", tone: "danger" });
    if (agent.cert === "expired") hints.push({ title: "Agent certificate expired", body: "Kerberos handshake will fail. Re-issue via internal CA and push a reinstall.", tone: "danger" });
    if (!agent.authOk) hints.push({ title: "Authentication failing", body: "Machine SPN mismatch is the most common cause on Server 2022. Reset computer account and rejoin.", tone: "warn" });
  }
  if (outdated) {
    hints.push({ title: `Agent ${agent.agentVersion} is behind production (${CURRENT_VERSION})`, body: "Schedule a Push Update from the bulk actions or open the deployment wizard.", tone: "warn" });
  }
  if (agent.cert === "expiring") {
    hints.push({ title: "Certificate expiring within 30 days", body: "Renewal window is open. Rotate via the offline PKI job.", tone: "warn" });
  }
  if (!agent.compliant) {
    hints.push({ title: "Policy compliance drift detected", body: "Agent settings differ from assigned policy. Reassign to restore baseline.", tone: "warn" });
  }
  if (hints.length === 0) {
    hints.push({ title: "No issues detected", body: "Telemetry within thresholds. Continue routine monitoring.", tone: "info" });
  }

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/20" onClick={onClose} />
      <aside className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l bg-card shadow-xl">
        <div className="flex items-center gap-2 border-b px-4 py-3">
          <Activity className="h-4 w-4 text-primary" />
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold">{agent.hostname}</div>
            <div className="text-xs text-muted-foreground">{agent.id} · {agent.ip}</div>
          </div>
          <AgentStatusPill status={agent.status} />
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose} aria-label="Close diagnostics">
            <X className="h-4 w-4" />
          </Button>
        </div>

        <ScrollArea className="flex-1">
          <div className="space-y-4 p-4">
            <section>
              <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <TrendIcon /> Metrics — last 2 hours
              </div>
              <div className="space-y-2">
                <MetricRow label="CPU"     value={`${agent.cpu}%`}       series={cpuSeries} tone={agent.cpu > 80 ? "danger" : agent.cpu > 60 ? "warn" : "primary"} />
                <MetricRow label="Memory"  value={`${agent.mem}%`}       series={memSeries} tone={agent.mem > 80 ? "danger" : agent.mem > 60 ? "warn" : "primary"} />
                <MetricRow label="Latency" value={`${agent.latencyMs} ms`} series={latSeries} tone={agent.latencyMs > 60 ? "warn" : "primary"} />
              </div>
            </section>

            <Separator />

            <section>
              <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <HeartPulse className="h-3.5 w-3.5" /> Heartbeat history
              </div>
              <div className="grid grid-cols-6 gap-1">
                {heartbeats.map((h, i) => (
                  <Tooltip key={i}>
                    <TooltipTrigger asChild>
                      <div className={cn(
                        "h-6 rounded-sm",
                        h.ok ? "bg-emerald-500/70" : "bg-rose-500/60",
                      )} />
                    </TooltipTrigger>
                    <TooltipContent>{h.ok ? "OK" : "Missed"} · {h.t}</TooltipContent>
                  </Tooltip>
                ))}
              </div>
              <div className="mt-2 flex justify-between text-[11px] text-muted-foreground">
                <span>Older</span><span>Latest — {agent.heartbeat}</span>
              </div>
            </section>

            <Separator />

            <section>
              <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <Lightbulb className="h-3.5 w-3.5" /> Root-cause hints
              </div>
              <div className="space-y-2">
                {hints.map((h, i) => (
                  <div key={i} className={cn(
                    "rounded-md border p-3 text-xs",
                    h.tone === "danger" ? "border-rose-500/30 bg-rose-500/5"
                    : h.tone === "warn"  ? "border-amber-500/30 bg-amber-500/5"
                    : "bg-muted/20",
                  )}>
                    <div className={cn(
                      "text-sm font-medium",
                      h.tone === "danger" ? "text-rose-700 dark:text-rose-300"
                      : h.tone === "warn"  ? "text-amber-700 dark:text-amber-300"
                      : "text-foreground",
                    )}>{h.title}</div>
                    <div className="mt-1 text-muted-foreground">{h.body}</div>
                  </div>
                ))}
              </div>
            </section>

            <Separator />

            <section>
              <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <History className="h-3.5 w-3.5" /> Recent events
              </div>
              <ol className="space-y-2 text-xs">
                {AGENT_LOGS.filter((l) => l.device === agent.hostname).slice(0, 4).map((l, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <ResultDot result={l.result} />
                    <div className="min-w-0">
                      <div><span className="font-medium">{l.action}</span> — {l.detail}</div>
                      <div className="text-muted-foreground">{l.ts} · {l.user}</div>
                    </div>
                  </li>
                ))}
                {AGENT_LOGS.filter((l) => l.device === agent.hostname).length === 0 && (
                  <li className="text-muted-foreground">No recent lifecycle events for this device.</li>
                )}
              </ol>
            </section>
          </div>
        </ScrollArea>
      </aside>
    </>
  );
}

function MetricRow({ label, value, series, tone }: { label: string; value: string; series: number[]; tone: "primary" | "warn" | "danger" }) {
  return (
    <div className="rounded-md border bg-muted/10 p-3">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{label}</span>
        <span className="text-sm font-semibold">{value}</span>
      </div>
      <Sparkline data={series} tone={tone} />
    </div>
  );
}

function TrendIcon() {
  return <Activity className="h-3.5 w-3.5" />;
}

function ResultDot({ result }: { result: AgentLog["result"] }) {
  const cls =
    result === "success" ? "bg-emerald-500"
    : result === "failed" ? "bg-rose-500"
    : result === "denied" ? "bg-amber-500"
    : "bg-muted-foreground";
  return <span className={cn("mt-1 h-1.5 w-1.5 shrink-0 rounded-full", cls)} />;
}