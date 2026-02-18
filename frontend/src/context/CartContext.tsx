/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useCallback, useMemo, ReactNode } from 'react';
import { MenuItem, Order } from '../types';
import { cartService, CartItemRequest } from '../services/cartService';
import { paymentService, CreatePaymentResponse } from '../services/paymentService';

export interface CartItem {
  id: string;
  menuItem: MenuItem;
  quantity: number;
  specialRequests?: string;
}

interface CartContextType {
  cartItems: CartItem[];
  loading: boolean;
  error: string | null;
  addToCart: (menuItem: MenuItem, quantity: number, specialRequests?: string) => void;
  removeFromCart: (itemId: number) => void;
  updateQuantity: (itemId: number, quantity: number) => void;
  clearCart: () => void;
  getTotalPrice: () => number;
  getItemCount: () => number;
  // Backend integration methods
  initCart: (jwtToken?: string) => Promise<string>;
  checkout: (jwtToken: string) => Promise<{ orderId: string; totalAmount: number }>;
  getOrder: (orderId: string, jwtToken: string) => Promise<Order>;
  createPayment: (orderId: string, amount: number) => Promise<CreatePaymentResponse>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [cartId, setCartId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addToCart = useCallback(
    async (menuItem: MenuItem, quantity: number, specialRequests?: string) => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('auth_access_token') || undefined;

        // 1. Init cart if needed
        let currentCartId = cartId;
        if (!currentCartId) {
          const openResponse = await cartService.openCart(token);
          currentCartId = openResponse.cartId;
          setCartId(currentCartId);
        }

        // 2. Add item to backend
        const itemData: CartItemRequest = {
          menuItemId: menuItem.id,
          itemName: menuItem.name,
          price: menuItem.price,
          quantity: quantity,
          note: specialRequests,
        };
        const backendItem = await cartService.addCartItem(itemData, token);

        // 3. Update local state
        setCartItems((prev) => {
          const existingItem = prev.find((item) => item.menuItem.id === menuItem.id);
          if (existingItem) {
            return prev.map((item) =>
              item.menuItem.id === menuItem.id
                ? { ...item, quantity: item.quantity + quantity, id: backendItem.id }
                : item
            );
          }
          return [
            ...prev,
            {
              id: backendItem.id, // Use backend's item ID
              menuItem,
              quantity,
              specialRequests,
            },
          ];
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to add to cart');
      } finally {
        setLoading(false);
      }
    },
    [cartId]
  );

  const removeFromCart = useCallback(async (itemId: number) => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('auth_access_token') || undefined;
      const itemToDelete = cartItems.find(item => item.menuItem.id === itemId);
      if (itemToDelete) {
        await cartService.deleteCartItem(itemToDelete.id, token);
      }
      setCartItems((prev) => prev.filter((item) => item.menuItem.id !== itemId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove from cart');
    } finally {
      setLoading(false);
    }
  }, [cartItems]);

  const updateQuantity = useCallback(async (itemId: number, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(itemId);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('auth_access_token') || undefined;

      // Find the cart item ID (backend ID)
      const itemToUpdate = cartItems.find(item => item.menuItem.id === itemId);
      if (itemToUpdate) {
        await cartService.updateCartItem(itemToUpdate.id, { quantity }, token);
      }

      setCartItems((prev) =>
        prev.map((item) =>
          item.menuItem.id === itemId ? { ...item, quantity } : item
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update quantity');
    } finally {
      setLoading(false);
    }
  }, [cartItems, removeFromCart]);

  const clearCart = useCallback(() => {
    setCartItems([]);
  }, []);

  const getTotalPrice = useCallback(() => {
    return cartItems.reduce((total, item) => total + item.menuItem.price * item.quantity, 0);
  }, [cartItems]);

  const getItemCount = useCallback(() => {
    return cartItems.reduce((count, item) => count + item.quantity, 0);
  }, [cartItems]);

  // ============================================
  // BACKEND INTEGRATION METHODS
  // ============================================



  /**
   * Initializes a cart session
   */
  const initCart = useCallback(async (jwtToken?: string): Promise<string> => {
    setLoading(true);
    setError(null);
    try {
      const response = await cartService.openCart(jwtToken);
      setCartId(response.cartId);
      return response.cartId;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to init cart');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Checks out the cart and creates an order
   */
  const checkout = useCallback(async (jwtToken: string): Promise<{ orderId: string; totalAmount: number }> => {
    setLoading(true);
    setError(null);

    try {
      // Perform checkout directly if items are already synced
      const result = await cartService.checkout(jwtToken);

      // Clear local cart after successful checkout
      setCartItems([]);
      setCartId(null);

      console.log('[CartContext] Checkout successful:', result.orderId);
      return result;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Checkout failed';
      setError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Retrieves order details by order ID
   */
  const getOrder = useCallback(async (orderId: string, jwtToken: string): Promise<Order> => {
    setLoading(true);
    setError(null);

    try {
      const order = await cartService.getOrder(orderId, jwtToken);
      return order;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to fetch order';
      setError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Creates a payment session for an order
   */
  const createPayment = useCallback(async (
    orderId: string,
    amount: number
  ): Promise<CreatePaymentResponse> => {
    setLoading(true);
    setError(null);

    try {
      const paymentResponse = await paymentService.createPayment({
        total: amount,
        currency: 'USD',
        method: 'paypal',
        intent: 'sale',
        description: `Order #${orderId}`,
      });
      console.log('[CartContext] Payment created:', paymentResponse.paymentId);
      return paymentResponse;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to create payment';
      setError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const value = useMemo(
    () => ({
      cartItems,
      loading,
      error,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      getTotalPrice,
      getItemCount,
      initCart,
      checkout,
      getOrder,
      createPayment,
    }),
    [cartItems, loading, error, addToCart, removeFromCart, updateQuantity, clearCart, getTotalPrice, getItemCount, checkout, getOrder, createPayment]
  );

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
};

