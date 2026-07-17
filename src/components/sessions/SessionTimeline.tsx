import { CheckCircle2, ShieldCheck, Wifi, Send, PlugZap, Clock, Ban, MessageSquare, FolderUp, Info, AlertTriangle, Power } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SessionEvent, SessionEventKind } from "@/lib/sessions";

const META: Record<SessionEventKind, { label: string; icon: React.ComponentType<{ className?: string }>; tone: string }> = {
  request_created:    { label: "Request created",      icon: PlugZap,       tone: "text-primary" },
  permission_verified:{ label: "Permissions verified", icon: ShieldCheck,   tone: "text-emerald-600" },
  agent_ok:           { label: "Agent reachable",      icon: Wifi,          tone: "text-emerald-600" },
  approval_requested: { label: "Approval requested",   icon: Send,          tone: "text-amber-600" },
  approved:           { label: "Approved",             icon: CheckCircle2,  tone: "text-emerald-600" },
  declined:           { label: "Declined",             icon: Ban,           tone: "text-red-600" },
  connected:          { label: "Connected",            icon: PlugZap,       tone: "text-emerald-600" },
  disconnected:       { label: "Disconnected",         icon: Power,         tone: "text-slate-600" },
  error:              { label: "Error",                icon: AlertTriangle, tone: "text-red-600" },
  chat:               { label: "Chat",                 icon: MessageSquare, tone: "text-primary" },
  file:               { label: "File transfer",        icon: FolderUp,      tone: "text-primary" },
  info:               { label: "Info",                 icon: Info,          tone: "text-muted-foreground" },
};

export function SessionTimeline({ events }: { events: SessionEvent[] | undefined }) {
  if (!events?.length) {
    return <div className="rounded-md border border-dashed p-4 text-center text-xs text-muted-foreground">No timeline events recorded.</div>;
  }
  const sorted = [...events].sort((a, b) => a.ts - b.ts);
  return (
    <ol className="relative ml-2 space-y-3 border-l pl-4">
      {sorted.map((e, i) => {
        const m = META[e.kind] ?? META.info;
        const Icon = m.icon;
        return (
          <li key={i} className="relative">
            <span className="absolute -left-[22px] top-0.5 grid h-4 w-4 place-items-center rounded-full border bg-background">
              <Icon className={cn("h-2.5 w-2.5", m.tone)} />
            </span>
            <div className="flex items-baseline gap-2 text-xs">
              <span className="font-medium">{m.label}</span>
              <span className="text-[10px] text-muted-foreground">{new Date(e.ts).toLocaleTimeString()}</span>
            </div>
            <div className="text-xs text-muted-foreground">{e.message}</div>
          </li>
        );
      })}
      <li className="relative">
        <span className="absolute -left-[22px] top-0.5 grid h-4 w-4 place-items-center rounded-full border bg-muted">
          <Clock className="h-2.5 w-2.5 text-muted-foreground" />
        </span>
      </li>
    </ol>
  );
}