import { useMemo, useState } from "react";
import {
  Search,
  Power,
  RotateCw,
  Copy,
  Plug,
  ClipboardList,
  X,
  Circle,
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
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { AppShell } from "@/components/app-shell/AppShell";

type Status = "online" | "offline";
type Role = "admin" | "operator" | "viewer";

interface Device {
  id: string;
  hostname: string;
  currentUser: string;
  branch: string;
  department: string;
  status: Status;
  lastSeen: string;
  os: string;
  ip: string;
  rustDeskPort: number;
}

const DEVICES: Device[] = [
  { id: "DEV-10241", hostname: "NYC-FIN-WS01", currentUser: "a.morgan", branch: "New York", department: "Finance", status: "online", lastSeen: "2 min ago", os: "Windows 11 Pro 23H2", ip: "10.24.11.42", rustDeskPort: 21118 },
  { id: "DEV-10242", hostname: "LON-HR-LT14", currentUser: "s.patel", branch: "London", department: "HR", status: "online", lastSeen: "just now", os: "Windows 11 Pro 23H2", ip: "10.44.9.18", rustDeskPort: 21118 },
  { id: "DEV-10243", hostname: "BER-ENG-WS22", currentUser: "m.klein", branch: "Berlin", department: "Engineering", status: "offline", lastSeen: "3 h ago", os: "Windows 10 Enterprise 22H2", ip: "10.61.4.201", rustDeskPort: 21118 },
  { id: "DEV-10244", hostname: "SFO-DES-MB08", currentUser: "j.nguyen", branch: "San Francisco", department: "Design", status: "online", lastSeen: "5 min ago", os: "Windows 11 Pro 24H2", ip: "10.12.7.66", rustDeskPort: 21118 },
  { id: "DEV-10245", hostname: "TOK-OPS-WS05", currentUser: "y.tanaka", branch: "Tokyo", department: "Operations", status: "offline", lastSeen: "1 d ago", os: "Windows Server 2022", ip: "10.88.2.9", rustDeskPort: 21118 },
  { id: "DEV-10246", hostname: "NYC-ENG-WS31", currentUser: "r.silva", branch: "New York", department: "Engineering", status: "online", lastSeen: "1 min ago", os: "Windows 11 Pro 24H2", ip: "10.24.11.77", rustDeskPort: 21118 },
  { id: "DEV-10247", hostname: "LON-FIN-LT02", currentUser: "e.brown", branch: "London", department: "Finance", status: "online", lastSeen: "8 min ago", os: "Windows 11 Pro 23H2", ip: "10.44.9.44", rustDeskPort: 21118 },
  { id: "DEV-10248", hostname: "BER-HR-WS10", currentUser: "k.mueller", branch: "Berlin", department: "HR", status: "offline", lastSeen: "5 h ago", os: "Windows 10 Enterprise 22H2", ip: "10.61.4.115", rustDeskPort: 21118 },
  { id: "DEV-10249", hostname: "SFO-OPS-WS17", currentUser: "l.chen", branch: "San Francisco", department: "Operations", status: "online", lastSeen: "12 min ago", os: "Windows 11 Pro 24H2", ip: "10.12.7.88", rustDeskPort: 21118 },
  { id: "DEV-10250", hostname: "TOK-DES-MB03", currentUser: "h.sato", branch: "Tokyo", department: "Design", status: "online", lastSeen: "just now", os: "Windows 11 Pro 23H2", ip: "10.88.2.31", rustDeskPort: 21118 },
];

const UNIQUE = <K extends keyof Device>(k: K) => Array.from(new Set(DEVICES.map((d) => String(d[k]))));

export function DeviceManagement() {
  const [role, setRole] = useState<Role>("admin");
  const [q, setQ] = useState("");
  const [branch, setBranch] = useState("all");
  const [department, setDepartment] = useState("all");
  const [status, setStatus] = useState("all");
  const [os, setOs] = useState("all");
  const [selectedId, setSelectedId] = useState<string | null>(DEVICES[0].id);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return DEVICES.filter((d) => {
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
  }, [q, branch, department, status, os]);

  const selected = filtered.find((d) => d.id === selectedId) ?? DEVICES.find((d) => d.id === selectedId) ?? null;

  const can = {
    connect: role === "admin" || role === "operator",
    history: true,
    restart: role === "admin",
    shutdown: role === "admin",
    copyIp: true,
  };

  return (
    <AppShell
      title="Devices"
      subtitle="All managed Windows endpoints"
      headerRight={
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search Device ID, Hostname, or Current User…"
            className="h-9 pl-9"
          />
        </div>
      }
    >
          <section className="flex min-w-0 flex-1 flex-col">
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
                {filtered.length} of {DEVICES.length} devices
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
                        <TableHead>Branch</TableHead>
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
                          <TableCell>{d.branch}</TableCell>
                          <TableCell>{d.department}</TableCell>
                          <TableCell>
                            <StatusPill status={d.status} />
                          </TableCell>
                          <TableCell className="text-muted-foreground">{d.lastSeen}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              size="sm"
                              disabled={!can.connect || d.status === "offline"}
                              onClick={(e) => {
                                e.stopPropagation();
                                toast.success(`Connecting to ${d.hostname}…`);
                              }}
                            >
                              Connect
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                      {filtered.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={8} className="h-32 text-center text-sm text-muted-foreground">
                            No devices match the current filters.
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
                <Button
                  className="col-span-2"
                  disabled={!can.connect || selected.status === "offline"}
                  onClick={() => toast.success(`Connecting to ${selected.hostname}…`)}
                >
                  <Plug className="mr-2 h-4 w-4" /> Connect
                </Button>
                <Button variant="outline" disabled={!can.history} onClick={() => toast("Opening session history…")}>
                  <ClipboardList className="mr-2 h-4 w-4" /> View History
                </Button>
                <Button
                  variant="outline"
                  disabled={!can.restart || selected.status === "offline"}
                  onClick={() => toast.success(`Restart sent to ${selected.hostname}`)}
                >
                  <RotateCw className="mr-2 h-4 w-4" /> Restart
                </Button>
                <Button
                  variant="outline"
                  disabled={!can.shutdown || selected.status === "offline"}
                  onClick={() => toast.success(`Shutdown sent to ${selected.hostname}`)}
                >
                  <Power className="mr-2 h-4 w-4" /> Shutdown
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    navigator.clipboard?.writeText(selected.ip);
                    toast.success(`Copied ${selected.ip}`);
                  }}
                >
                  <Copy className="mr-2 h-4 w-4" /> Copy IP
                </Button>
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
    </AppShell>
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