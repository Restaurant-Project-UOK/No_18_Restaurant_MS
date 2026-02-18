/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useCallback, useMemo, ReactNode, useEffect } from 'react';
import { AuthState, UserRole, User } from '../types';
import { authService, LoginRequest, RegisterRequest } from '../services/authService';
import { profileService, UpdateProfileRequest } from '../services/profileService';
import { staffService } from '../services/staffService';

/** Decode a JWT payload without verifying signature */
const decodeJwtPayload = (token: string): Record<string, unknown> => {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(base64));
  } catch {
    return {};
  }
};

interface AuthContextType extends AuthState {
  login: (email: string, password: string, tableId?: number) => Promise<User>;
  logout: () => Promise<void>;
  register: (name: string, email: string, password: string, phone?: string, tableId?: number) => Promise<void>;
  updateProfile: (name: string, phone: string, address: string) => Promise<void>;
  addStaff: (name: string, email: string, password: string, role: UserRole, phone: string) => Promise<void>;
  getJwtToken: () => string | null;
  refreshToken: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    token: null,
    isAuthenticated: false,
    loading: true, // Start in loading state
    error: null,
  });

  // Restore session from localStorage on mount
  useEffect(() => {
    const restoreSession = async () => {
      const storedToken = localStorage.getItem('auth_access_token');
      const storedUser = localStorage.getItem('auth_user');

      if (storedToken && storedUser) {
        try {
          const user = JSON.parse(storedUser);
          setAuthState({
            user,
            token: storedToken,
            isAuthenticated: true,
            loading: false,
            error: null,
          });
        } catch (error) {
          console.error('Failed to restore session:', error);
          // Clear invalid session data
          localStorage.removeItem('auth_access_token');
          localStorage.removeItem('auth_refresh_token');
          localStorage.removeItem('auth_user');
          localStorage.removeItem('auth_user_id');
          setAuthState(prev => ({ ...prev, loading: false }));
        }
      } else {
        setAuthState(prev => ({ ...prev, loading: false }));
      }
    };

    restoreSession();
  }, []);

  const login = useCallback(async (email: string, password: string, tableId?: number) => {
    setAuthState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const loginData: LoginRequest = { email, password, tableId: tableId || 0 };
      const response = await authService.login(loginData);

      // Store tokens first so profile fetch can use them
      localStorage.setItem('auth_access_token', response.accessToken);
      localStorage.setItem('auth_refresh_token', response.refreshToken);

      // Decode JWT to get id and role (backend doesn't return user object)
      const payload = decodeJwtPayload(response.accessToken);
      const userId = String(payload.sub || '');
      const userRole = Number(payload.role ?? UserRole.CUSTOMER);

      // Try to fetch full profile; fall back to JWT claims if unavailable
      let user: User;
      try {
        const profile = await profileService.getMyProfile(response.accessToken);
        user = {
          id: String(profile.id),
          email: profile.email,
          name: profile.fullName,
          role: userRole, // Use role from JWT as ProfileDto doesn't include it
          phone: profile.phone,
          address: profile.address,
          createdAt: profile.createdAt || new Date().toISOString(),
        };
      } catch (profileErr) {
        console.warn('[AuthContext] Profile fetch failed, using JWT claims:', profileErr);
        user = {
          id: userId,
          email,
          name: email.split('@')[0],
          role: userRole,
          createdAt: new Date().toISOString(),
        };
      }

      console.log('[AuthContext] User data after login:', user);

      localStorage.setItem('auth_user', JSON.stringify(user));
      localStorage.setItem('auth_user_id', user.id.toString());

      setAuthState({
        user,
        token: response.accessToken,
        isAuthenticated: true,
        loading: false,
        error: null,
      });

      return user;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      setAuthState((prev) => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));
      throw error;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      const token = localStorage.getItem('auth_access_token');
      const userIdStr = localStorage.getItem('auth_user_id');
      const userId = userIdStr ? parseInt(userIdStr, 10) : undefined;

      if (token) {
        await authService.logout(token, userId);
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear state and storage regardless of API response
      setAuthState({
        user: null,
        token: null,
        isAuthenticated: false,
        loading: false,
        error: null,
      });
      localStorage.removeItem('auth_access_token');
      localStorage.removeItem('auth_refresh_token');
      localStorage.removeItem('auth_user');
      localStorage.removeItem('auth_user_id');
    }
  }, []);

  const register = useCallback(
    async (name: string, email: string, password: string, phone?: string, tableId?: number): Promise<void> => {
      setAuthState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        console.log('[AuthContext] Registering user:', email);

        const registerData: RegisterRequest = {
          fullName: name,
          email,
          password,
          role: UserRole.CUSTOMER,
          provider: 1,
          phone,
        };

        const message = await authService.register(registerData);
        console.log('[AuthContext] Registration successful:', message);

        await login(email, password, tableId);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Registration failed';
        console.error('[AuthContext] Registration error:', errorMessage);
        setAuthState((prev) => ({
          ...prev,
          loading: false,
          error: errorMessage,
        }));
        throw err;
      }
    },
    [login]
  );

  const updateProfile = useCallback(
    async (name: string, phone: string, address: string) => {
      const token = authState.token || localStorage.getItem('auth_access_token');
      if (!authState.user || !token) return;

      setAuthState((prev) => ({ ...prev, loading: true, error: null }));
      try {
        const updateData: UpdateProfileRequest = {
          fullName: name,
          phone,
          address,
        };
        const updatedProfile = await profileService.updateMyProfile(updateData, token);

        const updatedUser: User = {
          ...authState.user,
          name: updatedProfile.fullName,
          phone: updatedProfile.phone,
          address: updatedProfile.address,
        };

        setAuthState((prev) => ({
          ...prev,
          user: updatedUser,
          loading: false,
        }));

        localStorage.setItem('auth_user', JSON.stringify(updatedUser));
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Profile update failed';
        setAuthState((prev) => ({
          ...prev,
          loading: false,
          error: errorMessage,
        }));
        throw error;
      }
    },
    [authState.token, authState.user]
  );

  const addStaff = useCallback(
    async (name: string, email: string, password: string, role: UserRole, phone: string) => {
      setAuthState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        const registerData = {
          fullName: name,
          email,
          password,
          role,
          phone,
        };
        await staffService.createStaff(registerData, authState.token || undefined);

        setAuthState((prev) => ({ ...prev, loading: false, error: null }));
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to add staff';
        setAuthState((prev) => ({
          ...prev,
          loading: false,
          error: errorMessage,
        }));
        throw error;
      }
    },
    []
  );

  const getJwtToken = useCallback((): string | null => {
    const token = localStorage.getItem('auth_access_token');
    return token || authState.token;
  }, [authState.token]);

  const refreshToken = useCallback(async () => {
    const refreshTok = localStorage.getItem('auth_refresh_token');
    if (!refreshTok) {
      throw new Error('No refresh token available');
    }

    try {
      const response = await authService.refreshAccessToken({ refreshToken: refreshTok });
      localStorage.setItem('auth_access_token', response.accessToken);
      setAuthState((prev) => ({ ...prev, token: response.accessToken }));
    } catch (error) {
      await logout();
      throw error;
    }
  }, [logout]);

  const value = useMemo(
    () => ({ ...authState, login, logout, register, updateProfile, addStaff, getJwtToken, refreshToken }),
    [authState, login, logout, register, updateProfile, addStaff, getJwtToken, refreshToken]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
