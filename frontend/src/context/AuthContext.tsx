/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useCallback, useMemo, ReactNode, useEffect } from 'react';
import { AuthState, UserRole } from '../types';
import { authService, LoginRequest, RegisterRequest } from '../services/authService';
import { profileService, UpdateProfileRequest } from '../services/profileService';

interface AuthContextType extends AuthState {
  login: (email: string, password: string, tableId?: number) => Promise<void>;
  logout: () => Promise<void>;
  register: (name: string, email: string, password: string, role: UserRole, phone?: string, address?: string) => Promise<void>;
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
    loading: false,
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
        }
      }
    };

    restoreSession();
  }, []);

  const login = useCallback(async (email: string, password: string, tableId?: number) => {
    setAuthState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const loginData: LoginRequest = { email, password, tableId };
      const response = await authService.login(loginData);

      // Store tokens and user
      localStorage.setItem('auth_access_token', response.accessToken);
      localStorage.setItem('auth_refresh_token', response.refreshToken);
      localStorage.setItem('auth_user', JSON.stringify(response.user));

      setAuthState({
        user: response.user,
        token: response.accessToken,
        isAuthenticated: true,
        loading: false,
        error: null,
      });
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
      if (token) {
        await authService.logout(token);
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
    }
  }, []);

  const register = useCallback(
    async (name: string, email: string, password: string, role: UserRole, phone?: string, address?: string) => {
      setAuthState((prev) => ({ ...prev, loading: true, error: null }));
      try {
        const registerData: RegisterRequest = {
          fullName: name,
          email,
          password,
          role,
          provider: 1, // local provider
          phone,
          address,
        };
        await authService.register(registerData);
        
        // Auto-login after successful registration
        await login(email, password);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Registration failed';
        setAuthState((prev) => ({
          ...prev,
          loading: false,
          error: errorMessage,
        }));
        throw error;
      }
    },
    [login]
  );

  const updateProfile = useCallback(
    async (name: string, phone: string, address: string) => {
      if (!authState.user || !authState.token) return;

      setAuthState((prev) => ({ ...prev, loading: true, error: null }));
      try {
        const updateData: UpdateProfileRequest = {
          fullName: name,
          phone,
          address,
        };
        const updatedProfile = await profileService.updateMyProfile(updateData, authState.token);
        
        // Update auth state with new profile data
        const updatedUser = {
          ...authState.user,
          name: updatedProfile.fullName,
          phone: updatedProfile.phone,
          address: updatedProfile.address,
        };
        
        setAuthState({
          ...authState,
          user: updatedUser,
          loading: false,
        });
        
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
    [authState]
  );

  const addStaff = useCallback(
    async (name: string, email: string, password: string, role: UserRole, phone: string) => {
      setAuthState((prev) => ({ ...prev, loading: true, error: null }));
      
      try {
        const registerData: RegisterRequest = {
          fullName: name,
          email,
          password,
          role,
          provider: 1, // local provider
          phone,
        };
        await authService.register(registerData);
        
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
    // Return the actual JWT access token from localStorage
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
      // Refresh failed, logout user
      await logout();
      throw error;
    }
  }, [logout]);

  const value = useMemo(
    () => ({ ...authState, login, logout, register, updateProfile, addStaff, getJwtToken, refreshToken }),
    [authState, login, logout, register, updateProfile, addStaff, getJwtToken, refreshToken]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

