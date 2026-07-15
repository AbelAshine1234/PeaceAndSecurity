import { UserRole, UserStatus, OTPStatus, TokenType, OTPType } from "@/lib/enums";

export { UserRole, UserStatus, OTPStatus, TokenType, OTPType };

declare global {
  interface Window {
    google: any;
  }
}

export interface UserResponse {
  id: string;
  fullName: string;
  phoneNumber?: string;
  email: string;
  role: UserRole;
  password?: string;
  status: UserStatus;
  isPasswordSet: boolean;
  isPhoneVerified?: boolean;
  isEmailVerified?: boolean;
  permissions?: string[];
  profileImage?: string;
  latitude?: number;
  longitude?: number;
  lastLocationUpdate?: string | Date;
  assignedArea?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaginatedResponse<T> {
  data?: T[];
  users?: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  previousPage?: number | null;
  nextPage?: number | null;
}

export interface UserFilterParams {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
  status?: string;
  isStaffUser?: boolean;
  startDate?: string;
  endDate?: string;
  sortBy?: string;
  sortOrder?: "ASC" | "DESC";
}

export type LoginStep = "identifier" | "password" | "set-password";
