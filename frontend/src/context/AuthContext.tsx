import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { getProfile } from "../api/auth";
import { clearTokens, getAccessToken } from "../utils/jwt";

export interface UserProfile {
  id?: number;
  fullName?: string;
  email?: string;
  phone?: string;
  role?: number;
  provider?: number;
}

interface AuthContextType {
  user: UserProfile | null;
  tableId: number | string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
  logout: () => void;
  refreshUser: () => Promise<void>;
  setError: (error: string | null) => void;
  setTableId: (id: number | string | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TABLE_ID_STORAGE_KEY = "restaurantTableId";

/**
 * Extract tableId from URL query parameters
 */
function getTableIdFromUrl(): number | string | null {
  const params = new URLSearchParams(window.location.search);
  const tableId = params.get("tableId");
  return tableId ? (isNaN(Number(tableId)) ? tableId : Number(tableId)) : null;
}

/**
 * Get tableId from localStorage
 */
function getTableIdFromStorage(): number | string | null {
  const stored = localStorage.getItem(TABLE_ID_STORAGE_KEY);
  if (!stored) return null;
  return isNaN(Number(stored)) ? stored : Number(stored);
}

/**
 * Save tableId to localStorage
 */
function saveTableIdToStorage(id: number | string | null): void {
  if (id === null) {
    localStorage.removeItem(TABLE_ID_STORAGE_KEY);
  } else {
    localStorage.setItem(TABLE_ID_STORAGE_KEY, String(id));
  }
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [tableId, setTableIdState] = useState<number | string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isAuthenticated = Boolean(getAccessToken() && user);

  /**
   * Set tableId and persist to localStorage
   */
  const setTableId = useCallback((id: number | string | null) => {
    setTableIdState(id);
    saveTableIdToStorage(id);
  }, []);

  const logout = useCallback(() => {
    clearTokens();
    setUser(null);
    setTableId(null);
    window.location.href = "/login";
  }, [setTableId]);

  const refreshUser = useCallback(async () => {
    try {
      setIsLoading(true);
      const profile = await getProfile();
      setUser(profile);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch user profile");
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Initialize on mount:
   * 1. Check for tableId in URL params
   * 2. Fall back to localStorage
   * 3. Load user profile if authenticated
   */
  useEffect(() => {
    // Check URL for tableId first (allows session selection on entry)
    const urlTableId = getTableIdFromUrl();
    if (urlTableId) {
      setTableId(urlTableId);
    } else {
      // Fall back to stored tableId
      const storedTableId = getTableIdFromStorage();
      if (storedTableId) {
        setTableIdState(storedTableId);
      }
    }

    // Load user profile if we have a token
    const token = getAccessToken();
    if (token) {
      refreshUser();
    } else {
      setIsLoading(false);
    }
  }, [refreshUser, setTableId]);

  return (
    <AuthContext.Provider
      value={{
        user,
        tableId,
        isLoading,
        isAuthenticated,
        error,
        logout,
        refreshUser,
        setError,
        setTableId,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};
