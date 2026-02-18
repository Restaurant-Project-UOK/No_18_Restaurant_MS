import { Order } from '../types';
import { apiRequest, API_CONFIG } from '../config/api';
import { getAccessToken } from '../utils/cookieStorage';

// ============================================
// TYPES & INTERFACES
// ============================================

export interface CartItemRequest {
  menuItemId: number;
  itemName: string;
  price: number;
  quantity: number;
  note?: string;
}

export interface UpdateCartItemRequest {
  quantity: number;
}

export interface CartItemResponse {
  id: string;
  menuItemId: number;
  itemName: string;
  price: number;
  quantity: number;
  note?: string;
  subtotal: number;
}

export interface CartOpenResponse {
  cartId: string;
  status: string;
  message: string;
}

export interface CheckoutResponse {
  orderId: string;
  status: string;
  totalAmount: number;
}

// ============================================
// CART API ENDPOINTS
// ============================================

/**
 * POST /api/cart/open
 * Opens a new shopping cart session
 * 
 * @param accessToken - JWT access token
 * @returns Cart ID and confirmation
 */
const openCart = async (accessToken?: string): Promise<CartOpenResponse> => {
  try {
    const token = accessToken || getAccessToken();
    if (!token) {
      throw new Error('Unauthorized: No access token');
    }

    const response = await apiRequest<CartOpenResponse>(
      `${API_CONFIG.CART_ENDPOINT}/open`,
      {
        method: 'POST',
        jwt: token,
      }
    );

    console.log('[cartService] Cart opened:', response.cartId);
    return response;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to open cart';
    console.error('[cartService] Failed to open cart:', message);
    throw new Error(message);
  }
};

/**
 * POST /api/cart/items
 * Adds an item to the cart
 * 
 * @param itemData - Cart item details
 * @param accessToken - JWT access token
 * @returns Updated cart item
 */
const addCartItem = async (
  itemData: CartItemRequest,
  accessToken?: string
): Promise<CartItemResponse> => {
  try {
    const token = accessToken || getAccessToken();
    if (!token) {
      throw new Error('Unauthorized: No access token');
    }

    const response = await apiRequest<CartItemResponse>(
      `${API_CONFIG.CART_ENDPOINT}/items`,
      {
        method: 'POST',
        jwt: token,
        body: JSON.stringify(itemData),
      }
    );

    console.log('[cartService] Added cart item:', response.id);
    return response;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to add cart item';
    console.error('[cartService] Failed to add cart item:', message);
    throw new Error(message);
  }
};

/**
 * PUT /api/cart/items/:itemId
 * Updates the quantity of a cart item
 * 
 * @param itemId - Cart item ID
 * @param updateData - Updated quantity
 * @param accessToken - JWT access token
 * @returns Updated cart item
 */
const updateCartItem = async (
  itemId: string | number,
  updateData: UpdateCartItemRequest,
  accessToken?: string
): Promise<CartItemResponse> => {
  try {
    const token = accessToken || getAccessToken();
    if (!token) {
      throw new Error('Unauthorized: No access token');
    }

    const response = await apiRequest<CartItemResponse>(
      `${API_CONFIG.CART_ENDPOINT}/items/${itemId}`,
      {
        method: 'PUT',
        jwt: token,
        body: JSON.stringify(updateData),
      }
    );

    console.log('[cartService] Updated cart item:', itemId);
    return response;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to update cart item';
    console.error('[cartService] Failed to update cart item:', message);
    throw new Error(message);
  }
};

/**
 * DELETE /api/cart/items/:itemId
 * Removes an item from the cart
 * 
 * @param itemId - Cart item ID
 * @param accessToken - JWT access token
 */
const deleteCartItem = async (itemId: string | number, accessToken?: string): Promise<void> => {
  try {
    const token = accessToken || getAccessToken();
    if (!token) {
      throw new Error('Unauthorized: No access token');
    }

    await apiRequest<void>(
      `${API_CONFIG.CART_ENDPOINT}/items/${itemId}`,
      {
        method: 'DELETE',
        jwt: token,
      }
    );

    console.log('[cartService] Deleted cart item:', itemId);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to delete cart item';
    console.error('[cartService] Failed to delete cart item:', message);
    throw new Error(message);
  }
};

/**
 * POST /api/cart/checkout
 * Checks out the current cart and creates an order
 * 
 * @param accessToken - JWT access token
 * @returns Order ID, status, and total amount
 */
const checkout = async (accessToken?: string): Promise<CheckoutResponse> => {
  try {
    const token = accessToken || getAccessToken();
    if (!token) {
      throw new Error('Unauthorized: No access token');
    }

    // Get tableId from cookie
    let tableId: number | undefined;
    const cookieMatch = document.cookie.match(/(?:^|;\s*)tableId=(\d+)/);
    if (cookieMatch) {
      tableId = parseInt(cookieMatch[1], 10);
    }

    const response = await apiRequest<CheckoutResponse>(
      `${API_CONFIG.CART_ENDPOINT}/checkout`,
      {
        method: 'POST',
        jwt: token,
        headers: tableId ? { 'X-Table-Id': String(tableId) } : {},
      }
    );

    console.log('[cartService] Checkout completed:', response.orderId);
    return response;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Checkout failed';
    console.error('[cartService] Checkout failed:', message);
    throw new Error(message);
  }
};

/**
 * GET /api/cart/order/:orderId
 * Retrieves full order details
 * 
 * @param orderId - Order ID
 * @param accessToken - JWT access token
 * @returns Full order details
 */
const getOrder = async (orderId: string, accessToken?: string): Promise<Order> => {
  try {
    const token = accessToken || getAccessToken();
    if (!token) {
      throw new Error('Unauthorized: No access token');
    }

    const response = await apiRequest<Order>(
      `${API_CONFIG.CART_ENDPOINT}/order/${orderId}`,
      {
        jwt: token,
      }
    );

    console.log('[cartService] Retrieved order:', orderId);
    return response;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch order';
    console.error('[cartService] Failed to fetch order:', message);
    throw new Error(message);
  }
};

// ============================================
// EXPORTED SERVICE
// ============================================

export const cartService = {
  openCart,
  addCartItem,
  updateCartItem,
  deleteCartItem,
  checkout,
  getOrder,
};

