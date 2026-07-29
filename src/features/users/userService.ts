import { apiFetch } from "../../lib/apiClient";
import type { UserListDto } from "./user.types";

export function getUsers(): Promise<UserListDto[]> {
  return apiFetch<UserListDto[]>("/api/users");
}
