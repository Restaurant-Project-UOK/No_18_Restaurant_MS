import { User } from '../types';
import { apiRequest } from '../config/api';

// ============================================
// TYPES & INTERFACES
// ============================================

export interface RegisterRequest {
  fullName: string;
  email: string;
  password: string;
  role: number; // UserRole enum value
  provider?: number; // 1 = local, 2 = google, etc.
  phone?: string;
  address?: string;
}

export interface RegisterResponse {
  id: number;
  email: string;
  role: number;
  profile: {
    fullName: string;
    phone?: string;
    address?: string;
  };
}

export interface LoginRequest {
  email: string;
  password: string;
  tableId?: number; // Optional for customer QR login
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface RefreshTokenResponse {
  accessToken: string;
  tokenType: string;
  expiresIn: number; // milliseconds
}

export interface UserProfile {
  id: number;
  fullName: string;
  email: string;
  phone?: string;
  address?: string;
  role: number;
}

// ============================================
// AUTHENTICATION API ENDPOINTS
// ============================================

/**
 * POST /api/auth/register
 * Registers a new user (customer or staff)
 * 
 * @param registerData - Registration data
 * @returns Registered user info
 */
export const register = async (registerData: RegisterRequest): Promise<RegisterResponse> => {
  try {
    const response = await apiRequest<RegisterResponse>(
      '/api/auth/register',
      {
        method: 'POST',
        body: JSON.stringify({
          fullName: registerData.fullName,
          email: registerData.email,
          password: registerData.password,
          role: registerData.role,
          provider: registerData.provider || 1,
          phone: registerData.phone,
          address: registerData.address,
        }),
      }
    );

    console.log('[authService] User registered:', registerData.email, 'Role:', registerData.role);
    return response;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Registration failed';
    console.error('[authService] Registration failed:', message);
    throw new Error(message);
  }
};

/**
 * POST /api/auth/login
 * Authenticates a user and returns tokens
 * 
 * @param loginData - Login credentials
 * @returns Access token, refresh token, and user info
 */
export const login = async (loginData: LoginRequest): Promise<LoginResponse> => {
  try {
    const response = await apiRequest<LoginResponse>(
      '/api/auth/login',
      {
        method: 'POST',
        body: JSON.stringify({
          email: loginData.email,
          password: loginData.password,
          tableId: loginData.tableId,
        }),
      }
    );

    console.log('[authService] User logged in:', loginData.email);
    if (loginData.tableId) {
      console.log('[authService] Customer logged in via QR at table:', loginData.tableId);
    }

    return response;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Invalid email or password';
    console.error('[authService] Login failed:', message);
    throw new Error(message);
  }
};

/**
 * POST /api/auth/refresh
 * Refreshes an access token using a refresh token
 * 
 * @param refreshData - Refresh token
 * @returns New access token
 */
export const refreshAccessToken = async (refreshData: RefreshTokenRequest): Promise<RefreshTokenResponse> => {
  try {
    const response = await apiRequest<RefreshTokenResponse>(
      '/api/auth/refresh',
      {
        method: 'POST',
        body: JSON.stringify(refreshData),
      }
    );

    return response;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Token refresh failed';
    console.error('[authService] Token refresh failed:', message);
    throw new Error(message);
  }
};

/**
 * POST /api/auth/logout
 * Logs out the current user
 * 
 * @param accessToken - Current access token
 * @returns Success message
 */
export const logout = async (accessToken?: string): Promise<string> => {
  try {
    const token = accessToken || localStorage.getItem('auth_access_token');
    if (!token) {
      throw new Error('No access token provided');
    }

    await apiRequest(
      '/api/auth/logout',
      {
        method: 'POST',
        jwt: token,
      }
    );

    console.log('[authService] User logged out');
    return 'Logged out successfully';
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Logout failed';
    console.error('[authService] Logout failed:', message);
    // Still clear local storage even if API fails
    throw new Error(message);
  }
};

// ============================================
// EXPORTED SERVICE
// ============================================

export const authService = {
  register,
  login,
  refreshAccessToken,
  logout,
};
