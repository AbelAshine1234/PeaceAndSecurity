
import apiClient from '../api-client';
import { ServiceResponse } from '../api-types';

export interface EcoGuardStats {
    reports: {
        total: number;
        resolved: number;
        pending: number;
        byType: { name: string; count: string | number }[];
        byStatus: { status: string; count: string | number }[];
        trend: { date: string; count: number }[];
    };
    users: {
        citizens: number;
        patrols: number;
        admins: number;
    };
    cameras: {
        total: number;
        active: number;
    };
    reportTypes: number;
}

class DashboardService {
    async getDashboardStats(): Promise<ServiceResponse<EcoGuardStats>> {
        const response = await apiClient.get<ServiceResponse<EcoGuardStats>>('/dashboard/stats');
        return response.data;
    }

    async getFleetLocations(): Promise<ServiceResponse<any>> {
        const response = await apiClient.get<ServiceResponse<any>>('/dashboard/fleet-locations');
        return response.data;
    }

    async getRecentReports(): Promise<ServiceResponse<any[]>> {
        const response = await apiClient.get<ServiceResponse<any[]>>('/dashboard/recent-reports');
        return response.data;
    }
}

export const dashboardService = new DashboardService();
