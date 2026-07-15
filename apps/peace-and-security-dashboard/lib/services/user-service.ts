import apiClient from '../api-client';
import { API_ENDPOINTS } from '../api-config';
import { ServiceResponse } from '../api-types';
import { UserResponse, PaginatedResponse, UserFilterParams } from '@/components/types';

class UserService {
    /**
     * Get all users
     */
    async getAllUsers(params?: UserFilterParams): Promise<PaginatedResponse<UserResponse>> {
        const response = await apiClient.get(API_ENDPOINTS.USERS.GET_ALL, { params });
        return response.data;
    }

    /**
     * Create/Register a new user (Internal users by Admin)
     */
    async registerUser(formData: FormData): Promise<ServiceResponse<any>> {
        const response = await apiClient.post<ServiceResponse<any>>(
            API_ENDPOINTS.USERS.REGISTER,
            formData,
            {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            }
        );
        return response.data;
    }

    /**
     * Update user profile (Admin only for arbitrary users)
     */
    /**
     * Update user profile (Admin only for arbitrary users)
     */
    async updateUser(id: string, formData: FormData): Promise<ServiceResponse<any>> {
        const response = await apiClient.patch<ServiceResponse<any>>(
            `/users/${id}`,
            formData,
            {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            }
        );
        return response.data;
    }

    /**
     * Update current user profile
     */
    async updateProfile(formData: FormData): Promise<ServiceResponse<any>> {
        const response = await apiClient.patch<ServiceResponse<any>>(
            API_ENDPOINTS.USERS.UPDATE_PROFILE,
            formData,
            {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            }
        );
        return response.data;
    }

    /**
     * Update user status (toggle)
     */
    async toggleUserStatus(id: string): Promise<ServiceResponse<any>> {
        const response = await apiClient.put<ServiceResponse<any>>(
            API_ENDPOINTS.USERS.TOGGLE_STATUS(id)
        );
        return response.data;
    }

    async getUserProfile(): Promise<ServiceResponse<any>> {
        const response = await apiClient.get<ServiceResponse<any>>(
            API_ENDPOINTS.USERS.GET_PROFILE
        );
        return response.data;
    }

    /**
     * Get user by ID
     */
    async getUserById(id: string, config?: any): Promise<ServiceResponse<UserResponse>> {
        const response = await apiClient.get<ServiceResponse<UserResponse>>(
            API_ENDPOINTS.USERS.GET_BY_ID(id),
            config
        );
        return response.data;
    }

    async resetUserPassword(id: string): Promise<ServiceResponse<any>> {
        const response = await apiClient.post<ServiceResponse<any>>(
            `/users/${id}/reset-password`
        );
        return response.data;
    }
}

export const userService = new UserService();
