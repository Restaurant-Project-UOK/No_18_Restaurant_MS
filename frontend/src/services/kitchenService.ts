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
  tableId?: number;
  status: OrderStatus;
  createdAt: string;
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
 * GET /api/orders/active
 * Returns all active orders for kitchen display.
 * Filters to statuses relevant to kitchen: CREATED, CONFIRMED, PREPARING.
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

    const response = await apiRequest<Order[]>(
      `${API_CONFIG.KITCHEN_ENDPOINT}/orders`,
      {
        jwt: token,
      }
    );

    // Filter to kitchen-relevant statuses and transform to kitchen order format
    const kitchenStatuses: OrderStatus[] = [
      OrderStatus.CREATED,
      OrderStatus.CONFIRMED,
      OrderStatus.PREPARING,
    ];

    const kitchenOrders = response
      .filter((order) => kitchenStatuses.includes(order.status))
      .map((order) => ({
        orderId: String(order.id),
        items: order.items.map((item) => ({
          id: String(item.id),
          // Support both new (itemName) and legacy (menuItem.name) field names
          name: item.itemName || item.menuItem?.name || '',
          quantity: item.quantity,
          specialRequests: item.specialRequests,
        })),
        tableId: order.tableId ?? order.tableNumber,
        status: order.status,
        createdAt: order.createdAt || order.orderTime || new Date().toISOString(),
        priority: determinePriority(order),
      }));

    // Sort by priority and time
    kitchenOrders.sort((a, b) => {
      const priorityWeight = { high: 3, normal: 2, low: 1 };
      const priorityDiff = priorityWeight[b.priority!] - priorityWeight[a.priority!];
      if (priorityDiff !== 0) return priorityDiff;
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
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
 * PATCH /api/orders/:id/status
 * Marks order as CONFIRMED (kitchen accepts the order)
 */
const markOrderCreated = async (
  orderId: string,
  accessToken?: string
): Promise<StatusUpdateResponse> => {
  try {
    const token = accessToken || localStorage.getItem('auth_access_token');
    if (!token) throw new Error('Unauthorized: No access token');

    await apiRequest<Order>(
      `${API_CONFIG.ORDERS_ENDPOINT}/${orderId}/status`,
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
 * PATCH /api/orders/:id/status
 * Marks order as PREPARING
 */
const markOrderPreparing = async (
  orderId: string,
  accessToken?: string
): Promise<StatusUpdateResponse> => {
  try {
    const token = accessToken || localStorage.getItem('auth_access_token');
    if (!token) throw new Error('Unauthorized: No access token');

    await apiRequest<Order>(
      `${API_CONFIG.KITCHEN_ENDPOINT}/orders/${orderId}/preparing`,
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
 * PATCH /api/orders/:id/status
 * Marks order as READY for pickup
 */
const markOrderReady = async (
  orderId: string,
  accessToken?: string
): Promise<StatusUpdateResponse> => {
  try {
    const token = accessToken || localStorage.getItem('auth_access_token');
    if (!token) throw new Error('Unauthorized: No access token');

    await apiRequest<Order>(
      `${API_CONFIG.KITCHEN_ENDPOINT}/orders/${orderId}/ready`,
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
 * Health check — falls back gracefully if endpoint doesn't exist
 */
const getKitchenHealth = async (): Promise<HealthCheckResponse> => {
  try {
    return await apiRequest<HealthCheckResponse>(
      `${API_CONFIG.ANALYTICS_ENDPOINT}/kitchen-health`
    );
  } catch {
    return {
      status: 'DOWN',
      timestamp: new Date().toISOString(),
    };
  }
};

/**
 * Determines order priority based on waiting time
 */
const determinePriority = (order: Order): 'low' | 'normal' | 'high' => {
  const orderTime = new Date(order.createdAt || order.orderTime || Date.now()).getTime();
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
