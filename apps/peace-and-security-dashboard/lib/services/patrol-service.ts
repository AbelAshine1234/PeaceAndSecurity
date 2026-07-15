import apiClient from '../api-client';
import { API_ENDPOINTS } from '../api-config';
import { ServiceResponse } from '../api-types';
import { UserResponse, PaginatedResponse, UserFilterParams } from '@/components/types';

class PatrolService {
    /**
     * Get all patrols
     */
    async getAllPatrols(params?: UserFilterParams): Promise<PaginatedResponse<UserResponse>> {
        const response = await apiClient.get(API_ENDPOINTS.PATROLS.GET_ALL, { params });
        return response.data;
    }

    /**
     * Register a new patrol officer
     */
    async registerPatrol(formData: FormData): Promise<ServiceResponse<any>> {
        const response = await apiClient.post<ServiceResponse<any>>(
            API_ENDPOINTS.PATROLS.CREATE,
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
     * Update patrol details
     */
    async updatePatrol(id: string, formData: FormData): Promise<ServiceResponse<any>> {
        const response = await apiClient.patch<ServiceResponse<any>>(
            API_ENDPOINTS.PATROLS.UPDATE(id),
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
     * Get patrol by ID
     */
    async getPatrolById(id: string, config?: any): Promise<ServiceResponse<UserResponse>> {
        const response = await apiClient.get<ServiceResponse<UserResponse>>(
            API_ENDPOINTS.PATROLS.GET_BY_ID(id),
            config
        );
        return response.data;
    }

    /**
     * Delete patrol
     */
    async deletePatrol(id: string): Promise<ServiceResponse<any>> {
        const response = await apiClient.delete<ServiceResponse<any>>(
            API_ENDPOINTS.PATROLS.DELETE(id)
        );
        return response.data;
    }

    async getNearby(params: { latitude: number; longitude: number; radiusKm?: number }): Promise<ServiceResponse<any[]>> {
        const response = await apiClient.get<ServiceResponse<any[]>>(
            API_ENDPOINTS.PATROLS.GET_NEARBY,
            { params }
        );
        return response.data;
    }
}

export const patrolService = new PatrolService();
