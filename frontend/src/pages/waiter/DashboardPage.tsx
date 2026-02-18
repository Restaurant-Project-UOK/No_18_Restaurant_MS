import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useOrders } from '../../context/OrderContext';
import { useMenu } from '../../context/MenuContext';
import { waiterService, WaiterOrder } from '../../services/waiterService';
import {
  MdPerson, MdCheck, MdRestaurant, MdCheckCircle, MdChair,
  MdAccessTime,
  MdNotifications, MdDeliveryDining
} from 'react-icons/md';
import { getAccessToken } from '../../utils/cookieStorage';

export default function WaiterDashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    errorAPI
  } = useOrders();
  const { menuItems, categories } = useMenu();

  // Tab management
  const [activeTab, setActiveTab] = useState<'pickup' | 'menu'>('pickup');
  const [activeCategory, setActiveCategory] = useState<string>('');

  // Data states
  const [readyOrders, setReadyOrders] = useState<WaiterOrder[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [serveLoading, setServeLoading] = useState<string | null>(null);

  const menuItemsByCategory = menuItems.filter((item) =>
    item.categories.some(cat => cat.name === (activeCategory || categories[0]?.name))
  );

  // Load ready orders from waiter service
  const loadReadyOrders = useCallback(async () => {
    try {
      const token = getAccessToken() || undefined;
      const received = await waiterService.getReceivedOrders(token);
      setReadyOrders(received);
      // We don't load servedOrders here as they come from OrderContext's orders state
    } catch (err) {
      console.error('[WaiterDashboard] Failed to load received orders:', err);
    }
  }, []);

  // Filter served orders for payment from the global orders state


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
  // ORDER STATUS HANDLERS
  // ============================================

  const handleMarkAsServed = async (orderId: string) => {
    setServeLoading(orderId);
    try {
      const token = getAccessToken() || undefined;
      // PATCH /api/orders/{id}/SERVED
      await waiterService.markOrderServed(orderId, token);
      await loadReadyOrders();
    } catch (error) {
      console.error('Failed to mark as served:', error);
      alert('Failed to update order status. Please try again.');
    } finally {
      setServeLoading(null);
    }
  };

  const getWaitingTime = (orderTime: string): string => {
    const minutesAgo = Math.floor((new Date().getTime() - new Date(orderTime).getTime()) / 60000);
    if (minutesAgo < 1) return 'Just now';
    if (minutesAgo === 1) return '1 min';
    return `${minutesAgo} mins`;
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
              onClick={() => setActiveTab('menu')}
              className={`px-6 py-3 font-semibold transition-colors border-b-2 flex items-center gap-2 ${activeTab === 'menu'
                ? 'border-brand-primary text-brand-primary'
                : 'border-transparent text-gray-400 hover:text-gray-300'
                }`}
            >
              <MdRestaurant />
              View Menu
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
                          Order #{String(order.orderId).slice(-6)}
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
                          {getWaitingTime(order.readyTime)}
                        </div>
                        <div className="bg-green-600 text-white text-xs px-2 py-1 rounded mt-1 font-semibold">
                          READY
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1 mb-4 border-t border-brand-border pt-3">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between text-sm text-gray-300">
                          <span>{item.quantity}x {item.itemName}</span>
                        </div>
                      ))}
                    </div>

                    <button
                      onClick={() => handleMarkAsServed(String(order.orderId))}
                      disabled={serveLoading === String(order.orderId)}
                      className="w-full py-2 px-4 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      <MdCheck /> {serveLoading === String(order.orderId) ? 'Updating...' : 'Mark as Served'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* MENU VIEW TAB (Read-only) */}
        {activeTab === 'menu' && (
          <div>
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
              <MdRestaurant className="text-brand-primary" />
              Restaurant Menu
            </h2>

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
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {menuItemsByCategory.map((item) => (
                <div
                  key={item.id}
                  className="p-4 bg-brand-darker border border-brand-border rounded-lg shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="w-full h-40 bg-brand-dark flex items-center justify-center rounded-lg overflow-hidden mb-3">
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      <MdRestaurant className="text-4xl text-gray-600" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-lg mb-1">{item.name}</h3>
                    <p className="text-sm text-gray-400 line-clamp-2 mb-2">{item.description}</p>
                    <p className="text-brand-primary font-bold text-xl">${item.price.toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>

            {menuItemsByCategory.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                No items found in this category.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
