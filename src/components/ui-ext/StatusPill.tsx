import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type StatusTone =
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "neutral"
  | "online"
  | "offline"
  | "pending";

const TONE: Record<StatusTone, string> = {
  success: "bg-success/10 text-success ring-success/30",
  warning: "bg-warning/10 text-warning ring-warning/30",
  danger: "bg-danger/10 text-danger ring-danger/30",
  info: "bg-info/10 text-info ring-info/30",
  neutral: "bg-muted text-muted-foreground ring-border",
  online: "bg-success/10 text-success ring-success/30",
  offline: "bg-danger/10 text-danger ring-danger/30",
  pending: "bg-warning/10 text-warning ring-warning/30",
};

export interface StatusPillProps {
  tone?: StatusTone;
  children: ReactNode;
  icon?: ReactNode;
  className?: string;
}

export function StatusPill({ tone = "neutral", children, icon, className }: StatusPillProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset",
        TONE[tone],
        className,
      )}
    >
      {icon}
      {children}
    </span>
  );
}

export function Dot({ tone = "neutral" }: { tone?: StatusTone }) {
  const dotClass =
    tone === "success" || tone === "online"
      ? "bg-success"
      : tone === "danger" || tone === "offline"
        ? "bg-danger"
        : tone === "warning" || tone === "pending"
          ? "bg-warning"
          : tone === "info"
            ? "bg-info"
            : "bg-muted-foreground";
  return <span className={cn("h-1.5 w-1.5 rounded-full", dotClass)} aria-hidden />;
}