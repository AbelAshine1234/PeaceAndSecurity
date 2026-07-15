
import apiClient from '../api-client';
import { API_ENDPOINTS } from '../api-config';
import { ServiceResponse } from '../api-types';

class ReportTypeService {
    async getAll(params?: { search?: string; isActive?: string }): Promise<ServiceResponse<any[]>> {
        const response = await apiClient.get<ServiceResponse<any[]>>(
            API_ENDPOINTS.REPORT_TYPES.GET_ALL,
            { params }
        );
        return response.data;
    }

    async create(data: any): Promise<ServiceResponse<any>> {
        const response = await apiClient.post<ServiceResponse<any>>(
            API_ENDPOINTS.REPORT_TYPES.CREATE,
            data
        );
        return response.data;
    }

    async update(id: string, data: any): Promise<ServiceResponse<any>> {
        const response = await apiClient.patch<ServiceResponse<any>>(
            API_ENDPOINTS.REPORT_TYPES.UPDATE(id),
            data
        );
        return response.data;
    }

    async deleteReportType(id: string): Promise<ServiceResponse<any>> {
        const response = await apiClient.delete<ServiceResponse<any>>(
            API_ENDPOINTS.REPORT_TYPES.DELETE(id)
        );
        return response.data;
    }
}

export const reportTypeService = new ReportTypeService();
