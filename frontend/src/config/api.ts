/**
 * API Configuration - Gateway & Service Endpoints
 * Gateway Base URL: https://gateway-app.mangofield-91faac5e.southeastasia.azurecontainerapps.io
 */
import { setAccessToken, setRefreshToken, getRefreshToken, getStoredUser, clearAuthStorage } from '../utils/cookieStorage';

export const API_CONFIG = {
  // Use environment variable if available, fallback to hosted gateway
  GATEWAY_BASE_URL: import.meta.env.VITE_BASE_URL || 'https://gateway-app.mangofield-91faac5e.southeastasia.azurecontainerapps.io',

  // Service endpoints (relative to gateway)
  AUTH_ENDPOINT: '/api/auth',
  MENU_ENDPOINT: '/api/menu',
  CATEGORIES_ENDPOINT: '/api/categories',
  MEDIA_ENDPOINT: '/api/media',
  CART_ENDPOINT: '/api/cart',
  ORDERS_ENDPOINT: '/api/orders',
  ADMIN_ENDPOINT: '/api/admin',
  ANALYTICS_ENDPOINT: '/api/admin/analytics',
  WAITER_ENDPOINT: '/api/waiter',
  KITCHEN_ENDPOINT: '/api/kitchen',
  PROFILE_ENDPOINT: '/api/profile',
  PAYMENT_ENDPOINT: '/api/payments',
  PAYMENT_CREATE_ENDPOINT: '/payments',
};

/**
 * Construct full API URL
 * Strips a trailing `/api` from the base URL to prevent double-prefix
 * if VITE_BASE_URL is set to something like `https://gateway.../api`
 */
export const getApiUrl = (endpoint: string): string => {
  let baseUrl = API_CONFIG.GATEWAY_BASE_URL;

  // Remove trailing slash
  if (baseUrl.endsWith('/')) {
    baseUrl = baseUrl.slice(0, -1);
  }

  // Remove trailing /api if present — our endpoint paths already include /api/...
  if (baseUrl.endsWith('/api')) {
    baseUrl = baseUrl.slice(0, -4);
  }

  return `${baseUrl}${endpoint}`;
};

/**
 * Check if a JWT token is expired (or about to expire within buffer seconds)
 */
const isTokenExpired = (token: string, bufferSeconds = 30): boolean => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const exp = payload.exp;
    if (!exp) return false; // No expiry claim — assume valid
    return Date.now() >= (exp - bufferSeconds) * 1000;
  } catch {
    return false; // If we can't decode, let the server decide
  }
};

/**
 * Proactively refresh the access token if it is expired or about to expire.
 * Returns the new token, or the original token if no refresh was needed.
 */
const ensureFreshToken = async (token: string): Promise<string> => {
  if (!isTokenExpired(token)) return token;

  const storedRefreshToken = getRefreshToken();
  if (!storedRefreshToken) return token; // No refresh token — use as-is

  try {
    console.log('[apiRequest] Token expired/expiring, proactively refreshing...');
    const refreshResponse = await fetch(getApiUrl(`${API_CONFIG.AUTH_ENDPOINT}/refresh`), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: storedRefreshToken }),
    });

    if (refreshResponse.ok) {
      const data = await refreshResponse.json();
      setAccessToken(data.accessToken);
      if (data.refreshToken) {
        setRefreshToken(data.refreshToken);
      }
      console.log('[apiRequest] Proactive token refresh successful');
      return data.accessToken;
    }
  } catch (e) {
    console.warn('[apiRequest] Proactive refresh failed, proceeding with old token', e);
  }

  return token; // Fall through — the 401 retry handler will catch it
};

/**
 * API request helper with automatic JWT handling
 */
export const apiRequest = async <T = Record<string, unknown>>(
  endpoint: string,
  options: RequestInit & { jwt?: string; _isRetry?: boolean } = {}
): Promise<T> => {
  const { jwt: rawJwt, _isRetry, ...fetchOptions } = options;

  // Proactively refresh expired tokens before making the request
  let jwt = rawJwt;
  if (jwt && !_isRetry) {
    jwt = await ensureFreshToken(jwt);
  }

  const headers: Record<string, string> = {
    ...(fetchOptions.headers as Record<string, string> || {}),
  };

  // Only set Content-Type to application/json if body is NOT FormData
  if (!(fetchOptions.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  // Add JWT token if provided
  if (jwt) {
    headers['Authorization'] = `Bearer ${jwt}`;
  }

  // Add role from cookie storage if available (for internal service communication)
  const storedUser = getStoredUser();
  if (storedUser) {
    try {
      const user = JSON.parse(storedUser);
      if (user.id) {
        headers['X-User-Id'] = String(user.id);
      }
      if (user.role) {
        headers['X-Role'] = String(user.role);
      }
    } catch {
      // Ignore parsing errors
    }
  }

  const url = getApiUrl(endpoint);

  const response = await fetch(url, {
    ...fetchOptions,
    headers,
  });

  // Handle 401 Unauthorized - Attempt Refresh
  if (response.status === 401 && !_isRetry) {
    const storedRefreshToken = getRefreshToken();

    if (storedRefreshToken) {
      try {
        console.log('[apiRequest] 401 detected, attempting token refresh...');
        const refreshResponse = await fetch(getApiUrl(`${API_CONFIG.AUTH_ENDPOINT}/refresh`), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken: storedRefreshToken }),
        });

        if (refreshResponse.ok) {
          const data = await refreshResponse.json();
          // Update cookies with new access token AND refresh token
          setAccessToken(data.accessToken);
          if (data.refreshToken) {
            setRefreshToken(data.refreshToken);
          }
          console.log('[apiRequest] Token refresh successful, retrying request...');

          // Retry original request with new token
          return apiRequest<T>(endpoint, {
            ...options,
            jwt: data.accessToken,
            _isRetry: true,
          });
        } else {
          console.error('[apiRequest] Refresh token invalid or expired');
        }
      } catch (e) {
        console.error('[apiRequest] Refresh attempt failed', e);
      }
    }

    // If refresh failed or no refresh token, perform logout
    console.warn('[apiRequest] Session expired, clearing cookies and redirecting');
    clearAuthStorage();
    window.location.href = '/login';
    throw new Error('Unauthorized. Please login again.');
  }

  // Handle 405 Method Not Allowed
  if (response.status === 405) {
    throw new Error('Invalid request method. Please try again.');
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: response.statusText }));
    const errorMessage = errorData.message || `API Error: ${response.status}`;
    console.error(`[apiRequest] Error ${response.status}: ${errorMessage}`);
    throw new Error(errorMessage);
  }

  // Check content-type to handle both JSON and plain text responses
  const contentType = response.headers.get('content-type');
  if (contentType?.includes('application/json')) {
    return response.json();
  } else {
    // Return text response
    return response.text() as Promise<T>;
  }
};

/**
 * Simulate network delay (remove in production)
 */
export const simulateDelay = (ms: number = 300): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

export default API_CONFIG;
