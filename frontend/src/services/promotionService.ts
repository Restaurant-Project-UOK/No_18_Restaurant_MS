import { apiRequest, API_CONFIG } from '../config/api';
import { getAccessToken } from '../utils/cookieStorage';

// ============================================
// TYPES & INTERFACES
// ============================================

export interface Promotion {
    id: number;
    name: string;
    discountType: 'PERCENTAGE' | 'FIXED';
    discountValue: number;
    startAt: string;
    endAt: string;
}

export interface CreatePromotionRequest {
    name: string;
    discountType: 'PERCENTAGE' | 'FIXED';
    discountValue: number;
    startAt: string;
    endAt: string;
}

export interface UpdatePromotionRequest {
    name?: string;
    discountType?: 'PERCENTAGE' | 'FIXED';
    discountValue?: number;
    startAt?: string;
    endAt?: string;
}

// ============================================
// PROMOTION SERVICE
// ============================================

export const promotionService = {
    // Customer Endpoints

    /**
     * GET /api/promotion
     * Get available promotions (filtered by date)
     */
    getAvailablePromotions: async (jwtToken?: string): Promise<Promotion[]> => {
        try {
            const token = jwtToken || getAccessToken() || undefined;
            return await apiRequest<Promotion[]>(
                API_CONFIG.PROMOTION_ENDPOINT,
                { jwt: token }
            );
        } catch (error) {
            console.error('[promotionService] Failed to fetch available promotions:', error);
            throw error;
        }
    },

    /**
     * GET /api/promotion/{id}
     * Get single promotion by ID
     */
    getPromotionById: async (id: number, jwtToken?: string): Promise<Promotion> => {
        try {
            const token = jwtToken || getAccessToken() || undefined;
            return await apiRequest<Promotion>(
                `${API_CONFIG.PROMOTION_ENDPOINT}/${id}`,
                { jwt: token }
            );
        } catch (error) {
            console.error(`[promotionService] Failed to fetch promotion ${id}:`, error);
            throw error;
        }
    },

    // Admin Endpoints

    /**
     * GET /api/admin/promotion
     * Get all promotions (including inactive)
     */
    getAllPromotions: async (jwtToken?: string): Promise<Promotion[]> => {
        try {
            const token = jwtToken || getAccessToken();
            if (!token) throw new Error('Unauthorized: No access token');

            return await apiRequest<Promotion[]>(
                `${API_CONFIG.ADMIN_ENDPOINT}/promotion`,
                { jwt: token }
            );
        } catch (error) {
            console.error('[promotionService] Failed to fetch all promotions:', error);
            throw error;
        }
    },

    /**
     * POST /api/admin/promotion/promotion
     * Create a new promotion
     */
    createPromotion: async (data: CreatePromotionRequest, jwtToken?: string): Promise<Promotion> => {
        try {
            const token = jwtToken || getAccessToken();
            if (!token) throw new Error('Unauthorized: No access token');

            return await apiRequest<Promotion>(
                `${API_CONFIG.ADMIN_ENDPOINT}/promotion/promotion`,
                {
                    method: 'POST',
                    jwt: token,
                    body: JSON.stringify(data),
                }
            );
        } catch (error) {
            console.error('[promotionService] Failed to create promotion:', error);
            throw error;
        }
    },

    /**
     * PUT /api/admin/promotion/promotion/{id}
     * Update an existing promotion
     */
    updatePromotion: async (id: number, data: UpdatePromotionRequest, jwtToken?: string): Promise<Promotion> => {
        try {
            const token = jwtToken || getAccessToken();
            if (!token) throw new Error('Unauthorized: No access token');

            return await apiRequest<Promotion>(
                `${API_CONFIG.ADMIN_ENDPOINT}/promotion/promotion/${id}`,
                {
                    method: 'PUT',
                    jwt: token,
                    body: JSON.stringify(data),
                }
            );
        } catch (error) {
            console.error(`[promotionService] Failed to update promotion ${id}:`, error);
            throw error;
        }
    },

    /**
     * DELETE /api/admin/promotion/{id}
     * Delete a promotion
     */
    deletePromotion: async (id: number, jwtToken?: string): Promise<void> => {
        try {
            const token = jwtToken || getAccessToken();
            if (!token) throw new Error('Unauthorized: No access token');

            await apiRequest(
                `${API_CONFIG.ADMIN_ENDPOINT}/promotion/${id}`,
                {
                    method: 'DELETE',
                    jwt: token,
                }
            );
        } catch (error) {
            console.error(`[promotionService] Failed to delete promotion ${id}:`, error);
            throw error;
        }
    },
};
