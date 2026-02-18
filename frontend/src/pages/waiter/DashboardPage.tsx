import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useOrders } from '../../context/OrderContext';
import { useTables } from '../../context/TableContext';
import { useMenu } from '../../context/MenuContext';
import { waiterService, WaiterOrder } from '../../services/waiterService';
import { Order, OrderStatus, MenuItem } from '../../types';
import {
  MdPerson, MdAdd, MdCheck, MdClose, MdChair, MdRestaurant,
  MdTableBar, MdPayment, MdCheckCircle, MdAccessTime, MdAttachMoney,
  MdNotifications, MdDeliveryDining
} from 'react-icons/md';

export default function WaiterDashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    orders,
    updateOrderStatusAPI,
    createOrderAPI,
    loadingAPI,
    errorAPI
  } = useOrders();
  const { tables, occupyTable, releaseTable } = useTables();
  const { menuItems, categories } = useMenu();

  // Tab management
  const [activeTab, setActiveTab] = useState<'pickup' | 'tables' | 'payment'>('pickup');

  // Table management
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [orderMode, setOrderMode] = useState<'view' | 'new'>('view');
  const [newOrderItems, setNewOrderItems] = useState<Array<{ menuItem: MenuItem; quantity: number }>>([]);
  const [activeCategory, setActiveCategory] = useState<string>('');

  // Payment management
  const [paymentOrder, setPaymentOrder] = useState<Order | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'digital'>('cash');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [showPaymentSuccess, setShowPaymentSuccess] = useState(false);

  // Data states
  const [readyOrders, setReadyOrders] = useState<WaiterOrder[]>([]);
  const [servedOrders, setServedOrders] = useState<WaiterOrder[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [serveLoading, setServeLoading] = useState<string | null>(null);

  const selectedTableData = selectedTable ? tables.find((t) => t.id === selectedTable) : null;
  const tableOrder = selectedTableData?.currentOrderId ? orders.find((o) => o.id === selectedTableData.currentOrderId) : null;
  const menuItemsByCategory = menuItems.filter((item) =>
    item.categories.some(cat => cat.name === (activeCategory || categories[0]?.name))
  );

  // Load ready orders from waiter service
  const loadReadyOrders = useCallback(async () => {
    try {
      const token = localStorage.getItem('auth_access_token') || undefined;
      const received = await waiterService.getReceivedOrders(token);
      setReadyOrders(received.filter(o => o.status === OrderStatus.READY));
      setServedOrders(received.filter(o => o.status === OrderStatus.SERVED));
    } catch (err) {
      console.error('[WaiterDashboard] Failed to load received orders:', err);
    }
  }, []);

  // Load ready orders when component mounts
  useEffect(() => {
    loadReadyOrders();
  }, [loadReadyOrders]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(loadReadyOrders, 30000);
    return () => clearInterval(interval);
  }, [loadReadyOrders]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadReadyOrders();
    setTimeout(() => setRefreshing(false), 1000);
  };

  // ============================================
  // ORDER CREATION HANDLERS
  // ============================================

  const handleAddItemToOrder = (menuItem: MenuItem) => {
    const existing = newOrderItems.find((item) => item.menuItem.id === menuItem.id);
    if (existing) {
      setNewOrderItems(
        newOrderItems.map((item) =>
          item.menuItem.id === menuItem.id ? { ...item, quantity: item.quantity + 1 } : item
        )
      );
    } else {
      setNewOrderItems([...newOrderItems, { menuItem, quantity: 1 }]);
    }
  };

  const handleRemoveItemFromOrder = (menuItemId: number) => {
    setNewOrderItems(newOrderItems.filter((item) => item.menuItem.id !== menuItemId));
  };

  const handleSubmitOrder = async () => {
    if (!selectedTable || newOrderItems.length === 0) return;

    try {
      // Create order via API
      const orderData = {
        items: newOrderItems.map(item => ({
          itemId: item.menuItem.id,
          quantity: item.quantity,
          unitPrice: item.menuItem.price,
        })),
        tableNumber: selectedTableData?.tableNumber,
      };

      const newOrder = await createOrderAPI(orderData as never);
      occupyTable(selectedTable, newOrder.id);
      setNewOrderItems([]);
      setOrderMode('view');
    } catch (error) {
      console.error('Failed to create order:', error);
      alert('Failed to create order. Please try again.');
    }
  };

  // ============================================
  // ORDER STATUS HANDLERS
  // ============================================

  const handleMarkAsServed = async (orderId: string) => {
    setServeLoading(orderId);
    try {
      const token = localStorage.getItem('auth_access_token') || undefined;
      // Use waiterService: PATCH /api/waiter/orders/{id}/served
      await waiterService.markOrderServed(orderId, token);
      await loadReadyOrders();
    } catch (error) {
      console.error('Failed to mark as served:', error);
      alert('Failed to update order status. Please try again.');
    } finally {
      setServeLoading(null);
    }
  };

  // Get waiting time - uses inline Date.now() at call site to avoid purity issues
  const getWaitingTime = (orderTime: string): string => {
    // This function is called from render, so we calculate on each call
    const minutesAgo = Math.floor((new Date().getTime() - new Date(orderTime).getTime()) / 60000);
    if (minutesAgo < 1) return 'Just now';
    if (minutesAgo === 1) return '1 min';
    return `${minutesAgo} mins`;
  };

  // ============================================
  // PAYMENT HANDLERS
  // ============================================

  const handleOpenPayment = (order: Order) => {
    setPaymentOrder(order);
    setPaymentAmount(order.totalPrice.toFixed(2));
    setPaymentMethod('cash');
    setActiveTab('payment');
  };

  const handleProcessPayment = async () => {
    if (!paymentOrder) return;

    try {
      // Mark order as completed
      await updateOrderStatusAPI(paymentOrder.id, 'COMPLETED');

      // Release table if it has one
      if (paymentOrder.tableNumber) {
        const table = tables.find(t => t.tableNumber === paymentOrder.tableNumber);
        if (table) {
          releaseTable(table.id);
        }
      }

      setShowPaymentSuccess(true);
      setTimeout(() => {
        setShowPaymentSuccess(false);
        setPaymentOrder(null);
        setActiveTab('pickup');
        loadReadyOrders();
      }, 2000);
    } catch (error) {
      console.error('Failed to process payment:', error);
      alert('Failed to process payment. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-brand-dark">
      {/* Header */}
      <div className="bg-brand-darker border-b border-brand-border sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-2">
              <MdRestaurant /> Waiter Dashboard
            </h1>
            <p className="text-gray-400">{user?.name}</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleRefresh}
              className={`p-3 bg-brand-darker hover:bg-black border border-brand-border text-white rounded-lg transition-all ${refreshing ? 'animate-spin' : ''}`}
              title="Refresh Orders"
            >
              <MdNotifications className="text-xl" />
            </button>
            <button
              onClick={() => navigate('/profile')}
              className="p-3 bg-brand-primary hover:bg-orange-600 text-white rounded-lg transition-colors"
              title="My Profile"
            >
              <MdPerson className="text-xl" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-2 -mb-px">
            <button
              onClick={() => setActiveTab('pickup')}
              className={`px-6 py-3 font-semibold transition-colors border-b-2 flex items-center gap-2 ${activeTab === 'pickup'
                ? 'border-brand-primary text-brand-primary'
                : 'border-transparent text-gray-400 hover:text-gray-300'
                }`}
            >
              <MdDeliveryDining />
              Ready to Pickup
              {readyOrders.length > 0 && (
                <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                  {readyOrders.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('tables')}
              className={`px-6 py-3 font-semibold transition-colors border-b-2 flex items-center gap-2 ${activeTab === 'tables'
                ? 'border-brand-primary text-brand-primary'
                : 'border-transparent text-gray-400 hover:text-gray-300'
                }`}
            >
              <MdTableBar />
              Tables & Orders
            </button>
            <button
              onClick={() => setActiveTab('payment')}
              className={`px-6 py-3 font-semibold transition-colors border-b-2 flex items-center gap-2 ${activeTab === 'payment'
                ? 'border-brand-primary text-brand-primary'
                : 'border-transparent text-gray-400 hover:text-gray-300'
                }`}
            >
              <MdPayment />
              Payment Collection
              {servedOrders.length > 0 && (
                <span className="bg-yellow-500 text-white text-xs px-2 py-0.5 rounded-full">
                  {servedOrders.length}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {errorAPI && (
        <div className="max-w-7xl mx-auto px-4 py-2">
          <div className="bg-red-900/20 border border-red-500 text-red-400 px-4 py-3 rounded-lg">
            {errorAPI}
          </div>
        </div>
      )}

      {/* Tab Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* READY TO PICKUP TAB */}
        {activeTab === 'pickup' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <MdDeliveryDining className="text-brand-primary" />
                Ready for Pickup ({readyOrders.length})
              </h2>
              <button
                onClick={handleRefresh}
                className="px-4 py-2 bg-brand-darker hover:bg-black border border-brand-border text-white rounded-lg transition-colors text-sm"
              >
                Refresh
              </button>
            </div>

            {readyOrders.length === 0 ? (
              <div className="bg-brand-darker border border-brand-border rounded-lg p-12 text-center">
                <MdCheckCircle className="mx-auto text-6xl text-green-500 mb-4" />
                <p className="text-gray-400 text-lg">All orders delivered! No orders ready for pickup.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {readyOrders.map((order) => (
                  <div
                    key={order.orderId}
                    className="bg-brand-darker border-2 border-green-600 rounded-lg p-5 hover:shadow-lg transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-lg font-bold text-white">
                          Order #{order.orderId.slice(-6)}
                        </h3>
                        {order.tableId && (
                          <p className="text-brand-primary font-semibold flex items-center gap-1">
                            <MdChair /> Table {order.tableId}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-1 text-yellow-400 text-sm">
                          <MdAccessTime />
                          {getWaitingTime(order.orderTime)}
                        </div>
                        <div className="bg-green-600 text-white text-xs px-2 py-1 rounded mt-1 font-semibold">
                          READY
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1 mb-4 border-t border-brand-border pt-3">
                      {order.items.map((item) => (
                        <div key={item.id} className="flex justify-between text-sm text-gray-300">
                          <span>{item.quantity}x {item.name}</span>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center justify-between mb-4 border-t border-brand-border pt-3">
                      <span className="text-gray-400 text-sm">Total:</span>
                      <span className="text-brand-primary font-bold text-lg">
                        ${order.totalPrice.toFixed(2)}
                      </span>
                    </div>

                    <button
                      onClick={() => handleMarkAsServed(order.orderId)}
                      disabled={serveLoading === order.orderId}
                      className="w-full py-2 px-4 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      <MdCheck /> {serveLoading === order.orderId ? 'Updating...' : 'Mark as Served'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TABLES & ORDERS TAB */}
        {activeTab === 'tables' && (
          <div>
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
              <MdTableBar className="text-brand-primary" />
              Floor Plan & Order Management
            </h2>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Floor Plan */}
              <div className="lg:col-span-1">
                <h3 className="text-xl font-bold mb-4 text-white flex items-center gap-2"><MdChair /> Tables</h3>
                <div className="grid grid-cols-2 gap-3">
                  {tables.map((table) => (
                    <button
                      key={table.id}
                      onClick={() => {
                        setSelectedTable(table.id);
                        setOrderMode('view');
                        setNewOrderItems([]);
                      }}
                      className={`p-4 rounded-lg border-2 transition-all transform hover:scale-105 ${selectedTable === table.id
                        ? 'border-brand-primary bg-orange-900/20'
                        : table.status === 'available'
                          ? 'border-green-700 bg-green-900/20 hover:border-green-600'
                          : table.status === 'occupied'
                            ? 'border-red-700 bg-red-900/20 hover:border-red-600'
                            : 'border-yellow-700 bg-yellow-900/20 hover:border-yellow-600'
                        }`}
                    >
                      <p className="text-2xl font-bold text-white">{table.tableNumber}</p>
                      <p className="text-xs text-gray-400">Cap: {table.capacity}</p>
                      <p className={`text-xs font-semibold uppercase ${table.status === 'available' ? 'text-green-400' :
                        table.status === 'occupied' ? 'text-red-400' : 'text-yellow-400'
                        }`}>{table.status}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Table Details / Order Entry */}
              <div className="lg:col-span-2">
                {!selectedTable ? (
                  <div className="bg-brand-darker border border-brand-border rounded-lg p-8 text-center">
                    <p className="text-gray-400 text-lg">Select a table to view or create an order</p>
                  </div>
                ) : orderMode === 'view' ? (
                  <div className="bg-brand-darker border border-brand-border rounded-lg p-6">
                    <h3 className="text-2xl font-bold mb-4 text-white">
                      🪑 Table {selectedTableData?.tableNumber} - <span className="text-gray-400">{selectedTableData?.status}</span>
                    </h3>

                    {tableOrder ? (
                      <div className="space-y-4">
                        <div className="bg-brand-dark border border-brand-border p-4 rounded-lg">
                          <div className="flex items-center justify-between mb-3">
                            <p className="text-sm text-gray-400">Current Order</p>
                            <div className={`px-3 py-1 rounded-full text-xs font-semibold ${tableOrder.status === OrderStatus.PENDING ? 'bg-yellow-900/30 text-yellow-400' :
                              tableOrder.status === OrderStatus.CONFIRMED ? 'bg-blue-900/30 text-blue-400' :
                                tableOrder.status === OrderStatus.PREPARING ? 'bg-orange-900/30 text-orange-400' :
                                  tableOrder.status === OrderStatus.READY ? 'bg-green-900/30 text-green-400' :
                                    tableOrder.status === OrderStatus.SERVED ? 'bg-purple-900/30 text-purple-400' :
                                      'bg-gray-900/30 text-gray-400'
                              }`}>
                              {tableOrder.status.toUpperCase()}
                            </div>
                          </div>

                          <p className="text-lg font-bold mb-3 text-white">Order #{tableOrder.id.slice(-6)}</p>

                          <div className="space-y-2 mb-4">
                            {tableOrder.items.map((item) => (
                              <div key={item.id} className="flex items-center justify-between text-sm text-gray-300">
                                <span>{item.quantity}x {item.menuItem.name}</span>
                                <span className="text-brand-primary">${(item.menuItem.price * item.quantity).toFixed(2)}</span>
                              </div>
                            ))}
                          </div>

                          <div className="border-t border-brand-border pt-3 flex justify-between font-bold text-white mb-4">
                            <span>Total:</span>
                            <span className="text-brand-primary text-xl">${tableOrder.totalPrice.toFixed(2)}</span>
                          </div>

                          <div className="space-y-2">
                            {tableOrder.status === OrderStatus.READY && (
                              <button
                                onClick={() => handleMarkAsServed(tableOrder.id)}
                                disabled={loadingAPI}
                                className="w-full py-2 px-4 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                              >
                                <MdCheck /> Mark as Served
                              </button>
                            )}
                            {tableOrder.status === OrderStatus.SERVED && (
                              <button
                                onClick={() => handleOpenPayment(tableOrder)}
                                disabled={loadingAPI}
                                className="w-full py-2 px-4 bg-brand-primary hover:bg-orange-600 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                              >
                                <MdAttachMoney /> Collect Payment
                              </button>
                            )}
                            <button
                              onClick={() => setOrderMode('new')}
                              disabled={loadingAPI}
                              className="w-full py-2 px-4 bg-brand-dark hover:bg-black border border-brand-border text-gray-300 rounded-lg font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                              <MdAdd /> Add More Items
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-gray-400 mb-4">No active order at this table</p>
                        <button
                          onClick={() => setOrderMode('new')}
                          disabled={loadingAPI}
                          className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-1 mx-auto"
                        >
                          <MdAdd /> Create New Order
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-brand-darker border border-brand-border rounded-lg p-6">
                    <h3 className="text-2xl font-bold mb-4 text-white">
                      <MdChair className="inline mr-2" /> New Order - Table {selectedTableData?.tableNumber}
                    </h3>

                    {/* Category Tabs */}
                    <div className="mb-6 flex gap-2 overflow-x-auto pb-2 border-b border-brand-border">
                      {categories.map((category) => (
                        <button
                          key={category.id}
                          onClick={() => setActiveCategory(category.name)}
                          className={`px-4 py-2 rounded-lg whitespace-nowrap font-medium transition-colors ${(activeCategory || categories[0]?.name) === category.name
                            ? 'bg-brand-primary text-white'
                            : 'bg-brand-dark border border-brand-border text-gray-400 hover:text-gray-300'
                            }`}
                        >
                          {category.name}
                        </button>
                      ))}
                    </div>

                    {/* Menu Items */}
                    <div className="grid grid-cols-2 gap-3 mb-6">
                      {menuItemsByCategory.map((item) => (
                        <button
                          key={item.id}
                          onClick={() => handleAddItemToOrder(item)}
                          className="p-3 bg-brand-dark border border-brand-border rounded-lg hover:bg-black hover:border-brand-primary transition-colors text-left"
                        >
                          <div className="w-full h-24 bg-brand-dark flex items-center justify-center rounded-lg overflow-hidden mb-2">
                            {item.imageUrl ? (
                              <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                            ) : (
                              <MdRestaurant className="text-3xl text-gray-500" />
                            )}
                          </div>
                          <p className="font-semibold text-sm text-white">{item.name}</p>
                          <p className="text-brand-primary font-bold text-sm">${item.price.toFixed(2)}</p>
                        </button>
                      ))}
                    </div>

                    {/* Order Summary */}
                    {newOrderItems.length > 0 && (
                      <div className="bg-brand-dark border border-brand-border p-4 rounded-lg mb-4">
                        <h4 className="font-bold mb-3 text-white">Order Items:</h4>
                        <div className="space-y-2 mb-4">
                          {newOrderItems.map((item) => (
                            <div key={item.menuItem.id} className="flex items-center justify-between">
                              <div>
                                <p className="font-semibold text-white">{item.quantity}x {item.menuItem.name}</p>
                                <p className="text-sm text-brand-primary">${(item.menuItem.price * item.quantity).toFixed(2)}</p>
                              </div>
                              <button
                                onClick={() => handleRemoveItemFromOrder(item.menuItem.id)}
                                className="text-red-400 hover:text-red-300 font-bold transition-colors disabled:opacity-50"
                                disabled={loadingAPI}
                              >
                                <MdClose />
                              </button>
                            </div>
                          ))}
                        </div>

                        <div className="border-t border-brand-border pt-3 flex justify-between font-bold mb-4 text-white">
                          <span>Total:</span>
                          <span className="text-brand-primary">
                            ${newOrderItems
                              .reduce((sum, item) => sum + item.menuItem.price * item.quantity, 0)
                              .toFixed(2)}
                          </span>
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setOrderMode('view');
                              setNewOrderItems([]);
                            }}
                            disabled={loadingAPI}
                            className="flex-1 py-2 px-4 bg-brand-darker hover:bg-black border border-brand-border text-gray-300 rounded-lg font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-1"
                          >
                            <MdClose /> Cancel
                          </button>
                          <button
                            onClick={handleSubmitOrder}
                            disabled={loadingAPI}
                            className="flex-1 py-2 px-4 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-1"
                          >
                            <MdCheck /> Submit Order
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* PAYMENT COLLECTION TAB */}
        {activeTab === 'payment' && (
          <div>
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
              <MdPayment className="text-brand-primary" />
              Payment Collection
            </h2>

            {showPaymentSuccess ? (
              <div className="bg-brand-darker border border-green-600 rounded-lg p-12 text-center">
                <MdCheckCircle className="mx-auto text-8xl text-green-500 mb-4" />
                <h3 className="text-3xl font-bold text-white mb-2">Payment Successful!</h3>
                <p className="text-gray-400">Order marked as completed.</p>
              </div>
            ) : paymentOrder ? (
              <div className="max-w-2xl mx-auto">
                <div className="bg-brand-darker border border-brand-border rounded-lg p-6 mb-6">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-2xl font-bold text-white">Order #{paymentOrder.id.slice(-6)}</h3>
                      {paymentOrder.tableNumber && (
                        <p className="text-gray-400 flex items-center gap-1 mt-1">
                          <MdChair /> Table {paymentOrder.tableNumber}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => setPaymentOrder(null)}
                      className="text-gray-400 hover:text-gray-300"
                    >
                      <MdClose className="text-2xl" />
                    </button>
                  </div>

                  <div className="space-y-2 mb-4 border-t border-brand-border pt-4">
                    {paymentOrder.items.map((item) => (
                      <div key={item.id} className="flex justify-between text-gray-300">
                        <span>{item.quantity}x {item.menuItem.name}</span>
                        <span>${(item.menuItem.price * item.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>

                  <div className="border-t border-brand-border pt-4 flex justify-between mb-6">
                    <span className="text-lg font-bold text-white">Total Amount:</span>
                    <span className="text-3xl font-bold text-brand-primary">
                      ${paymentOrder.totalPrice.toFixed(2)}
                    </span>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-white mb-2">Payment Method</label>
                      <div className="grid grid-cols-3 gap-2">
                        <button
                          onClick={() => setPaymentMethod('cash')}
                          className={`py-3 px-4 rounded-lg font-semibold transition-colors ${paymentMethod === 'cash'
                            ? 'bg-brand-primary text-white'
                            : 'bg-brand-dark border border-brand-border text-gray-400 hover:text-gray-300'
                            }`}
                        >
                          💵 Cash
                        </button>
                        <button
                          onClick={() => setPaymentMethod('card')}
                          className={`py-3 px-4 rounded-lg font-semibold transition-colors ${paymentMethod === 'card'
                            ? 'bg-brand-primary text-white'
                            : 'bg-brand-dark border border-brand-border text-gray-400 hover:text-gray-300'
                            }`}
                        >
                          💳 Card
                        </button>
                        <button
                          onClick={() => setPaymentMethod('digital')}
                          className={`py-3 px-4 rounded-lg font-semibold transition-colors ${paymentMethod === 'digital'
                            ? 'bg-brand-primary text-white'
                            : 'bg-brand-dark border border-brand-border text-gray-400 hover:text-gray-300'
                            }`}
                        >
                          📱 Digital
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-white mb-2">Amount Received</label>
                      <input
                        type="number"
                        value={paymentAmount}
                        onChange={(e) => setPaymentAmount(e.target.value)}
                        className="w-full px-4 py-3 bg-brand-dark border border-brand-border text-white rounded-lg focus:outline-none focus:border-brand-primary text-xl font-bold"
                        placeholder="0.00"
                        step="0.01"
                      />
                      {parseFloat(paymentAmount) > paymentOrder.totalPrice && (
                        <p className="mt-2 text-green-400 font-semibold">
                          Change: ${(parseFloat(paymentAmount) - paymentOrder.totalPrice).toFixed(2)}
                        </p>
                      )}
                    </div>

                    <button
                      onClick={handleProcessPayment}
                      disabled={loadingAPI || parseFloat(paymentAmount) < paymentOrder.totalPrice}
                      className="w-full py-4 px-6 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold text-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      <MdCheckCircle /> Complete Payment & Mark Order Done
                    </button>

                    <p className="text-center text-sm text-gray-400">
                      Payment will be recorded for admin to collect
                    </p>
                  </div>
                </div>
              </div>
            ) : servedOrders.length > 0 ? (
              <div>
                <p className="text-gray-400 mb-6">Select an order to collect payment:</p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {servedOrders.map((order) => (
                    <button
                      key={order.orderId}
                      onClick={() => setPaymentOrder(order as never)}
                      className="bg-brand-darker border-2 border-purple-600 rounded-lg p-5 hover:shadow-lg transition-all text-left"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="text-lg font-bold text-white">
                            Order #{order.orderId.slice(-6)}
                          </h3>
                          {order.tableId && (
                            <p className="text-brand-primary font-semibold flex items-center gap-1">
                              <MdChair /> Table {order.tableId}
                            </p>
                          )}
                        </div>
                        <div className="bg-purple-600 text-white text-xs px-2 py-1 rounded font-semibold">
                          SERVED
                        </div>
                      </div>

                      <div className="space-y-1 mb-4 border-t border-brand-border pt-3">
                        {order.items.slice(0, 3).map((item) => (
                          <div key={item.id} className="text-sm text-gray-400">
                            {item.quantity}x {item.name}
                          </div>
                        ))}
                        {order.items.length > 3 && (
                          <div className="text-sm text-gray-400">
                            +{order.items.length - 3} more items
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between border-t border-brand-border pt-3">
                        <span className="text-gray-400 text-sm">Total:</span>
                        <span className="text-brand-primary font-bold text-xl">
                          ${order.totalPrice.toFixed(2)}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-brand-darker border border-brand-border rounded-lg p-12 text-center">
                <MdCheckCircle className="mx-auto text-6xl text-green-500 mb-4" />
                <p className="text-gray-400 text-lg">No orders waiting for payment collection.</p>
                <p className="text-sm text-gray-500 mt-2">Orders marked as "Served" will appear here.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

