import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  Activity,
  Search,
  AlertTriangle,
  AlertOctagon,
  CheckCircle2,
  XCircle,
  Info,
  FileText,
  Download,
  Upload,
  Bell,
  Lock,
  KeyRound,
  Database,
  Radio,
  Server,
  Users as UsersIcon,
  MonitorSmartphone,
  ClipboardList,
  ChevronRight,
  Calendar,
  Settings as SettingsIcon,
  LayoutDashboard,
  Fingerprint,
  History,
  Play,
  RefreshCw,
  Filter,
  Siren,
  Clock,
  Building2,
  Terminal as TerminalIcon,
  FileSearch,
  ScrollText,
  BarChart3,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

// ─── Types ─────────────────────────────────────────────────────────────

type Severity = "critical" | "warning" | "info" | "success";
type EventCategory =
  | "auth"
  | "session"
  | "file"
  | "command"
  | "config"
  | "policy"
  | "agent"
  | "admin";
type EventResult = "success" | "blocked" | "failed" | "info";

interface SecurityEvent {
  id: string;
  ts: number;
  user: string;
  role: string;
  device: string;
  branch: string;
  category: EventCategory;
  action: string;
  result: EventResult;
  severity: Severity;
  ip: string;
  details: string;
}

type AlertState = "new" | "assigned" | "investigating" | "resolved" | "closed";
interface AlertRecord {
  id: string;
  ts: number;
  severity: Severity;
  title: string;
  source: string;
  analyst: string | null;
  state: AlertState;
  category: string;
}

interface Evidence {
  id: string;
  sessionId: string;
  kind: "recording" | "screenshot" | "command" | "file" | "note";
  collectedBy: string;
  collectedAt: number;
  hash: string;
  sizeMb: number;
  chain: { by: string; at: number; action: string }[];
}

// ─── Sidebar ───────────────────────────────────────────────────────────

type NavSection = {
  label: string;
  items: { key: string; label: string; icon: React.ElementType; to?: string; active?: boolean }[];
};

function SecuritySidebar({ active }: { active: string }) {
  const sections: NavSection[] = [
    {
      label: "Overview",
      items: [
        { key: "dashboard", label: "Dashboard", icon: LayoutDashboard, to: "/" },
      ],
    },
    {
      label: "Devices",
      items: [
        { key: "inventory", label: "Device Inventory", icon: MonitorSmartphone, to: "/" },
        { key: "sessions", label: "Remote Sessions", icon: Radio, to: "/sessions" },
        { key: "agents", label: "Agent Management", icon: Server, to: "/agents" },
        { key: "groups", label: "Device Groups", icon: Database },
        { key: "policies", label: "Policies", icon: ClipboardList },
        { key: "compliance", label: "Compliance", icon: ShieldCheck },
      ],
    },
    {
      label: "Operations",
      items: [
        { key: "console", label: "Session Console", icon: TerminalIcon, to: "/console" },
        { key: "history", label: "Session History", icon: History, to: "/sessions" },
        { key: "incident", label: "Incident Support", icon: Siren },
        { key: "audit", label: "Audit Logs", icon: ScrollText, to: "/users" },
      ],
    },
    {
      label: "Security Center",
      items: [
        { key: "sec-dashboard", label: "Security Dashboard", icon: Shield, to: "/security" },
        { key: "sec-explorer", label: "Event Explorer", icon: FileSearch, to: "/security" },
        { key: "sec-siem", label: "SIEM Integration", icon: Network(), to: "/security" } as any,
        { key: "sec-reports", label: "Compliance Reports", icon: FileText, to: "/security" },
        { key: "sec-alerts", label: "Alerts", icon: Bell, to: "/security" },
        { key: "sec-evidence", label: "Digital Evidence", icon: Fingerprint, to: "/security" },
      ],
    },
  ];

  return (
    <aside className="w-64 shrink-0 bg-sidebar text-sidebar-foreground border-r border-sidebar-border flex flex-col">
      <div className="h-14 flex items-center gap-2 px-4 border-b border-sidebar-border">
        <div className="h-8 w-8 rounded-md bg-sidebar-primary text-sidebar-primary-foreground flex items-center justify-center">
          <Shield className="h-4 w-4" />
        </div>
        <div>
          <div className="text-sm font-semibold">ERAP</div>
          <div className="text-[10px] text-sidebar-foreground/60 uppercase tracking-wider">Security Center</div>
        </div>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-4">
          {sections.map((s) => (
            <div key={s.label}>
              <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-sidebar-foreground/50">
                {s.label}
              </div>
              <div className="space-y-0.5">
                {s.items.map((it) => {
                  const Icon = it.icon;
                  const isActive = it.key === active;
                  const cls = cn(
                    "w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors",
                    isActive
                      ? "bg-sidebar-primary text-sidebar-primary-foreground"
                      : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground text-sidebar-foreground/80",
                  );
                  return it.to ? (
                    <Link key={it.key} to={it.to} className={cls}>
                      <Icon className="h-4 w-4 shrink-0" />
                      <span className="truncate">{it.label}</span>
                    </Link>
                  ) : (
                    <button key={it.key} className={cls}>
                      <Icon className="h-4 w-4 shrink-0" />
                      <span className="truncate">{it.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
      <div className="p-3 border-t border-sidebar-border text-[10px] text-sidebar-foreground/50">
        <div className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          Private WAN · Offline mode
        </div>
        <div className="mt-1">ERAP v4.2.1 · classified</div>
      </div>
    </aside>
  );
}

// Network icon workaround — keep simple line-icon
function Network() {
  return Radio;
}

// ─── Utility badges ────────────────────────────────────────────────────

function SeverityPill({ s }: { s: Severity }) {
  const map: Record<Severity, string> = {
    critical: "bg-red-500/15 text-red-600 border-red-500/30",
    warning: "bg-amber-500/15 text-amber-600 border-amber-500/30",
    info: "bg-sky-500/15 text-sky-600 border-sky-500/30",
    success: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30",
  };
  return (
    <Badge variant="outline" className={cn("uppercase text-[10px] tracking-wider", map[s])}>
      {s}
    </Badge>
  );
}

function ResultPill({ r }: { r: EventResult }) {
  const map: Record<EventResult, { cls: string; label: string; Icon: React.ElementType }> = {
    success: { cls: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30", label: "Success", Icon: CheckCircle2 },
    blocked: { cls: "bg-amber-500/15 text-amber-600 border-amber-500/30", label: "Blocked", Icon: ShieldAlert },
    failed: { cls: "bg-red-500/15 text-red-600 border-red-500/30", label: "Failed", Icon: XCircle },
    info: { cls: "bg-sky-500/15 text-sky-600 border-sky-500/30", label: "Info", Icon: Info },
  };
  const { cls, label, Icon } = map[r];
  return (
    <Badge variant="outline" className={cn("gap-1", cls)}>
      <Icon className="h-3 w-3" />
      {label}
    </Badge>
  );
}

// ─── Seed data ─────────────────────────────────────────────────────────

const NOW = Date.now();
const min = (n: number) => NOW - n * 60_000;

const EVENTS: SecurityEvent[] = [
  { id: "EVT-90211", ts: min(2), user: "a.morgan", role: "System Admin", device: "DEVICE-UG-0452", branch: "New York", category: "session", action: "Remote Session Started", result: "success", severity: "info", ip: "10.14.22.41", details: "RustDesk tunnel established with AES-256" },
  { id: "EVT-90210", ts: min(4), user: "unknown", role: "—", device: "FINANCE-PC-042", branch: "New York", category: "auth", action: "Unauthorized Access Attempt", result: "blocked", severity: "critical", ip: "10.14.99.14", details: "5 consecutive failed logons from unregistered technician account" },
  { id: "EVT-90209", ts: min(7), user: "s.patel", role: "Regional Admin", device: "SERVER-FIN-001", branch: "London", category: "file", action: "File Transfer Attempt", result: "blocked", severity: "warning", ip: "10.22.4.7", details: "Blocked by DLP policy: financial-records.xlsx" },
  { id: "EVT-90208", ts: min(11), user: "r.silva", role: "Support Tech", device: "NYC-ENG-WS31", branch: "New York", category: "command", action: "PowerShell Command Executed", result: "success", severity: "info", ip: "10.14.22.55", details: "Get-Service | Where Status -eq Stopped" },
  { id: "EVT-90207", ts: min(18), user: "j.nguyen", role: "Senior Engineer", device: "SFO-DES-MB08", branch: "San Francisco", category: "session", action: "Remote Session Ended", result: "success", severity: "success", ip: "10.30.7.12", details: "Duration 00:14:22 · reason satisfied" },
  { id: "EVT-90206", ts: min(25), user: "k.mueller", role: "Auditor", device: "BER-HR-WS10", branch: "Berlin", category: "admin", action: "Audit Log Exported", result: "success", severity: "info", ip: "10.44.2.9", details: "CSV export · 1,204 rows" },
  { id: "EVT-90205", ts: min(31), user: "l.chen", role: "Regional Admin", device: "SFO-OPS-WS17", branch: "San Francisco", category: "policy", action: "Approval Policy Updated", result: "success", severity: "warning", ip: "10.30.7.30", details: "After-hours approval requirement enabled" },
  { id: "EVT-90204", ts: min(44), user: "a.morgan", role: "System Admin", device: "—", branch: "Global", category: "config", action: "Privilege Escalation", result: "success", severity: "warning", ip: "10.14.22.41", details: "Temporary emergency admin granted (expires 30 min)" },
  { id: "EVT-90203", ts: min(62), user: "svc-agent", role: "Service", device: "BRANCH-KLA-102", branch: "Kolkata", category: "agent", action: "Agent Heartbeat Restored", result: "info", severity: "info", ip: "10.71.4.19", details: "Recovered after 6 minutes offline" },
  { id: "EVT-90202", ts: min(88), user: "e.brown", role: "Support Tech", device: "LON-FIN-LT02", branch: "London", category: "auth", action: "MFA Challenge Passed", result: "success", severity: "info", ip: "10.22.4.16", details: "TOTP verified" },
  { id: "EVT-90201", ts: min(133), user: "unknown", role: "—", device: "BRANCH-DXB-014", branch: "Dubai", category: "auth", action: "Failed Login", result: "failed", severity: "warning", ip: "10.60.1.204", details: "Password mismatch · account not locked" },
  { id: "EVT-90200", ts: min(210), user: "a.morgan", role: "System Admin", device: "FINANCE-PC-042", branch: "New York", category: "admin", action: "Certificate Renewed", result: "success", severity: "success", ip: "10.14.22.41", details: "Internal CA · expires 2027-07-14" },
];

const ALERTS: AlertRecord[] = [
  { id: "ALT-4412", ts: min(4), severity: "critical", title: "Unauthorized access attempt on FINANCE-PC-042", source: "Auth Engine", analyst: null, state: "new", category: "Authentication" },
  { id: "ALT-4411", ts: min(20), severity: "critical", title: "Privilege escalation outside change window", source: "Policy Engine", analyst: "a.morgan", state: "investigating", category: "Privilege" },
  { id: "ALT-4410", ts: min(45), severity: "warning", title: "Outdated agent on 14 endpoints (Berlin)", source: "Agent Telemetry", analyst: "s.patel", state: "assigned", category: "Endpoint" },
  { id: "ALT-4409", ts: min(120), severity: "warning", title: "Repeated failed authentication from DXB-014", source: "Auth Engine", analyst: "k.mueller", state: "investigating", category: "Authentication" },
  { id: "ALT-4408", ts: min(240), severity: "info", title: "Agent update completed (batch B-221, 412 devices)", source: "Deployment", analyst: "s.patel", state: "resolved", category: "Endpoint" },
  { id: "ALT-4407", ts: min(1440), severity: "warning", title: "Policy violation: unattended access outside pilot branch", source: "Policy Engine", analyst: "a.morgan", state: "closed", category: "Policy" },
];

const EVIDENCE: Evidence[] = [
  { id: "EVD-8801", sessionId: "SES-6042", kind: "recording", collectedBy: "s.patel", collectedAt: min(60), hash: "9f2b…c418", sizeMb: 42.7, chain: [
    { by: "s.patel", at: min(60), action: "Captured" },
    { by: "k.mueller", at: min(50), action: "Verified integrity" },
  ] },
  { id: "EVD-8800", sessionId: "SES-6041", kind: "command", collectedBy: "r.silva", collectedAt: min(75), hash: "12ae…77c1", sizeMb: 0.02, chain: [
    { by: "r.silva", at: min(75), action: "Captured" },
  ] },
  { id: "EVD-8799", sessionId: "SES-6039", kind: "screenshot", collectedBy: "a.morgan", collectedAt: min(140), hash: "3fdc…aa20", sizeMb: 1.4, chain: [
    { by: "a.morgan", at: min(140), action: "Captured" },
    { by: "k.mueller", at: min(90), action: "Sealed" },
  ] },
  { id: "EVD-8798", sessionId: "SES-6038", kind: "file", collectedBy: "s.patel", collectedAt: min(220), hash: "88bd…19f2", sizeMb: 12.3, chain: [
    { by: "s.patel", at: min(220), action: "Captured" },
  ] },
];

const TECHNICIANS = [
  { name: "Alex Morgan", handle: "a.morgan", role: "System Admin", dept: "Global IT", sessions: 128, avgMin: 18, lastActivity: min(4), score: "low" as const, notes: ["Normal access pattern", "Approved devices only", "No policy violations"] },
  { name: "Sara Patel", handle: "s.patel", role: "Regional Admin", dept: "EMEA Operations", sessions: 214, avgMin: 22, lastActivity: min(12), score: "low" as const, notes: ["Consistent working hours", "MFA active", "0 blocked transfers"] },
  { name: "Rafa Silva", handle: "r.silva", role: "Support Tech", dept: "Endpoint", sessions: 402, avgMin: 11, lastActivity: min(2), score: "medium" as const, notes: ["3 after-hours sessions this week", "1 blocked file transfer", "New branch access granted"] },
  { name: "Yuki Tanaka", handle: "y.tanaka", role: "Support Tech", dept: "Endpoint", sessions: 87, avgMin: 14, lastActivity: min(360), score: "medium" as const, notes: ["5 failed logins today", "Password reset pending"] },
  { name: "Karl Mueller", handle: "k.mueller", role: "Auditor", dept: "Compliance", sessions: 12, avgMin: 47, lastActivity: min(80), score: "low" as const, notes: ["Read-only role", "Evidence chain intact"] },
];

const DEVICES = [
  { name: "NYC-FIN-WS01", agent: "healthy", ver: "4.2.1", enc: "AES-256", cert: "Valid · 2027", branch: "New York", last: min(1), compliance: "compliant" as const },
  { name: "SFO-DES-MB08", agent: "healthy", ver: "4.2.1", enc: "AES-256", cert: "Valid · 2026", branch: "San Francisco", last: min(3), compliance: "compliant" as const },
  { name: "LON-FIN-LT02", agent: "outdated", ver: "3.9.4", enc: "AES-256", cert: "Valid · 2026", branch: "London", last: min(8), compliance: "at-risk" as const },
  { name: "BER-HR-WS10", agent: "healthy", ver: "4.2.1", enc: "AES-256", cert: "Expiring 30d", branch: "Berlin", last: min(2), compliance: "at-risk" as const },
  { name: "BRANCH-DXB-014", agent: "offline", ver: "4.1.0", enc: "AES-256", cert: "Valid · 2026", branch: "Dubai", last: min(45), compliance: "non-compliant" as const },
  { name: "FINANCE-PC-042", agent: "healthy", ver: "4.2.1", enc: "AES-256", cert: "Renewed", branch: "New York", last: min(1), compliance: "compliant" as const },
];

// ─── Formatting ────────────────────────────────────────────────────────

function fmtTime(ts: number) {
  return new Date(ts).toLocaleString(undefined, {
    month: "short", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit",
  });
}
function fmtHm(ts: number) {
  return new Date(ts).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

// ─── Header ────────────────────────────────────────────────────────────

function TopBar({ tab, setTab }: { tab: string; setTab: (t: string) => void }) {
  return (
    <div className="h-14 border-b bg-card flex items-center gap-3 px-4">
      <div>
        <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Security Center</div>
        <div className="text-sm font-semibold">Audit, Compliance & Monitoring</div>
      </div>
      <div className="ml-4 flex items-center gap-1 text-xs">
        {[
          { k: "dashboard", label: "Dashboard", Icon: LayoutDashboard },
          { k: "explorer", label: "Event Explorer", Icon: FileSearch },
          { k: "forensics", label: "Forensics", Icon: Fingerprint },
          { k: "stream", label: "Live Stream", Icon: Radio },
          { k: "siem", label: "SIEM", Icon: Server },
          { k: "reports", label: "Reports", Icon: FileText },
          { k: "users", label: "User Activity", Icon: UsersIcon },
          { k: "devices", label: "Device Security", Icon: MonitorSmartphone },
          { k: "alerts", label: "Alerts", Icon: Bell },
          { k: "evidence", label: "Evidence", Icon: Fingerprint },
        ].map(({ k, label, Icon }) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1.5 rounded-md transition-colors",
              tab === k ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted",
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </button>
        ))}
      </div>
      <div className="ml-auto flex items-center gap-2">
        <Badge variant="outline" className="gap-1 border-emerald-500/40 text-emerald-600 bg-emerald-500/10">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Live · Private WAN
        </Badge>
        <Button variant="outline" size="sm" className="gap-1"><Download className="h-3.5 w-3.5" />Export</Button>
      </div>
    </div>
  );
}

// ─── Sections ──────────────────────────────────────────────────────────

function Kpi({ label, value, sub, tone = "default", Icon }: { label: string; value: string | number; sub?: string; tone?: "default" | "green" | "red" | "amber" | "sky"; Icon: React.ElementType }) {
  const toneMap: Record<string, string> = {
    default: "text-foreground",
    green: "text-emerald-600",
    red: "text-red-600",
    amber: "text-amber-600",
    sky: "text-sky-600",
  };
  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="flex items-center justify-between">
        <div className="text-xs text-muted-foreground uppercase tracking-wider">{label}</div>
        <Icon className={cn("h-4 w-4", toneMap[tone])} />
      </div>
      <div className={cn("mt-1.5 text-2xl font-semibold tabular-nums", toneMap[tone])}>{value}</div>
      {sub && <div className="text-[11px] text-muted-foreground mt-0.5">{sub}</div>}
    </div>
  );
}

function Dashboard() {
  const posture = [
    { label: "System Health", value: 98, status: "Healthy", Icon: Activity, tone: "green" as const },
    { label: "Agent Compliance", value: 92, status: "3 outdated", Icon: ShieldCheck, tone: "amber" as const },
    { label: "Encryption", value: 100, status: "AES-256 all links", Icon: Lock, tone: "green" as const },
    { label: "Certificate Validity", value: 96, status: "2 expiring 30d", Icon: KeyRound, tone: "amber" as const },
    { label: "Access Control", value: 100, status: "RBAC enforced", Icon: ShieldCheck, tone: "green" as const },
  ];
  const risk = [
    { label: "Low", value: 1284, tone: "bg-emerald-500", text: "text-emerald-600" },
    { label: "Medium", value: 47, tone: "bg-amber-500", text: "text-amber-600" },
    { label: "High", value: 12, tone: "bg-orange-500", text: "text-orange-600" },
    { label: "Critical", value: 3, tone: "bg-red-500", text: "text-red-600" },
  ];
  const total = risk.reduce((s, r) => s + r.value, 0);

  return (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <Kpi label="Events Today" value="14,208" sub="+6.4% vs yesterday" Icon={Activity} tone="sky" />
        <Kpi label="Successful Sessions" value="1,942" sub="Last 24h" Icon={CheckCircle2} tone="green" />
        <Kpi label="Failed Auth" value="63" sub="5 accounts locked" Icon={XCircle} tone="red" />
        <Kpi label="Policy Violations" value="21" sub="7 auto-remediated" Icon={ShieldAlert} tone="amber" />
        <Kpi label="Privileged Actions" value="184" sub="12 emergency-elevated" Icon={KeyRound} tone="amber" />
        <Kpi label="Security Alerts" value="9" sub="2 critical open" Icon={Bell} tone="red" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 rounded-lg border bg-card">
          <div className="p-4 border-b flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold">Security Posture</div>
              <div className="text-xs text-muted-foreground">Rolling assessment across the private WAN fabric</div>
            </div>
            <Badge variant="outline" className="border-emerald-500/40 text-emerald-600 bg-emerald-500/10">Overall 97%</Badge>
          </div>
          <div className="p-4 space-y-3">
            {posture.map((p) => (
              <div key={p.label} className="grid grid-cols-[220px_1fr_120px] items-center gap-3">
                <div className="flex items-center gap-2">
                  <p.Icon className={cn("h-4 w-4", p.tone === "green" ? "text-emerald-600" : "text-amber-600")} />
                  <span className="text-sm">{p.label}</span>
                </div>
                <Progress value={p.value} className="h-2" />
                <div className="text-right text-xs">
                  <span className="font-semibold tabular-nums">{p.value}%</span>
                  <span className="ml-2 text-muted-foreground">{p.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border bg-card">
          <div className="p-4 border-b">
            <div className="text-sm font-semibold">Risk Overview</div>
            <div className="text-xs text-muted-foreground">Aggregated across all endpoints & users</div>
          </div>
          <div className="p-4 space-y-3">
            {risk.map((r) => {
              const pct = Math.round((r.value / total) * 100);
              return (
                <div key={r.label}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <div className="flex items-center gap-2">
                      <span className={cn("h-2 w-2 rounded-full", r.tone)} />
                      <span className="font-medium">{r.label}</span>
                    </div>
                    <div className={cn("tabular-nums", r.text)}>{r.value.toLocaleString()} · {pct}%</div>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className={cn("h-full", r.tone)} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
            <Separator />
            <div className="text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5"><Info className="h-3.5 w-3.5" /> Sensitive departments (HR, Finance) weighted 1.5×</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 rounded-lg border bg-card">
          <div className="p-4 border-b flex items-center justify-between">
            <div className="text-sm font-semibold">Recent Critical Events</div>
            <Button variant="ghost" size="sm" className="text-xs">View all <ChevronRight className="h-3.5 w-3.5" /></Button>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-40">Time</TableHead>
                <TableHead>Event</TableHead>
                <TableHead>Device</TableHead>
                <TableHead>Result</TableHead>
                <TableHead>Severity</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {EVENTS.filter((e) => e.severity === "critical" || e.severity === "warning").slice(0, 6).map((e) => (
                <TableRow key={e.id}>
                  <TableCell className="text-xs text-muted-foreground tabular-nums">{fmtTime(e.ts)}</TableCell>
                  <TableCell className="text-sm">{e.action}</TableCell>
                  <TableCell className="text-xs font-mono">{e.device}</TableCell>
                  <TableCell><ResultPill r={e.result} /></TableCell>
                  <TableCell><SeverityPill s={e.severity} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="rounded-lg border bg-card">
          <div className="p-4 border-b">
            <div className="text-sm font-semibold">Open Alerts</div>
            <div className="text-xs text-muted-foreground">Assigned or awaiting triage</div>
          </div>
          <div className="divide-y">
            {ALERTS.filter((a) => a.state !== "resolved" && a.state !== "closed").map((a) => (
              <div key={a.id} className="p-3 flex items-start gap-2">
                <div className={cn("mt-0.5 h-2 w-2 rounded-full shrink-0",
                  a.severity === "critical" ? "bg-red-500" : a.severity === "warning" ? "bg-amber-500" : "bg-sky-500")} />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium truncate">{a.title}</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-2">
                    <span>{a.id}</span>·<span>{a.source}</span>·<span>{fmtTime(a.ts)}</span>
                  </div>
                  <div className="mt-1 flex items-center gap-1.5">
                    <SeverityPill s={a.severity} />
                    <Badge variant="outline" className="text-[10px] capitalize">{a.state}</Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Event Explorer ────────────────────────────────────────────────────

function EventExplorer({ onOpenSession }: { onOpenSession: (id: string) => void }) {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string>("all");
  const [sev, setSev] = useState<string>("all");
  const [selected, setSelected] = useState<SecurityEvent | null>(null);

  const filtered = useMemo(() => {
    return EVENTS.filter((e) => {
      if (cat !== "all" && e.category !== cat) return false;
      if (sev !== "all" && e.severity !== sev) return false;
      if (!q) return true;
      const s = q.toLowerCase();
      return [e.user, e.device, e.branch, e.action, e.ip, e.id, e.role].some((f) => f.toLowerCase().includes(s));
    });
  }, [q, cat, sev]);

  return (
    <div className="p-6 space-y-4">
      <div className="rounded-lg border bg-card p-4 space-y-3">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by user, technician, device, hostname, IP, branch…" className="pl-8" />
          </div>
          <Button variant="outline" size="sm" className="gap-1"><Calendar className="h-3.5 w-3.5" />Last 24h</Button>
          <Button variant="outline" size="sm" className="gap-1"><Filter className="h-3.5 w-3.5" />Advanced</Button>
          <Button size="sm" className="gap-1"><Download className="h-3.5 w-3.5" />Export</Button>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-muted-foreground uppercase tracking-wider">Event Category:</span>
          {[
            { k: "all", l: "All" },
            { k: "auth", l: "Authentication" },
            { k: "session", l: "Remote Session" },
            { k: "file", l: "File Transfer" },
            { k: "command", l: "Command Execution" },
            { k: "config", l: "Configuration Change" },
            { k: "policy", l: "Policy Change" },
            { k: "agent", l: "Agent Activity" },
            { k: "admin", l: "Administrative" },
          ].map((c) => (
            <button
              key={c.k}
              onClick={() => setCat(c.k)}
              className={cn("text-xs px-2 py-1 rounded-md border transition-colors",
                cat === c.k ? "bg-primary text-primary-foreground border-primary" : "bg-background hover:bg-muted")}
            >
              {c.l}
            </button>
          ))}
          <span className="ml-auto text-xs text-muted-foreground">Severity:</span>
          <Select value={sev} onValueChange={setSev}>
            <SelectTrigger className="w-32 h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
              <SelectItem value="warning">Warning</SelectItem>
              <SelectItem value="info">Info</SelectItem>
              <SelectItem value="success">Success</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="rounded-lg border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-36">Timestamp</TableHead>
              <TableHead className="w-24">Event ID</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Device</TableHead>
              <TableHead>Branch</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Result</TableHead>
              <TableHead>Severity</TableHead>
              <TableHead className="w-16"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((e) => (
              <TableRow key={e.id} className="hover:bg-muted/50 cursor-pointer" onClick={() => setSelected(e)}>
                <TableCell className="text-xs tabular-nums text-muted-foreground">{fmtTime(e.ts)}</TableCell>
                <TableCell className="text-xs font-mono">{e.id}</TableCell>
                <TableCell className="text-sm">{e.user}</TableCell>
                <TableCell className="text-xs text-muted-foreground">{e.role}</TableCell>
                <TableCell className="text-xs font-mono">{e.device}</TableCell>
                <TableCell className="text-xs">{e.branch}</TableCell>
                <TableCell className="text-sm">{e.action}</TableCell>
                <TableCell><ResultPill r={e.result} /></TableCell>
                <TableCell><SeverityPill s={e.severity} /></TableCell>
                <TableCell><Button variant="ghost" size="icon" className="h-7 w-7"><Eye className="h-3.5 w-3.5" /></Button></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <div className="p-3 border-t flex items-center justify-between text-xs text-muted-foreground">
          <div>Showing {filtered.length} of {EVENTS.length} events</div>
          <div>Retention: 400 days · Sealed archive after 90 days</div>
        </div>
      </div>

      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <SheetContent side="right" className="w-[520px] sm:max-w-[520px]">
          {selected && (
            <>
              <SheetHeader>
                <SheetTitle>{selected.action}</SheetTitle>
                <SheetDescription>
                  <span className="font-mono">{selected.id}</span> · {fmtTime(selected.ts)}
                </SheetDescription>
              </SheetHeader>
              <div className="mt-4 space-y-4">
                <div className="flex items-center gap-2">
                  <SeverityPill s={selected.severity} />
                  <ResultPill r={selected.result} />
                  <Badge variant="outline" className="capitalize">{selected.category}</Badge>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><div className="text-xs text-muted-foreground">User</div><div>{selected.user}</div></div>
                  <div><div className="text-xs text-muted-foreground">Role</div><div>{selected.role}</div></div>
                  <div><div className="text-xs text-muted-foreground">Device</div><div className="font-mono">{selected.device}</div></div>
                  <div><div className="text-xs text-muted-foreground">Branch</div><div>{selected.branch}</div></div>
                  <div><div className="text-xs text-muted-foreground">Source IP</div><div className="font-mono">{selected.ip}</div></div>
                  <div><div className="text-xs text-muted-foreground">Session</div><div className="font-mono">SES-6042</div></div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Details</div>
                  <div className="text-sm p-3 rounded-md bg-muted/50 border">{selected.details}</div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" className="gap-1" onClick={() => { setSelected(null); onOpenSession("SES-6042"); }}><Fingerprint className="h-3.5 w-3.5" />Open Forensics</Button>
                  <Button size="sm" variant="outline" className="gap-1"><UsersIcon className="h-3.5 w-3.5" />Investigate User</Button>
                  <Button size="sm" variant="outline" className="gap-1"><MonitorSmartphone className="h-3.5 w-3.5" />Investigate Device</Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

// ─── Forensics ─────────────────────────────────────────────────────────

function Forensics({ sessionId }: { sessionId: string }) {
  const timeline = [
    { t: "09:01:04", label: "Authentication successful", kind: "success" as const },
    { t: "09:01:22", label: "MFA challenge passed (TOTP)", kind: "success" as const },
    { t: "09:02:11", label: "Screen viewing enabled", kind: "info" as const },
    { t: "09:05:47", label: "Keyboard control granted by remote user", kind: "info" as const },
    { t: "09:12:03", label: "Clipboard sharing enabled", kind: "info" as const },
    { t: "09:15:29", label: "PowerShell command executed: Get-Service", kind: "info" as const },
    { t: "09:18:41", label: "Privilege elevation to local admin", kind: "warning" as const },
    { t: "09:20:07", label: "File transfer blocked by DLP: budget-q3.xlsx", kind: "warning" as const },
    { t: "09:23:14", label: "Screenshot captured (evidence EVD-8799)", kind: "info" as const },
    { t: "09:25:52", label: "Session terminated by technician", kind: "success" as const },
  ];
  return (
    <div className="p-6 space-y-4">
      <div className="rounded-lg border bg-card p-4">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-xs text-muted-foreground uppercase tracking-wider">Session forensics</div>
            <div className="text-lg font-semibold">{sessionId} · NYC-FIN-WS01</div>
            <div className="text-xs text-muted-foreground mt-0.5">Sealed evidence · integrity verified</div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="gap-1"><Play className="h-3.5 w-3.5" />View Recording</Button>
            <Button size="sm" variant="outline" className="gap-1"><Download className="h-3.5 w-3.5" />Export Report</Button>
            <Button size="sm" variant="outline" className="gap-1"><UsersIcon className="h-3.5 w-3.5" />Investigate User</Button>
            <Button size="sm" variant="outline" className="gap-1"><MonitorSmartphone className="h-3.5 w-3.5" />Investigate Device</Button>
          </div>
        </div>
        <Separator className="my-4" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div><div className="text-xs text-muted-foreground">Technician</div><div>Alex Morgan (a.morgan)</div></div>
          <div><div className="text-xs text-muted-foreground">Target Device</div><div className="font-mono">NYC-FIN-WS01</div></div>
          <div><div className="text-xs text-muted-foreground">Start Time</div><div>2026-07-17 09:01:04</div></div>
          <div><div className="text-xs text-muted-foreground">End Time</div><div>2026-07-17 09:25:52</div></div>
          <div><div className="text-xs text-muted-foreground">Duration</div><div>00:24:48</div></div>
          <div><div className="text-xs text-muted-foreground">Location</div><div>New York HQ · Floor 14</div></div>
          <div><div className="text-xs text-muted-foreground">Approval Method</div><div>User approval + MFA</div></div>
          <div><div className="text-xs text-muted-foreground">Broker</div><div className="font-mono">RD-BR-14</div></div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 rounded-lg border bg-card">
          <div className="p-4 border-b flex items-center justify-between">
            <div className="text-sm font-semibold">Session Timeline</div>
            <Badge variant="outline" className="text-[10px]">Sealed · SHA-256 verified</Badge>
          </div>
          <div className="p-4">
            <ol className="relative border-l-2 border-border ml-3 space-y-4">
              {timeline.map((e, i) => (
                <li key={i} className="pl-4 relative">
                  <span className={cn("absolute -left-[9px] top-1 h-4 w-4 rounded-full ring-2 ring-background flex items-center justify-center",
                    e.kind === "success" ? "bg-emerald-500" : e.kind === "warning" ? "bg-amber-500" : "bg-sky-500")}>
                    {e.kind === "success" ? <CheckCircle2 className="h-3 w-3 text-white" /> : e.kind === "warning" ? <AlertTriangle className="h-2.5 w-2.5 text-white" /> : <Info className="h-2.5 w-2.5 text-white" />}
                  </span>
                  <div className="flex items-center justify-between">
                    <div className="text-sm">{e.label}</div>
                    <div className="text-xs text-muted-foreground tabular-nums">{e.t}</div>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
        <div className="rounded-lg border bg-card">
          <div className="p-4 border-b">
            <div className="text-sm font-semibold">Collected Evidence</div>
            <div className="text-xs text-muted-foreground">Chain-of-custody preserved</div>
          </div>
          <div className="divide-y">
            {EVIDENCE.slice(0, 3).map((ev) => (
              <div key={ev.id} className="p-3">
                <div className="flex items-center gap-2">
                  <Fingerprint className="h-4 w-4 text-primary" />
                  <div className="text-sm font-medium">{ev.id}</div>
                  <Badge variant="outline" className="ml-auto text-[10px] capitalize">{ev.kind}</Badge>
                </div>
                <div className="mt-1 text-xs text-muted-foreground">Hash <span className="font-mono">{ev.hash}</span> · {ev.sizeMb} MB</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── SIEM ──────────────────────────────────────────────────────────────

function SiemIntegration() {
  const [target, setTarget] = useState("splunk");
  const targets = [
    { k: "splunk", name: "Splunk Enterprise", desc: "HEC or TCP forwarders", status: "Connected" },
    { k: "sentinel", name: "Microsoft Sentinel", desc: "Log Analytics workspace (private endpoint)", status: "Not configured" },
    { k: "qradar", name: "IBM QRadar", desc: "LEEF over TCP/UDP", status: "Not configured" },
    { k: "elastic", name: "Elastic Security", desc: "Beats / Logstash forwarding", status: "Standby" },
    { k: "local", name: "Local SIEM Server", desc: "On-prem syslog collector", status: "Connected" },
  ];
  const active = targets.find((t) => t.k === target)!;
  return (
    <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div className="rounded-lg border bg-card">
        <div className="p-4 border-b">
          <div className="text-sm font-semibold">Supported SIEM Targets</div>
          <div className="text-xs text-muted-foreground">All connectors are private-WAN only</div>
        </div>
        <div className="divide-y">
          {targets.map((t) => (
            <button key={t.k} onClick={() => setTarget(t.k)}
              className={cn("w-full text-left p-3 flex items-start gap-3 hover:bg-muted/50 transition-colors",
                target === t.k && "bg-primary/5 border-l-2 border-primary")}>
              <Server className="h-4 w-4 mt-0.5 text-muted-foreground" />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium">{t.name}</div>
                <div className="text-xs text-muted-foreground">{t.desc}</div>
              </div>
              <Badge variant="outline" className={cn("text-[10px]",
                t.status === "Connected" ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30" :
                t.status === "Standby" ? "bg-sky-500/10 text-sky-600 border-sky-500/30" :
                "bg-muted text-muted-foreground")}>
                {t.status}
              </Badge>
            </button>
          ))}
        </div>
      </div>
      <div className="lg:col-span-2 space-y-4">
        <div className="rounded-lg border bg-card">
          <div className="p-4 border-b flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold">{active.name} · Configuration</div>
              <div className="text-xs text-muted-foreground">Encrypted forwarding over private WAN</div>
            </div>
            <Badge variant="outline" className="border-emerald-500/40 text-emerald-600 bg-emerald-500/10">Last sync 12s ago</Badge>
          </div>
          <div className="p-4 grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs">SIEM Server Address</Label>
              <Input defaultValue="siem-primary.corp.wan" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Port</Label>
              <Input defaultValue="6514" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Protocol</Label>
              <Select defaultValue="tcp">
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="tcp">TCP (TLS 1.3)</SelectItem>
                  <SelectItem value="udp">UDP</SelectItem>
                  <SelectItem value="https">HTTPS (mTLS)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Client Certificate</Label>
              <Input defaultValue="erap-forwarder.pem · valid 2027" readOnly />
            </div>
            <div className="col-span-2 space-y-2">
              <Label className="text-xs">Log Types</Label>
              <div className="grid grid-cols-2 gap-2">
                {["Authentication Events", "Remote Sessions", "Privilege Escalation", "File Transfers", "Policy Changes", "Failed Connections"].map((l) => (
                  <label key={l} className="flex items-center gap-2 rounded-md border p-2 bg-muted/30">
                    <Switch defaultChecked />
                    <span className="text-sm">{l}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
          <div className="p-4 border-t flex items-center gap-2">
            <Button size="sm" className="gap-1"><RefreshCw className="h-3.5 w-3.5" />Test Connection</Button>
            <Button size="sm" variant="outline">Save & Apply</Button>
            <div className="ml-auto text-xs text-muted-foreground">Buffered offline for up to 72 hours</div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Kpi label="Connection" value="Connected" Icon={CheckCircle2} tone="green" />
          <Kpi label="Events Sent (24h)" value="128,441" Icon={Upload} tone="sky" />
          <Kpi label="Failed Events" value="7" sub="Retry queue" Icon={AlertOctagon} tone="amber" />
          <Kpi label="Last Sync" value="12s ago" Icon={Clock} />
        </div>
      </div>
    </div>
  );
}

// ─── Live stream ───────────────────────────────────────────────────────

function LiveStream() {
  const [events, setEvents] = useState<{ id: number; ts: number; level: Severity; message: string; device: string; user: string }[]>(() => [
    { id: 1, ts: NOW, level: "warning", message: "Unauthorized remote access attempt detected", device: "FINANCE-PC-042", user: "Unknown Technician" },
    { id: 2, ts: NOW - 41_000, level: "info", message: "Agent heartbeat restored", device: "BRANCH-KLA-102", user: "svc-agent" },
    { id: 3, ts: NOW - 82_000, level: "info", message: "MFA challenge passed (TOTP)", device: "LON-FIN-LT02", user: "e.brown" },
    { id: 4, ts: NOW - 121_000, level: "critical", message: "Privilege escalation outside change window", device: "NYC-FIN-WS01", user: "a.morgan" },
  ]);
  const [filter, setFilter] = useState("all");
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const templates: { level: Severity; message: string; device: string; user: string }[] = [
      { level: "info", message: "Agent heartbeat OK", device: "SFO-DES-MB08", user: "svc-agent" },
      { level: "info", message: "Remote session started", device: "NYC-ENG-WS31", user: "r.silva" },
      { level: "warning", message: "Failed authentication (password mismatch)", device: "BRANCH-DXB-014", user: "unknown" },
      { level: "info", message: "File transfer completed", device: "LON-FIN-LT02", user: "s.patel" },
      { level: "critical", message: "Suspicious PowerShell execution flagged", device: "BER-HR-WS10", user: "y.tanaka" },
      { level: "warning", message: "Certificate expiring in 30 days", device: "BER-HR-WS10", user: "system" },
      { level: "info", message: "Policy update applied to 42 endpoints", device: "—", user: "a.morgan" },
    ];
    const t = setInterval(() => {
      const p = templates[Math.floor(Math.random() * templates.length)];
      setEvents((prev) => [{ id: prev[0].id + 1, ts: Date.now(), ...p }, ...prev].slice(0, 40));
    }, 2200);
    return () => clearInterval(t);
  }, [paused]);

  const filtered = events.filter((e) => {
    if (filter === "critical") return e.level === "critical";
    if (filter === "auth") return /auth|mfa|logon/i.test(e.message);
    if (filter === "remote") return /session|remote/i.test(e.message);
    if (filter === "malware") return /suspicious|malware/i.test(e.message);
    return true;
  });

  return (
    <div className="p-6 space-y-3">
      <div className="rounded-lg border bg-card p-3 flex items-center gap-2 flex-wrap">
        <span className="text-xs text-muted-foreground uppercase tracking-wider">Filter:</span>
        {[
          { k: "all", l: "All" },
          { k: "critical", l: "Critical Only" },
          { k: "auth", l: "Authentication" },
          { k: "remote", l: "Remote Access" },
          { k: "malware", l: "Suspicious Activity" },
        ].map((f) => (
          <button key={f.k} onClick={() => setFilter(f.k)}
            className={cn("text-xs px-2 py-1 rounded-md border",
              filter === f.k ? "bg-primary text-primary-foreground border-primary" : "hover:bg-muted")}>{f.l}</button>
        ))}
        <div className="ml-auto flex items-center gap-2">
          <Badge variant="outline" className={cn(paused ? "bg-muted" : "bg-emerald-500/10 text-emerald-600 border-emerald-500/30")}>
            <span className={cn("h-1.5 w-1.5 rounded-full mr-1.5", paused ? "bg-muted-foreground" : "bg-emerald-500 animate-pulse")} />
            {paused ? "Paused" : "Streaming"}
          </Badge>
          <Button size="sm" variant="outline" onClick={() => setPaused((p) => !p)}>{paused ? "Resume" : "Pause"}</Button>
        </div>
      </div>

      <div className="rounded-lg border bg-zinc-950 text-zinc-100 font-mono text-[12px] overflow-hidden">
        <div className="px-3 py-2 border-b border-zinc-800 flex items-center justify-between text-[10px] uppercase tracking-widest text-zinc-400">
          <span>SOC · Live Event Stream · Private WAN</span>
          <span>{filtered.length} events buffered</span>
        </div>
        <ScrollArea className="h-[560px]">
          <div className="divide-y divide-zinc-800/60">
            {filtered.map((e) => (
              <div key={e.id} className="px-3 py-2 grid grid-cols-[90px_90px_1fr_180px_140px] gap-3 items-center">
                <span className="text-zinc-500">[{fmtHm(e.ts)}]</span>
                <span className={cn("uppercase text-[10px] font-semibold px-1.5 py-0.5 rounded",
                  e.level === "critical" ? "bg-red-500/20 text-red-400" :
                  e.level === "warning" ? "bg-amber-500/20 text-amber-300" :
                  "bg-sky-500/20 text-sky-300")}>{e.level === "info" ? "INFO" : e.level.toUpperCase()}</span>
                <span className="text-zinc-100 truncate">{e.message}</span>
                <span className="text-zinc-400">device={e.device}</span>
                <span className="text-zinc-400">user={e.user}</span>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}

// ─── Reports ───────────────────────────────────────────────────────────

function Reports() {
  const cards = [
    { title: "Access Control Report", desc: "User permissions · Role assignments · Privileged accounts", Icon: KeyRound, last: "Yesterday · 06:00" },
    { title: "Remote Access Compliance", desc: "Session history · Approval records · Technician activity", Icon: Radio, last: "Today · 02:00" },
    { title: "Device Compliance", desc: "Agent versions · Security policies · Encryption status", Icon: MonitorSmartphone, last: "Today · 04:15" },
    { title: "Audit Retention", desc: "Storage usage · Retention policy · Archive status", Icon: Database, last: "Weekly" },
  ];
  return (
    <div className="p-6 space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {cards.map((c) => (
          <div key={c.title} className="rounded-lg border bg-card p-5">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-md bg-primary/10 text-primary flex items-center justify-center">
                <c.Icon className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <div className="font-semibold">{c.title}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{c.desc}</div>
                <div className="text-[11px] text-muted-foreground mt-2">Last generated: {c.last}</div>
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <Button size="sm" className="gap-1"><BarChart3 className="h-3.5 w-3.5" />Generate</Button>
              <Button size="sm" variant="outline" className="gap-1"><FileText className="h-3.5 w-3.5" />Export PDF</Button>
              <Button size="sm" variant="outline" className="gap-1"><Download className="h-3.5 w-3.5" />Export CSV</Button>
              <Button size="sm" variant="ghost" className="gap-1 ml-auto"><Calendar className="h-3.5 w-3.5" />Schedule</Button>
            </div>
          </div>
        ))}
      </div>
      <div className="rounded-lg border bg-card">
        <div className="p-4 border-b">
          <div className="text-sm font-semibold">Scheduled Reports</div>
          <div className="text-xs text-muted-foreground">Delivered to internal report share · never leaves the WAN</div>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Report</TableHead>
              <TableHead>Schedule</TableHead>
              <TableHead>Recipients</TableHead>
              <TableHead>Format</TableHead>
              <TableHead>Next Run</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[
              { r: "Remote Access Compliance", s: "Daily · 02:00", to: "compliance@corp.wan", f: "PDF", n: "Tomorrow 02:00", st: "Active" },
              { r: "Device Compliance", s: "Weekly · Mon 04:00", to: "endpoint-ops@corp.wan", f: "CSV", n: "Mon 04:00", st: "Active" },
              { r: "Access Control", s: "Monthly · 1st", to: "ciso@corp.wan", f: "PDF", n: "Aug 1 06:00", st: "Active" },
            ].map((row) => (
              <TableRow key={row.r}>
                <TableCell className="text-sm">{row.r}</TableCell>
                <TableCell className="text-xs">{row.s}</TableCell>
                <TableCell className="text-xs font-mono">{row.to}</TableCell>
                <TableCell className="text-xs">{row.f}</TableCell>
                <TableCell className="text-xs">{row.n}</TableCell>
                <TableCell><Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30 text-[10px]">{row.st}</Badge></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

// ─── User Activity ─────────────────────────────────────────────────────

function UserActivity() {
  return (
    <div className="p-6 grid grid-cols-1 xl:grid-cols-2 gap-4">
      {TECHNICIANS.map((t) => {
        const scoreMap: Record<string, string> = {
          low: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30",
          medium: "bg-amber-500/15 text-amber-600 border-amber-500/30",
          high: "bg-red-500/15 text-red-600 border-red-500/30",
        };
        return (
          <div key={t.handle} className="rounded-lg border bg-card p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-semibold">
                  {t.name.split(" ").map((n) => n[0]).join("")}
                </div>
                <div>
                  <div className="font-semibold text-sm">{t.name}</div>
                  <div className="text-xs text-muted-foreground">{t.role} · {t.dept}</div>
                </div>
              </div>
              <Badge variant="outline" className={cn("uppercase text-[10px]", scoreMap[t.score])}>Risk: {t.score}</Badge>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-3 text-center">
              <div className="rounded-md bg-muted/40 p-2">
                <div className="text-xs text-muted-foreground">Sessions</div>
                <div className="text-sm font-semibold tabular-nums">{t.sessions}</div>
              </div>
              <div className="rounded-md bg-muted/40 p-2">
                <div className="text-xs text-muted-foreground">Avg duration</div>
                <div className="text-sm font-semibold tabular-nums">{t.avgMin}m</div>
              </div>
              <div className="rounded-md bg-muted/40 p-2">
                <div className="text-xs text-muted-foreground">Last activity</div>
                <div className="text-sm font-semibold">{fmtHm(t.lastActivity)}</div>
              </div>
            </div>
            <Separator className="my-3" />
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <div className="text-muted-foreground mb-1">Behavior signals</div>
                <ul className="space-y-0.5">
                  <li>· Login frequency: normal</li>
                  <li>· Failed attempts: {t.score === "medium" ? "5" : "0"}</li>
                  <li>· After-hours activity: {t.score === "medium" ? "3" : "0"}</li>
                  <li>· Privileged ops: {t.role === "System Admin" ? "high" : "normal"}</li>
                </ul>
              </div>
              <div>
                <div className="text-muted-foreground mb-1">Analyst notes</div>
                <ul className="space-y-0.5">
                  {t.notes.map((n) => <li key={n}>· {n}</li>)}
                </ul>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Device security ───────────────────────────────────────────────────

function DeviceSecurity() {
  return (
    <div className="p-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {DEVICES.map((d) => {
        const okAgent = d.agent === "healthy";
        const okVer = d.ver === "4.2.1";
        const okCert = !d.cert.includes("Expiring");
        const complianceMap: Record<string, string> = {
          compliant: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30",
          "at-risk": "bg-amber-500/15 text-amber-600 border-amber-500/30",
          "non-compliant": "bg-red-500/15 text-red-600 border-red-500/30",
        };
        const check = (ok: boolean, label: string) => (
          <div className="flex items-center gap-1.5 text-xs">
            {ok ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> : <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />}
            <span className={ok ? "" : "text-amber-600"}>{label}</span>
          </div>
        );
        return (
          <div key={d.name} className="rounded-lg border bg-card p-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="font-mono text-sm font-semibold">{d.name}</div>
                <div className="text-xs text-muted-foreground">{d.branch}</div>
              </div>
              <Badge variant="outline" className={cn("text-[10px] capitalize", complianceMap[d.compliance])}>{d.compliance}</Badge>
            </div>
            <Separator className="my-3" />
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div><div className="text-muted-foreground">Agent</div><div className="capitalize">{d.agent}</div></div>
              <div><div className="text-muted-foreground">Version</div><div className="font-mono">{d.ver}</div></div>
              <div><div className="text-muted-foreground">Encryption</div><div>{d.enc}</div></div>
              <div><div className="text-muted-foreground">Certificate</div><div>{d.cert}</div></div>
              <div className="col-span-2"><div className="text-muted-foreground">Last connection</div><div>{fmtTime(d.last)}</div></div>
            </div>
            <Separator className="my-3" />
            <div className="grid grid-cols-2 gap-1.5">
              {check(okAgent, "Agent installed")}
              {check(okVer, "Latest version")}
              {check(okCert, "Valid certificate")}
              {check(true, "Policy applied")}
              {check(d.agent !== "offline", "No suspicious activity")}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Alerts ────────────────────────────────────────────────────────────

function AlertsPanel() {
  const [selected, setSelected] = useState<AlertRecord | null>(null);
  const stages: AlertState[] = ["new", "assigned", "investigating", "resolved", "closed"];
  return (
    <div className="p-6 space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {[
          { t: "Critical", desc: "Unauthorized access · Privilege escalation · Disabled controls", cls: "border-red-500/40 bg-red-500/5", n: ALERTS.filter((a) => a.severity === "critical").length, Icon: AlertOctagon, color: "text-red-600" },
          { t: "Warning", desc: "Outdated agents · Failed auth · Policy violations", cls: "border-amber-500/40 bg-amber-500/5", n: ALERTS.filter((a) => a.severity === "warning").length, Icon: AlertTriangle, color: "text-amber-600" },
          { t: "Information", desc: "Agent updates completed · Successful maintenance", cls: "border-sky-500/40 bg-sky-500/5", n: ALERTS.filter((a) => a.severity === "info").length, Icon: Info, color: "text-sky-600" },
        ].map((c) => (
          <div key={c.t} className={cn("rounded-lg border p-4", c.cls)}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <c.Icon className={cn("h-5 w-5", c.color)} />
                <div className="font-semibold">{c.t}</div>
              </div>
              <div className={cn("text-2xl font-semibold tabular-nums", c.color)}>{c.n}</div>
            </div>
            <div className="text-xs text-muted-foreground mt-1">{c.desc}</div>
          </div>
        ))}
      </div>

      <div className="rounded-lg border bg-card">
        <div className="p-4 border-b flex items-center justify-between">
          <div className="text-sm font-semibold">Alert Queue</div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" className="gap-1"><Filter className="h-3.5 w-3.5" />Filter</Button>
            <Button size="sm" className="gap-1"><Bell className="h-3.5 w-3.5" />Create Alert</Button>
          </div>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-24">ID</TableHead>
              <TableHead className="w-32">Severity</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Analyst</TableHead>
              <TableHead>State</TableHead>
              <TableHead className="w-32">Opened</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ALERTS.map((a) => (
              <TableRow key={a.id} className="hover:bg-muted/50 cursor-pointer" onClick={() => setSelected(a)}>
                <TableCell className="font-mono text-xs">{a.id}</TableCell>
                <TableCell><SeverityPill s={a.severity} /></TableCell>
                <TableCell className="text-sm">{a.title}</TableCell>
                <TableCell className="text-xs">{a.source}</TableCell>
                <TableCell className="text-xs">{a.analyst ?? <span className="text-muted-foreground italic">Unassigned</span>}</TableCell>
                <TableCell><Badge variant="outline" className="capitalize text-[10px]">{a.state}</Badge></TableCell>
                <TableCell className="text-xs text-muted-foreground">{fmtTime(a.ts)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-2xl">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <SeverityPill s={selected.severity} />
                  {selected.title}
                </DialogTitle>
                <DialogDescription>{selected.id} · {selected.source} · Opened {fmtTime(selected.ts)}</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Workflow</div>
                  <div className="flex items-center gap-1">
                    {stages.map((st, i) => {
                      const currentIdx = stages.indexOf(selected.state);
                      const done = i <= currentIdx;
                      return (
                        <div key={st} className="flex items-center flex-1">
                          <div className={cn("h-7 w-7 rounded-full flex items-center justify-center text-[11px] font-semibold",
                            done ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>
                            {i + 1}
                          </div>
                          {i < stages.length - 1 && <div className={cn("h-0.5 flex-1", done && i < currentIdx ? "bg-primary" : "bg-muted")} />}
                        </div>
                      );
                    })}
                  </div>
                  <div className="grid grid-cols-5 gap-1 mt-1 text-[10px] text-muted-foreground capitalize">
                    {stages.map((s) => <div key={s} className="text-center">{s}</div>)}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><div className="text-xs text-muted-foreground">Category</div>{selected.category}</div>
                  <div><div className="text-xs text-muted-foreground">Analyst</div>{selected.analyst ?? "Unassigned"}</div>
                </div>
                <div className="p-3 rounded-md border bg-muted/40 text-sm">
                  Recommended action: correlate with related audit events, verify source device, and confirm approval trail.
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" size="sm">Assign to me</Button>
                <Button size="sm">Advance stage</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Evidence ──────────────────────────────────────────────────────────

function EvidenceRepository() {
  const [selected, setSelected] = useState<Evidence | null>(null);
  return (
    <div className="p-6 space-y-4">
      <div className="rounded-lg border bg-card">
        <div className="p-4 border-b flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold">Digital Evidence Repository</div>
            <div className="text-xs text-muted-foreground">Sealed on WORM storage · SHA-256 integrity</div>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" className="gap-1"><Upload className="h-3.5 w-3.5" />Ingest</Button>
            <Button size="sm" className="gap-1"><Download className="h-3.5 w-3.5" />Export</Button>
          </div>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Evidence ID</TableHead>
              <TableHead>Session</TableHead>
              <TableHead>Kind</TableHead>
              <TableHead>Collected By</TableHead>
              <TableHead>Collected</TableHead>
              <TableHead>Size</TableHead>
              <TableHead>Integrity Hash</TableHead>
              <TableHead className="w-24">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {EVIDENCE.map((e) => (
              <TableRow key={e.id}>
                <TableCell className="font-mono text-xs">{e.id}</TableCell>
                <TableCell className="font-mono text-xs">{e.sessionId}</TableCell>
                <TableCell><Badge variant="outline" className="capitalize text-[10px]">{e.kind}</Badge></TableCell>
                <TableCell className="text-xs">{e.collectedBy}</TableCell>
                <TableCell className="text-xs">{fmtTime(e.collectedAt)}</TableCell>
                <TableCell className="text-xs tabular-nums">{e.sizeMb} MB</TableCell>
                <TableCell className="font-mono text-xs">{e.hash}</TableCell>
                <TableCell>
                  <Button size="sm" variant="ghost" className="h-7" onClick={() => setSelected(e)}>Open</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <SheetContent side="right" className="w-[520px] sm:max-w-[520px]">
          {selected && (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2"><Fingerprint className="h-4 w-4" />{selected.id}</SheetTitle>
                <SheetDescription>Related session <span className="font-mono">{selected.sessionId}</span></SheetDescription>
              </SheetHeader>
              <div className="mt-4 space-y-4">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><div className="text-xs text-muted-foreground">Kind</div><div className="capitalize">{selected.kind}</div></div>
                  <div><div className="text-xs text-muted-foreground">Size</div><div>{selected.sizeMb} MB</div></div>
                  <div><div className="text-xs text-muted-foreground">Collected by</div><div>{selected.collectedBy}</div></div>
                  <div><div className="text-xs text-muted-foreground">Collected at</div><div>{fmtTime(selected.collectedAt)}</div></div>
                  <div className="col-span-2"><div className="text-xs text-muted-foreground">Integrity hash</div><div className="font-mono text-xs">sha256:{selected.hash}0000000000000000000000000000000000</div></div>
                </div>
                <div>
                  <div className="text-xs uppercase text-muted-foreground mb-2">Chain of custody</div>
                  <ol className="relative border-l-2 border-border ml-3 space-y-3">
                    {selected.chain.map((c, i) => (
                      <li key={i} className="pl-4 relative">
                        <span className="absolute -left-[7px] top-1.5 h-3 w-3 rounded-full bg-primary ring-2 ring-background" />
                        <div className="text-sm">{c.action} by <span className="font-medium">{c.by}</span></div>
                        <div className="text-[11px] text-muted-foreground">{fmtTime(c.at)}</div>
                      </li>
                    ))}
                  </ol>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" className="gap-1"><Eye className="h-3.5 w-3.5" />View</Button>
                  <Button size="sm" variant="outline" className="gap-1"><Download className="h-3.5 w-3.5" />Export</Button>
                  <Button size="sm" variant="outline" className="gap-1"><ShieldCheck className="h-3.5 w-3.5" />Verify Integrity</Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

// ─── Main ──────────────────────────────────────────────────────────────

export function SecurityCenter() {
  const [tab, setTab] = useState<string>("dashboard");
  const [forensicSession, setForensicSession] = useState<string>("SES-6042");

  const openSession = (id: string) => {
    setForensicSession(id);
    setTab("forensics");
  };

  return (
    <div className="min-h-screen flex bg-background">
      <SecuritySidebar active="sec-dashboard" />
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar tab={tab} setTab={setTab} />
        <div className="flex-1 min-w-0">
          {tab === "dashboard" && <Dashboard />}
          {tab === "explorer" && <EventExplorer onOpenSession={openSession} />}
          {tab === "forensics" && <Forensics sessionId={forensicSession} />}
          {tab === "stream" && <LiveStream />}
          {tab === "siem" && <SiemIntegration />}
          {tab === "reports" && <Reports />}
          {tab === "users" && <UserActivity />}
          {tab === "devices" && <DeviceSecurity />}
          {tab === "alerts" && <AlertsPanel />}
          {tab === "evidence" && <EvidenceRepository />}
        </div>
      </div>
    </div>
  );
}