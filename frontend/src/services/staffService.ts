import { Staff } from '../types';
import { apiRequest, API_CONFIG } from '../config/api';
import { getAccessToken } from '../utils/cookieStorage';

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
            const token = accessToken || getAccessToken();
            const users = await apiRequest<Array<{
                id: number;
                email: string;
                role: number;
                fullName?: string;
                name?: string;
                phone?: string;
                profile?: { fullName?: string; phone?: string; address?: string } | null;
            }>>(
                `${API_CONFIG.ADMIN_ENDPOINT}/users`,
                { jwt: token || undefined }
            );
            // Map backend User shape → Staff shape
            // Name & phone can be at top-level OR nested inside profile (which can be null)
            return users.map((u) => ({
                id: String(u.id),
                name: u.profile?.fullName || u.fullName || u.name || 'No Name',
                fullName: u.profile?.fullName || u.fullName,
                email: u.email,
                role: u.role,
                phone: u.profile?.phone || u.phone,
                profile: u.profile || null,
            })) as Staff[];
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
            const token = accessToken || getAccessToken();
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

    /**
     * POST /api/admin/staff
     * Creates a new staff member (Admin only)
     */
    createStaff: async (staffData: { fullName: string; email: string; password: string; role: number; phone: string }, accessToken?: string): Promise<string> => {
        try {
            const token = accessToken || getAccessToken();
            return await apiRequest<string>(
                `${API_CONFIG.ADMIN_ENDPOINT}/staff`,
                {
                    method: 'POST',
                    jwt: token || undefined,
                    body: JSON.stringify(staffData),
                }
            );
        } catch (error) {
            console.error('[staffService] Failed to create staff:', error);
            throw error;
        }
    },
};
