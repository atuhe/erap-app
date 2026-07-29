// Mirrors the backend UserListDto.
export interface UserListDto {
  userId: number;
  username: string;
  fullName: string;
  isActive: boolean;
  branch: string | null;
  roles: string[];
}
