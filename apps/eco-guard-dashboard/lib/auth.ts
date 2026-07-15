import { UserStatus, UserRole } from "./enums";
export { UserStatus, UserRole };

export interface User {
  id: string;
  userCode?: string;
  email: string;
  fullName?: string;
  role: UserRole;
  phoneNumber?: string;
  password?: string;
  isPasswordSet?: boolean;
  address?: string;
  isPhoneVerified?: boolean;
  isEmailVerified?: boolean;
  status?: UserStatus;
  profileImage?: string;
  permissions?: string[];
  latitude?: number;
  longitude?: number;
  lastLocationUpdate?: string | Date;
  assignedArea?: string;
  createdAt: string | Date;
  updatedAt?: string | Date;
}

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  isServerActive: boolean;
  isCheckingServer: boolean;
  login: (
    email: string,
    password: string,
    phoneNumber?: string
  ) => Promise<void>;
  loginWithData: (user: User) => void;
  logout: () => void;
  canAccess: (requiredRoles: UserRole[]) => boolean;
  hasPermission: (permission: string) => boolean;
}

export async function validateCredentials(
  email?: string,
  password?: string,
  phoneNumber?: string
): Promise<User> {
  const { authService } = await import("./services/auth-service");
  const { user } = await authService.login({ email, password: password || "", phoneNumber });
  return user;
}

/**
 * Page-level route permissions by role.
 * System Admins have full access.
 * Patrol officers can view reports and their own settings.
 * Citizens access the system via the mobile app only.
 */
export const rolePermissions: Record<UserRole, string[]> = {
  [UserRole.SYSTEM_SUPER_ADMIN]: [
    "dashboard",
    "reports",
    "violations",
    "cameras",
    "staff_management",
    "settings",
  ],
  [UserRole.SYSTEM_ADMIN]: [
    "dashboard",
    "reports",
    "violations",
    "cameras",
    "staff_management",
    "settings",
  ],
  [UserRole.PATROL]: [
    "dashboard",
    "reports",
    "settings",
  ],
  [UserRole.CITIZEN]: [
    // Citizens access via mobile app, not this dashboard
    "reports",
  ],
};
