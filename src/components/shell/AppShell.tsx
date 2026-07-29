import { type ReactNode, createContext, useContext, useEffect, useState } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { Bell, ChevronDown, ChevronsLeft, ChevronsRight, LogOut, Menu, Search, ShieldAlert, User as UserIcon } from "lucide-react";
import { toast } from "sonner";

import { APP_NAV, ROUTE_META } from "@/lib/nav";
import { hasPermission, ROLE_LABELS, ALL_ROLES, type ErapRole } from "@/lib/erap-roles";
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

function deriveRole(roles: string[] | undefined): ErapRole {
  const found = (roles ?? []).find((r) => (ALL_ROLES as string[]).includes(r));
  return (found as ErapRole) ?? "Viewer";
}

export function useAppRole() {
  // The role now comes from the authenticated user's profile — not a switcher.
  const role = deriveRole(getProfile()?.roles);
  return [role, setRole] as const;
}

const COLLAPSE_KEY = "erap:sidebar:collapsed";
const SidebarCollapseCtx = createContext<{ collapsed: boolean; toggle: () => void }>({
  collapsed: false,
  toggle: () => {},
});

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
  const [collapsed, setCollapsed] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    setCollapsed(window.localStorage.getItem(COLLAPSE_KEY) === "1");
  }, []);
  const toggle = () => {
    setCollapsed((v) => {
      const next = !v;
      if (typeof window !== "undefined") {
        window.localStorage.setItem(COLLAPSE_KEY, next ? "1" : "0");
      }
      return next;
    });
  };

  return (
    <SidebarCollapseCtx.Provider value={{ collapsed, toggle }}>
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
    </SidebarCollapseCtx.Provider>
  );
}

function DesktopSidebar() {
  const { collapsed } = useContext(SidebarCollapseCtx);
  return (
    <aside
      aria-label="Primary"
      data-collapsed={collapsed ? "true" : "false"}
      className={cn(
        "hidden shrink-0 flex-col bg-sidebar text-sidebar-foreground transition-[width] duration-200 md:flex",
        collapsed ? "w-16" : "w-64",
      )}
    >
      <BrandBlock />
      <NavBlock />
      <FooterBlock />
    </aside>
  );
}

function BrandBlock() {
  const { collapsed, toggle } = useContext(SidebarCollapseCtx);
  return (
    <div className={cn(
      "flex h-14 items-center gap-2.5 border-b border-sidebar-border",
      collapsed ? "justify-center px-2" : "px-4",
    )}>
      <div className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground font-bold text-sm tracking-tight shadow-sm">
        E
      </div>
      {!collapsed && (
        <>
          <div className="min-w-0 flex-1 leading-tight">
            <div className="text-sm font-semibold tracking-wide text-sidebar-foreground">ERAP</div>
            <div className="text-[10px] uppercase tracking-wider text-sidebar-foreground/50">Remote Administration</div>
          </div>
          <button
            type="button"
            onClick={toggle}
            aria-label="Collapse sidebar"
            className="grid h-7 w-7 place-items-center rounded-md text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          >
            <ChevronsLeft className="h-4 w-4" aria-hidden />
          </button>
        </>
      )}
    </div>
  );
}

function NavBlock() {
  const [role] = useAppRole();
  const { collapsed } = useContext(SidebarCollapseCtx);
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  return (
    <nav aria-label="Modules" className={cn("flex-1 overflow-auto", collapsed ? "space-y-2 p-2" : "space-y-4 p-3")}>
      {APP_NAV.map((group) => (
        <div key={group.key}>
          {collapsed ? (
            <div className="mx-2 mb-1 h-px bg-sidebar-border" aria-hidden />
          ) : (
            <div className="px-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-sidebar-foreground/50">
              {group.label}
            </div>
          )}
          <div className="space-y-0.5">
            {group.items.map((item) => {
              const disabled = !!item.perm && !hasPermission(role, item.perm);
              const isActive = pathname === item.to;
              const Icon = item.icon;
              const inner = (
                <span
                  className={cn(
                    "flex items-center rounded-md border-l-[3px] text-sm transition-colors",
                    collapsed ? "justify-center gap-0 px-0 py-2" : "gap-3 px-3 py-2",
                    isActive
                      ? "border-sidebar-primary bg-sidebar-accent text-sidebar-accent-foreground font-semibold"
                      : disabled
                        ? "cursor-not-allowed border-transparent text-sidebar-foreground/40"
                        : "border-transparent text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
                  )}
                >
                  <Icon className="h-4 w-4" aria-hidden />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </span>
              );
              if (disabled) {
                return (
                  <Tooltip key={item.key}>
                    <TooltipTrigger asChild>
                      <div aria-disabled className="opacity-100">{inner}</div>
                    </TooltipTrigger>
                    <TooltipContent side="right">
                      {item.label} — requires {item.perm} permission
                    </TooltipContent>
                  </Tooltip>
                );
              }
              const link = (
                <Link
                  key={item.key}
                  to={item.to}
                  aria-current={isActive ? "page" : undefined}
                  title={collapsed ? item.label : undefined}
                >
                  {inner}
                </Link>
              );
              if (collapsed) {
                return (
                  <Tooltip key={item.key}>
                    <TooltipTrigger asChild>{link}</TooltipTrigger>
                    <TooltipContent side="right">{item.label}</TooltipContent>
                  </Tooltip>
                );
              }
              return link;
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}

function FooterBlock() {
  const { collapsed, toggle } = useContext(SidebarCollapseCtx);
  if (collapsed) {
    return (
      <div className="border-t border-sidebar-border p-2">
        <button
          type="button"
          onClick={toggle}
          aria-label="Expand sidebar"
          className="grid h-8 w-full place-items-center rounded-md text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        >
          <ChevronsRight className="h-4 w-4" aria-hidden />
        </button>
      </div>
    );
  }
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
  const [role] = useAppRole();
  const navigate = useNavigate();
  const profile = getProfile();
  const displayName = profile?.fullName ?? profile?.username ?? "Account";
  const initials = (displayName.match(/\b\w/g) ?? ["A"]).slice(0, 2).join("").toUpperCase();

  function handleSignOut() {
    logout();
    toast.success("Signed out");
    navigate({ to: "/login", search: { redirect: undefined } });
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
      <div
        className="hidden h-9 items-center gap-1.5 rounded-md border px-3 text-xs font-medium text-muted-foreground sm:inline-flex"
        aria-label="Your role"
        title="Your assigned role"
      >
        <span className="text-foreground">{ROLE_LABELS[role]}</span>
      </div>
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