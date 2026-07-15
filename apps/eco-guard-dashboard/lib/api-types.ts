// Backend API Response Types

// Backend uses different role names than frontend
export enum UserRole {
    SYSTEM_SUPER_ADMIN = 'SYSTEM_SUPER_ADMIN',
    SYSTEM_ADMIN = 'SYSTEM_ADMIN',
    PATROL = 'PATROL',
    CITIZEN = 'CITIZEN',
}

export interface ServiceResponse<T = any> {
    success: boolean;
    message: string;
    data?: T;
    total?: number;
    page?: number;
    limit?: number;
    totalPages?: number;
    error?: any;
}

export interface BackendUser {
    id: string;
    email?: string;
    phoneNumber?: string;
    fullName: string;
    role: UserRole;
    profileImage?: string;
    permissions?: string[];
    status?: string;
    isPasswordSet: boolean;
    isPhoneVerified?: boolean;
    isEmailVerified?: boolean;
    createdAt: string | Date;
    updatedAt?: string | Date;
}

export interface LoginResponse {
    accessToken: string;
    refreshToken: string;
    user: {
        id: string;
        phoneNumber?: string;
        email?: string;
        role: UserRole;
        profileImage?: string;
        permissions?: string[];
    };
}

export interface UserListResponse {
    users: BackendUser[];
    total: number;
    page?: number;
    limit?: number;
}
