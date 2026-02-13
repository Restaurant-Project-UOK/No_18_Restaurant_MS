/**
 * HTTP Client for API Gateway Integration
 *
 * Handles:
 * - JWT Bearer token injection
 * - TableId header injection (required by API Gateway)
 * - Automatic token refresh on 401/403 errors
 * - Request/response logging in development mode
 * - Error handling and standardized error responses
 *
 * API Gateway expects:
 * - Authorization: Bearer <jwt_token>
 * - X-Table-Id: <table_id> (required for protected routes)
 */

import { getAccessToken, getRefreshToken, setAccessToken, clearTokens } from '../../utils/jwt';
import { apiConfig } from '../../config/api.config';

interface RequestOptions extends RequestInit {
  tableId?: number | string;
}


/**
 * Refreshes the access token using the refresh token
 */
async function refreshAccessToken(): Promise<boolean> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return false;

  try {
    const res = await fetch(`${apiConfig.gateway}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    if (!res.ok) return false;

    const newAccessToken = await res.text();
    setAccessToken(newAccessToken);
    return true;
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('[HTTP Client] Token refresh failed:', error);
    }
    return false;
  }
}

/**
 * Logs request details in development mode
 */
function logRequest(method: string, url: string, options: RequestOptions) {
  if (import.meta.env.DEV) {
    console.log(`[API Request] ${method} ${url}`, {
      headers: options.headers,
      tableId: options.tableId,
    });
  }
}

/**
 * Logs response details in development mode
 */
function logResponse(method: string, url: string, status: number, duration: number) {
  if (import.meta.env.DEV) {
    console.log(`[API Response] ${method} ${url} - ${status} (${duration}ms)`);
  }
}

/**
 * Makes an HTTP request with automatic JWT and TableId injection
 *
 * @param baseUrl - The base URL of the service (from apiConfig)
 * @param endpoint - The endpoint path
 * @param options - Request options (method, headers, body, tableId)
 * @returns Promise with parsed response
 */
export async function apiCall<T = any>(
  baseUrl: string,
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const startTime = performance.now();
  const method = options.method || 'GET';
  const url = `${baseUrl}/${endpoint}`.replace(/\/+/g, '/').replace(':/', '://');

  // Prepare headers
  if (!options.headers) options.headers = {};
  const headers = options.headers as Record<string, string>;

  // Inject JWT Bearer token
  const accessToken = getAccessToken();
  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  // Inject TableId header if provided
  if (options.tableId) {
    headers['X-Table-Id'] = String(options.tableId);
  }

  // Ensure Content-Type is set for requests with body
  if (options.body && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  logRequest(method, url, options);

  let response = await fetch(url, {
    ...options,
    method,
    headers,
  });

  const duration = performance.now() - startTime;
  logResponse(method, url, response.status, duration);

  // Handle 401/403 - attempt token refresh
  if ((response.status === 401 || response.status === 403) && accessToken) {
    if (import.meta.env.DEV) {
      console.log('[HTTP Client] Token expired, attempting refresh...');
    }

    const refreshed = await refreshAccessToken();
    if (refreshed) {
      // Retry request with new token
      const newToken = getAccessToken();
      if (newToken) {
        headers['Authorization'] = `Bearer ${newToken}`;
        logRequest(method, url, options);

        response = await fetch(url, {
          ...options,
          method,
          headers,
        });

        const retryDuration = performance.now() - startTime;
        logResponse(method, url, response.status, retryDuration);
      }
    } else {
      // Token refresh failed, clear auth and redirect to login
      clearTokens();
      window.location.href = '/login';
      throw new Error('Session expired. Please login again.');
    }
  }

  // Handle errors
  if (!response.ok) {
    let errorMessage = `Error ${response.status}`;
    let errorData: any = {};

    try {
      errorData = await response.json();
      errorMessage = errorData.message || errorData.error || errorMessage;
    } catch {
      // Response is not JSON, use status text
      errorMessage = response.statusText || errorMessage;
    }

    if (import.meta.env.DEV) {
      console.error('[HTTP Client] Request failed:', {
        status: response.status,
        message: errorMessage,
        data: errorData,
      });
    }

    throw new Error(errorMessage);
  }

  // Parse and return response
  try {
    return await response.json();
  } catch {
    // Some endpoints return plain text or empty response
    return null as T;
  }
}

/**
 * Convenience method for GET requests
 */
export async function apiGet<T = any>(
  baseUrl: string,
  endpoint: string,
  tableId?: number | string
): Promise<T> {
  return apiCall<T>(baseUrl, endpoint, { method: 'GET', tableId });
}

/**
 * Convenience method for POST requests
 */
export async function apiPost<T = any>(
  baseUrl: string,
  endpoint: string,
  body: any,
  tableId?: number | string
): Promise<T> {
  return apiCall<T>(baseUrl, endpoint, {
    method: 'POST',
    body: JSON.stringify(body),
    tableId,
  });
}

/**
 * Convenience method for PUT requests
 */
export async function apiPut<T = any>(
  baseUrl: string,
  endpoint: string,
  body: any,
  tableId?: number | string
): Promise<T> {
  return apiCall<T>(baseUrl, endpoint, {
    method: 'PUT',
    body: JSON.stringify(body),
    tableId,
  });
}

/**
 * Convenience method for DELETE requests
 */
export async function apiDelete<T = any>(
  baseUrl: string,
  endpoint: string,
  tableId?: number | string
): Promise<T> {
  return apiCall<T>(baseUrl, endpoint, { method: 'DELETE', tableId });
}
