import { Order, OrderStatus } from '../types';
import { apiRequest, API_CONFIG } from '../config/api';

// ============================================
// TYPES & INTERFACES
// ============================================

export interface KitchenOrder {
  orderId: string;
  items: {
    id: string;
    name: string;
    quantity: number;
    specialRequests?: string;
  }[];
  tableNumber?: number;
  customerName: string;
  status: OrderStatus;
  orderTime: string;
  priority?: 'low' | 'normal' | 'high';
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
// KITCHEN API ENDPOINTS
// ============================================

/**
 * GET /api/orders?status=PENDING,CONFIRMED,PREPARING
 * Returns all orders that need kitchen attention
 * 
 * @param accessToken - JWT access token (Kitchen or Admin role)
 * @returns Array of kitchen orders
 */
const getKitchenOrders = async (accessToken?: string): Promise<KitchenOrder[]> => {
  try {
    const token = accessToken || localStorage.getItem('auth_access_token');
    if (!token) {
      throw new Error('Unauthorized: No access token');
    }

    // Use ORDERS_ENDPOINT with query params
    const response = await apiRequest<Order[]>(
      '/api/kitchen/orders',
      {
        jwt: token,
      }
    );

    // Transform to kitchen order format and sort by priority
    const kitchenOrders = response.map((order) => ({
      orderId: order.id,
      items: order.items.map((item) => ({
        id: item.id,
        name: item.menuItem.name,
        quantity: item.quantity,
        specialRequests: item.specialRequests,
      })),
      tableNumber: order.tableNumber,
      customerName: order.customerName,
      status: order.status,
      orderTime: order.orderTime,
      priority: determinePriority(order),
    }));

    // Sort by priority and time
    kitchenOrders.sort((a, b) => {
      const priorityWeight = { high: 3, normal: 2, low: 1 };
      const priorityDiff = priorityWeight[b.priority!] - priorityWeight[a.priority!];
      if (priorityDiff !== 0) return priorityDiff;
      return new Date(a.orderTime).getTime() - new Date(b.orderTime).getTime();
    });

    console.log('[kitchenService] Retrieved', kitchenOrders.length, 'orders');
    return kitchenOrders;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch kitchen orders';
    console.error('[kitchenService] Failed to fetch kitchen orders:', message);
    throw new Error(message);
  }
};

/**
 * PATCH /api/orders/:id
 * Marks order as created/confirmed
 */
const markOrderCreated = async (
  orderId: string,
  accessToken?: string
): Promise<StatusUpdateResponse> => {
  try {
    const token = accessToken || localStorage.getItem('auth_access_token');
    if (!token) throw new Error('Unauthorized: No access token');

    await apiRequest<Order>(
      `${API_CONFIG.ORDERS_ENDPOINT}/${orderId}`,
      {
        method: 'PATCH',
        jwt: token,
        body: JSON.stringify({ status: OrderStatus.CONFIRMED }),
      }
    );

    return {
      orderId,
      status: OrderStatus.CONFIRMED,
      message: 'Order confirmed and added to kitchen queue',
      timestamp: new Date().toISOString(),
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to update order';
    throw new Error(message);
  }
};

/**
 * PATCH /api/orders/:id
 * Marks order as being prepared
 */
const markOrderPreparing = async (
  orderId: string,
  accessToken?: string
): Promise<StatusUpdateResponse> => {
  try {
    const token = accessToken || localStorage.getItem('auth_access_token');
    if (!token) throw new Error('Unauthorized: No access token');

    await apiRequest<Order>(
      `/api/kitchen/orders/${orderId}/preparing`,
      {
        method: 'POST',
        jwt: token,
      }
    );

    return {
      orderId,
      status: OrderStatus.PREPARING,
      message: 'Order is now being prepared',
      timestamp: new Date().toISOString(),
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to update order';
    throw new Error(message);
  }
};

/**
 * PATCH /api/orders/:id
 * Marks order as ready for pickup
 */
const markOrderReady = async (
  orderId: string,
  accessToken?: string
): Promise<StatusUpdateResponse> => {
  try {
    const token = accessToken || localStorage.getItem('auth_access_token');
    if (!token) throw new Error('Unauthorized: No access token');

    await apiRequest<Order>(
      `/api/kitchen/orders/${orderId}/ready`,
      {
        method: 'POST',
        jwt: token,
      }
    );

    return {
      orderId,
      status: OrderStatus.READY,
      message: 'Order is ready for pickup',
      timestamp: new Date().toISOString(),
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to update order';
    throw new Error(message);
  }
};

/**
 * GET /api/admin/analytics/kitchen-health
 * Health check endpoint
 */
const getKitchenHealth = async (): Promise<HealthCheckResponse> => {
  try {
    return await apiRequest<HealthCheckResponse>(
      `${API_CONFIG.ANALYTICS_ENDPOINT}/kitchen-health`
    );
  } catch (error) {
    return {
      status: 'DOWN',
      timestamp: new Date().toISOString(),
    };
  }
};

/**
 * Determines order priority based on time
 */
const determinePriority = (order: Order): 'low' | 'normal' | 'high' => {
  const orderTime = new Date(order.orderTime).getTime();
  const now = Date.now();
  const minutesWaiting = (now - orderTime) / (1000 * 60);

  if (minutesWaiting > 20) return 'high';
  if (minutesWaiting > 10) return 'normal';
  return 'low';
};

// ============================================
// EXPORTED SERVICE
// ============================================

export const kitchenService = {
  getKitchenOrders,
  markOrderCreated,
  markOrderPreparing,
  markOrderReady,
  getKitchenHealth,
};
