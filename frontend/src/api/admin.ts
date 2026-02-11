import { gateway } from "../services/gateway";
import { MenuItem } from "./menu";

export interface AdminDashboardStats {
  totalOrders: number;
  totalRevenue: number;
  activeUsers: number;
  pendingOrders: number;
}

export interface MenuItemPayload {
  name: string;
  price: number;
  description?: string;
  category?: string;
  available?: boolean;
}

// ==================== Admin Dashboard ====================

/**
 * Get admin dashboard statistics
 */
export async function getAdminDashboard(
  tableId?: number | string
): Promise<AdminDashboardStats> {
  try {
    return await gateway.admin.get("admin/dashboard", tableId);
  } catch (error) {
    console.error("Failed to fetch admin dashboard:", error);
    throw error;
  }
}

// ==================== Menu Management ====================

/**
 * Get menu statistics for admin
 */
export async function getMenuStatsForAdmin(tableId?: number | string) {
  try {
    return await gateway.admin.get("admin/menu/stats", tableId);
  } catch (error) {
    console.error("Failed to fetch menu stats:", error);
    throw error;
  }
}

/**
 * Get all menu items for admin management
 */
export async function getMenuItemsForAdmin(
  tableId?: number | string
): Promise<MenuItem[]> {
  try {
    return await gateway.admin.get("admin/menu", tableId);
  } catch (error) {
    console.error("Failed to fetch menu items for admin:", error);
    throw error;
  }
}

/**
 * Create a new menu item
 */
export async function createMenuItem(
  payload: MenuItemPayload,
  tableId?: number | string
): Promise<MenuItem> {
  try {
    return await gateway.admin.post("admin/menu", payload, tableId);
  } catch (error) {
    console.error("Failed to create menu item:", error);
    throw error;
  }
}

/**
 * Update an existing menu item
 */
export async function updateMenuItem(
  id: number,
  payload: Partial<MenuItemPayload>,
  tableId?: number | string
): Promise<MenuItem> {
  try {
    return await gateway.admin.put(`admin/menu/${id}`, payload, tableId);
  } catch (error) {
    console.error("Failed to update menu item:", error);
    throw error;
  }
}

/**
 * Delete a menu item
 */
export async function deleteMenuItem(
  id: number,
  tableId?: number | string
): Promise<{ success: boolean }> {
  try {
    return await gateway.admin.delete(`admin/menu/${id}`, tableId);
  } catch (error) {
    console.error("Failed to delete menu item:", error);
    throw error;
  }
}

// ==================== User Management ====================

/**
 * Get all users
 */
export async function getAllUsers(tableId?: number | string) {
  try {
    return await gateway.admin.get("admin/users", tableId);
  } catch (error) {
    console.error("Failed to fetch users:", error);
    throw error;
  }
}

/**
 * Get a specific user by ID
 */
export async function getUserById(
  id: number,
  tableId?: number | string
) {
  try {
    return await gateway.admin.get(`admin/users/${id}`, tableId);
  } catch (error) {
    console.error("Failed to fetch user:", error);
    throw error;
  }
}

/**
 * Update a user
 */
export async function updateUser(
  id: number,
  payload: any,
  tableId?: number | string
) {
  try {
    return await gateway.admin.put(`admin/users/${id}`, payload, tableId);
  } catch (error) {
    console.error("Failed to update user:", error);
    throw error;
  }
}

// ==================== Order Management ====================

/**
 * Get all orders from admin perspective
 */
export async function getAdminOrders(
  filters?: any,
  tableId?: number | string
) {
  try {
    const queryString = filters
      ? new URLSearchParams(filters).toString()
      : "";
    const url = queryString ? `admin/orders?${queryString}` : "admin/orders";
    return await gateway.admin.get(url, tableId);
  } catch (error) {
    console.error("Failed to fetch admin orders:", error);
    throw error;
  }
}

/**
 * Get detailed order information from admin perspective
 */
export async function getOrderDetailsAdmin(
  id: number,
  tableId?: number | string
) {
  try {
    return await gateway.admin.get(`admin/orders/${id}`, tableId);
  } catch (error) {
    console.error("Failed to fetch order details:", error);
    throw error;
  }
}
