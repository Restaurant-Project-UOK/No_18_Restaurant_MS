import { apiRequest, API_CONFIG } from '../config/api';

// ============================================
// TYPES & INTERFACES
// ============================================

export interface UserProfile {
  id: number;
  fullName: string;
  email: string;
  phone?: string;
  address?: string;
  role: number;
  createdAt?: string;
}

export interface UpdateProfileRequest {
  fullName?: string;
  phone?: string;
  address?: string;
}

// ============================================
// PROFILE API ENDPOINTS
// ============================================

/**
 * GET /api/profile/me
 * Gets the current user's profile
 * 
 * @param accessToken - JWT access token
 * @returns User profile
 */
export const getMyProfile = async (accessToken?: string): Promise<UserProfile> => {
  try {
    const token = accessToken || localStorage.getItem('auth_access_token');
    if (!token) {
      throw new Error('No access token provided');
    }

    const response = await apiRequest<UserProfile>(
      `${API_CONFIG.PROFILE_ENDPOINT}/me`,
      {
        jwt: token,
      }
    );

    console.log('[profileService] Fetched profile');
    return response;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch profile';
    console.error('[profileService] Failed to fetch profile:', message);
    throw new Error(message);
  }
};

/**
 * PUT /api/profile/me
 * Updates the current user's profile
 * 
 * @param updateData - Profile update data
 * @param accessToken - JWT access token
 * @returns Updated user profile
 */
export const updateMyProfile = async (
  updateData: UpdateProfileRequest,
  accessToken?: string
): Promise<UserProfile> => {
  try {
    const token = accessToken || localStorage.getItem('auth_access_token');
    if (!token) {
      throw new Error('No access token provided');
    }

    const response = await apiRequest<UserProfile>(
      `${API_CONFIG.PROFILE_ENDPOINT}/me`,
      {
        method: 'PUT',
        jwt: token,
        body: JSON.stringify(updateData),
      }
    );

    console.log('[profileService] Profile updated');
    return response;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to update profile';
    console.error('[profileService] Failed to update profile:', message);
    throw new Error(message);
  }
};

// ============================================
// EXPORTED SERVICE
// ============================================

export const profileService = {
  getMyProfile,
  updateMyProfile,
};
