import { ChevronDown, LogOut, User as UserIcon } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

import { logout, useAuth } from "@/lib/auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

/**
 * Shared account chip — shows the current viewer's initials + name and
 * exposes a Sign out action. Every module top bar renders this so login /
 * logout state is synchronised across the app.
 */
export function AccountBadge() {
  const navigate = useNavigate();
  const { profile, viewerName: name, viewerInitials: initials, isAuthenticated } = useAuth();

  if (!isAuthenticated) return null;

  function handleSignOut() {
    logout();
    toast.success("Signed out");
    navigate({ to: "/login", search: { redirect: undefined } });
  }

  return (
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
          <span className="hidden sm:inline">{name}</span>
          <ChevronDown className="h-3 w-3 text-muted-foreground" aria-hidden />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="flex flex-col gap-0.5">
          <span className="text-sm">{name}</span>
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
  );
}