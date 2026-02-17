/**
 * API Configuration - Gateway & Service Endpoints
 * Gateway Base URL: https://gateway-app.mangofield-91faac5e.southeastasia.azurecontainerapps.io
 */

export const API_CONFIG = {
  // Change this to your backend gateway URL
  GATEWAY_BASE_URL: 'https://gateway-app.mangofield-91faac5e.southeastasia.azurecontainerapps.io',
  // For local development, uncomment below:
  // GATEWAY_BASE_URL: 'http://localhost:8000',

  // Service endpoints (relative to gateway)
  AUTH_ENDPOINT: '/api/auth',
  MENU_ENDPOINT: '/api/menu',
  CART_ENDPOINT: '/api/cart',
  ORDERS_ENDPOINT: '/api/orders',
  ADMIN_ENDPOINT: '/api/admin',
  ANALYTICS_ENDPOINT: '/api/admin/analytics',
};

/**
 * Construct full API URL
 */
export const getApiUrl = (endpoint: string): string => {
  const baseUrl = API_CONFIG.GATEWAY_BASE_URL.endsWith('/')
    ? API_CONFIG.GATEWAY_BASE_URL.slice(0, -1)
    : API_CONFIG.GATEWAY_BASE_URL;
  return `${baseUrl}${endpoint}`;
};

/**
 * API request helper with automatic JWT handling
 */
export const apiRequest = async <T = Record<string, unknown>>(
  endpoint: string,
  options: RequestInit & { jwt?: string } = {}
): Promise<T> => {
  const { jwt, ...fetchOptions } = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(fetchOptions.headers as Record<string, string> || {}),
  };

  // Add JWT token if provided
  if (jwt) {
    headers['Authorization'] = `Bearer ${jwt}`;
  }

  // Add role from localStorage if available (for internal service communication)
  const storedUser = localStorage.getItem('auth_user');
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

  // Handle 401 Unauthorized
  if (response.status === 401) {
    // Clear auth state on 401
    localStorage.removeItem('auth_access_token');
    localStorage.removeItem('auth_refresh_token');
    localStorage.removeItem('auth_user');
    window.location.href = '/login';
    throw new Error('Unauthorized. Please login again.');
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(errorData.message || `API Error: ${response.status}`);
  }

  return response.json();
};

/**
 * Simulate network delay (remove in production)
 */
export const simulateDelay = (ms: number = 300): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

export default API_CONFIG;
