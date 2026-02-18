/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useCallback, useMemo, ReactNode, useEffect } from 'react';
import { Order, OrderStatus } from '../types';
import { orderService } from '../services/orderService';
import { useAuth } from './AuthContext';

interface OrderContextType {
  orders: Order[];
  addOrder: (order: Order) => void;
  updateOrderStatus: (orderId: string, status: OrderStatus) => void;
  getOrderById: (orderId: string) => Order | undefined;
  deleteOrder: (orderId: string) => void;
  getOrdersByStatus: (status: OrderStatus) => Order[];
  getOrdersByCustomer: (customerId: string) => Order[];
  // API methods
  createOrderAPI: (tableId?: number) => Promise<Order>;
  updateOrderStatusAPI: (orderId: string, status: OrderStatus) => Promise<Order>;
  getActiveOrdersAPI: () => Promise<Order[]>;
  getUserOrdersAPI: () => Promise<Order[]>;
  getTableOrdersAPI: (tableId: number) => Promise<Order[]>;
  loadingAPI: boolean;
  errorAPI: string | null;
  refreshOrders: () => Promise<void>;
  loadUserHistory: () => Promise<void>;
}

const OrderContext = createContext<OrderContextType | undefined>(undefined);

export const OrderProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingAPI, setLoadingAPI] = useState(false);
  const [errorAPI, setErrorAPI] = useState<string | null>(null);
  const { getJwtToken, isAuthenticated } = useAuth();

  const refreshOrders = useCallback(async () => {
    setLoadingAPI(true);
    setErrorAPI(null);
    try {
      // For staff/general context: load active orders
      const activeOrders = await orderService.getActiveOrders();
      setOrders(activeOrders);
    } catch (error) {
      console.error('[OrderContext] Failed to load active orders:', error);
      setErrorAPI(error instanceof Error ? error.message : 'Failed to load orders');
    } finally {
      setLoadingAPI(false);
    }
  }, []);

  const loadUserHistory = useCallback(async () => {
    setLoadingAPI(true);
    setErrorAPI(null);
    try {
      const jwt = getJwtToken() || undefined;
      if (jwt) {
        const userOrders = await orderService.getUserOrders(jwt);
        setOrders(userOrders);
      }
    } catch (error) {
      console.error('[OrderContext] Failed to load user history:', error);
      setErrorAPI(error instanceof Error ? error.message : 'Failed to load user history');
    } finally {
      setLoadingAPI(false);
    }
  }, [getJwtToken]);

  // Load orders on mount — only when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      refreshOrders();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  const addOrder = useCallback((order: Order) => {
    setOrders((prev) => [...prev, order]);
  }, []);

  const updateOrderStatus = useCallback((orderId: string, status: OrderStatus) => {
    setOrders((prev) =>
      prev.map((order) =>
        order.id === orderId
          ? { ...order, status, completedTime: status === OrderStatus.SERVED ? new Date().toISOString() : undefined }
          : order
      )
    );
  }, []);

  const getOrderById = useCallback(
    (orderId: string) => {
      return orders.find((order) => order.id === orderId);
    },
    [orders]
  );

  const deleteOrder = useCallback((orderId: string) => {
    setOrders((prev) => prev.filter((order) => order.id !== orderId));
  }, []);

  const getOrdersByStatus = useCallback(
    (status: OrderStatus) => {
      return orders.filter((order) => order.status === status);
    },
    [orders]
  );

  const getOrdersByCustomer = useCallback(
    (customerId: string) => {
      return orders.filter((order) => {
        // Check legacy customerId
        if (order.customerId === customerId) return true;
        // Check userId (handle potential number vs string mismatch)
        if (order.userId !== undefined) {
          return String(order.userId) === String(customerId);
        }
        return false;
      });
    },
    [orders]
  );

  // ============================================
  // API METHODS
  // ============================================

  const createOrderAPI = useCallback(async (tableId?: number): Promise<Order> => {
    setLoadingAPI(true);
    setErrorAPI(null);
    try {
      const jwt = getJwtToken() || undefined;
      const newOrder = await orderService.createOrder(tableId, jwt);
      // Add to local state
      setOrders((prev) => [...prev, newOrder]);
      return newOrder;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create order';
      setErrorAPI(errorMessage);
      throw error;
    } finally {
      setLoadingAPI(false);
    }
  }, [getJwtToken]);

  const updateOrderStatusAPI = useCallback(async (orderId: string, status: OrderStatus): Promise<Order> => {
    setLoadingAPI(true);
    setErrorAPI(null);
    try {
      const jwt = getJwtToken() || undefined;
      const updatedOrder = await orderService.updateOrderStatus(orderId, { status }, jwt);
      // Update local state
      setOrders((prev) =>
        prev.map((order) => (order.id === orderId ? updatedOrder : order))
      );
      return updatedOrder;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update order status';
      setErrorAPI(errorMessage);
      throw error;
    } finally {
      setLoadingAPI(false);
    }
  }, [getJwtToken]);

  const getActiveOrdersAPI = useCallback(async (): Promise<Order[]> => {
    setLoadingAPI(true);
    setErrorAPI(null);
    try {
      const activeOrders = await orderService.getActiveOrders();
      return activeOrders;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch active orders';
      setErrorAPI(errorMessage);
      throw error;
    } finally {
      setLoadingAPI(false);
    }
  }, []);

  const getUserOrdersAPI = useCallback(async (): Promise<Order[]> => {
    setLoadingAPI(true);
    setErrorAPI(null);
    try {
      const jwt = getJwtToken() || undefined;
      const userOrders = await orderService.getUserOrders(jwt);
      return userOrders;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch user orders';
      setErrorAPI(errorMessage);
      throw error;
    } finally {
      setLoadingAPI(false);
    }
  }, [getJwtToken]);

  const getTableOrdersAPI = useCallback(async (tableId: number): Promise<Order[]> => {
    setLoadingAPI(true);
    setErrorAPI(null);
    try {
      const jwt = getJwtToken() || undefined;
      const tableOrders = await orderService.getTableOrders(tableId, jwt);
      return tableOrders;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch table orders';
      setErrorAPI(errorMessage);
      throw error;
    } finally {
      setLoadingAPI(false);
    }
  }, [getJwtToken]);

  const value = useMemo(
    () => ({
      orders,
      addOrder,
      updateOrderStatus,
      getOrderById,
      deleteOrder,
      getOrdersByStatus,
      getOrdersByCustomer,
      // API methods
      createOrderAPI,
      updateOrderStatusAPI,
      getActiveOrdersAPI,
      getUserOrdersAPI,
      getTableOrdersAPI,
      loadingAPI,
      errorAPI,
      refreshOrders,
      loadUserHistory,
    }),
    [
      orders,
      addOrder,
      updateOrderStatus,
      getOrderById,
      deleteOrder,
      getOrdersByStatus,
      getOrdersByCustomer,
      createOrderAPI,
      updateOrderStatusAPI,
      getActiveOrdersAPI,
      getUserOrdersAPI,
      getTableOrdersAPI,
      loadingAPI,
      errorAPI,
      refreshOrders,
    ]
  );

  return (
    <OrderContext.Provider value={value}>
      {children}
    </OrderContext.Provider>
  );
};

export const useOrders = () => {
  const context = useContext(OrderContext);
  if (!context) {
    throw new Error('useOrders must be used within OrderProvider');
  }
  return context;
};
