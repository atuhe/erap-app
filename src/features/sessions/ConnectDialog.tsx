import { useEffect, useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Copy, PlugZap, Loader2, CheckCircle2, MonitorUp, PhoneOff, Info } from "lucide-react";
import { toast } from "sonner";
import { connectSession, endSession } from "./sessionService";
import type { ConnectResponse } from "./session.types";
import { ApiError } from "@/lib/apiClient";

// Structural subset of the device shape this dialog needs.
interface DeviceLike {
  id: string;               // "DEV-16"
  hostname: string;
  ip: string;
  rustDeskPort: number;
  branch?: string;
  currentUser?: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  device: DeviceLike | null;
  onConnected?: () => void;  // e.g. refetch the device list so status shows "In Session"
}

type Phase = "confirm" | "connecting" | "active";

export function ConnectDialog({ open, onOpenChange, device, onConnected }: Props) {
  const [phase, setPhase] = useState<Phase>("confirm");
  const [reason, setReason] = useState("");
  const [session, setSession] = useState<ConnectResponse | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) { setPhase("confirm"); setReason(""); setSession(null); setBusy(false); }
  }, [open, device?.id]);

  if (!device) return null;

  const deviceId = Number.parseInt(device.id.replace(/\D/g, ""), 10);

  const start = async () => {
    if (busy) return;
    setBusy(true);
    setPhase("connecting");
    try {
      const res = await connectSession(deviceId, reason.trim() || undefined);
      setSession(res);
      setPhase("active");
      onConnected?.();
      if (res.launchUrl) tryLaunch(res.launchUrl);   // best-effort; works once RustDesk is installed
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : "Couldn't start the session.";
      toast.error(msg);
      setPhase("confirm");
    } finally {
      setBusy(false);
    }
  };

  const finish = async () => {
    if (session) {
      try { await endSession(session.sessionId); onConnected?.(); } catch { /* already ended */ }
    }
    onOpenChange(false);
  };

  const copy = (text: string, label: string) => {
    navigator.clipboard?.writeText(text);
    toast.success(`Copied ${label}`);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => (!v ? (session ? finish() : onOpenChange(false)) : onOpenChange(v))}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Connect to {device.hostname}</DialogTitle>
          <DialogDescription>
            {device.branch ? `${device.branch} · ` : ""}{device.currentUser ?? ""}
          </DialogDescription>
        </DialogHeader>

        {phase === "confirm" && (
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="connect-reason">Reason for connection</Label>
              <Input
                id="connect-reason" value={reason} autoFocus
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Password reset, software fix…"
              />
              <p className="text-xs text-muted-foreground">Recorded in the audit log.</p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button onClick={start} disabled={busy}>
                <PlugZap className="mr-2 h-4 w-4" /> Start session
              </Button>
            </DialogFooter>
          </div>
        )}

        {phase === "connecting" && (
          <div className="flex items-center gap-3 py-6 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Creating audited session…
          </div>
        )}

        {phase === "active" && session && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              <span>Session <span className="font-mono text-xs">{session.sessionId}</span> is active.</span>
            </div>

            <div className="space-y-2 rounded-md border bg-muted/30 p-3 text-sm">
              <Row label="Host" value={session.hostname} onCopy={() => copy(session.hostname, "hostname")} />
              <Row
                label="IP address" value={session.ipAddress ?? "—"} mono
                onCopy={session.ipAddress ? () => copy(session.ipAddress!, "IP") : undefined}
              />
              <Row label="RustDesk port" value={String(session.rustDeskPort ?? "—")} mono />
            </div>

            {session.launchUrl && (
              <Button className="w-full" onClick={() => tryLaunch(session.launchUrl!)}>
                <MonitorUp className="mr-2 h-4 w-4" /> Open in RustDesk
              </Button>
            )}

            <p className="flex items-start gap-2 text-xs text-muted-foreground">
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              If RustDesk doesn't open, it isn't installed or its link handler isn't registered on this PC.
              Use the IP and port above to connect manually.
            </p>

            <DialogFooter>
              <Button variant="destructive" onClick={finish}>
                <PhoneOff className="mr-2 h-4 w-4" /> End session
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Row({ label, value, mono, onCopy }: { label: string; value: string; mono?: boolean; onCopy?: () => void }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className="flex items-center gap-1.5">
        <span className={mono ? "font-mono text-xs" : ""}>{value}</span>
        {onCopy && (
          <button type="button" onClick={onCopy}
            className="text-muted-foreground hover:text-foreground" aria-label={`Copy ${label}`}>
            <Copy className="h-3.5 w-3.5" />
          </button>
        )}
      </span>
    </div>
  );
}

// Hand off to the local RustDesk client via its URL protocol (no-op if unregistered).
function tryLaunch(url: string) {
  if (typeof document === "undefined") return;
  const a = document.createElement("a");
  a.href = url;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
}
