import { useEffect, useState } from "react";
import type { ErapRole } from "@/lib/erap-roles";
import { ALL_ROLES } from "@/lib/erap-roles";
import { getUsers } from "./userService";
import type { UserListDto } from "./user.types";

// The rich shape the Users page renders. Fields the backend doesn't hold yet
// are shown honestly as "—" rather than faked.
export interface AppUser {
  id: string;
  fullName: string;
  username: string;
  employeeNo: string;
  email: string;
  phone: string;
  role: ErapRole;
  branch: string;
  department: string;
  position: string;
  supervisor: string;
  status: "active" | "locked" | "disabled";
  lastLogin: string;
  createdAt: string;
  passwordChanged: string;
  mfa: boolean;
  online: boolean;
}

function toRole(roles: string[]): ErapRole {
  const r = roles.find((x) => (ALL_ROLES as string[]).includes(x));
  return (r as ErapRole) ?? "Viewer";
}

function toAppUser(d: UserListDto): AppUser {
  return {
    id: `U-${d.userId}`,
    fullName: d.fullName,
    username: d.username,
    employeeNo: "—",
    email: "—",
    phone: "—",
    role: toRole(d.roles),
    branch: d.branch ?? "—",
    department: "—",
    position: "—",
    supervisor: "—",
    status: d.isActive ? "active" : "disabled",
    lastLogin: "—",
    createdAt: "—",
    passwordChanged: "—",
    mfa: false,
    online: false,
  };
}

export function useBackendUsers(intervalMs = 15000): AppUser[] {
  const [users, setUsers] = useState<AppUser[]>([]);
  useEffect(() => {
    let alive = true;
    const load = () =>
      getUsers()
        .then((rows) => { if (alive) setUsers(rows.map(toAppUser)); })
        .catch(() => { /* keep last good */ });
    load();
    const t = setInterval(load, intervalMs);
    return () => { alive = false; clearInterval(t); };
  }, [intervalMs]);
  return users;
}
