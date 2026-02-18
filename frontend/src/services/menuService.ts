import { MenuItem, MenuCategory } from '../types';
import { apiRequest, API_CONFIG } from '../config/api';

// ============================================
// TYPES & INTERFACES
// ============================================

export interface CreateMenuItemRequest {
  name: string;
  description: string;
  category: string;
  price: number;
  available: boolean;
  preparationTime: number;
  ingredients?: string[];
  allergens?: string[];
}

// ============================================
// PUBLIC ENDPOINTS (No Auth Required)
// ============================================

/**
 * GET /api/menu
 * Returns all menu items
 */
const getAllMenuItems = async (): Promise<MenuItem[]> => {
  try {
    return await apiRequest<MenuItem[]>(API_CONFIG.MENU_ENDPOINT);
  } catch (error) {
    console.error('[menuService] Failed to fetch menu items:', error);
    throw error;
  }
};

/**
 * GET /api/categories
 * Returns all menu categories
 */
const getAllCategories = async (): Promise<MenuCategory[]> => {
  try {
    return await apiRequest<MenuCategory[]>(API_CONFIG.CATEGORIES_ENDPOINT);
  } catch (error) {
    console.error('[menuService] Failed to fetch categories:', error);
    throw error;
  }
};

/**
 * GET /api/media/{id}
 * Returns media URL or binary data for a given ID
 * Note: Browser usually handles this via <img> src, 
 * but this is here for cases where manual fetch is needed.
 */
const getMediaById = async (id: string): Promise<string> => {
  // Return the full URL for the media
  const baseUrl = API_CONFIG.GATEWAY_BASE_URL.endsWith('/')
    ? API_CONFIG.GATEWAY_BASE_URL.slice(0, -1)
    : API_CONFIG.GATEWAY_BASE_URL;
  return `${baseUrl}${API_CONFIG.MEDIA_ENDPOINT}/${id}`;
};

// ============================================
// ADMIN ENDPOINTS (JWT Required)
// ============================================

/**
 * POST /api/admin/menu/with-image
 * Creates a new menu item with image upload (Admin only)
 * 
 * @param formData - FormData containing menuItem (JSON) and image (File)
 * @param jwtToken - JWT token for authentication
 * @returns Created MenuItem object
 */
const createMenuItemWithImage = async (
  formData: FormData,
  jwtToken?: string
): Promise<MenuItem> => {
  try {
    const token = jwtToken || localStorage.getItem('auth_access_token');
    if (!token) throw new Error('Unauthorized: No access token');

    return await apiRequest<MenuItem>(
      `${API_CONFIG.ADMIN_ENDPOINT}/menu/with-image`,
      {
        method: 'POST',
        jwt: token,
        // When sending FormData, we must NOT set Content-Type header manually
        // apiRequest usually sets it to application/json, so we need to bypass or modify it.
        // Let's check apiRequest implementation in api.ts.
        body: formData,
      }
    );
  } catch (error) {
    console.error('[menuService] Failed to create menu item:', error);
    throw error;
  }
};

/**
 * PATCH /api/admin/menu/{id}/availability?isActive={true|false}
 * Toggles menu item availability (Admin only)
 */
const updateMenuItemAvailability = async (
  id: string,
  isActive: boolean,
  jwtToken?: string
): Promise<void> => {
  try {
    const token = jwtToken || localStorage.getItem('auth_access_token');
    if (!token) throw new Error('Unauthorized: No access token');

    await apiRequest(
      `${API_CONFIG.ADMIN_ENDPOINT}/menu/${id}/availability?isActive=${isActive}`,
      {
        method: 'PATCH',
        jwt: token,
      }
    );
  } catch (error) {
    console.error('[menuService] Failed to update availability:', error);
    throw error;
  }
};

/**
 * DELETE /api/admin/menu/{id}
 * Deletes a menu item (Admin only)
 */
const deleteMenuItem = async (id: string, jwtToken?: string): Promise<void> => {
  try {
    const token = jwtToken || localStorage.getItem('auth_access_token');
    if (!token) throw new Error('Unauthorized: No access token');

    await apiRequest(
      `${API_CONFIG.ADMIN_ENDPOINT}/menu/${id}`,
      {
        method: 'DELETE',
        jwt: token,
      }
    );
  } catch (error) {
    console.error('[menuService] Failed to delete menu item:', error);
    throw error;
  }
};

// ============================================
// EXPORTED SERVICE
// ============================================

export const menuService = {
  // Public endpoints (no auth)
  getAllMenuItems,
  getAllCategories,
  getMediaById,

  // Admin endpoints (JWT required)
  createMenuItemWithImage,
  updateMenuItemAvailability,
  deleteMenuItem,
};
