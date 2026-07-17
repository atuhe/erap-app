import type { ReactNode } from "react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

export interface DetailSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  description?: ReactNode;
  side?: "right" | "left" | "top" | "bottom";
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
}

export function DetailSheet({
  open,
  onOpenChange,
  title,
  description,
  side = "right",
  children,
  footer,
  className,
}: DetailSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side={side} className={cn("flex w-full flex-col gap-0 sm:max-w-lg", className)}>
        <SheetHeader className="border-b">
          <SheetTitle>{title}</SheetTitle>
          {description && <SheetDescription>{description}</SheetDescription>}
        </SheetHeader>
        <div className="min-h-0 flex-1 overflow-auto p-4">{children}</div>
        {footer && <div className="border-t p-4">{footer}</div>}
      </SheetContent>
    </Sheet>
  );
}