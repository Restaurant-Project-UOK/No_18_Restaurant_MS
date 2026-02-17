import { Order, OrderStatus } from '../types';
import { apiRequest } from '../config/api';

// ============================================
// TYPES & INTERFACES
// ============================================

export interface WaiterOrder {
  orderId: string;
  tableId?: number;
  status: OrderStatus;
  customerName: string;
  items: {
    id: string;
    name: string;
    quantity: number;
  }[];
  totalPrice: number;
  orderTime: string;
  timeReady?: string;
}

export interface UpdateStatusRequest {
  status: string;
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
 * GET /api/orders?status=READY
 * Returns all orders that are ready to be served
 * 
 * @param accessToken - JWT access token (Waiter or Admin role)
 * @returns Array of ready orders
 */
const getReceivedOrders = async (accessToken?: string): Promise<WaiterOrder[]> => {
  try {
    const token = accessToken || localStorage.getItem('auth_access_token');
    if (!token) {
      throw new Error('Unauthorized: No access token');
    }

    const response = await apiRequest<Order[]>(
      '/api/orders?status=READY',
      {
        jwt: token,
      }
    );

    // Transform to waiter order format
    const transformedOrders: WaiterOrder[] = response.map((order) => ({
      orderId: order.id,
      tableId: order.tableNumber,
      status: order.status,
      customerName: order.customerName,
      items: order.items.map((item) => ({
        id: item.id,
        name: item.menuItem.name,
        quantity: item.quantity,
      })),
      totalPrice: order.totalPrice,
      orderTime: order.orderTime,
      timeReady: new Date().toISOString(),
    }));

    // Sort by order time (oldest first - FIFO)
    transformedOrders.sort(
      (a, b) => new Date(a.orderTime).getTime() - new Date(b.orderTime).getTime()
    );

    console.log('[waiterService] Retrieved', transformedOrders.length, 'ready orders');
    return transformedOrders;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch received orders';
    console.error('[waiterService] Failed to fetch received orders:', message);
    throw new Error(message);
  }
};

/**
 * PATCH /api/orders/:id
 * Updates order status
 * 
 * @param orderId - Order ID
 * @param statusData - New status
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
      `/api/orders/${orderId}`,
      {
        method: 'PATCH',
        jwt: token,
        body: JSON.stringify({ status: statusData.status }),
      }
    );

    console.log('[waiterService] Order status updated:', orderId, '→', statusData.status);

    return {
      orderId,
      status: statusData.status as OrderStatus,
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
 * GET /api/orders/table/:tableNumber
 * Gets all orders for a specific table
 * 
 * @param tableNumber - Table number
 * @param accessToken - JWT access token
 * @returns Array of table orders
 */
const getOrdersByTable = async (
  tableNumber: number,
  accessToken?: string
): Promise<WaiterOrder[]> => {
  try {
    const token = accessToken || localStorage.getItem('auth_access_token');
    if (!token) {
      throw new Error('Unauthorized: No access token');
    }

    const response = await apiRequest<Order[]>(
      `/api/orders/table/${tableNumber}`,
      {
        jwt: token,
      }
    );

    // Transform to waiter order format
    const transformedOrders: WaiterOrder[] = response.map((order) => ({
      orderId: order.id,
      tableId: order.tableNumber,
      status: order.status,
      customerName: order.customerName,
      items: order.items.map((item) => ({
        id: item.id,
        name: item.menuItem.name,
        quantity: item.quantity,
      })),
      totalPrice: order.totalPrice,
      orderTime: order.orderTime,
      timeReady: order.status === OrderStatus.READY ? new Date().toISOString() : undefined,
    }));

    console.log('[waiterService] Retrieved', transformedOrders.length, 'orders for table', tableNumber);
    return transformedOrders;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch table orders';
    console.error('[waiterService] Failed to fetch table orders:', message);
    throw new Error(message);
  }
};

/**
 * GET /api/admin/analytics/waiter-health
 * Health check endpoint (No JWT required)
 * 
 * @returns Health status
 */
const getWaiterHealth = async (): Promise<HealthCheckResponse> => {
  try {
    const response = await apiRequest<HealthCheckResponse>(
      '/api/admin/analytics/waiter-health'
    );

    console.log('[waiterService] Health check:', response.status);
    return response;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[waiterService] Health check failed:', message);
    // Return degraded status instead of throwing
    return {
      status: 'DOWN',
      timestamp: new Date().toISOString(),
    };
  }
};

/**
 * Marks an order as served (shortcut method)
 */
const markOrderServed = async (
  orderId: string,
  accessToken?: string
): Promise<StatusUpdateResponse> => {
  return updateOrderStatus(orderId, { status: 'SERVED' }, accessToken);
};

/**
 * Marks an order as completed (shortcut method)
 */
const markOrderCompleted = async (
  orderId: string,
  accessToken?: string
): Promise<StatusUpdateResponse> => {
  return updateOrderStatus(orderId, { status: 'COMPLETED' }, accessToken);
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
  markOrderCompleted,
};
