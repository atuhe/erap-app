import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { StatusTone } from "./StatusPill";

export interface KpiCardProps {
  label: string;
  value: string | number;
  hint?: string;
  icon?: LucideIcon;
  tone?: StatusTone;
  className?: string;
}

const TONE_ACCENT: Record<StatusTone, string> = {
  success: "text-success",
  online: "text-success",
  warning: "text-warning",
  pending: "text-warning",
  danger: "text-danger",
  offline: "text-danger",
  info: "text-info",
  neutral: "text-muted-foreground",
};

export function KpiCard({ label, value, hint, icon: Icon, tone = "neutral", className }: KpiCardProps) {
  return (
    <div className={cn("rounded-lg border bg-card p-4 shadow-sm", className)}>
      <div className="flex items-center justify-between">
        <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</div>
        {Icon && <Icon className={cn("h-4 w-4", TONE_ACCENT[tone])} aria-hidden />}
      </div>
      <div className="mt-2 text-2xl font-semibold tracking-tight text-foreground">{value}</div>
      {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
    </div>
  );
}

export function KpiRow({
  children,
  cols = 4,
  className,
}: {
  children: React.ReactNode;
  cols?: 2 | 3 | 4 | 5 | 6;
  className?: string;
}) {
  const colClass =
    cols === 6 ? "md:grid-cols-3 lg:grid-cols-6"
    : cols === 5 ? "md:grid-cols-3 lg:grid-cols-5"
    : cols === 4 ? "md:grid-cols-2 lg:grid-cols-4"
    : cols === 3 ? "md:grid-cols-3"
    : "grid-cols-2";
  return <div className={cn("grid gap-3 grid-cols-2", colClass, className)}>{children}</div>;
}