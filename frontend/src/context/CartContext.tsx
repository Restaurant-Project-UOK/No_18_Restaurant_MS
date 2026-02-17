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
  removeFromCart: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  getTotalPrice: () => number;
  getItemCount: () => number;
  // Backend integration methods
  checkout: (jwtToken: string) => Promise<{ orderId: string; totalAmount: number }>;
  getOrder: (orderId: string, jwtToken: string) => Promise<Order>;
  createPayment: (orderId: string, amount: number) => Promise<CreatePaymentResponse>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addToCart = useCallback(
    (menuItem: MenuItem, quantity: number, specialRequests?: string) => {
      setCartItems((prev) => {
        const existingItem = prev.find((item) => item.menuItem.id === menuItem.id);
        if (existingItem) {
          return prev.map((item) =>
            item.menuItem.id === menuItem.id
              ? { ...item, quantity: item.quantity + quantity }
              : item
          );
        }
        return [
          ...prev,
          {
            id: `cart_${menuItem.id}_${Date.now()}`,
            menuItem,
            quantity,
            specialRequests,
          },
        ];
      });
    },
    []
  );

  const removeFromCart = useCallback((itemId: string) => {
    setCartItems((prev) => prev.filter((item) => item.menuItem.id !== itemId));
  }, []);

  const updateQuantity = useCallback((itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(itemId);
    } else {
      setCartItems((prev) =>
        prev.map((item) =>
          item.menuItem.id === itemId ? { ...item, quantity } : item
        )
      );
    }
  }, [removeFromCart]);

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
   * Checks out the cart and creates an order
   */
  const checkout = useCallback(async (jwtToken: string): Promise<{ orderId: string; totalAmount: number }> => {
    setLoading(true);
    setError(null);

    try {
      // Sync cart items to backend before checkout
      for (const item of cartItems) {
        const cartItemData: CartItemRequest = {
          menuItemId: item.menuItem.id,
          itemName: item.menuItem.name,
          price: item.menuItem.price,
          quantity: item.quantity,
          note: item.specialRequests,
        };
        await cartService.addCartItem(cartItemData, jwtToken);
      }

      // Perform checkout
      const result = await cartService.checkout(jwtToken);
      
      // Clear local cart after successful checkout
      setCartItems([]);

      console.log('[CartContext] Checkout successful:', result.orderId);
      return result;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Checkout failed';
      setError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [cartItems]);

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
      const paymentResponse = await paymentService.createPayment(orderId, amount);
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

