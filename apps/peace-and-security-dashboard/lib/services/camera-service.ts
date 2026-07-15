
import apiClient from '../api-client';
import { API_ENDPOINTS } from '../api-config';
import { ServiceResponse } from '../api-types';

class CameraService {
    async getAll(): Promise<ServiceResponse<any[]>> {
        const response = await apiClient.get<ServiceResponse<any[]>>(
            API_ENDPOINTS.CAMERAS.GET_ALL
        );
        return response.data;
    }

    async create(data: any): Promise<ServiceResponse<any>> {
        const response = await apiClient.post<ServiceResponse<any>>(
            API_ENDPOINTS.CAMERAS.CREATE,
            data
        );
        return response.data;
    }

    async update(id: string, data: any): Promise<ServiceResponse<any>> {
        const response = await apiClient.patch<ServiceResponse<any>>(
            API_ENDPOINTS.CAMERAS.UPDATE(id),
            data
        );
        return response.data;
    }

    async deleteCamera(id: string): Promise<ServiceResponse<any>> {
        const response = await apiClient.delete<ServiceResponse<any>>(
            API_ENDPOINTS.CAMERAS.DELETE(id)
        );
        return response.data;
    }

    async getAlerts(): Promise<ServiceResponse<any[]>> {
        const response = await apiClient.get<ServiceResponse<any[]>>('/cameras/alerts');
        return response.data;
    }

    async createAlert(data: any): Promise<ServiceResponse<any>> {
        const response = await apiClient.post<ServiceResponse<any>>('/cameras/alerts', data);
        return response.data;
    }
}

export const cameraService = new CameraService();
