import { Table, TableStatus } from '../types';
import { apiRequest, API_CONFIG } from '../config/api';

/**
 * Table Service - Handles table management via Gateway
 */
export const tableService = {
    /**
     * GET /api/admin/tables
     * Retrieves all tables (Admin/Staff only)
     */
    getAllTables: async (accessToken?: string): Promise<Table[]> => {
        try {
            const token = accessToken || localStorage.getItem('auth_access_token');
            return await apiRequest<Table[]>(
                `${API_CONFIG.ADMIN_ENDPOINT}/tables`,
                { jwt: token || undefined }
            );
        } catch (error) {
            console.error('[tableService] Failed to fetch tables:', error);
            throw error;
        }
    },

    /**
     * PATCH /api/admin/tables/:id/status
     * Updates table status
     */
    updateTableStatus: async (tableId: string, status: TableStatus, accessToken?: string): Promise<Table> => {
        try {
            const token = accessToken || localStorage.getItem('auth_access_token');
            return await apiRequest<Table>(
                `${API_CONFIG.ADMIN_ENDPOINT}/tables/${tableId}/status`,
                {
                    method: 'PATCH',
                    jwt: token || undefined,
                    body: JSON.stringify({ status }),
                }
            );
        } catch (error) {
            console.error('[tableService] Failed to update table status:', error);
            throw error;
        }
    },
};
