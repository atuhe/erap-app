import { useMemo, useState } from "react";
import { Search, ShieldAlert, CheckCircle2, Info, Download } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import {
  AUDIT_ACTION_LABELS,
  AUDIT_CATEGORY_LABELS,
  AuditCategory,
  AuditStatus,
  formatAuditTime,
  useAuditLog,
} from "@/lib/audit-log";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export function AuditLogView({ canExport = false }: { canExport?: boolean }) {
  const entries = useAuditLog();
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string>("all");
  const [status, setStatus] = useState<string>("all");
  const [action, setAction] = useState<string>("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const actions = useMemo(
    () => Array.from(new Set(entries.map((e) => e.action))),
    [entries],
  );

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    const fromTs = from ? new Date(from).getTime() : -Infinity;
    const toTs = to ? new Date(to).getTime() + 86_400_000 : Infinity;
    return entries.filter((e) => {
      if (cat !== "all" && e.category !== cat) return false;
      if (status !== "all" && e.status !== status) return false;
      if (action !== "all" && e.action !== action) return false;
      if (e.ts < fromTs || e.ts > toTs) return false;
      if (!term) return true;
      const hay = `${e.actor} ${e.target ?? ""} ${e.targetId ?? ""} ${e.details ?? ""} ${e.action}`.toLowerCase();
      return hay.includes(term);
    });
  }, [entries, q, cat, status, action, from, to]);

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-[260px] flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search actor, target, details…" className="h-9 pl-9" />
            </div>
            <Select value={cat} onValueChange={setCat}>
              <SelectTrigger className="h-9 w-[150px]"><SelectValue placeholder="Category" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {(Object.keys(AUDIT_CATEGORY_LABELS) as AuditCategory[]).map((k) => (
                  <SelectItem key={k} value={k}>{AUDIT_CATEGORY_LABELS[k]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={action} onValueChange={setAction}>
              <SelectTrigger className="h-9 w-[190px]"><SelectValue placeholder="Action" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                {actions.map((a) => (
                  <SelectItem key={a} value={a}>{AUDIT_ACTION_LABELS[a] ?? a}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="h-9 w-[140px]"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="success">Success</SelectItem>
                <SelectItem value="denied">Denied</SelectItem>
                <SelectItem value="info">Info</SelectItem>
              </SelectContent>
            </Select>
            <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="h-9 w-[150px]" aria-label="From date" />
            <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="h-9 w-[150px]" aria-label="To date" />
            <Button
              variant="outline"
              size="sm"
              className="ml-auto"
              disabled={!canExport}
              onClick={() => toast.success(`Exported ${filtered.length} audit rows`)}
            >
              <Download className="mr-2 h-4 w-4" /> Export CSV
            </Button>
          </div>
          <div className="mt-2 text-xs text-muted-foreground">{filtered.length} of {entries.length} entries</div>
        </CardContent>
      </Card>

      <div className="overflow-hidden rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40">
              <TableHead className="w-[170px]">Time</TableHead>
              <TableHead>Actor</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Target</TableHead>
              <TableHead>Details</TableHead>
              <TableHead className="w-[110px]">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((e) => (
              <TableRow key={e.id}>
                <TableCell className="whitespace-nowrap text-xs text-muted-foreground">{formatAuditTime(e.ts)}</TableCell>
                <TableCell>
                  <div className="text-sm font-medium">{e.actor}</div>
                  <div className="text-[11px] text-muted-foreground">{e.actorRole}</div>
                </TableCell>
                <TableCell><Badge variant="secondary" className="font-normal">{AUDIT_CATEGORY_LABELS[e.category]}</Badge></TableCell>
                <TableCell className="text-sm">{AUDIT_ACTION_LABELS[e.action] ?? e.action}</TableCell>
                <TableCell>
                  {e.target ? (
                    <div>
                      <div className="text-sm">{e.target}</div>
                      {e.targetId && <div className="font-mono text-[11px] text-muted-foreground">{e.targetId}</div>}
                    </div>
                  ) : <span className="text-xs text-muted-foreground">—</span>}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">{e.details ?? "—"}</TableCell>
                <TableCell><StatusPill status={e.status} /></TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow><TableCell colSpan={7} className="h-32 text-center text-sm text-muted-foreground">No audit entries match the current filters.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function StatusPill({ status }: { status: AuditStatus }) {
  const map = {
    success: { cls: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400", Icon: CheckCircle2, label: "Success" },
    denied: { cls: "bg-red-500/10 text-red-700 dark:text-red-400", Icon: ShieldAlert, label: "Denied" },
    info: { cls: "bg-slate-500/10 text-slate-700 dark:text-slate-300", Icon: Info, label: "Info" },
  }[status];
  const Icon = map.Icon;
  return (
    <Badge variant="outline" className={cn("gap-1.5 border-transparent font-medium", map.cls)}>
      <Icon className="h-3 w-3" /> {map.label}
    </Badge>
  );
}