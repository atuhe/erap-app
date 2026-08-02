import { useEffect, useMemo, useState } from "react";
import { Search, Plus, Pencil, Ban, RotateCcw } from "lucide-react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { ALL_ROLES, ROLE_LABELS, hasPermission, type ErapRole } from "@/lib/erap-roles";
import { useAppRole } from "@/components/shell/AppShell";
import { getUsers, disableUser, enableUser } from "@/features/users/userService";
import type { UserListDto } from "@/features/users/user.types";
import { UserFormDialog } from "@/features/users/UserFormDialog";

function fmtDate(iso: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  return isNaN(d.getTime()) ? "—" : d.toLocaleString();
}

export function UsersModule() {
  const [role] = useAppRole();
  const canManage = hasPermission(role, "manage_users");

  const [users, setUsers] = useState<UserListDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [fRole, setFRole] = useState("all");
  const [fStatus, setFStatus] = useState("all");

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<UserListDto | null>(null);
  const [disabling, setDisabling] = useState<UserListDto | null>(null);
  const [reason, setReason] = useState("");

  const reload = () =>
    getUsers().then(setUsers).catch((e) => toast.error(e?.message ?? "Failed to load users")).finally(() => setLoading(false));

  useEffect(() => { void reload(); }, []);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return users.filter((u) => {
      const uRole = u.roles?.[0] ?? "";
      if (fRole !== "all" && uRole !== fRole) return false;
      if (fStatus === "active" && !u.isActive) return false;
      if (fStatus === "disabled" && u.isActive) return false;
      if (!term) return true;
      return (
        (u.armyNo ?? "").toLowerCase().includes(term) ||
        u.fullName.toLowerCase().includes(term) ||
        u.username.toLowerCase().includes(term) ||
        (u.unit ?? "").toLowerCase().includes(term)
      );
    });
  }, [users, q, fRole, fStatus]);

  function openAdd() { setEditing(null); setFormOpen(true); }
  function openEdit(u: UserListDto) { setEditing(u); setFormOpen(true); }

  async function confirmDisable() {
    if (!disabling) return;
    if (!reason.trim()) { toast.error("A reason is required"); return; }
    try {
      await disableUser(disabling.userId, reason);
      toast.success(`Disabled ${disabling.fullName}`);
      setDisabling(null); setReason("");
      void reload();
    } catch (e: any) { toast.error(e?.message ?? "Failed"); }
  }

  async function onEnable(u: UserListDto) {
    try { await enableUser(u.userId); toast.success(`Enabled ${u.fullName}`); void reload(); }
    catch (e: any) { toast.error(e?.message ?? "Failed"); }
  }

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-[260px] flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search Army No, Names, Username, or Unit…" className="h-9 pl-9" />
            </div>
            <Select value={fRole} onValueChange={setFRole}>
              <SelectTrigger className="h-9 w-[190px]"><SelectValue placeholder="Role" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                {ALL_ROLES.map((r) => <SelectItem key={r} value={r}>{ROLE_LABELS[r]}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={fStatus} onValueChange={setFStatus}>
              <SelectTrigger className="h-9 w-[150px]"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="disabled">Disabled</SelectItem>
              </SelectContent>
            </Select>
            {canManage && (
              <Button className="ml-auto" onClick={openAdd}><Plus className="mr-1 h-4 w-4" /> Add user</Button>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="overflow-hidden rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40">
              <TableHead>Army No</TableHead>
              <TableHead>Rank</TableHead>
              <TableHead>Names</TableHead>
              <TableHead>Username</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Unit</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Last Login</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={10} className="py-8 text-center text-sm text-muted-foreground">Loading users…</TableCell></TableRow>
            ) : filtered.length === 0 ? (
              <TableRow><TableCell colSpan={10} className="py-8 text-center text-sm text-muted-foreground">No users found.</TableCell></TableRow>
            ) : filtered.map((u) => (
              <TableRow key={u.userId}>
                <TableCell className="font-mono text-xs">{u.armyNo ?? "—"}</TableCell>
                <TableCell className="font-medium">{u.rank ?? "—"}</TableCell>
                <TableCell className="font-medium">{u.fullName}</TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">{u.username}</TableCell>
                <TableCell><Badge variant="outline" className="border-transparent bg-primary/10 font-medium text-primary">{u.roles?.[0] ?? "—"}</Badge></TableCell>
                <TableCell>{u.unit ?? "—"}</TableCell>
                <TableCell>{u.department ?? "—"}</TableCell>
                <TableCell className="text-xs text-muted-foreground">{fmtDate(u.lastLogin)}</TableCell>
                <TableCell>
                  <Badge variant="outline" className={cn("border-transparent font-medium",
                    u.isActive ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" : "bg-red-500/10 text-red-700 dark:text-red-400")}>
                    {u.isActive ? "Active" : "Disabled"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  {canManage ? (
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(u)}><Pencil className="mr-1 h-3.5 w-3.5" />Edit</Button>
                      {u.isActive ? (
                        <Button variant="ghost" size="sm" className="text-red-600" onClick={() => { setDisabling(u); setReason(""); }}><Ban className="mr-1 h-3.5 w-3.5" />Disable</Button>
                      ) : (
                        <Button variant="ghost" size="sm" onClick={() => onEnable(u)}><RotateCcw className="mr-1 h-3.5 w-3.5" />Enable</Button>
                      )}
                    </div>
                  ) : <span className="text-xs text-muted-foreground">—</span>}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <UserFormDialog open={formOpen} onOpenChange={setFormOpen} editing={editing} onSaved={() => void reload()} />

      <Dialog open={!!disabling} onOpenChange={(v) => !v && setDisabling(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Disable user</DialogTitle>
            <DialogDescription>
              Users are never deleted — only deactivated. State a reason; it is recorded in the audit log.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5 py-2">
            <Label className="text-xs">Reason *</Label>
            <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Transferred out of unit" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDisabling(null)}>Cancel</Button>
            <Button className="bg-red-600 hover:bg-red-700" onClick={confirmDisable}>Disable user</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
