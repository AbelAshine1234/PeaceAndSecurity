
import apiClient from '../api-client';
import { API_ENDPOINTS } from '../api-config';
import { ServiceResponse } from '../api-types';

class ReportService {
    /** Get all reports (admin view) or filtered list */
    async getAll(params?: any): Promise<ServiceResponse<any[]>> {
        const response = await apiClient.get<ServiceResponse<any[]>>(
            API_ENDPOINTS.REPORTS.GET_ALL,
            { params }
        );
        return response.data;
    }

    /**
     * Get nearby reports for the authenticated patrol officer.
     * Uses the patrol's registered office location to filter by proximity.
     */
    async getNearby(params?: { radiusKm?: number; status?: string }): Promise<ServiceResponse<any>> {
        const response = await apiClient.get<ServiceResponse<any>>(
            API_ENDPOINTS.REPORTS.GET_NEARBY,
            { params }
        );
        return response.data;
    }

    /** Get reports submitted by the current citizen */
    async getMyReports(): Promise<ServiceResponse<any[]>> {
        const response = await apiClient.get<ServiceResponse<any[]>>(
            API_ENDPOINTS.REPORTS.MY_REPORTS
        );
        return response.data;
    }

    /** Public: track a report by Case ID */
    async trackReport(caseId: string): Promise<ServiceResponse<any>> {
        const response = await apiClient.get<ServiceResponse<any>>(
            API_ENDPOINTS.REPORTS.TRACK(caseId)
        );
        return response.data;
    }

    /** Create a new report (supports anonymous or authenticated citizens) */
    async create(formData: FormData): Promise<ServiceResponse<any>> {
        const response = await apiClient.post<ServiceResponse<any>>(
            API_ENDPOINTS.REPORTS.CREATE,
            formData,
            {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            }
        );
        return response.data;
    }

    async getById(id: string): Promise<ServiceResponse<any>> {
        const response = await apiClient.get<ServiceResponse<any>>(
            API_ENDPOINTS.REPORTS.GET_BY_ID(id)
        );
        return response.data;
    }

    async getHistory(id: string): Promise<ServiceResponse<any[]>> {
        const response = await apiClient.get<ServiceResponse<any[]>>(
            API_ENDPOINTS.REPORTS.GET_HISTORY(id)
        );
        return response.data;
    }

    async updateReport(id: string, data: any): Promise<ServiceResponse<any>> {
        const response = await apiClient.patch<ServiceResponse<any>>(
            API_ENDPOINTS.REPORTS.UPDATE(id),
            data
        );
        return response.data;
    }

    async deleteReport(id: string): Promise<ServiceResponse<any>> {
        const response = await apiClient.delete<ServiceResponse<any>>(
            API_ENDPOINTS.REPORTS.DELETE(id)
        );
        return response.data;
    }

    /** Admin: assign a patrol officer to a report */
    async assignPatrol(reportId: string, patrolId: string): Promise<ServiceResponse<any>> {
        const response = await apiClient.patch<ServiceResponse<any>>(
            API_ENDPOINTS.REPORTS.ASSIGN(reportId),
            { patrolId }
        );
        return response.data;
    }

    /** Patrol: accept an assigned report */
    async acceptReport(reportId: string): Promise<ServiceResponse<any>> {
        const response = await apiClient.patch<ServiceResponse<any>>(
            API_ENDPOINTS.REPORTS.ACCEPT(reportId)
        );
        return response.data;
    }

    /** Patrol: submit follow-up notes and evidence (requires GPS within 50m) */
    async submitFollowUp(reportId: string, formData: FormData): Promise<ServiceResponse<any>> {
        const response = await apiClient.patch<ServiceResponse<any>>(
            API_ENDPOINTS.REPORTS.FOLLOW_UP(reportId),
            formData,
            {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            }
        );
        return response.data;
    }

    /** Patrol / Admin: close / resolve a report */
    async closeReport(reportId: string): Promise<ServiceResponse<any>> {
        const response = await apiClient.patch<ServiceResponse<any>>(
            API_ENDPOINTS.REPORTS.CLOSE(reportId)
        );
        return response.data;
    }

    /** Admin: pre-inspect and approve/reject evidence */
    async reviewReport(id: string, status: string, rejectionReason?: string): Promise<ServiceResponse<any>> {
        const response = await apiClient.patch<ServiceResponse<any>>(
            API_ENDPOINTS.REPORTS.REVIEW(id),
            { status, rejectionReason }
        );
        return response.data;
    }

    async escalateReport(id: string, notes: string): Promise<ServiceResponse<any>> {
        const response = await apiClient.patch<ServiceResponse<any>>(
            API_ENDPOINTS.REPORTS.ESCALATE(id),
            { notes }
        );
        return response.data;
    }
}

export const reportService = new ReportService();
