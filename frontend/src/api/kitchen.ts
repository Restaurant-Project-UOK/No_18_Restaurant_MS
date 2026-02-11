import { gateway } from "../services/gateway";
import { Order } from "./order";

export interface KitchenOrderItem {
  menuItemId: number;
  name: string;
  quantity: number;
  notes?: string;
}

export interface KitchenOrderDetails {
  id: number;
  orderId: string;
  tableId?: number;
  items: KitchenOrderItem[];
  status: "pending" | "preparing" | "ready" | "delivered";
  specialRequests?: string;
  createdAt: Date;
  updatedAt?: Date;
}

/**
 * Get orders for kitchen staff (customer orders filtered by status)
 */
export async function getKitchenOrders(
  status?: "pending" | "preparing" | "ready",
  tableId?: number | string
): Promise<KitchenOrderDetails[]> {
  try {
    const url = status ? `kitchen/orders?status=${status}` : "kitchen/orders";
    return await gateway.kitchen.get(url, tableId);
  } catch (error) {
    console.error("Failed to fetch kitchen orders:", error);
    throw error;
  }
}

/**
 * Get details for a specific order
 */
export async function getOrderDetailsForKitchen(
  id: number,
  tableId?: number | string
): Promise<KitchenOrderDetails> {
  try {
    return await gateway.kitchen.get(`kitchen/orders/${id}`, tableId);
  } catch (error) {
    console.error("Failed to fetch order details:", error);
    throw error;
  }
}

/**
 * Update order status (pending → preparing → ready)
 */
export async function updateOrderStatus(
  id: number,
  status: "preparing" | "ready" | "delivered",
  tableId?: number | string
): Promise<KitchenOrderDetails> {
  try {
    return await gateway.kitchen.put(
      `kitchen/orders/${id}`,
      { status },
      tableId
    );
  } catch (error) {
    console.error("Failed to update order status:", error);
    throw error;
  }
}

/**
 * Get orders for a specific table
 */
export async function getOrdersForTableKitchen(
  tableId: number | string
): Promise<Order[]> {
  try {
    return await gateway.kitchen.get(`kitchen/orders/table/${tableId}`, tableId);
  } catch (error) {
    console.error("Failed to fetch table orders:", error);
    throw error;
  }
}

/**
 * Get kitchen statistics/summary
 */
export async function getKitchenStats(
  tableId?: number | string
) {
  try {
    return await gateway.kitchen.get("kitchen/stats", tableId);
  } catch (error) {
    console.error("Failed to fetch kitchen stats:", error);
    throw error;
  }
}

/**
 * Add or update notes on an order
 */
export async function updateOrderNotes(
  id: number,
  notes: string,
  tableId?: number | string
): Promise<KitchenOrderDetails> {
  try {
    return await gateway.kitchen.put(
      `kitchen/orders/${id}/notes`,
      { notes },
      tableId
    );
  } catch (error) {
    console.error("Failed to update order notes:", error);
    throw error;
  }
}
