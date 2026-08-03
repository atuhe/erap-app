import { useEffect, useMemo, useState } from "react";
import { Boxes, HeartPulse, AlertTriangle, WifiOff, Search } from "lucide-react";
import { getDevices } from "@/features/devices/deviceService";
import type { Device } from "@/features/devices/device.types";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

type Health = "Healthy" | "Stale" | "Offline";

function healthOf(lastSeen: string | null): { health: Health; ageMin: number } {
  if (!lastSeen) return { health: "Offline", ageMin: Infinity };
  const ageMs = Date.now() - new Date(lastSeen).getTime();
  const ageMin = ageMs / 60000;
  if (ageMin < 2) return { health: "Healthy", ageMin };
  if (ageMin < 10) return { health: "Stale", ageMin };
  return { health: "Offline", ageMin };
}

function relTime(lastSeen: string | null): string {
  if (!lastSeen) return "never";
  const s = Math.floor((Date.now() - new Date(lastSeen).getTime()) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

const TONE: Record<Health, string> = {
  Healthy: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  Stale: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
  Offline: "bg-red-500/10 text-red-700 dark:text-red-400",
};

export function AgentFleet() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    const load = () =>
      getDevices().then((d) => { if (alive) setDevices(d); }).catch(() => {}).finally(() => setLoading(false));
    load();
    const t = setInterval(load, 15000);   // refresh so heartbeats show live
    return () => { alive = false; clearInterval(t); };
  }, []);

  // Only kits that have reported an agent.
  const agents = useMemo(() => devices.filter((d) => !!d.agentVersion), [devices]);

  const stats = useMemo(() => {
    let healthy = 0, stale = 0, offline = 0;
    for (const d of agents) {
      const h = healthOf(d.lastSeen).health;
      if (h === "Healthy") healthy++; else if (h === "Stale") stale++; else offline++;
    }
    return { total: agents.length, healthy, stale, offline };
  }, [agents]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return agents;
    return agents.filter((d) =>
      d.hostname.toLowerCase().includes(term) || (d.unit ?? "").toLowerCase().includes(term));
  }, [agents, q]);

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi icon={Boxes} label="Agents deployed" value={stats.total} />
        <Kpi icon={HeartPulse} label="Healthy" value={stats.healthy} tone="text-emerald-600" />
        <Kpi icon={AlertTriangle} label="Stale" value={stats.stale} tone="text-amber-600" />
        <Kpi icon={WifiOff} label="Offline" value={stats.offline} tone="text-red-600" />
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="relative max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search agents by hostname or unit…" className="h-9 pl-9" />
          </div>
        </CardContent>
      </Card>

      <div className="overflow-hidden rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40">
              <TableHead>Kit (Hostname)</TableHead>
              <TableHead>Unit</TableHead>
              <TableHead>Agent Version</TableHead>
              <TableHead>Current User</TableHead>
              <TableHead>Last Heartbeat</TableHead>
              <TableHead>Agent Health</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={6} className="py-8 text-center text-sm text-muted-foreground">Loading agents…</TableCell></TableRow>
            ) : filtered.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="py-8 text-center text-sm text-muted-foreground">No agents reporting yet. Install the ERAP agent on a kit and it will appear here.</TableCell></TableRow>
            ) : filtered.map((d) => {
              const { health } = healthOf(d.lastSeen);
              return (
                <TableRow key={d.deviceId}>
                  <TableCell className="font-medium">{d.hostname}</TableCell>
                  <TableCell>{d.unit ?? "—"}</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">{d.agentVersion}</TableCell>
                  <TableCell className="text-sm">{d.currentUsername ?? "—"}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{relTime(d.lastSeen)}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={cn("border-transparent font-medium", TONE[health])}>{health}</Badge>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function Kpi({ icon: Icon, label, value, tone }: { icon: any; label: string; value: number; tone?: string }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <div className="grid h-10 w-10 place-items-center rounded-md bg-primary/10 text-primary">
          <Icon className={cn("h-5 w-5", tone)} />
        </div>
        <div>
          <div className="text-2xl font-semibold leading-none">{value}</div>
          <div className="text-xs text-muted-foreground">{label}</div>
        </div>
      </CardContent>
    </Card>
  );
}
