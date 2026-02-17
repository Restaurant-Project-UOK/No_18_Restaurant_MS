import { Order, OrderStatus } from '../types';
import { apiRequest } from '../config/api';

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
// MOCK DATA PERSISTENCE (For cross-service sync)
// ============================================

// Shared mock orders store (for OrderContext/KitchenService sync)
// Can be removed once backend fully syncs orders
let mockOrders: Order[] = [];

/**
 * Initialize mock orders (called from OrderContext)
 */
export const initializeMockOrders = (orders: Order[]): void => {
  mockOrders = orders;
  console.log('[kitchenService] Initialized with', mockOrders.length, 'orders');
};

/**
 * Get current mock orders (for syncing with OrderContext)
 */
export const getMockOrders = (): Order[] => {
  return mockOrders;
};

/**
 * Update an order in the mock store
 */
export const updateMockOrder = (orderId: string, updates: Partial<Order>): void => {
  const orderIndex = mockOrders.findIndex((o) => o.id === orderId);
  if (orderIndex !== -1) {
    mockOrders[orderIndex] = { ...mockOrders[orderIndex], ...updates };
  }
};

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

    const response = await apiRequest<Order[]>(
      '/api/orders?status=PENDING,CONFIRMED,PREPARING',
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
 * 
 * @param orderId - Order ID
 * @param accessToken - JWT access token
 * @returns Status update confirmation
 */
const markOrderCreated = async (
  orderId: string,
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
        body: JSON.stringify({ status: OrderStatus.CONFIRMED }),
      }
    );

    console.log('[kitchenService] Order marked as created:', orderId);
    return {
      orderId,
      status: OrderStatus.CONFIRMED,
      message: 'Order confirmed and added to kitchen queue',
      timestamp: new Date().toISOString(),
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to update order';
    console.error('[kitchenService] Failed to mark order created:', message);
    throw new Error(message);
  }
};

/**
 * PATCH /api/orders/:id
 * Marks order as being prepared
 * 
 * @param orderId - Order ID
 * @param accessToken - JWT access token
 * @returns Status update confirmation
 */
const markOrderPreparing = async (
  orderId: string,
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
        body: JSON.stringify({ status: OrderStatus.PREPARING }),
      }
    );

    console.log('[kitchenService] Order marked as preparing:', orderId);
    return {
      orderId,
      status: OrderStatus.PREPARING,
      message: 'Order is now being prepared',
      timestamp: new Date().toISOString(),
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to update order';
    console.error('[kitchenService] Failed to mark order preparing:', message);
    throw new Error(message);
  }
};

/**
 * PATCH /api/orders/:id
 * Marks order as ready for pickup
 * 
 * @param orderId - Order ID
 * @param accessToken - JWT access token
 * @returns Status update confirmation
 */
const markOrderReady = async (
  orderId: string,
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
        body: JSON.stringify({ status: OrderStatus.READY }),
      }
    );

    console.log('[kitchenService] Order marked as ready:', orderId);
    return {
      orderId,
      status: OrderStatus.READY,
      message: 'Order is ready for pickup',
      timestamp: new Date().toISOString(),
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to update order';
    console.error('[kitchenService] Failed to mark order ready:', message);
    throw new Error(message);
  }
};

/**
 * GET /api/admin/analytics/kitchen-health
 * Health check endpoint (No JWT required)
 * 
 * @returns Health status
 */
const getKitchenHealth = async (): Promise<HealthCheckResponse> => {
  try {
    const response = await apiRequest<HealthCheckResponse>(
      '/api/admin/analytics/kitchen-health'
    );

    console.log('[kitchenService] Health check:', response.status);
    return response;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[kitchenService] Health check failed:', message);
    // Return degraded status instead of throwing
    return {
      status: 'DOWN',
      timestamp: new Date().toISOString(),
    };
  }
};

/**
 * Determines order priority based on time and table status
 */
const determinePriority = (order: Order): 'low' | 'normal' | 'high' => {
  const orderTime = new Date(order.orderTime).getTime();
  const now = Date.now();
  const minutesWaiting = (now - orderTime) / (1000 * 60);

  // High priority if waiting > 20 minutes
  if (minutesWaiting > 20) return 'high';
  
  // Normal priority if 10-20 minutes
  if (minutesWaiting > 10) return 'normal';
  
  // Low priority if < 10 minutes
  return 'low';
};

// ============================================
// EXPORTED SERVICE
// ============================================

export const kitchenService = {
  // API endpoints
  getKitchenOrders,
  markOrderCreated,
  markOrderPreparing,
  markOrderReady,
  getKitchenHealth,
  
  // Data management helpers (for OrderContext sync)
  initializeMockOrders,
  getMockOrders,
  updateMockOrder,};
