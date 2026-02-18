import { Staff } from '../types';
import { apiRequest, API_CONFIG } from '../config/api';

/**
 * Staff Service - Handles staff management via Admin endpoints
 */
export const staffService = {
    /**
     * GET /api/admin/staff
     * Retrieves all staff members (Admin only)
     */
    getAllStaff: async (accessToken?: string): Promise<Staff[]> => {
        try {
            const token = accessToken || localStorage.getItem('auth_access_token');
            return await apiRequest<Staff[]>(
                `${API_CONFIG.ADMIN_ENDPOINT}/staff`,
                { jwt: token || undefined }
            );
        } catch (error) {
            console.error('[staffService] Failed to fetch staff:', error);
            throw error;
        }
    },

    /**
     * PATCH /api/admin/staff/:id/status
     * Updates staff status (active/inactive/on-break)
     */
    updateStaffStatus: async (
        staffId: string,
        status: 'active' | 'inactive' | 'on-break',
        accessToken?: string
    ): Promise<Staff> => {
        try {
            const token = accessToken || localStorage.getItem('auth_access_token');
            return await apiRequest<Staff>(
                `${API_CONFIG.ADMIN_ENDPOINT}/staff/${staffId}/status`,
                {
                    method: 'PATCH',
                    jwt: token || undefined,
                    body: JSON.stringify({ status }),
                }
            );
        } catch (error) {
            console.error('[staffService] Failed to update staff status:', error);
            throw error;
        }
    },
};
