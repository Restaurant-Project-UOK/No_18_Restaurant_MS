import { Order, OrderStatus } from '../types';
import { apiRequest } from '../config/api';

// ============================================
// TYPES & INTERFACES
// ============================================

/**
 * Request body for POST /api/orders
 * NOTE: tableId and userId are sent as headers (X-Table-Id, X-User-Id).
 * The body is optional — items are fetched automatically from Cart Service.
 */
export interface CreateOrderRequest {
  tableId: number;
  userId?: number;
}

export interface UpdateOrderStatusRequest {
  status: OrderStatus;
}

export interface UserOrderSummary {
  id: string;
  total: number;
  date: string;
  status: OrderStatus;
  itemCount: number;
}

// ============================================
// ORDER API ENDPOINTS
// ============================================

/**
 * POST /api/orders
 * Creates a new order. tableId and userId are passed as headers.
 * Items are fetched automatically from Cart Service — no body needed.
 *
 * @param tableId - Table ID (sent as X-Table-Id header)
 * @param accessToken - JWT access token
 * @returns Created order
 */
export const createOrder = async (
  tableId: number,
  accessToken?: string
): Promise<Order> => {
  try {
    const token = accessToken || localStorage.getItem('auth_access_token');
    if (!token) {
      throw new Error('Unauthorized: No access token');
    }

    // Get userId from stored user
    const storedUser = localStorage.getItem('auth_user');
    const userId = storedUser ? JSON.parse(storedUser)?.id : undefined;

    const response = await apiRequest<Order>(
      '/api/orders',
      {
        method: 'POST',
        jwt: token,
        headers: {
          'X-Table-Id': String(tableId),
          ...(userId ? { 'X-User-Id': String(userId) } : {}),
        },
        // Body is optional — cart service provides items
      }
    );

    console.log('[orderService] Order created:', response.id);
    return response;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to create order';
    console.error('[orderService] Failed to create order:', message);
    throw new Error(message);
  }
};

/**
 * PATCH /api/orders/:orderId/status
 * Updates order status
 *
 * @param orderId - Order ID
 * @param statusData - Status update data { status: OrderStatus }
 * @param accessToken - JWT access token
 * @returns Updated order
 */
export const updateOrderStatus = async (
  orderId: string,
  statusData: UpdateOrderStatusRequest,
  accessToken?: string
): Promise<Order> => {
  try {
    const token = accessToken || localStorage.getItem('auth_access_token');
    if (!token) {
      throw new Error('Unauthorized: No access token');
    }

    const response = await apiRequest<Order>(
      `/api/orders/${orderId}/status`,
      {
        method: 'PATCH',
        jwt: token,
        body: JSON.stringify(statusData),
      }
    );

    console.log('[orderService] Order status updated:', orderId, '→', statusData.status);
    return response;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to update order';
    console.error('[orderService] Failed to update order status:', message);
    throw new Error(message);
  }
};

/**
 * GET /api/orders/active
 * Returns all active orders (no auth required)
 *
 * @returns Array of active orders
 */
export const getActiveOrders = async (): Promise<Order[]> => {
  try {
    const response = await apiRequest<Order[]>(
      '/api/orders/active'
    );

    console.log('[orderService] Retrieved', response.length, 'active orders');
    return response;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch active orders';
    console.error('[orderService] Failed to fetch active orders:', message);
    throw new Error(message);
  }
};

/**
 * GET /api/orders/user
 * Returns all orders for the authenticated user (order history)
 *
 * @param accessToken - JWT token for authentication
 * @returns Array of user's orders
 */
export const getUserOrders = async (
  accessToken?: string
): Promise<Order[]> => {
  try {
    const token = accessToken || localStorage.getItem('auth_access_token');
    if (!token) {
      throw new Error('Unauthorized: No access token');
    }

    const response = await apiRequest<Order[]>(
      '/api/orders/user',
      {
        jwt: token,
      }
    );

    console.log('[orderService] Retrieved', response.length, 'user orders');
    return response;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch user orders';
    console.error('[orderService] Failed to fetch user orders:', message);
    throw new Error(message);
  }
};

/**
 * GET /api/orders/table
 * Returns all orders for a specific table.
 * NOTE: tableId is sent as X-Table-Id header (not a path variable).
 *
 * @param tableId - Table ID
 * @param accessToken - JWT token for authentication
 * @returns Orders for the table
 */
export const getTableOrders = async (
  tableId: number,
  accessToken?: string
): Promise<Order[]> => {
  try {
    const token = accessToken || localStorage.getItem('auth_access_token');
    if (!token) {
      throw new Error('Unauthorized: No access token');
    }

    const response = await apiRequest<Order[]>(
      '/api/orders/table',
      {
        jwt: token,
        headers: {
          'X-Table-Id': String(tableId),
        },
      }
    );

    console.log('[orderService] Retrieved', response.length, 'orders for table:', tableId);
    return response;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch table orders';
    console.error('[orderService] Failed to fetch table orders:', message);
    throw new Error(message);
  }
};

/**
 * GET /api/orders/:orderId
 * Returns a single order by ID
 *
 * @param orderId - Order ID
 * @param accessToken - JWT token
 * @returns Order
 */
export const getOrderById = async (
  orderId: string,
  accessToken?: string
): Promise<Order> => {
  try {
    const token = accessToken || localStorage.getItem('auth_access_token');

    const response = await apiRequest<Order>(
      `/api/orders/${orderId}`,
      token ? { jwt: token } : {}
    );

    return response;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch order';
    console.error('[orderService] Failed to fetch order:', message);
    throw new Error(message);
  }
};

// ============================================
// EXPORTED SERVICE
// ============================================

export const orderService = {
  createOrder,
  updateOrderStatus,
  getActiveOrders,
  getUserOrders,
  getTableOrders,
  getOrderById,
};
