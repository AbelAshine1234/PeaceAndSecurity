export enum UserStatus {
    PENDING = "PENDING",
    ACTIVE = "ACTIVE",
    DISABLED = "DISABLED",
}

/**
 * EcoGuard System Roles:
 * - SYSTEM_SUPER_ADMIN: Full system access, can manage all admins
 * - SYSTEM_ADMIN:       Admin access, manages patrols and reports
 * - PATROL:             Field officer, accesses via Patrol mobile app
 * - CITIZEN:            Public user, submits reports via Citizen mobile app
 */
export enum UserRole {
    SYSTEM_SUPER_ADMIN = "SYSTEM_SUPER_ADMIN",
    SYSTEM_ADMIN = "SYSTEM_ADMIN",
    PATROL = "PATROL",
    CITIZEN = "CITIZEN",
}

export enum OTPType {
    FORGOT_PASSWORD_OTP = "FORGOT-PASSWORD-OTP",
    REGISTRATION_OTP = "REGISTRATION-OTP",
}

export enum ReportStatus {
    SUBMITTED = "SUBMITTED",
    UNDER_REVIEW = "UNDER_REVIEW",
    ASSIGNED = "ASSIGNED",
    IN_PROGRESS = "IN_PROGRESS",
    RESOLVED = "RESOLVED",
    CLOSED = "CLOSED",
    REJECTED = "REJECTED",
}

export enum OTPStatus {
    REQUESTED = "REQUESTED",
    EXPIRED = "EXPIRED",
    USED = "USED",
}

export enum TokenType {
    ACCESS = "ACCESS",
    REFRESH = "REFRESH",
    PASSWORD_RESET = "PASSWORD_RESET",
    REGISTRATION = "REGISTRATION",
    SET_PASSWORD = "SET_PASSWORD",
}

export enum EvidenceType {
    PHOTO = "PHOTO",
    VIDEO = "VIDEO",
    BOTH = "BOTH",
}
