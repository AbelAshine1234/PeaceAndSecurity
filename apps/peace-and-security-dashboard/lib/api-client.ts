import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { API_CONFIG, API_ENDPOINTS } from './api-config';
import { toast } from 'sonner';

// Create axios instance
const apiClient: AxiosInstance = axios.create({
    baseURL: API_CONFIG.BASE_URL,
    timeout: API_CONFIG.TIMEOUT,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        if (typeof window === 'undefined') return config;

        try {
            const token = localStorage.getItem('accessToken');
            if (token && config.headers) {
                const hasAuth = typeof config.headers.get === 'function'
                    ? config.headers.get('Authorization')
                    : config.headers['Authorization'];

                if (!hasAuth) {
                    config.headers.Authorization = `Bearer ${token}`;
                }
            }
        } catch (e) {
            console.error("Storage access failed", e);
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Refresh Token Logic
let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
    failedQueue.forEach(prom => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });
    failedQueue = [];
};

// Response interceptor
apiClient.interceptors.response.use(
    (response) => {
        const method = response.config.method?.toUpperCase();
        const isMutation = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method || '');
        const data = response.data;

        if (data && data.success === false) {
            const message = data.message || 'An error occurred';
            const isLogin = response.config.url?.includes('login');

            if (!isLogin && !(response.config as any)?.skipToast) {
                toast.error(message);
            }
            return Promise.reject({ message });
        }

        if (isMutation && data && data.message && data.success !== false) {
            if (!response.config.url?.includes('refresh')) { // Don't toast on refresh
                toast.success(data.message);
            }
        }

        return response;
    },
    async (error: AxiosError) => {
        const originalRequest = error.config as any;

        // Handle 401 Unauthorized
        const isLoginOrPreLogin = originalRequest.url?.includes('login') || originalRequest.url?.includes('pre-login');

        if (error.response?.status === 401 && !originalRequest._retry && !isLoginOrPreLogin) {
            if (isRefreshing) {
                return new Promise(function (resolve, reject) {
                    failedQueue.push({ resolve, reject });
                })
                    .then((token) => {
                        originalRequest.headers['Authorization'] = 'Bearer ' + token;
                        return apiClient(originalRequest);
                    })
                    .catch((err) => {
                        return Promise.reject(err);
                    });
            }

            originalRequest._retry = true;
            isRefreshing = true;

            const refreshToken = typeof window !== 'undefined' ? localStorage.getItem('refreshToken') : null;

            if (!refreshToken) {
                // No refresh token, logout
                handleLogout();
                return Promise.reject(error);
            }

            try {
                // Call refresh endpoint using a fresh axios instance to avoid interceptors
                const response = await axios.post(
                    `${API_CONFIG.BASE_URL}${API_ENDPOINTS.AUTH.USER_REFRESH}`,
                    { refreshToken },
                    { headers: { 'Content-Type': 'application/json' } }
                );

                const data = response.data;
                if (data.success && data.data?.accessToken) {
                    const newToken = data.data.accessToken;
                    if (typeof window !== 'undefined') {
                        localStorage.setItem('accessToken', newToken);

                        // If backend rotates refresh token
                        if (data.data.refreshToken) {
                            localStorage.setItem('refreshToken', data.data.refreshToken);
                        }
                    }

                    apiClient.defaults.headers.common['Authorization'] = 'Bearer ' + newToken;
                    originalRequest.headers['Authorization'] = 'Bearer ' + newToken;

                    processQueue(null, newToken);
                    isRefreshing = false;

                    return apiClient(originalRequest);
                } else {
                    throw new Error("Refresh failed");
                }
            } catch (refreshError) {
                processQueue(refreshError, null);
                isRefreshing = false;
                handleLogout();
                return Promise.reject(refreshError);
            }
        }

        // Handle other errors
        const data = error.response?.data as any;
        let errorMessage = 'An unexpected error occurred';

        if (data) {
            if (data.message) {
                errorMessage = Array.isArray(data.message) ? data.message[0] : data.message;
            } else if (data.error) {
                errorMessage = data.error;
            }
        } else if (error.message) {
            errorMessage = error.message;
        }

        // Only show toast if not 401 (handled above), if refresh failed explicitly,
        // and if skipToast is not set in the request config
        if (error.response?.status !== 401 && !originalRequest?.skipToast) {
            toast.error(errorMessage);
        }

        return Promise.reject(error);
    }
);

function handleLogout() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');

    if (typeof window !== 'undefined' && window.location.pathname !== '/') {
        window.location.href = '/';
    }
}

export default apiClient;
