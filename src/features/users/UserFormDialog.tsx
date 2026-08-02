import { useEffect, useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select";
import { toast } from "sonner";
import { ALL_ROLES, ROLE_LABELS, type ErapRole } from "@/lib/erap-roles";
import { RANKS } from "./ranks";
import { createUser, updateUser } from "./userService";
import type { UserListDto } from "./user.types";

export function UserFormDialog({
  open, onOpenChange, editing, onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editing?: UserListDto | null;   // present = edit mode
  onSaved: () => void;
}) {
  const isEdit = !!editing;
  const [armyNo, setArmyNo] = useState("");
  const [rank, setRank] = useState("");
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [unit, setUnit] = useState("");
  const [department, setDepartment] = useState("");
  const [role, setRole] = useState<ErapRole>("Viewer");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setArmyNo(editing?.armyNo ?? "");
      setRank(editing?.rank ?? "");
      setFullName(editing?.fullName ?? "");
      setUsername(editing?.username ?? "");
      setPassword("");
      setUnit(editing?.unit ?? "");
      setDepartment(editing?.department ?? "");
      setRole((editing?.roles?.[0] as ErapRole) ?? "Viewer");
    }
  }, [open, editing]);

  async function save() {
    if (!armyNo.trim() || !fullName.trim() || !rank || !role) {
      toast.error("Army No, Rank, Names and Role are required");
      return;
    }
    if (!isEdit && (!username.trim() || !password.trim())) {
      toast.error("Username and password are required for a new user");
      return;
    }
    setSaving(true);
    try {
      if (isEdit && editing) {
        await updateUser(editing.userId, {
          armyNo, rank, fullName, unit, department, roleName: role,
          password: password.trim() ? password : null,
        });
        toast.success(`Updated ${rank} ${fullName}`);
      } else {
        await createUser({
          armyNo, rank, fullName, username, password, unit, department, roleName: role,
        });
        toast.success(`Added ${rank} ${fullName}`);
      }
      onSaved();
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e?.message ?? "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit user" : "Add user"}</DialogTitle>
          <DialogDescription>
            {isEdit ? "Update this soldier's record and role." : "Register a new user. Army No must be unique."}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-3 py-2">
          <Field label="Army No *"><Input value={armyNo} onChange={(e) => setArmyNo(e.target.value)} placeholder="RA/123456" /></Field>
          <Field label="Rank *">
            <Select value={rank} onValueChange={setRank}>
              <SelectTrigger><SelectValue placeholder="Select rank" /></SelectTrigger>
              <SelectContent>{RANKS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <Field label="Names *"><Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Okello John" /></Field>
          <Field label="Username *"><Input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="j.okello" disabled={isEdit} /></Field>
          <Field label="Unit"><Input value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="2nd Division" /></Field>
          <Field label="Department"><Input value={department} onChange={(e) => setDepartment(e.target.value)} placeholder="JS MIS" /></Field>
          <Field label="Role *">
            <Select value={role} onValueChange={(v) => setRole(v as ErapRole)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{ALL_ROLES.map((r) => <SelectItem key={r} value={r}>{ROLE_LABELS[r]}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <Field label={isEdit ? "Reset password" : "Password *"}>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder={isEdit ? "leave blank to keep" : "initial password"} />
          </Field>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancel</Button>
          <Button onClick={save} disabled={saving}>{saving ? "Saving…" : isEdit ? "Save changes" : "Add user"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><Label className="text-xs">{label}</Label>{children}</div>;
}
