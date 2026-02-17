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

// Backend returns a simple string message on register
export type RegisterResponse = string;

export interface LoginRequest {
  email: string;
  password: string;
  tableId?: number; // Optional for customer QR login
}

// Maps to TokenResponseDto from backend
export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

// Maps to TokenRefreshResponseDto from backend
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
 * Backend returns: "Customer created successfully"
 * 
 * @param registerData - Registration data
 * @returns Success message string
 */
export const register = async (registerData: RegisterRequest): Promise<RegisterResponse> => {
  try {
    const response = await apiRequest<string>(
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
 * Backend returns: TokenResponseDto { accessToken, refreshToken, user }
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
 * Backend expects: Map<String, String> with "refreshToken" key
 * Backend returns: TokenRefreshResponseDto { accessToken, tokenType, expiresIn }
 * 
 * @param refreshData - Refresh token
 * @returns New access token info
 */
export const refreshAccessToken = async (refreshData: RefreshTokenRequest): Promise<RefreshTokenResponse> => {
  try {
    const response = await apiRequest<RefreshTokenResponse>(
      '/api/auth/refresh',
      {
        method: 'POST',
        body: JSON.stringify({
          refreshToken: refreshData.refreshToken,
        }),
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
 * Backend expects: Authorization header and X-User-Id header
 * Backend returns: "Logged out successfully"
 * 
 * @param accessToken - Current access token
 * @param userId - Current user ID
 * @returns Success message
 */
export const logout = async (accessToken?: string, userId?: number): Promise<string> => {
  try {
    const token = accessToken || localStorage.getItem('auth_access_token');
    const storedUserId = userId || parseInt(localStorage.getItem('auth_user_id') || '0', 10);
    
    if (!token) {
      throw new Error('No access token provided');
    }
    
    if (!storedUserId) {
      throw new Error('No user ID provided');
    }

    const response = await apiRequest<string>(
      '/api/auth/logout',
      {
        method: 'POST',
        jwt: token,
        headers: {
          'X-User-Id': storedUserId.toString(),
        },
      }
    );

    console.log('[authService] User logged out');
    return response;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Logout failed';
    console.error('[authService] Logout failed:', message);
    // Still throw so caller knows it failed
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

