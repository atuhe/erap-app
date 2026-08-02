import { useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { registerDevice, type RegisterDeviceRequest } from "./deviceService";

const EMPTY: RegisterDeviceRequest = {
  hostname: "", currentUsername: "", branch: "", department: "",
  ipAddress: "", rustDeskId: "", rustDeskPort: 21118, osVersion: "",
};

export function AddDeviceDialog({
  open, onOpenChange, onAdded,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onAdded: () => void;
}) {
  const [form, setForm] = useState<RegisterDeviceRequest>(EMPTY);
  const [saving, setSaving] = useState(false);

  const set = (k: keyof RegisterDeviceRequest, v: string) =>
    setForm((f) => ({ ...f, [k]: k === "rustDeskPort" ? (v ? Number(v) : null) : v }));

  async function save() {
    if (!form.hostname.trim()) {
      toast.error("Hostname is required");
      return;
    }
    setSaving(true);
    try {
      await registerDevice(form);
      toast.success(`Device ${form.hostname} added`);
      setForm(EMPTY);
      onAdded();
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to add device");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Add device</DialogTitle>
          <DialogDescription>
            Register a Windows endpoint. The RustDesk ID is how ERAP connects to modem/CGNAT machines;
            the IP is used for direct LAN connections. Hostname is required.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-3 py-2">
          <Field label="Hostname *"><Input value={form.hostname ?? ""} onChange={(e) => set("hostname", e.target.value)} placeholder="HQ-FIN-PC01" /></Field>
          <Field label="Current user"><Input value={form.currentUsername ?? ""} onChange={(e) => set("currentUsername", e.target.value)} placeholder="m.chowdhury" /></Field>
          <Field label="RustDesk ID"><Input value={form.rustDeskId ?? ""} onChange={(e) => set("rustDeskId", e.target.value)} placeholder="1583689580" /></Field>
          <Field label="RustDesk port"><Input value={String(form.rustDeskPort ?? "")} onChange={(e) => set("rustDeskPort", e.target.value)} placeholder="21118" /></Field>
          <Field label="IP address"><Input value={form.ipAddress ?? ""} onChange={(e) => set("ipAddress", e.target.value)} placeholder="172.16.1.200" /></Field>
          <Field label="OS version"><Input value={form.osVersion ?? ""} onChange={(e) => set("osVersion", e.target.value)} placeholder="Windows 11" /></Field>
          <Field label="Branch"><Input value={form.branch ?? ""} onChange={(e) => set("branch", e.target.value)} placeholder="Headquarters" /></Field>
          <Field label="Department"><Input value={form.department ?? ""} onChange={(e) => set("department", e.target.value)} placeholder="Finance" /></Field>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancel</Button>
          <Button onClick={save} disabled={saving}>{saving ? "Adding…" : "Add device"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      {children}
    </div>
  );
}
