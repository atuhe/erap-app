import type { ReactNode } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface WizardStep {
  key: string;
  label: string;
}

export function WizardStepper({
  steps,
  currentIndex,
  className,
}: {
  steps: WizardStep[];
  currentIndex: number;
  className?: string;
}) {
  return (
    <ol className={cn("flex items-center gap-2", className)} aria-label="Wizard progress">
      {steps.map((s, i) => {
        const done = i < currentIndex;
        const active = i === currentIndex;
        return (
          <li key={s.key} className="flex flex-1 items-center gap-2">
            <span
              className={cn(
                "grid h-6 w-6 shrink-0 place-items-center rounded-full text-[11px] font-semibold ring-1 ring-inset",
                done
                  ? "bg-primary text-primary-foreground ring-primary"
                  : active
                    ? "bg-primary/10 text-primary ring-primary/40"
                    : "bg-muted text-muted-foreground ring-border",
              )}
              aria-current={active ? "step" : undefined}
            >
              {done ? <Check className="h-3.5 w-3.5" aria-hidden /> : i + 1}
            </span>
            <span className={cn("truncate text-xs", active ? "font-medium text-foreground" : "text-muted-foreground")}>
              {s.label}
            </span>
            {i < steps.length - 1 && <span className="h-px flex-1 bg-border" aria-hidden />}
          </li>
        );
      })}
    </ol>
  );
}

export function WizardFooter({ children }: { children: ReactNode }) {
  return <div className="flex items-center justify-end gap-2 border-t pt-4">{children}</div>;
}