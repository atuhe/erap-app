import { useMemo, useState } from "react";
import {
  Search,
  Radio,
  CalendarClock,
  ShieldCheck,
  X,
  Video,
  Mic,
  MicOff,
  VideoOff,
  MousePointer2,
  Keyboard,
  Files,
  Camera,
  StopCircle,
  UserPlus,
  MessageSquare,
  Lock,
  Unlock,
  Ban,
  Check,
  AlertTriangle,
  Circle,
  Send,
  ArrowRight,
  Play,
  Pause,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
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
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { AppShell } from "@/components/app-shell/AppShell";

type Role = "admin" | "operator" | "viewer";
type SessionState = "active" | "pending" | "scheduled" | "completed" | "terminated";

interface Session {
  id: string;
  deviceId: string;
  hostname: string;
  endUser: string;
  operator: string;
  branch: string;
  department: string;
  reason: string;
  state: SessionState;
  startedAt: string;
  duration: string;
  quality: "excellent" | "good" | "poor";
  encryption: "AES-256";
  recording: boolean;
  approver?: string;
  approvalRequired?: boolean;
  scheduledFor?: string;
}

const SESSIONS: Session[] = [
  { id: "SES-88214", deviceId: "DEV-10241", hostname: "NYC-FIN-WS01", endUser: "a.morgan", operator: "j.hart", branch: "New York", department: "Finance", reason: "Excel add-in failure", state: "active", startedAt: "14:22", duration: "00:12:47", quality: "excellent", encryption: "AES-256", recording: true },
  { id: "SES-88215", deviceId: "DEV-10246", hostname: "NYC-ENG-WS31", endUser: "r.silva", operator: "d.owens", branch: "New York", department: "Engineering", reason: "VS Code debugger crash", state: "active", startedAt: "14:05", duration: "00:29:11", quality: "good", encryption: "AES-256", recording: true },
  { id: "SES-88216", deviceId: "DEV-10242", hostname: "LON-HR-LT14", endUser: "s.patel", operator: "j.hart", branch: "London", department: "HR", reason: "Password reset assistance", state: "active", startedAt: "14:31", duration: "00:03:22", quality: "excellent", encryption: "AES-256", recording: false },
  { id: "SES-88220", deviceId: "DEV-10249", hostname: "SFO-OPS-WS17", endUser: "l.chen", operator: "j.hart", branch: "San Francisco", department: "Operations", reason: "Elevated: install SCCM package", state: "pending", startedAt: "—", duration: "—", quality: "excellent", encryption: "AES-256", recording: true, approver: "n.rossi", approvalRequired: true },
  { id: "SES-88221", deviceId: "DEV-10247", hostname: "LON-FIN-LT02", endUser: "e.brown", operator: "d.owens", branch: "London", department: "Finance", reason: "Access GL server via device", state: "pending", startedAt: "—", duration: "—", quality: "excellent", encryption: "AES-256", recording: true, approver: "n.rossi", approvalRequired: true },
  { id: "SES-88230", deviceId: "DEV-10250", hostname: "TOK-DES-MB03", endUser: "h.sato", operator: "k.wells", branch: "Tokyo", department: "Design", reason: "Scheduled OS patch validation", state: "scheduled", startedAt: "—", duration: "—", quality: "excellent", encryption: "AES-256", recording: true, scheduledFor: "Today · 18:00 JST" },
  { id: "SES-88231", deviceId: "DEV-10245", hostname: "TOK-OPS-WS05", endUser: "y.tanaka", operator: "k.wells", branch: "Tokyo", department: "Operations", reason: "After-hours reboot window", state: "scheduled", startedAt: "—", duration: "—", quality: "excellent", encryption: "AES-256", recording: true, scheduledFor: "Tomorrow · 02:00 JST" },
  { id: "SES-88190", deviceId: "DEV-10244", hostname: "SFO-DES-MB08", endUser: "j.nguyen", operator: "j.hart", branch: "San Francisco", department: "Design", reason: "Figma plugin reinstall", state: "completed", startedAt: "12:04", duration: "00:18:03", quality: "good", encryption: "AES-256", recording: true },
  { id: "SES-88188", deviceId: "DEV-10243", hostname: "BER-ENG-WS22", endUser: "m.klein", operator: "d.owens", branch: "Berlin", department: "Engineering", reason: "Driver rollback", state: "completed", startedAt: "10:41", duration: "00:41:28", quality: "poor", encryption: "AES-256", recording: true },
  { id: "SES-88180", deviceId: "DEV-10248", hostname: "BER-HR-WS10", endUser: "k.mueller", operator: "j.hart", branch: "Berlin", department: "HR", reason: "Unauthorized file transfer attempt", state: "terminated", startedAt: "09:12", duration: "00:02:14", quality: "excellent", encryption: "AES-256", recording: true },
];

export function SessionManagement() {
  const [role, setRole] = useState<Role>("admin");
  const [q, setQ] = useState("");
  const [tab, setTab] = useState<SessionState | "all">("active");
  const [selectedId, setSelectedId] = useState<string | null>(SESSIONS[0].id);
  const [consoleOpen, setConsoleOpen] = useState(false);
  const [requestOpen, setRequestOpen] = useState(false);

  const counts = useMemo(() => ({
    active: SESSIONS.filter((s) => s.state === "active").length,
    pending: SESSIONS.filter((s) => s.state === "pending").length,
    scheduled: SESSIONS.filter((s) => s.state === "scheduled").length,
    completed: SESSIONS.filter((s) => s.state === "completed" || s.state === "terminated").length,
  }), []);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return SESSIONS.filter((s) => {
      if (tab === "active" && s.state !== "active") return false;
      if (tab === "pending" && s.state !== "pending") return false;
      if (tab === "scheduled" && s.state !== "scheduled") return false;
      if (tab === "completed" && s.state !== "completed" && s.state !== "terminated") return false;
      if (!term) return true;
      return (
        s.id.toLowerCase().includes(term) ||
        s.hostname.toLowerCase().includes(term) ||
        s.endUser.toLowerCase().includes(term) ||
        s.operator.toLowerCase().includes(term)
      );
    });
  }, [q, tab]);

  const selected = SESSIONS.find((s) => s.id === selectedId) ?? null;

  const can = {
    join: role === "admin" || role === "operator",
    approve: role === "admin",
    terminate: role === "admin",
    schedule: role === "admin" || role === "operator",
    audit: true,
  };

  return (
    <AppShell
      title="Sessions"
      subtitle="Live remote support, approvals, and audit"
      headerRight={
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search Session ID, Hostname, End User, or Operator…"
            className="h-9 pl-9"
          />
        </div>
      }
    >
      <section className="flex min-w-0 flex-1 flex-col">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-2 border-b bg-card px-4 py-3">
          <Select value={role} onValueChange={(v) => setRole(v as Role)}>
            <SelectTrigger className="h-9 w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="admin">Role: Admin</SelectItem>
              <SelectItem value="operator">Role: Operator</SelectItem>
              <SelectItem value="viewer">Role: Viewer</SelectItem>
            </SelectContent>
          </Select>
          <StatChip label="Active" value={counts.active} tone="green" />
          <StatChip label="Awaiting approval" value={counts.pending} tone="amber" />
          <StatChip label="Scheduled" value={counts.scheduled} tone="blue" />
          <StatChip label="Completed today" value={counts.completed} tone="muted" />
          <div className="ml-auto flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => toast("Opening audit export…")}>
              <ShieldCheck className="mr-2 h-4 w-4" /> Export audit
            </Button>
            <Button
              size="sm"
              disabled={!can.schedule}
              onClick={() => setRequestOpen(true)}
            >
              <Radio className="mr-2 h-4 w-4" /> New session
            </Button>
          </div>
        </div>

        {/* Body */}
        <div className="flex min-h-0 flex-1">
          <div className="flex min-w-0 flex-1 flex-col">
            <Tabs
              value={tab}
              onValueChange={(v) => setTab(v as typeof tab)}
              className="flex min-h-0 flex-1 flex-col"
            >
              <div className="border-b bg-card px-4">
                <TabsList className="h-11 bg-transparent p-0">
                  <TabsTrigger value="active" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-11">
                    Active <Badge variant="secondary" className="ml-2">{counts.active}</Badge>
                  </TabsTrigger>
                  <TabsTrigger value="pending" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-11">
                    Pending approval <Badge variant="secondary" className="ml-2">{counts.pending}</Badge>
                  </TabsTrigger>
                  <TabsTrigger value="scheduled" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-11">
                    Scheduled <Badge variant="secondary" className="ml-2">{counts.scheduled}</Badge>
                  </TabsTrigger>
                  <TabsTrigger value="completed" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-11">
                    Recent
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value={tab} className="mt-0 min-h-0 flex-1 data-[state=inactive]:hidden">
                <ScrollArea className="h-full">
                  <div className="p-4">
                    <div className="overflow-hidden rounded-lg border bg-card">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted/40">
                            <TableHead className="w-[130px]">Session ID</TableHead>
                            <TableHead>Device / Hostname</TableHead>
                            <TableHead>End User</TableHead>
                            <TableHead>Operator</TableHead>
                            <TableHead>Branch</TableHead>
                            <TableHead>Reason</TableHead>
                            <TableHead>{tab === "scheduled" ? "Scheduled" : "Started"}</TableHead>
                            <TableHead>{tab === "active" ? "Duration" : "Status"}</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filtered.map((s) => (
                            <TableRow
                              key={s.id}
                              data-state={selectedId === s.id ? "selected" : undefined}
                              className="cursor-pointer"
                              onClick={() => setSelectedId(s.id)}
                            >
                              <TableCell className="font-mono text-xs">{s.id}</TableCell>
                              <TableCell>
                                <div className="font-medium">{s.hostname}</div>
                                <div className="font-mono text-[11px] text-muted-foreground">{s.deviceId}</div>
                              </TableCell>
                              <TableCell className="text-muted-foreground">{s.endUser}</TableCell>
                              <TableCell className="text-muted-foreground">{s.operator}</TableCell>
                              <TableCell>{s.branch}</TableCell>
                              <TableCell className="max-w-[220px] truncate" title={s.reason}>{s.reason}</TableCell>
                              <TableCell className="text-muted-foreground">
                                {s.state === "scheduled" ? s.scheduledFor : s.startedAt}
                              </TableCell>
                              <TableCell>
                                {s.state === "active" ? (
                                  <span className="flex items-center gap-2 text-xs">
                                    <LiveDot /> {s.duration}
                                  </span>
                                ) : (
                                  <SessionStatePill state={s.state} />
                                )}
                              </TableCell>
                              <TableCell className="text-right">
                                <RowActions
                                  session={s}
                                  can={can}
                                  onJoin={() => {
                                    setSelectedId(s.id);
                                    setConsoleOpen(true);
                                  }}
                                  onApprove={() => toast.success(`Approved ${s.id}`)}
                                  onDeny={() => toast.error(`Denied ${s.id}`)}
                                  onTerminate={() => toast.error(`Session ${s.id} terminated`)}
                                />
                              </TableCell>
                            </TableRow>
                          ))}
                          {filtered.length === 0 && (
                            <TableRow>
                              <TableCell colSpan={9} className="h-32 text-center text-sm text-muted-foreground">
                                No sessions match this view.
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </div>

          {/* Details panel */}
          {selected && (
            <aside className="hidden w-[400px] shrink-0 border-l bg-card lg:flex lg:flex-col">
              <div className="flex items-start justify-between border-b p-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    {selected.state === "active" ? <LiveDot /> : <SessionStatePill state={selected.state} />}
                    <span className="font-mono text-[11px] text-muted-foreground">{selected.id}</span>
                  </div>
                  <h2 className="mt-1 truncate text-base font-semibold">{selected.hostname}</h2>
                  <p className="text-xs text-muted-foreground">{selected.reason}</p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setSelectedId(null)} aria-label="Close">
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-2 p-4">
                {selected.state === "active" && (
                  <>
                    <Button
                      className="col-span-2"
                      disabled={!can.join}
                      onClick={() => setConsoleOpen(true)}
                    >
                      <Radio className="mr-2 h-4 w-4" /> Join session
                    </Button>
                    <Button
                      variant="destructive"
                      className="col-span-2"
                      disabled={!can.terminate}
                      onClick={() => toast.error(`Session ${selected.id} terminated`)}
                    >
                      <StopCircle className="mr-2 h-4 w-4" /> Terminate
                    </Button>
                  </>
                )}
                {selected.state === "pending" && (
                  <>
                    <Button
                      disabled={!can.approve}
                      onClick={() => toast.success(`Approved ${selected.id}`)}
                    >
                      <Check className="mr-2 h-4 w-4" /> Approve
                    </Button>
                    <Button
                      variant="outline"
                      disabled={!can.approve}
                      onClick={() => toast.error(`Denied ${selected.id}`)}
                    >
                      <Ban className="mr-2 h-4 w-4" /> Deny
                    </Button>
                  </>
                )}
                {selected.state === "scheduled" && (
                  <>
                    <Button onClick={() => toast("Starting session early…")}>
                      <Play className="mr-2 h-4 w-4" /> Start now
                    </Button>
                    <Button variant="outline" onClick={() => toast("Rescheduled")}>
                      <CalendarClock className="mr-2 h-4 w-4" /> Reschedule
                    </Button>
                  </>
                )}
                {(selected.state === "completed" || selected.state === "terminated") && (
                  <>
                    <Button className="col-span-2" onClick={() => toast("Opening recording…")}>
                      <Video className="mr-2 h-4 w-4" /> View recording
                    </Button>
                    <Button variant="outline" className="col-span-2" onClick={() => toast("Downloading audit bundle…")}>
                      <ShieldCheck className="mr-2 h-4 w-4" /> Download audit
                    </Button>
                  </>
                )}
              </div>

              <Separator />

              <ScrollArea className="flex-1">
                <div className="space-y-6 p-4">
                  <div>
                    <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Participants
                    </h3>
                    <div className="space-y-2">
                      <Participant name={selected.operator} role="Operator" />
                      <Participant name={selected.endUser} role="End user (attended)" />
                      {selected.approver && (
                        <Participant name={selected.approver} role="Approver" />
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Session details
                    </h3>
                    <dl className="divide-y">
                      <Detail label="Session ID" value={selected.id} mono />
                      <Detail label="Device ID" value={selected.deviceId} mono />
                      <Detail label="Hostname" value={selected.hostname} />
                      <Detail label="Branch" value={selected.branch} />
                      <Detail label="Department" value={selected.department} />
                      <Detail label="Reason" value={selected.reason} />
                      <Detail label="Transport" value="RustDesk relay (WAN-only)" />
                      <Detail label="Encryption" value={selected.encryption} mono />
                      <Detail label="Recording" value={selected.recording ? "On (retained 90 d)" : "Off"} />
                      <Detail label="Quality" value={<QualityPill q={selected.quality} />} />
                      <Detail label={selected.state === "scheduled" ? "Scheduled for" : "Started"} value={selected.state === "scheduled" ? selected.scheduledFor ?? "—" : selected.startedAt} />
                      <Detail label="Duration" value={selected.duration} mono />
                    </dl>
                  </div>

                  <div>
                    <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Audit trail
                    </h3>
                    <AuditTrail session={selected} />
                  </div>
                </div>
              </ScrollArea>
            </aside>
          )}
        </div>
      </section>

      {selected && (
        <SessionConsoleDialog
          open={consoleOpen}
          onOpenChange={setConsoleOpen}
          session={selected}
          role={role}
        />
      )}
      <NewSessionDialog open={requestOpen} onOpenChange={setRequestOpen} />
    </AppShell>
  );
}

function LiveDot() {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:text-emerald-400">
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
      </span>
      LIVE
    </span>
  );
}

function StatChip({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "green" | "amber" | "blue" | "muted";
}) {
  const toneClasses = {
    green: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
    amber: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
    blue: "bg-primary/10 text-primary",
    muted: "bg-muted text-muted-foreground",
  } as const;
  return (
    <div className="flex items-center gap-2 rounded-md border bg-background px-2.5 py-1.5 text-xs">
      <span className={cn("grid h-5 min-w-5 place-items-center rounded px-1.5 font-semibold", toneClasses[tone])}>
        {value}
      </span>
      <span className="text-muted-foreground">{label}</span>
    </div>
  );
}

function SessionStatePill({ state }: { state: SessionState }) {
  const map: Record<SessionState, { label: string; cls: string }> = {
    active: { label: "Active", cls: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" },
    pending: { label: "Awaiting approval", cls: "bg-amber-500/10 text-amber-700 dark:text-amber-400" },
    scheduled: { label: "Scheduled", cls: "bg-primary/10 text-primary" },
    completed: { label: "Completed", cls: "bg-muted text-muted-foreground" },
    terminated: { label: "Terminated", cls: "bg-red-500/10 text-red-700 dark:text-red-400" },
  };
  const m = map[state];
  return (
    <Badge variant="outline" className={cn("gap-1.5 border-transparent font-medium", m.cls)}>
      <Circle className="h-2 w-2 fill-current" /> {m.label}
    </Badge>
  );
}

function QualityPill({ q }: { q: Session["quality"] }) {
  const map = {
    excellent: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
    good: "bg-primary/10 text-primary",
    poor: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
  } as const;
  return (
    <Badge variant="outline" className={cn("border-transparent capitalize", map[q])}>
      {q}
    </Badge>
  );
}

function Participant({ name, role }: { name: string; role: string }) {
  const initials = name.split(/[.\s]/).map((p) => p[0]?.toUpperCase() ?? "").slice(0, 2).join("");
  return (
    <div className="flex items-center gap-3 rounded-md border bg-background p-2.5">
      <div className="grid h-8 w-8 place-items-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
        {initials}
      </div>
      <div className="min-w-0">
        <div className="truncate text-sm font-medium">{name}</div>
        <div className="text-[11px] text-muted-foreground">{role}</div>
      </div>
    </div>
  );
}

function Detail({ label, value, mono }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5 text-sm">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className={cn("text-right", mono && "font-mono text-xs")}>{value}</dd>
    </div>
  );
}

function AuditTrail({ session }: { session: Session }) {
  const events = buildAudit(session);
  return (
    <ol className="relative space-y-3 border-l pl-4">
      {events.map((e, i) => (
        <li key={i} className="relative">
          <span
            className={cn(
              "absolute -left-[21px] top-1.5 grid h-3.5 w-3.5 place-items-center rounded-full border-2 border-background",
              e.tone === "danger" && "bg-red-500",
              e.tone === "warn" && "bg-amber-500",
              e.tone === "info" && "bg-primary",
              e.tone === "ok" && "bg-emerald-500",
            )}
          />
          <div className="flex items-center gap-2 text-xs">
            <span className="font-mono text-muted-foreground">{e.time}</span>
            <span className="font-medium">{e.title}</span>
          </div>
          <div className="text-[11px] text-muted-foreground">{e.detail}</div>
        </li>
      ))}
    </ol>
  );
}

function buildAudit(s: Session): { time: string; title: string; detail: string; tone: "info" | "ok" | "warn" | "danger" }[] {
  if (s.state === "pending") {
    return [
      { time: "14:31", title: "Elevated access requested", detail: `${s.operator} → ${s.hostname} · ${s.reason}`, tone: "warn" },
      { time: "14:31", title: "Approver notified", detail: `${s.approver} (SecOps duty rotation)`, tone: "info" },
    ];
  }
  if (s.state === "scheduled") {
    return [
      { time: "13:02", title: "Session scheduled", detail: `${s.scheduledFor}`, tone: "info" },
      { time: "13:02", title: "End user notified", detail: `${s.endUser} accepted maintenance window`, tone: "ok" },
    ];
  }
  if (s.state === "terminated") {
    return [
      { time: "09:12", title: "Session started", detail: `Operator ${s.operator} connected`, tone: "info" },
      { time: "09:14", title: "Policy violation", detail: "Attempted file transfer of restricted extension (.pst)", tone: "danger" },
      { time: "09:14", title: "Session terminated", detail: "Auto-terminated by DLP policy · notification sent to SOC", tone: "danger" },
    ];
  }
  if (s.state === "completed") {
    return [
      { time: s.startedAt, title: "Session started", detail: `Operator ${s.operator} connected`, tone: "info" },
      { time: "…", title: "Elevation used", detail: "UAC prompt approved by end user", tone: "warn" },
      { time: "…", title: "Session ended", detail: `Duration ${s.duration} · recording archived`, tone: "ok" },
    ];
  }
  return [
    { time: s.startedAt, title: "Consent granted", detail: `${s.endUser} accepted on-device prompt`, tone: "ok" },
    { time: s.startedAt, title: "Session started", detail: `Operator ${s.operator} · AES-256 · RustDesk relay`, tone: "info" },
    { time: "+02:11", title: "Clipboard sync enabled", detail: "Operator ↔ end user (text only, DLP scanned)", tone: "info" },
    { time: "+05:40", title: "Recording checkpoint", detail: "Segment sealed · SHA-256 written to ledger", tone: "ok" },
  ];
}

function RowActions({
  session,
  can,
  onJoin,
  onApprove,
  onDeny,
  onTerminate,
}: {
  session: Session;
  can: { join: boolean; approve: boolean; terminate: boolean };
  onJoin: () => void;
  onApprove: () => void;
  onDeny: () => void;
  onTerminate: () => void;
}) {
  if (session.state === "active") {
    return (
      <div className="flex justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
        <Button size="sm" disabled={!can.join} onClick={onJoin}>
          Join
        </Button>
        <Button size="sm" variant="outline" disabled={!can.terminate} onClick={onTerminate}>
          End
        </Button>
      </div>
    );
  }
  if (session.state === "pending") {
    return (
      <div className="flex justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
        <Button size="sm" disabled={!can.approve} onClick={onApprove}>
          <Check className="mr-1 h-3.5 w-3.5" /> Approve
        </Button>
        <Button size="sm" variant="outline" disabled={!can.approve} onClick={onDeny}>
          Deny
        </Button>
      </div>
    );
  }
  if (session.state === "scheduled") {
    return (
      <div className="flex justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
        <Button size="sm" variant="outline" onClick={onJoin}>
          <Play className="mr-1 h-3.5 w-3.5" /> Start
        </Button>
      </div>
    );
  }
  return (
    <div className="flex justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
      <Button size="sm" variant="outline" onClick={onJoin}>
        <Video className="mr-1 h-3.5 w-3.5" /> Replay
      </Button>
    </div>
  );
}

function SessionConsoleDialog({
  open,
  onOpenChange,
  session,
  role,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  session: Session;
  role: Role;
}) {
  const [micOn, setMicOn] = useState(false);
  const [camOn, setCamOn] = useState(false);
  const [locked, setLocked] = useState(false);
  const [recording, setRecording] = useState(session.recording);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<{ from: string; text: string; at: string }[]>([
    { from: session.endUser, text: "Hi — my app keeps freezing when I open the ledger.", at: "14:22" },
    { from: session.operator, text: "Thanks, I'll take a look. Consent prompt sent.", at: "14:23" },
  ]);
  const isReadOnly = role === "viewer";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl p-0 sm:rounded-lg overflow-hidden gap-0">
        <DialogHeader className="border-b bg-card p-4">
          <div className="flex items-center gap-3">
            <LiveDot />
            <div className="min-w-0">
              <DialogTitle className="truncate text-base">
                {session.hostname} · {session.endUser}
              </DialogTitle>
              <DialogDescription className="text-xs">
                Session {session.id} · RustDesk relay · AES-256 · {isReadOnly ? "Read-only view" : "Full control"}
              </DialogDescription>
            </div>
            <div className="ml-auto flex items-center gap-2 text-xs text-muted-foreground">
              <span className="font-mono">{session.duration}</span>
              <QualityPill q={session.quality} />
            </div>
          </div>
        </DialogHeader>

        <div className="grid grid-cols-[1fr_320px]">
          {/* Viewport */}
          <div className="flex flex-col bg-slate-950 text-slate-100">
            <div className="flex items-center gap-1 border-b border-white/10 bg-slate-900/60 px-3 py-2 text-xs">
              <ToolbarBtn icon={MousePointer2} label="Control" disabled={isReadOnly} active />
              <ToolbarBtn icon={Keyboard} label="Send keys" disabled={isReadOnly} />
              <ToolbarBtn icon={Files} label="File transfer" disabled={isReadOnly} />
              <ToolbarBtn icon={Camera} label="Screenshot" />
              <div className="mx-2 h-4 w-px bg-white/10" />
              <ToolbarBtn
                icon={micOn ? Mic : MicOff}
                label={micOn ? "Mic on" : "Mic off"}
                active={micOn}
                onClick={() => setMicOn((v) => !v)}
              />
              <ToolbarBtn
                icon={camOn ? Video : VideoOff}
                label={camOn ? "Cam on" : "Cam off"}
                active={camOn}
                onClick={() => setCamOn((v) => !v)}
              />
              <div className="mx-2 h-4 w-px bg-white/10" />
              <ToolbarBtn
                icon={recording ? StopCircle : Play}
                label={recording ? "Recording" : "Record"}
                active={recording}
                onClick={() => setRecording((v) => !v)}
              />
              <ToolbarBtn
                icon={locked ? Lock : Unlock}
                label={locked ? "Input locked" : "Lock input"}
                active={locked}
                onClick={() => setLocked((v) => !v)}
              />
              <div className="ml-auto flex items-center gap-2">
                <Button size="sm" variant="ghost" className="h-7 text-slate-100 hover:bg-white/10 hover:text-white" onClick={() => toast("Invite sent to l.morgan")}>
                  <UserPlus className="mr-1.5 h-3.5 w-3.5" /> Invite
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  className="h-7"
                  onClick={() => {
                    toast.error(`Session ${session.id} terminated`);
                    onOpenChange(false);
                  }}
                >
                  <Pause className="mr-1.5 h-3.5 w-3.5" /> End session
                </Button>
              </div>
            </div>
            <div className="relative aspect-video w-full">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(59,130,246,0.15),transparent_60%),radial-gradient(circle_at_70%_80%,rgba(16,185,129,0.12),transparent_60%)]" />
              <div className="absolute inset-0 grid place-items-center">
                <div className="text-center">
                  <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full bg-white/5">
                    <Radio className="h-5 w-5 text-emerald-400" />
                  </div>
                  <div className="text-sm font-medium">Remote desktop stream</div>
                  <div className="text-xs text-slate-400">
                    1920×1080 · 60 fps · 4.2 Mbps · relay hop: dc-01.gov.wan
                  </div>
                </div>
              </div>
              {locked && (
                <div className="absolute left-3 top-3 flex items-center gap-1.5 rounded-md bg-black/60 px-2 py-1 text-[11px]">
                  <Lock className="h-3 w-3" /> End-user input locked
                </div>
              )}
              {recording && (
                <div className="absolute right-3 top-3 flex items-center gap-1.5 rounded-md bg-red-500/20 px-2 py-1 text-[11px] text-red-200">
                  <span className="h-2 w-2 rounded-full bg-red-500" /> REC
                </div>
              )}
            </div>
            <div className="flex items-center justify-between border-t border-white/10 bg-slate-900/60 px-3 py-1.5 text-[11px] text-slate-400">
              <div className="flex items-center gap-3">
                <span>Latency 38 ms</span>
                <span>Packet loss 0.1 %</span>
                <span>Codec H.264</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-3 w-3 text-emerald-400" /> WAN-only · no Internet egress
              </div>
            </div>
          </div>

          {/* Side panel: chat + participants */}
          <div className="flex flex-col border-l bg-card">
            <div className="border-b p-3">
              <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Participants</div>
              <div className="space-y-1.5">
                <Participant name={session.operator} role="Operator (you)" />
                <Participant name={session.endUser} role="End user · consented" />
              </div>
            </div>
            <div className="flex min-h-0 flex-1 flex-col">
              <div className="border-b px-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <MessageSquare className="mr-1.5 inline h-3 w-3" /> Chat
              </div>
              <ScrollArea className="flex-1">
                <div className="space-y-3 p-3">
                  {messages.map((m, i) => (
                    <div key={i} className="text-sm">
                      <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                        <span className="font-medium text-foreground">{m.from}</span>
                        <span>{m.at}</span>
                      </div>
                      <div className="mt-0.5 rounded-md bg-muted/60 px-2.5 py-1.5">{m.text}</div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
              <form
                className="flex items-center gap-2 border-t p-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!message.trim()) return;
                  setMessages((m) => [...m, { from: session.operator, text: message, at: "now" }]);
                  setMessage("");
                }}
              >
                <Input
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={isReadOnly ? "Read-only" : "Message end user…"}
                  disabled={isReadOnly}
                  className="h-9"
                />
                <Button size="icon" className="h-9 w-9" type="submit" disabled={isReadOnly}>
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ToolbarBtn({
  icon: Icon,
  label,
  active,
  disabled,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex items-center gap-1.5 rounded-md px-2 py-1 text-xs transition-colors",
        active ? "bg-white/15 text-white" : "text-slate-300 hover:bg-white/10",
        disabled && "opacity-40 hover:bg-transparent cursor-not-allowed",
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </button>
  );
}

function NewSessionDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const [device, setDevice] = useState("DEV-10241");
  const [reason, setReason] = useState("");
  const [elevated, setElevated] = useState(false);
  const [record, setRecord] = useState(true);
  const [notify, setNotify] = useState(true);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Request remote session</DialogTitle>
          <DialogDescription>
            End user must accept the consent prompt on-device before the session starts.
            Elevated access requires approver sign-off.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <label className="text-xs font-medium">Target device</label>
            <Select value={device} onValueChange={setDevice}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="DEV-10241">NYC-FIN-WS01 · a.morgan</SelectItem>
                <SelectItem value="DEV-10242">LON-HR-LT14 · s.patel</SelectItem>
                <SelectItem value="DEV-10246">NYC-ENG-WS31 · r.silva</SelectItem>
                <SelectItem value="DEV-10249">SFO-OPS-WS17 · l.chen</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium">Reason for access</label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Short justification for the audit log (required)…"
              rows={3}
            />
          </div>
          <div className="space-y-2 rounded-md border p-3">
            <ToggleRow
              label="Request elevated (admin) access"
              hint="Triggers approval workflow"
              icon={AlertTriangle}
              checked={elevated}
              onChange={setElevated}
            />
            <ToggleRow
              label="Record session"
              hint="Retained 90 days · SHA-256 sealed"
              icon={Video}
              checked={record}
              onChange={setRecord}
            />
            <ToggleRow
              label="Notify end user immediately"
              hint="Sends consent prompt now"
              icon={Radio}
              checked={notify}
              onChange={setNotify}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            disabled={!reason.trim()}
            onClick={() => {
              onOpenChange(false);
              toast.success(
                elevated
                  ? "Request submitted · awaiting approver"
                  : "Consent prompt sent to end user",
              );
            }}
          >
            {elevated ? "Request approval" : "Send request"} <ArrowRight className="ml-1.5 h-4 w-4" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ToggleRow({
  label,
  hint,
  icon: Icon,
  checked,
  onChange,
}: {
  label: string;
  hint: string;
  icon: React.ComponentType<{ className?: string }>;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-start gap-2.5">
        <Icon className="mt-0.5 h-4 w-4 text-muted-foreground" />
        <div>
          <div className="text-sm font-medium">{label}</div>
          <div className="text-[11px] text-muted-foreground">{hint}</div>
        </div>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}