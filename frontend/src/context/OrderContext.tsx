/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useCallback, useMemo, ReactNode, useEffect } from 'react';
import { Order, OrderStatus } from '../types';
import { generateMockOrders } from '../data/mockData';
import { initializeMockOrders } from '../services/kitchenService';
import { orderService, CreateOrderRequest, TableOrdersResponse } from '../services/orderService';
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
  createOrderAPI: (orderData: CreateOrderRequest) => Promise<Order>;
  updateOrderStatusAPI: (orderId: string, status: string) => Promise<Order>;
  getActiveOrdersAPI: () => Promise<Order[]>;
  getUserOrdersAPI: () => Promise<Order[]>;
  getTableOrdersAPI: (tableNumber: number) => Promise<TableOrdersResponse>;
  loadingAPI: boolean;
  errorAPI: string | null;
}

const OrderContext = createContext<OrderContextType | undefined>(undefined);

export const OrderProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [orders, setOrders] = useState<Order[]>(generateMockOrders());
  const [loadingAPI, setLoadingAPI] = useState(false);
  const [errorAPI, setErrorAPI] = useState<string | null>(null);
  const { getJwtToken } = useAuth();

  // Sync orders with kitchen/waiter services whenever they change
  useEffect(() => {
    initializeMockOrders(orders);
  }, [orders]);

  const addOrder = useCallback((order: Order) => {
    setOrders((prev) => [...prev, order]);
  }, []);

  const updateOrderStatus = useCallback((orderId: string, status: OrderStatus) => {
    setOrders((prev) =>
      prev.map((order) =>
        order.id === orderId
          ? { ...order, status, completedTime: status === OrderStatus.COMPLETED ? new Date().toISOString() : undefined }
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
      return orders.filter((order) => order.customerId === customerId);
    },
    [orders]
  );

  // ============================================
  // API METHODS
  // ============================================

  const createOrderAPI = useCallback(async (orderData: CreateOrderRequest): Promise<Order> => {
    setLoadingAPI(true);
    setErrorAPI(null);
    try {
      const jwt = getJwtToken() || undefined;
      const newOrder = await orderService.createOrder(orderData, jwt);
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

  const updateOrderStatusAPI = useCallback(async (orderId: string, status: string): Promise<Order> => {
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

  const getTableOrdersAPI = useCallback(async (tableNumber: number): Promise<TableOrdersResponse> => {
    setLoadingAPI(true);
    setErrorAPI(null);
    try {
      const jwt = getJwtToken() || undefined;
      const tableOrders = await orderService.getTableOrders(tableNumber, jwt);
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

