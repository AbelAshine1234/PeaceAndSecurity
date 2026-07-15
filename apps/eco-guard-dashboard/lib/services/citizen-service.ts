import apiClient from '../api-client';
import { API_ENDPOINTS } from '../api-config';
import { ServiceResponse } from '../api-types';
import { UserResponse, PaginatedResponse, UserFilterParams } from '@/components/types';

class CitizenService {
    /**
     * Get all citizens
     */
    async getAllCitizens(params?: UserFilterParams): Promise<PaginatedResponse<UserResponse>> {
        const response = await apiClient.get(API_ENDPOINTS.CITIZENS.GET_ALL, { params });
        return response.data;
    }

    /**
     * Create/Register a new citizen
     */
    async registerCitizen(formData: FormData): Promise<ServiceResponse<any>> {
        const response = await apiClient.post<ServiceResponse<any>>(
            API_ENDPOINTS.CITIZENS.CREATE,
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
     * Update citizen details
     */
    async updateCitizen(id: string, formData: FormData): Promise<ServiceResponse<any>> {
        const response = await apiClient.patch<ServiceResponse<any>>(
            API_ENDPOINTS.CITIZENS.UPDATE(id),
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
     * Get citizen by ID
     */
    async getCitizenById(id: string): Promise<ServiceResponse<UserResponse>> {
        const response = await apiClient.get<ServiceResponse<UserResponse>>(
            API_ENDPOINTS.CITIZENS.GET_BY_ID(id)
        );
        return response.data;
    }

    /**
     * Delete citizen
     */
    async deleteCitizen(id: string): Promise<ServiceResponse<any>> {
        const response = await apiClient.delete<ServiceResponse<any>>(
            API_ENDPOINTS.CITIZENS.DELETE(id)
        );
        return response.data;
    }
}

export const citizenService = new CitizenService();
