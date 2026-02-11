import { createContext, useContext, useState, ReactNode, useCallback } from "react";
import { MenuItem } from "../api/menu";

export interface CartItem extends MenuItem {
  quantity: number;
  notes?: string;
}

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (item: MenuItem, quantity: number, notes?: string) => void;
  removeFromCart: (id: number) => void;
  updateQuantity: (id: number, quantity: number) => void;
  updateNotes: (id: number, notes: string) => void;
  getTotalPrice: () => number;
  getTotalItems: () => number;
  clearCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

interface CartProviderProps {
  children: ReactNode;
}

export function CartProvider({ children }: CartProviderProps) {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  const addToCart = useCallback((item: MenuItem, quantity: number, notes?: string) => {
    setCartItems((prev) => {
      const existing = prev.find((ci) => ci.id === item.id);
      if (existing) {
        return prev.map((ci) =>
          ci.id === item.id
            ? { ...ci, quantity: ci.quantity + quantity, notes: notes || ci.notes }
            : ci
        );
      }
      return [...prev, { ...item, quantity, notes }];
    });
  }, []);

  const removeFromCart = useCallback((id: number) => {
    setCartItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const updateQuantity = useCallback((id: number, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(id);
      return;
    }
    setCartItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, quantity } : item))
    );
  }, [removeFromCart]);

  const updateNotes = useCallback((id: number, notes: string) => {
    setCartItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, notes } : item))
    );
  }, []);

  const getTotalPrice = useCallback(
    () => cartItems.reduce((total, item) => total + item.price * item.quantity, 0),
    [cartItems]
  );

  const getTotalItems = useCallback(
    () => cartItems.reduce((total, item) => total + item.quantity, 0),
    [cartItems]
  );

  const clearCart = useCallback(() => {
    setCartItems([]);
  }, []);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        updateQuantity,
        updateNotes,
        getTotalPrice,
        getTotalItems,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within CartProvider");
  }
  return context;
};
