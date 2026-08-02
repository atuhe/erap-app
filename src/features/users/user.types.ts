export interface UserListDto {
  userId: number;
  armyNo: string | null;
  rank: string | null;
  username: string;
  fullName: string;          // "Names"
  unit: string | null;
  department: string | null;
  isActive: boolean;
  lastLogin: string | null;  // ISO
  roles: string[];
}

export interface CreateUserRequest {
  armyNo: string;
  rank: string;
  fullName: string;
  username: string;
  password: string;
  unit?: string | null;
  department?: string | null;
  roleName: string;
}

export interface UpdateUserRequest {
  armyNo: string;
  rank: string;
  fullName: string;
  unit?: string | null;
  department?: string | null;
  roleName: string;
  password?: string | null;  // only reset if provided
}
