import { type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TableSkeleton } from "./LoadingSkeleton";
import { EmptyState } from "./EmptyState";
import { ErrorState } from "./ErrorState";

export interface DataTableColumn<T> {
  key: string;
  header: ReactNode;
  cell: (row: T) => ReactNode;
  className?: string;
  headClassName?: string;
  hideBelow?: "sm" | "md" | "lg" | "xl";
}

export interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  rows: T[];
  keyOf: (row: T) => string;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: ReactNode;
  onRowClick?: (row: T) => void;
  selectedKey?: string;
  toolbar?: ReactNode;
  caption?: string;
  className?: string;
}

const HIDE = {
  sm: "hidden sm:table-cell",
  md: "hidden md:table-cell",
  lg: "hidden lg:table-cell",
  xl: "hidden xl:table-cell",
} as const;

export function DataTable<T>({
  columns,
  rows,
  keyOf,
  loading,
  error,
  onRetry,
  emptyTitle = "No records",
  emptyDescription = "Nothing here yet.",
  emptyAction,
  onRowClick,
  selectedKey,
  toolbar,
  caption,
  className,
}: DataTableProps<T>) {
  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {toolbar}
      {loading ? (
        <TableSkeleton rows={6} cols={Math.min(columns.length, 6)} />
      ) : error ? (
        <ErrorState title="Couldn't load data" description={error} onRetry={onRetry} />
      ) : rows.length === 0 ? (
        <EmptyState title={emptyTitle} description={emptyDescription} action={emptyAction} />
      ) : (
        <div className="overflow-hidden rounded-lg border bg-card">
          <div className="overflow-x-auto">
            <Table>
              {caption && <caption className="sr-only">{caption}</caption>}
              <TableHeader>
                <TableRow className="bg-muted/40">
                  {columns.map((c) => (
                    <TableHead
                      key={c.key}
                      className={cn(c.hideBelow && HIDE[c.hideBelow], c.headClassName)}
                    >
                      {c.header}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => {
                  const k = keyOf(row);
                  return (
                    <TableRow
                      key={k}
                      data-state={selectedKey === k ? "selected" : undefined}
                      className={onRowClick ? "cursor-pointer" : undefined}
                      onClick={onRowClick ? () => onRowClick(row) : undefined}
                    >
                      {columns.map((c) => (
                        <TableCell
                          key={c.key}
                          className={cn(c.hideBelow && HIDE[c.hideBelow], c.className)}
                        >
                          {c.cell(row)}
                        </TableCell>
                      ))}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  );
}