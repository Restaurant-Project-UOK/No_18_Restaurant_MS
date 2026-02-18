import { Order, OrderStatus } from '../types';
import { apiRequest } from '../config/api';

// ============================================
// TYPES & INTERFACES
// ============================================

/**
 * WaiterOrder — matches backend OrderReadyEvent from waiter-service Kafka consumer.
 * GET /api/waiter/received-orders returns OrderReadyEvent[]:
 *   { orderId, tableId, items: [{itemName, quantity}], readyTime }
 */
export interface WaiterOrder {
  orderId: number;
  tableId: number;
  items: {
    itemName: string;
    quantity: number;
  }[];
  readyTime: string;
}

export interface UpdateStatusRequest {
  status: OrderStatus;
}

export interface StatusUpdateResponse {
  orderId: string;
  status: OrderStatus;
  message: string;
  timestamp: string;
}

export interface HealthCheckResponse {
  status: 'UP' | 'DOWN';
  timestamp: string;
  version?: string;
}

// ============================================
// WAITER API ENDPOINTS
// ============================================

/**
 * GET /api/waiter/received-orders
 * Returns all orders that are READY to be served.
 * This endpoint is backed by the Kafka consumer in waiter-service —
 * it returns OrderReadyEvent objects (not full Order objects).
 *
 * @param accessToken - JWT access token (Waiter or Admin role)
 * @returns Array of ready orders (OrderReadyEvent shape)
 */
const getReceivedOrders = async (accessToken?: string): Promise<WaiterOrder[]> => {
  try {
    const token = accessToken || localStorage.getItem('auth_access_token');
    if (!token) {
      throw new Error('Unauthorized: No access token');
    }

    const response = await apiRequest<WaiterOrder[]>(
      '/api/waiter/received-orders',
      {
        jwt: token,
      }
    );

    // Sort by readyTime (oldest first — FIFO)
    response.sort(
      (a, b) => new Date(a.readyTime).getTime() - new Date(b.readyTime).getTime()
    );

    console.log('[waiterService] Retrieved', response.length, 'ready orders');
    return response;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch received orders';
    console.error('[waiterService] Failed to fetch received orders:', message);
    throw new Error(message);
  }
};

/**
 * PATCH /api/orders/:id/status
 * Updates order status via the order-service.
 *
 * @param orderId - Order ID
 * @param statusData - New status (use OrderStatus enum)
 * @param accessToken - JWT access token
 * @returns Status update confirmation
 */
const updateOrderStatus = async (
  orderId: string,
  statusData: UpdateStatusRequest,
  accessToken?: string
): Promise<StatusUpdateResponse> => {
  try {
    const token = accessToken || localStorage.getItem('auth_access_token');
    if (!token) {
      throw new Error('Unauthorized: No access token');
    }

    await apiRequest<Order>(
      `/api/orders/${orderId}/status`,
      {
        method: 'PATCH',
        jwt: token,
        body: JSON.stringify({ status: statusData.status }),
      }
    );

    console.log('[waiterService] Order status updated:', orderId, '→', statusData.status);

    return {
      orderId,
      status: statusData.status,
      message: `Order status updated to ${statusData.status}`,
      timestamp: new Date().toISOString(),
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to update order status';
    console.error('[waiterService] Failed to update order status:', message);
    throw new Error(message);
  }
};

/**
 * GET /api/orders/table
 * Gets all orders for a specific table (via X-Table-Id header).
 *
 * @param tableId - Table ID
 * @param accessToken - JWT access token
 * @returns Array of table orders
 */
const getOrdersByTable = async (
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

    console.log('[waiterService] Retrieved', response.length, 'orders for table', tableId);
    return response;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch table orders';
    console.error('[waiterService] Failed to fetch table orders:', message);
    throw new Error(message);
  }
};

/**
 * Health check — falls back gracefully if endpoint doesn't exist
 */
const getWaiterHealth = async (): Promise<HealthCheckResponse> => {
  try {
    const response = await apiRequest<HealthCheckResponse>(
      '/api/waiter/health'
    );
    console.log('[waiterService] Health check:', response.status);
    return response;
  } catch {
    return {
      status: 'DOWN',
      timestamp: new Date().toISOString(),
    };
  }
};

/**
 * Marks an order as SERVED (shortcut method)
 */
const markOrderServed = async (
  orderId: string,
  accessToken?: string
): Promise<StatusUpdateResponse> => {
  return updateOrderStatus(orderId, { status: OrderStatus.SERVED }, accessToken);
};

// ============================================
// EXPORTED SERVICE
// ============================================

export const waiterService = {
  // API endpoints
  getReceivedOrders,
  updateOrderStatus,
  getWaiterHealth,

  // Helper methods
  getOrdersByTable,
  markOrderServed,
};
