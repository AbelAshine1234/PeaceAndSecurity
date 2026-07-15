const getBaseUrl = () => {
    // 1. Priority: Environment variable (baked in at build time)
    const envUrl = process.env.NEXT_PUBLIC_API_URL;
    if (envUrl && envUrl !== 'undefined') {
        return envUrl.endsWith('/') ? envUrl : `${envUrl}/`;
    }

    // 2. Fallback: Automatic detection on client side
    // We return a placeholder during SSR to avoid hydration mismatch
    // The actual components should handle the "waiting" state or use the fallback
    if (typeof window === 'undefined') {
        return 'http://127.0.0.1:1221/api/';
    }

    // On client: use current host but port 1221
    const url = `${window.location.protocol}//${window.location.hostname}:1221/api/`;
    return url;
};

export const API_CONFIG = {
    BASE_URL: getBaseUrl(),
    TIMEOUT: 30000,
} as const;

// API Endpoints
export const API_ENDPOINTS = {
    // ── Auth ──────────────────────────────────────────────────────────
    AUTH: {
        // Dashboard users (System Admin / Super Admin) — email or phone + password
        USER_LOGIN: 'auth/user/login',
        USER_PRE_LOGIN: 'auth/user/pre-login',
        USER_VERIFY: 'auth/user/verify',
        USER_SET_PASSWORD: 'auth/user/set-password',
        USER_PASSWORD_RESET_REQUEST: 'auth/user/password-reset/request',
        USER_PASSWORD_RESET_CONFIRM: 'auth/user/password-reset/confirm',
        USER_PASSWORD_CHANGE: 'auth/user/password/change',
        USER_REFRESH: 'auth/user/refresh',

        // Patrol (phone + PIN)
        PATROL_LOGIN: 'auth/patrol/login',
        PATROL_PIN_RESET_REQUEST: 'auth/patrol/pin-reset/request',
        PATROL_PIN_RESET_CONFIRM: 'auth/patrol/pin-reset/confirm',

        // Citizen (phone + PIN)
        CITIZEN_REGISTER: 'auth/citizen/register',
        CITIZEN_LOGIN: 'auth/citizen/login',
        CITIZEN_PIN_RESET_REQUEST: 'auth/citizen/pin-reset/request',
        CITIZEN_PIN_RESET_CONFIRM: 'auth/citizen/pin-reset/confirm',

        // PIN management (Admin sets PIN for patrol/citizen)
        SET_USER_PIN: (userId: string) => `auth/users/${userId}/set-pin`,
        CHANGE_PIN: 'auth/pin/change',
    },

    // ── Dashboard Users (admins) ──────────────────────────────────────
    USERS: {
        REGISTER: 'users/register',
        GET_ALL: 'users/all',
        GET_PROFILE: 'users/profile',
        UPDATE_PROFILE: 'users/profile',
        GET_BY_ID: (id: string) => `users/${id}`,
        TOGGLE_STATUS: (id: string) => `users/${id}/toggle-status`,
        RESET_PASSWORD: (id: string) => `users/${id}/reset-password`,
    },

    // ── Reports ───────────────────────────────────────────────────────
    REPORTS: {
        BASE: 'reports',
        GET_ALL: 'reports',
        GET_NEARBY: 'reports/nearby',
        MY_REPORTS: 'reports/my-reports',
        TRACK: (caseId: string) => `reports/track/${caseId}`,
        GET_BY_ID: (id: string) => `reports/${id}`,
        GET_HISTORY: (id: string) => `reports/${id}/history`,
        CREATE: 'reports',
        UPDATE: (id: string) => `reports/${id}`,
        DELETE: (id: string) => `reports/${id}`,
        ASSIGN: (id: string) => `reports/${id}/assign`,
        ACCEPT: (id: string) => `reports/${id}/accept`,
        FOLLOW_UP: (id: string) => `reports/${id}/follow-up`,
        CLOSE: (id: string) => `reports/${id}/close`,
        REVIEW: (id: string) => `reports/${id}/review`,
        ESCALATE: (id: string) => `reports/${id}/escalate`,
    },

    // ── Report Types ────────────────────────────────────────────────
    REPORT_TYPES: {
        GET_ALL: 'report-types',
        GET_BY_ID: (id: string) => `report-types/${id}`,
        CREATE: 'report-types',
        UPDATE: (id: string) => `report-types/${id}`,
        DELETE: (id: string) => `report-types/${id}`,
    },

    // ── Cameras ───────────────────────────────────────────────────────
    CAMERAS: {
        GET_ALL: 'cameras',
        GET_BY_ID: (id: string) => `cameras/${id}`,
        CREATE: 'cameras',
        UPDATE: (id: string) => `cameras/${id}`,
        DELETE: (id: string) => `cameras/${id}`,
    },

    // ── Patrol Officers (dashboard admin management) ───────────────────
    PATROLS: {
        GET_ALL: 'patrols',
        CREATE: 'patrols',
        GET_BY_ID: (id: string) => `patrols/${id}`,
        UPDATE: (id: string) => `patrols/${id}`,
        DELETE: (id: string) => `patrols/${id}`,
        UPDATE_LOCATION: (id: string) => `patrols/${id}/location`,
        GET_NEARBY: 'patrols/nearby',
    },

    // ── Citizens (dashboard admin management) ─────────────────────────
    CITIZENS: {
        GET_ALL: 'citizens',
        CREATE: 'citizens',
        GET_BY_ID: (id: string) => `citizens/${id}`,
        UPDATE: (id: string) => `citizens/${id}`,
        DELETE: (id: string) => `citizens/${id}`,
    },
} as const;

export const getApiBaseUrl = () => {
    return API_CONFIG.BASE_URL;
};
