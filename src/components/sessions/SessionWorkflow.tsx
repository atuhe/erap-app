import { useEffect, useMemo, useRef, useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import {
  ShieldCheck, Wifi, Send, Clock, Loader2, CheckCircle2, XCircle, AlertTriangle,
  PlugZap, MessageSquare, FolderUp, Info, Power, RotateCw, Monitor, Building2,
  User as UserIcon, ShieldAlert, Ban, WifiOff, Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { ErapRole, ROLE_LABELS, hasPermission } from "@/lib/erap-roles";
import { logAudit } from "@/lib/audit-log";
import {
  createSession, endSession, formatDuration, formatTime, updateSession,
  type SessionRecord,
} from "@/lib/sessions";

export interface ConnectTarget {
  id: string;
  hostname: string;
  currentUser: string;
  branch: string;
  department: string;
  status: "online" | "offline";
  os: string;
  ip: string;
  rustDeskPort: number;
}

export type ConnectError =
  | "device_offline"
  | "permission_denied"
  | "connection_timeout"
  | "user_declined"
  | "agent_not_running"
  | "network_unreachable";

type Phase =
  | "confirm"
  | "progress"
  | "waiting"
  | "active"
  | "summary"
  | "error";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  device: ConnectTarget | null;
  role: ErapRole;
  actor: string;
  onViewHistory?: () => void;
}

export function SessionWorkflow({ open, onOpenChange, device, role, actor, onViewHistory }: Props) {
  const [phase, setPhase] = useState<Phase>("confirm");
  const [reason, setReason] = useState("");
  const [mode, setMode] = useState<"approval" | "unattended">("approval");
  const [session, setSession] = useState<SessionRecord | null>(null);
  const [errorKind, setErrorKind] = useState<ConnectError | null>(null);
  const [showRemotePopup, setShowRemotePopup] = useState(false);

  const canUnattended = hasPermission(role, "manage_policies") || role === "system_admin";

  // Reset when re-opened on a new device
  useEffect(() => {
    if (open) {
      setPhase("confirm");
      setReason("");
      setMode("approval");
      setSession(null);
      setErrorKind(null);
      setShowRemotePopup(false);
    }
  }, [open, device?.id]);

  if (!device) return null;

  const log = (
    action: string,
    status: "success" | "denied" | "info",
    details?: string,
  ) =>
    logAudit({
      actor, actorRole: role, category: "session", action,
      target: device.hostname, targetId: device.id, status, details,
    });

  const failWith = (kind: ConnectError, msg: string) => {
    setErrorKind(kind);
    setPhase("error");
    if (session) endSession(session.id, "Failed", msg);
    log("connect_failed", "denied", msg);
  };

  const startConnect = () => {
    if (!reason.trim()) {
      toast.error("Reason for connection is required");
      return;
    }
    if (device.status === "offline") {
      failWith("device_offline", "Device offline");
      return;
    }
    if (!hasPermission(role, "remote_desktop")) {
      failWith("permission_denied", "Role lacks Remote Desktop");
      return;
    }
    const created = createSession({
      technician: actor, technicianRole: role,
      deviceId: device.id, hostname: device.hostname, currentUser: device.currentUser,
      branch: device.branch, department: device.department,
      reason: reason.trim(), mode,
    });
    setSession(created);
    log("connect_attempt", "success", `Reason: ${reason.trim()} · Mode: ${mode}`);
    setPhase("progress");
  };

  // Progress → waiting/active auto-advance
  useEffect(() => {
    if (phase !== "progress" || !session) return;
    const t = setTimeout(() => {
      if (mode === "unattended") {
        updateSession(session.id, { status: "connected" });
        log("connect", "success", "Unattended connection");
        setPhase("active");
      } else {
        updateSession(session.id, { status: "awaiting_approval" });
        setPhase("waiting");
        setShowRemotePopup(true);
      }
    }, 2200);
    return () => clearTimeout(t);
  }, [phase, session?.id]);

  const cancel = () => {
    if (session) {
      endSession(session.id, "Cancelled");
      log("connect_cancelled", "info");
    }
    onOpenChange(false);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={(v) => (!v ? cancel() : onOpenChange(v))}>
        <DialogContent className="max-w-lg">
          {phase === "confirm" && (
            <ConfirmScreen
              device={device} reason={reason} setReason={setReason}
              mode={mode} setMode={setMode} canUnattended={canUnattended}
              onCancel={() => onOpenChange(false)} onConnect={startConnect}
            />
          )}
          {phase === "progress" && (
            <ProgressScreen device={device} onCancel={cancel} />
          )}
          {phase === "waiting" && session && (
            <WaitingScreen
              device={device} session={session}
              onCancel={cancel}
              onRetry={() => {
                log("approval_retry", "info");
                setShowRemotePopup(false);
                setTimeout(() => setShowRemotePopup(true), 200);
              }}
              onApproved={() => {
                updateSession(session.id, { status: "connected" });
                log("connect", "success", "User approved");
                setShowRemotePopup(false);
                setPhase("active");
              }}
              onDeclined={() => {
                setShowRemotePopup(false);
                failWith("user_declined", "Remote user declined");
              }}
              onTimeout={() => {
                setShowRemotePopup(false);
                failWith("connection_timeout", "Approval request timed out");
              }}
            />
          )}
          {phase === "active" && session && (
            <ActiveScreen
              device={device} session={session}
              onEnd={() => {
                endSession(session.id, "Completed");
                log("session_ended", "info");
                setPhase("summary");
              }}
            />
          )}
          {phase === "summary" && session && (
            <SummaryScreen
              device={device} session={session}
              onClose={() => onOpenChange(false)}
              onHistory={() => { onOpenChange(false); onViewHistory?.(); }}
            />
          )}
          {phase === "error" && errorKind && (
            <ErrorScreen
              kind={errorKind} device={device}
              onClose={() => onOpenChange(false)}
              onRetry={() => { setErrorKind(null); setPhase("confirm"); }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Remote user approval popup — rendered as its own dialog on top */}
      <RemoteApprovalPopup
        open={showRemotePopup}
        device={device}
        technician={actor}
        technicianRole={role}
        reason={reason}
        onAccept={() => {
          if (!session) return;
          updateSession(session.id, { status: "connected" });
          log("connect", "success", "User approved");
          setShowRemotePopup(false);
          setPhase("active");
        }}
        onDecline={() => {
          setShowRemotePopup(false);
          failWith("user_declined", "Remote user declined");
        }}
        onExpire={() => {
          setShowRemotePopup(false);
          failWith("connection_timeout", "Approval request timed out");
        }}
      />
    </>
  );
}

// ─── Screen 1: Confirm ─────────────────────────────────────────────────────
function ConfirmScreen({
  device, reason, setReason, mode, setMode, canUnattended, onCancel, onConnect,
}: {
  device: ConnectTarget;
  reason: string;
  setReason: (v: string) => void;
  mode: "approval" | "unattended";
  setMode: (v: "approval" | "unattended") => void;
  canUnattended: boolean;
  onCancel: () => void;
  onConnect: () => void;
}) {
  return (
    <>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <PlugZap className="h-5 w-5 text-primary" /> Connection confirmation
        </DialogTitle>
        <DialogDescription>
          Review target and provide a reason before starting the remote session.
        </DialogDescription>
      </DialogHeader>

      <div className="rounded-lg border bg-muted/30 p-3">
        <div className="flex items-center justify-between">
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold">{device.hostname}</div>
            <div className="font-mono text-[11px] text-muted-foreground">{device.id}</div>
          </div>
          <Badge
            variant="outline"
            className={cn(
              "border-transparent",
              device.status === "online"
                ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                : "bg-red-500/10 text-red-700 dark:text-red-400",
            )}
          >
            {device.status === "online" ? "Online" : "Offline"}
          </Badge>
        </div>
        <Separator className="my-3" />
        <dl className="grid grid-cols-2 gap-y-2 text-xs">
          <Field label="Current User" value={device.currentUser} />
          <Field label="Branch" value={device.branch} />
          <Field label="Department" value={device.department} />
          <Field label="Operating System" value={device.os} />
        </dl>
      </div>

      <div className="space-y-2">
        <Label htmlFor="reason" className="text-xs">
          Reason for connection <span className="text-red-600">*</span>
        </Label>
        <Textarea
          id="reason" rows={3} value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="e.g. Install printer drivers"
        />
      </div>

      <div className="space-y-2">
        <Label className="text-xs">Connection mode</Label>
        <RadioGroup value={mode} onValueChange={(v) => setMode(v as "approval" | "unattended")} className="grid gap-2">
          <ModeCard
            id="approval" checked={mode === "approval"}
            title="Request user approval"
            desc="Remote user must accept the request in the ERAP Agent."
          />
          <ModeCard
            id="unattended" checked={mode === "unattended"}
            disabled={!canUnattended}
            title="Unattended connection"
            desc={
              canUnattended
                ? "Skip approval — allowed by your role and endpoint policy."
                : "Restricted to administrators with Manage Policies."
            }
          />
        </RadioGroup>
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button onClick={onConnect}><PlugZap className="mr-2 h-4 w-4" /> Connect</Button>
      </DialogFooter>
    </>
  );
}

function ModeCard({
  id, checked, disabled, title, desc,
}: { id: string; checked: boolean; disabled?: boolean; title: string; desc: string }) {
  return (
    <label
      htmlFor={id}
      className={cn(
        "flex cursor-pointer items-start gap-3 rounded-md border p-3 text-sm transition-colors",
        checked ? "border-primary bg-primary/5" : "hover:bg-muted/40",
        disabled && "cursor-not-allowed opacity-60",
      )}
    >
      <RadioGroupItem id={id} value={id} className="mt-0.5" disabled={disabled} />
      <div className="min-w-0">
        <div className="font-medium">{title}</div>
        <div className="text-xs text-muted-foreground">{desc}</div>
      </div>
    </label>
  );
}

// ─── Screen 2: Progress ────────────────────────────────────────────────────
function ProgressScreen({ device, onCancel }: { device: ConnectTarget; onCancel: () => void }) {
  const start = useRef(Date.now());
  const [step, setStep] = useState(0);
  const [, force] = useState(0);
  const steps = [
    { label: "Verifying technician permissions", Icon: ShieldCheck },
    { label: "Confirming ERAP Agent is online",  Icon: Wifi },
    { label: "Sending connection request",       Icon: Send },
  ];
  useEffect(() => {
    const t1 = setTimeout(() => setStep(1), 700);
    const t2 = setTimeout(() => setStep(2), 1400);
    const tick = setInterval(() => force((n) => n + 1), 250);
    return () => { clearTimeout(t1); clearTimeout(t2); clearInterval(tick); };
  }, []);
  const elapsed = Math.max(0, Math.floor((Date.now() - start.current) / 1000));
  const pct = Math.min(100, ((step + 1) / steps.length) * 100);
  return (
    <>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <Loader2 className="h-5 w-5 animate-spin text-primary" /> Establishing session
        </DialogTitle>
        <DialogDescription>
          Connecting to <span className="font-medium text-foreground">{device.hostname}</span> over the private WAN.
        </DialogDescription>
      </DialogHeader>
      <Progress value={pct} />
      <ol className="space-y-2">
        {steps.map((s, i) => {
          const Icon = i < step ? CheckCircle2 : i === step ? Loader2 : s.Icon;
          return (
            <li key={s.label} className="flex items-center gap-3 rounded-md border bg-card px-3 py-2 text-sm">
              <Icon className={cn("h-4 w-4", i < step ? "text-emerald-500" : i === step ? "animate-spin text-primary" : "text-muted-foreground")} />
              <span className={cn(i > step && "text-muted-foreground")}>{s.label}</span>
              {i < step && <Badge variant="outline" className="ml-auto border-transparent bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">Done</Badge>}
              {i === step && <Badge variant="outline" className="ml-auto border-transparent bg-amber-500/10 text-amber-700 dark:text-amber-400">In progress</Badge>}
            </li>
          );
        })}
      </ol>
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> Elapsed {elapsed}s</span>
        <span>Target · {device.ip}:{device.rustDeskPort}</span>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onCancel}>Cancel request</Button>
      </DialogFooter>
    </>
  );
}

// ─── Screen 3: Waiting for approval ────────────────────────────────────────
function WaitingScreen({
  device, session, onCancel, onRetry, onApproved, onDeclined, onTimeout,
}: {
  device: ConnectTarget;
  session: SessionRecord;
  onCancel: () => void;
  onRetry: () => void;
  onApproved: () => void;
  onDeclined: () => void;
  onTimeout: () => void;
}) {
  const [, force] = useState(0);
  useEffect(() => {
    const i = setInterval(() => force((n) => n + 1), 1000);
    return () => clearInterval(i);
  }, []);
  const waited = Math.floor((Date.now() - session.startedAt) / 1000);
  return (
    <>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-amber-500" /> Waiting for remote user approval
        </DialogTitle>
        <DialogDescription>
          The ERAP Agent on the endpoint is displaying your request to the user.
        </DialogDescription>
      </DialogHeader>
      <div className="rounded-lg border bg-amber-500/5 p-4">
        <dl className="grid grid-cols-2 gap-y-2 text-xs">
          <Field label="Computer name" value={device.hostname} />
          <Field label="Current user" value={device.currentUser} />
          <Field label="Branch" value={device.branch} />
          <Field label="Time waiting" value={`${waited}s`} />
        </dl>
      </div>
      <p className="text-xs text-muted-foreground">
        Simulating remote user response: use the popup that appears next to the dialog to accept or decline.
      </p>
      <DialogFooter className="gap-2 sm:justify-between">
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onRetry}><PlugZap className="mr-2 h-4 w-4" /> Retry</Button>
          {/* dev helpers exposed as tiny secondary actions to progress the demo */}
          <Button variant="ghost" size="sm" onClick={onDeclined}>Simulate decline</Button>
          <Button variant="ghost" size="sm" onClick={onTimeout}>Simulate timeout</Button>
          <Button size="sm" onClick={onApproved}>Simulate accept</Button>
        </div>
      </DialogFooter>
    </>
  );
}

// ─── Screen 5: Active session ──────────────────────────────────────────────
function ActiveScreen({
  device, session, onEnd,
}: { device: ConnectTarget; session: SessionRecord; onEnd: () => void }) {
  const [, force] = useState(0);
  useEffect(() => {
    const i = setInterval(() => force((n) => n + 1), 1000);
    return () => clearInterval(i);
  }, []);
  const dur = formatDuration(Date.now() - session.startedAt);
  return (
    <>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
          </span>
          Session active
        </DialogTitle>
        <DialogDescription>
          Remote desktop is now running in a separate RustDesk window.
        </DialogDescription>
      </DialogHeader>
      <div className="rounded-lg border p-4">
        <div className="flex items-center justify-between">
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold">{device.hostname}</div>
            <div className="font-mono text-[11px] text-muted-foreground">{device.id} · {device.currentUser}</div>
          </div>
          <Badge variant="outline" className="border-transparent bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
            Connected
          </Badge>
        </div>
        <Separator className="my-3" />
        <dl className="grid grid-cols-2 gap-y-2 text-xs">
          <Field label="Start time" value={formatTime(session.startedAt)} />
          <Field label="Live duration" value={dur} />
          <Field label="Reason" value={session.reason} />
          <Field label="Mode" value={session.mode === "unattended" ? "Unattended" : "Approval"} />
        </dl>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <QuickAction icon={PlugZap} label="Reconnect" onClick={() => toast.info("Reconnect requested via RustDesk broker") } />
        <QuickAction icon={FolderUp} label="Transfer file" onClick={() => toast.info("Opening file transfer channel…") } />
        <QuickAction icon={MessageSquare} label="Open chat" onClick={() => toast.info("Chat channel opened") } />
        <QuickAction icon={Monitor} label="Device details" onClick={() => toast.info("Opening device details…") } />
      </div>
      <div className="flex items-start gap-2 rounded-md border bg-muted/30 p-3 text-xs text-muted-foreground">
        <Info className="mt-0.5 h-3.5 w-3.5" />
        <span>The remote desktop window is running in <b>RustDesk</b>. ERAP handles authentication, permissions and auditing while RustDesk carries the pixel and input stream over the private WAN.</span>
      </div>
      <DialogFooter>
        <Button variant="destructive" onClick={onEnd}><Power className="mr-2 h-4 w-4" /> End session</Button>
      </DialogFooter>
    </>
  );
}

function QuickAction({ icon: Icon, label, onClick }: { icon: React.ComponentType<{ className?: string }>; label: string; onClick: () => void }) {
  return (
    <Button variant="outline" onClick={onClick} className="justify-start">
      <Icon className="mr-2 h-4 w-4" /> {label}
    </Button>
  );
}

// ─── Screen 6: Summary ─────────────────────────────────────────────────────
function SummaryScreen({
  device, session, onClose, onHistory,
}: { device: ConnectTarget; session: SessionRecord; onClose: () => void; onHistory: () => void }) {
  const end = session.endedAt ?? Date.now();
  const dur = formatDuration(end - session.startedAt);
  const tone =
    session.result === "Completed" ? "text-emerald-600" :
    session.result === "Failed" ? "text-red-600" : "text-amber-600";
  const Icon =
    session.result === "Completed" ? CheckCircle2 :
    session.result === "Failed" ? XCircle : AlertTriangle;
  return (
    <>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <Icon className={cn("h-5 w-5", tone)} /> Session summary
        </DialogTitle>
        <DialogDescription>
          Full record of the remote session has been written to the audit log.
        </DialogDescription>
      </DialogHeader>
      <div className="rounded-lg border p-4">
        <dl className="grid grid-cols-2 gap-y-2 text-xs">
          <Field label="Computer name" value={device.hostname} />
          <Field label="Device ID" value={device.id} mono />
          <Field label="Branch" value={device.branch} />
          <Field label="Technician" value={session.technician} />
          <Field label="Start time" value={formatTime(session.startedAt)} />
          <Field label="End time" value={formatTime(end)} />
          <Field label="Duration" value={dur} />
          <Field label="Reason" value={session.reason} />
          <Field label="Result" value={session.result ?? "—"} />
        </dl>
      </div>
      <DialogFooter className="gap-2">
        <Button variant="outline" onClick={onHistory}>View session history</Button>
        <Button onClick={onClose}>Return to devices</Button>
      </DialogFooter>
    </>
  );
}

// ─── Error screen ──────────────────────────────────────────────────────────
const ERROR_META: Record<ConnectError, {
  title: string; body: string; next: string;
  icon: React.ComponentType<{ className?: string }>;
}> = {
  device_offline: {
    title: "Device offline",
    body: "The ERAP Agent on this endpoint has not checked in recently and cannot accept a session.",
    next: "Ask the on-site user to power the workstation on, or use Wake-on-LAN if enabled for this branch.",
    icon: WifiOff,
  },
  permission_denied: {
    title: "Permission denied",
    body: "Your current role does not allow starting a remote session against this device.",
    next: "Request the Remote Desktop permission from an administrator, or ask a senior engineer to take over.",
    icon: ShieldAlert,
  },
  connection_timeout: {
    title: "Connection timed out",
    body: "The endpoint acknowledged the request but did not complete the RustDesk handshake in time.",
    next: "Retry the connection. If the timeout repeats, verify branch WAN latency and RustDesk broker health.",
    icon: Clock,
  },
  user_declined: {
    title: "Remote user declined",
    body: "The signed-in user rejected the approval prompt on the endpoint.",
    next: "Contact the user out-of-band to confirm the maintenance window, then request again with a clearer reason.",
    icon: Ban,
  },
  agent_not_running: {
    title: "Remote agent not running",
    body: "The ERAP Agent service is installed but is not currently running on the endpoint.",
    next: "Restart the ERAP Agent service via the Agent Management console, or dispatch on-site support.",
    icon: Shield,
  },
  network_unreachable: {
    title: "Network unreachable",
    body: "The endpoint's branch segment is not reachable from your operator subnet on the private WAN.",
    next: "Check the branch VPN tunnel and NOC dashboards. Retry once the branch is back on-net.",
    icon: WifiOff,
  },
};

function ErrorScreen({
  kind, device, onClose, onRetry,
}: { kind: ConnectError; device: ConnectTarget; onClose: () => void; onRetry: () => void }) {
  const meta = ERROR_META[kind];
  const Icon = meta.icon;
  return (
    <>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2 text-red-600">
          <Icon className="h-5 w-5" /> {meta.title}
        </DialogTitle>
        <DialogDescription>{meta.body}</DialogDescription>
      </DialogHeader>
      <div className="rounded-md border bg-red-500/5 p-3 text-xs">
        <div className="font-semibold text-red-700 dark:text-red-400">Recommended next step</div>
        <p className="mt-1 text-muted-foreground">{meta.next}</p>
      </div>
      <div className="rounded-md border p-3 text-xs">
        <div className="text-muted-foreground">Target</div>
        <div className="mt-1 font-medium">{device.hostname}</div>
        <div className="font-mono text-[11px] text-muted-foreground">{device.id} · {device.ip}:{device.rustDeskPort}</div>
      </div>
      <DialogFooter className="gap-2">
        <Button variant="outline" onClick={onClose}>Close</Button>
        <Button onClick={onRetry}><RotateCw className="mr-2 h-4 w-4" /> Try again</Button>
      </DialogFooter>
    </>
  );
}

// ─── Screen 4: Remote user popup (rendered on the endpoint) ────────────────
const APPROVAL_TIMEOUT_S = 30;

function RemoteApprovalPopup({
  open, device, technician, technicianRole, reason, onAccept, onDecline, onExpire,
}: {
  open: boolean;
  device: ConnectTarget;
  technician: string;
  technicianRole: ErapRole;
  reason: string;
  onAccept: () => void;
  onDecline: () => void;
  onExpire: () => void;
}) {
  const [remaining, setRemaining] = useState(APPROVAL_TIMEOUT_S);
  useEffect(() => {
    if (!open) return;
    setRemaining(APPROVAL_TIMEOUT_S);
    const i = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) { clearInterval(i); onExpire(); return 0; }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(i);
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={(v) => (!v ? onDecline() : null)}>
      <DialogContent className="max-w-md border-2 border-primary/40">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-md bg-primary text-primary-foreground">
            <Shield className="h-5 w-5" />
          </div>
          <div>
            <div className="text-sm font-semibold">Enterprise Remote Agent</div>
            <div className="text-[11px] text-muted-foreground">Incoming support request · {device.hostname}</div>
          </div>
          <Badge variant="outline" className="ml-auto border-transparent bg-amber-500/10 text-amber-700 dark:text-amber-400">
            <Clock className="mr-1 h-3 w-3" /> {remaining}s
          </Badge>
        </div>
        <Separator />
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <UserIcon className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{technician}</span>
            <Badge variant="secondary" className="font-normal">{ROLE_LABELS[technicianRole]}</Badge>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Building2 className="h-4 w-4" /> {device.branch} · {device.department}
          </div>
          <div className="rounded-md border bg-muted/40 p-3 text-xs">
            <div className="font-semibold">Reason for connection</div>
            <p className="mt-1 text-foreground/90">{reason || "— (not provided)"}</p>
          </div>
        </div>
        <div className="flex items-start gap-2 rounded-md border bg-amber-500/5 p-3 text-[11px] text-amber-800 dark:text-amber-300">
          <ShieldAlert className="mt-0.5 h-3.5 w-3.5" />
          <span>Only approve requests from authorized IT personnel. This request is logged in ERAP.</span>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onDecline}>Decline</Button>
          <Button onClick={onAccept}><CheckCircle2 className="mr-2 h-4 w-4" /> Accept</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, value, mono }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className={cn("text-right", mono && "font-mono")}>{value}</dd>
    </>
  );
}