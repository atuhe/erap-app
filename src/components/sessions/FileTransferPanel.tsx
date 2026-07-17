import { useMemo, useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { FolderUp, FolderDown, FileText, CheckCircle2, XCircle, Loader2, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import { ErapRole, ROLE_LABELS, hasPermission } from "@/lib/erap-roles";
import { logAudit } from "@/lib/audit-log";
import { appendSessionEvent } from "@/lib/sessions";
import { useFileTransfers, startFileTransfer, type FileTransfer, type TransferDirection } from "@/lib/session-messaging";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sessionId: string | null;
  hostname: string;
  actor: string;
  role: ErapRole;
}

const REMOTE_FILES = [
  { name: "C:\\Logs\\erap-agent.log", sizeKb: 812 },
  { name: "C:\\Users\\Public\\config.xml", sizeKb: 24 },
  { name: "C:\\Support\\dxdiag.txt", sizeKb: 96 },
];

export function FileTransferPanel({ open, onOpenChange, sessionId, hostname, actor, role }: Props) {
  const transfers = useFileTransfers(sessionId);
  const fileInput = useRef<HTMLInputElement>(null);
  const canTransfer = hasPermission(role, "file_transfer");
  const [error, setError] = useState<string | null>(null);

  const totals = useMemo(() => ({
    up: transfers.filter((t) => t.direction === "upload").length,
    down: transfers.filter((t) => t.direction === "download").length,
    failed: transfers.filter((t) => t.status === "failed").length,
  }), [transfers]);

  const submit = (direction: TransferDirection, name: string, sizeKb: number) => {
    if (!sessionId) return;
    if (!canTransfer) {
      logAudit({ actor, actorRole: role, category: "session", action: "file_transfer_denied", target: hostname, targetId: sessionId, status: "denied", details: `${direction} ${name}` });
      setError("Your role does not include File Transfer.");
      return;
    }
    setError(null);
    startFileTransfer(sessionId, actor, direction, name, sizeKb);
    appendSessionEvent(sessionId, { kind: "file", message: `${direction === "upload" ? "Uploaded" : "Downloaded"} ${name}` });
    logAudit({ actor, actorRole: role, category: "session", action: `file_${direction}`, target: hostname, targetId: sessionId, status: "success", details: `${name} (${sizeKb} KB)` });
  };

  const handleUpload = (list: FileList | null) => {
    if (!list) return;
    for (const f of Array.from(list)) submit("upload", f.name, Math.max(1, Math.round(f.size / 1024)));
    if (fileInput.current) fileInput.current.value = "";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FolderUp className="h-5 w-5 text-primary" /> File transfer
          </DialogTitle>
          <DialogDescription>
            Transfer files with <span className="font-mono">{hostname}</span> over the private WAN. Every operation is audit-logged.
          </DialogDescription>
        </DialogHeader>

        {!canTransfer && (
          <div className="flex items-start gap-2 rounded-md border bg-amber-500/5 p-3 text-xs text-amber-800 dark:text-amber-300">
            <ShieldAlert className="mt-0.5 h-3.5 w-3.5" />
            <span>Your role ({ROLE_LABELS[role]}) cannot transfer files. Controls are disabled.</span>
          </div>
        )}

        <div className="flex items-center gap-2">
          <Button variant="outline" disabled={!canTransfer} onClick={() => fileInput.current?.click()}>
            <FolderUp className="mr-2 h-4 w-4" /> Upload to endpoint
          </Button>
          <input ref={fileInput} type="file" multiple hidden onChange={(e) => handleUpload(e.target.files)} />
          <div className="ml-auto text-[11px] text-muted-foreground">
            {totals.up} up · {totals.down} down {totals.failed > 0 && <span className="text-red-600">· {totals.failed} failed</span>}
          </div>
        </div>

        <Separator />

        <div>
          <div className="mb-1 text-xs font-semibold text-muted-foreground">Remote files on endpoint</div>
          <ul className="space-y-1">
            {REMOTE_FILES.map((f) => (
              <li key={f.name} className="flex items-center gap-2 rounded-md border bg-card px-3 py-2 text-sm">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="min-w-0 flex-1 truncate font-mono text-xs">{f.name}</span>
                <span className="text-[11px] text-muted-foreground">{f.sizeKb} KB</span>
                <Button
                  size="sm" variant="ghost" disabled={!canTransfer}
                  onClick={() => submit("download", f.name.split("\\").pop() ?? f.name, f.sizeKb)}
                >
                  <FolderDown className="mr-1 h-3.5 w-3.5" /> Download
                </Button>
              </li>
            ))}
          </ul>
        </div>

        {error && <div className="rounded-md border bg-red-500/5 p-2 text-xs text-red-700">{error}</div>}

        <Separator />

        <div>
          <div className="mb-1 text-xs font-semibold text-muted-foreground">Transfers</div>
          <div className="max-h-56 space-y-2 overflow-y-auto">
            {transfers.length === 0 && (
              <div className="rounded-md border border-dashed p-4 text-center text-xs text-muted-foreground">No transfers yet.</div>
            )}
            {transfers.map((t) => <TransferRow key={t.id} t={t} />)}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function TransferRow({ t }: { t: FileTransfer }) {
  const Icon = t.direction === "upload" ? FolderUp : FolderDown;
  const status =
    t.status === "completed" ? { label: "Completed", cls: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400", Ico: CheckCircle2 } :
    t.status === "failed" ? { label: "Failed", cls: "bg-red-500/10 text-red-700 dark:text-red-400", Ico: XCircle } :
    t.status === "cancelled" ? { label: "Cancelled", cls: "bg-slate-500/10 text-slate-700", Ico: XCircle } :
    { label: t.status === "transferring" ? "Transferring" : "Queued", cls: "bg-amber-500/10 text-amber-700 dark:text-amber-400", Ico: Loader2 };
  return (
    <div className="rounded-md border bg-card p-2 text-xs">
      <div className="flex items-center gap-2">
        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="min-w-0 flex-1 truncate font-mono">{t.name}</span>
        <Badge variant="outline" className={cn("border-transparent gap-1", status.cls)}>
          <status.Ico className={cn("h-3 w-3", t.status === "transferring" && "animate-spin")} /> {status.label}
        </Badge>
      </div>
      <div className="mt-1 flex items-center gap-2">
        <Progress value={t.progress} className="h-1.5" />
        <span className="w-10 text-right text-muted-foreground">{t.progress}%</span>
      </div>
      <div className="mt-1 flex items-center justify-between text-[10px] text-muted-foreground">
        <span>{t.sizeKb} KB · sha256:{t.checksum}</span>
        <span>{new Date(t.ts).toLocaleTimeString()}</span>
      </div>
      {t.errorMessage && <div className="mt-1 text-[10px] text-red-600">{t.errorMessage}</div>}
    </div>
  );
}