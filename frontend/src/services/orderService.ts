import { Order, OrderStatus } from '../types';
import { apiRequest } from '../config/api';

// ============================================
// TYPES & INTERFACES
// ============================================

export interface CreateOrderRequest {
  items: {
    itemId: number;
    itemName: string;
    quantity: number;
    unitPrice: number;
    specialRequests?: string;
  }[];
  tableNumber?: number;
  notes?: string;
}

export interface UpdateOrderStatusRequest {
  status: string;
}

export interface UserOrderSummary {
  id: string;
  total: number;
  date: string;
  status: OrderStatus;
  itemCount: number;
}

export interface TableOrdersResponse {
  tableNumber: number;
  orders: Order[];
  totalOrders: number;
}

// ============================================
// ORDER API ENDPOINTS
// ============================================

/**
 * POST /api/orders
 * Creates a new order
 * 
 * @param orderData - Order creation data
 * @param accessToken - JWT access token
 * @returns Created order
 */
export const createOrder = async (
  orderData: CreateOrderRequest,
  accessToken?: string
): Promise<Order> => {
  try {
    const token = accessToken || localStorage.getItem('auth_access_token');
    if (!token) {
      throw new Error('Unauthorized: No access token');
    }

    const response = await apiRequest<Order>(
      '/api/orders',
      {
        method: 'POST',
        jwt: token,
        body: JSON.stringify(orderData),
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
 * PATCH /api/orders/:orderId
 * Updates order status
 * 
 * @param orderId - Order ID
 * @param statusData - Status update data
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
 * Returns all active orders (not completed or cancelled)
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
 * @returns Array of user's order summaries
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
 * GET /api/orders/table/:tableNumber
 * Returns all orders for a specific table
 * 
 * @param tableNumber - Table number
 * @param accessToken - JWT token for authentication
 * @returns Orders for the table
 */
export const getTableOrders = async (
  tableNumber: number,
  accessToken?: string
): Promise<TableOrdersResponse> => {
  try {
    const token = accessToken || localStorage.getItem('auth_access_token');
    if (!token) {
      throw new Error('Unauthorized: No access token');
    }

    const response = await apiRequest<TableOrdersResponse>(
      `/api/orders/table/${tableNumber}`,
      {
        jwt: token,
      }
    );

    console.log('[orderService] Retrieved', response.totalOrders, 'orders for table:', tableNumber);
    return response;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch table orders';
    console.error('[orderService] Failed to fetch table orders:', message);
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
};
