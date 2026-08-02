import { apiFetch } from "../../lib/apiClient";
import type { UserListDto, CreateUserRequest, UpdateUserRequest } from "./user.types";

export function getUsers(): Promise<UserListDto[]> {
  return apiFetch<UserListDto[]>("/api/users");
}
export function createUser(req: CreateUserRequest) {
  return apiFetch("/api/users", { method: "POST", body: JSON.stringify(req) });
}
export function updateUser(id: number, req: UpdateUserRequest) {
  return apiFetch(`/api/users/${id}`, { method: "PUT", body: JSON.stringify(req) });
}
export function disableUser(id: number, reason: string) {
  return apiFetch(`/api/users/${id}/disable`, { method: "POST", body: JSON.stringify({ reason }) });
}
export function enableUser(id: number) {
  return apiFetch(`/api/users/${id}/enable`, { method: "POST" });
}
