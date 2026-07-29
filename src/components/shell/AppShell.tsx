import { type ReactNode, useState } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { Bell, ChevronDown, LogOut, Menu, Plug, Search, ShieldAlert, User as UserIcon } from "lucide-react";
import { toast } from "sonner";

import { APP_NAV, ROUTE_META } from "@/lib/nav";
import { hasPermission, ROLE_LABELS, type ErapRole } from "@/lib/erap-roles";
import { getProfile, logout } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { cn } from "@/lib/utils";

// Cross-module role selector — module-scope state, so every route sees the
// same role. Keeps the polish scope demo-friendly without introducing a global
// store.
let currentRole: ErapRole = "Administrator";
const roleListeners = new Set<(r: ErapRole) => void>();
export function getRole() {
  return currentRole;
}
export function setRole(r: ErapRole) {
  currentRole = r;
  roleListeners.forEach((l) => l(r));
}
export function subscribeRole(cb: (r: ErapRole) => void) {
  roleListeners.add(cb);
  return () => {
    roleListeners.delete(cb);
  };
}

import { useEffect } from "react";
export function useAppRole() {
  const [r, setR] = useState<ErapRole>(currentRole);
  useEffect(() => subscribeRole(setR), []);
  return [r, setRole] as const;
}

export interface AppShellProps {
  children: ReactNode;
  /** Optional per-page breadcrumb override. */
  breadcrumbs?: { label: string; to?: string }[];
  /** Optional page title shown in the top bar. Defaults to route meta. */
  title?: string;
}

export function AppShell({ children, breadcrumbs, title }: AppShellProps) {
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const meta = ROUTE_META[pathname];
  const crumbs = breadcrumbs ?? meta?.breadcrumbs ?? [];
  const pageTitle = title ?? meta?.title ?? "Console";

  return (
    <TooltipProvider delayDuration={200}>
      <a
        href="#erap-main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded-md focus:bg-primary focus:px-3 focus:py-2 focus:text-primary-foreground"
      >
        Skip to main content
      </a>
      <div className="flex h-dvh w-full overflow-hidden bg-background text-foreground">
        <DesktopSidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <TopBar title={pageTitle} crumbs={crumbs} />
          <main id="erap-main" className="min-h-0 flex-1 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </TooltipProvider>
  );
}

function DesktopSidebar() {
  return (
    <aside
      aria-label="Primary"
      className="hidden w-64 shrink-0 flex-col bg-sidebar text-sidebar-foreground md:flex"
    >
      <BrandBlock />
      <NavBlock />
      <FooterBlock />
    </aside>
  );
}

function BrandBlock() {
  return (
    <div className="flex h-14 items-center gap-2 border-b border-sidebar-border px-4">
      <div className="grid h-8 w-8 place-items-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
        <Plug className="h-4 w-4" aria-hidden />
      </div>
      <div className="leading-tight">
        <div className="text-sm font-semibold">ERAP</div>
        <div className="text-[11px] text-sidebar-foreground/60">Remote Admin Console</div>
      </div>
    </div>
  );
}

function NavBlock() {
  const [role] = useAppRole();
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  return (
    <nav aria-label="Modules" className="flex-1 space-y-4 overflow-auto p-3">
      {APP_NAV.map((group) => (
        <div key={group.key}>
          <div className="px-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-sidebar-foreground/50">
            {group.label}
          </div>
          <div className="space-y-0.5">
            {group.items.map((item) => {
              const disabled = !!item.perm && !hasPermission(role, item.perm);
              const isActive = pathname === item.to;
              const Icon = item.icon;
              const inner = (
                <span
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                    isActive
                      ? "bg-sidebar-primary text-sidebar-primary-foreground"
                      : disabled
                        ? "cursor-not-allowed text-sidebar-foreground/40"
                        : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                  )}
                >
                  <Icon className="h-4 w-4" aria-hidden />
                  <span className="truncate">{item.label}</span>
                </span>
              );
              if (disabled) {
                return (
                  <Tooltip key={item.key}>
                    <TooltipTrigger asChild>
                      <div aria-disabled className="opacity-100">{inner}</div>
                    </TooltipTrigger>
                    <TooltipContent side="right">
                      Requires {item.perm} permission
                    </TooltipContent>
                  </Tooltip>
                );
              }
              return (
                <Link
                  key={item.key}
                  to={item.to}
                  aria-current={isActive ? "page" : undefined}
                >
                  {inner}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}

function FooterBlock() {
  return (
    <div className="border-t border-sidebar-border p-3 text-xs text-sidebar-foreground/60">
      <div className="flex items-center gap-1.5">
        <ShieldAlert className="h-3.5 w-3.5" aria-hidden />
        Private WAN · v2.5.0
      </div>
    </div>
  );
}

function TopBar({ title, crumbs }: { title: string; crumbs: { label: string; to?: string }[] }) {
  const [role, setRoleValue] = useAppRole();
  const navigate = useNavigate();
  const profile = getProfile();
  const displayName = profile?.fullName ?? profile?.username ?? "Account";
  const initials = (displayName.match(/\b\w/g) ?? ["A"]).slice(0, 2).join("").toUpperCase();

  function handleSignOut() {
    logout();
    toast.success("Signed out");
    navigate({ to: "/login" });
  }

  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b bg-card px-3 sm:px-4">
      <MobileNavTrigger />
      <div className="min-w-0 flex-1">
        <h1 className="truncate text-sm font-semibold" aria-live="polite">
          {title}
        </h1>
        {crumbs.length > 0 && (
          <Breadcrumb className="hidden sm:block">
            <BreadcrumbList className="text-[11px]">
              {crumbs.map((c, i) => {
                const last = i === crumbs.length - 1;
                return (
                  <span key={`${c.label}-${i}`} className="contents">
                    <BreadcrumbItem>
                      {last || !c.to ? (
                        <BreadcrumbPage>{c.label}</BreadcrumbPage>
                      ) : (
                        <BreadcrumbLink asChild>
                          <Link to={c.to}>{c.label}</Link>
                        </BreadcrumbLink>
                      )}
                    </BreadcrumbItem>
                    {!last && <BreadcrumbSeparator />}
                  </span>
                );
              })}
            </BreadcrumbList>
          </Breadcrumb>
        )}
      </div>
      <div className="relative hidden max-w-md flex-1 md:block">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
        <Input aria-label="Global search" placeholder="Search devices, users, sessions…" className="h-9 pl-9" />
      </div>
      <Select value={role} onValueChange={(v) => setRoleValue(v as ErapRole)}>
        <SelectTrigger aria-label="Active role" className="h-9 w-[180px] hidden sm:inline-flex">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {(Object.keys(ROLE_LABELS) as ErapRole[]).map((r) => (
            <SelectItem key={r} value={r}>
              Role: {ROLE_LABELS[r]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button variant="ghost" size="icon" aria-label="Notifications">
        <Bell className="h-4 w-4" aria-hidden />
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="flex items-center gap-2 rounded-md border px-2 py-1 text-xs hover:bg-accent"
            aria-label="Account menu"
          >
            <span className="grid h-6 w-6 place-items-center rounded-full bg-primary text-[10px] font-semibold text-primary-foreground">
              {initials}
            </span>
            <span className="hidden sm:inline">{displayName}</span>
            <ChevronDown className="h-3 w-3 text-muted-foreground" aria-hidden />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel className="flex flex-col gap-0.5">
            <span className="text-sm">{displayName}</span>
            {profile?.username && (
              <span className="text-[11px] font-normal text-muted-foreground">
                {profile.username}
              </span>
            )}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem disabled>
            <UserIcon className="mr-2 h-4 w-4" aria-hidden />
            Profile
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={handleSignOut} className="text-destructive focus:text-destructive">
            <LogOut className="mr-2 h-4 w-4" aria-hidden />
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}

function MobileNavTrigger() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden" aria-label="Open navigation">
          <Menu className="h-4 w-4" aria-hidden />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72 bg-sidebar p-0 text-sidebar-foreground">
        <SheetHeader className="border-b border-sidebar-border p-4">
          <SheetTitle className="text-sidebar-foreground">ERAP</SheetTitle>
        </SheetHeader>
        <NavBlock />
      </SheetContent>
    </Sheet>
  );
}