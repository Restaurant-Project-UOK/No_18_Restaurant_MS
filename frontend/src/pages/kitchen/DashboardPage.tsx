import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useOrders } from '../../context/OrderContext';
import { OrderStatus } from '../../types';
import { MdNewReleases, MdWarning, MdCheckCircle, MdPerson } from 'react-icons/md';
import { FaChalkboardUser } from 'react-icons/fa6';

export default function KitchenDashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { orders, updateOrderStatus, getOrdersByStatus } = useOrders();
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);

  const pendingOrders = getOrdersByStatus(OrderStatus.PENDING);
  const preparingOrders = getOrdersByStatus(OrderStatus.PREPARING);
  const readyOrders = getOrdersByStatus(OrderStatus.READY);

  const handleStartPreparing = (orderId: string) => {
    updateOrderStatus(orderId, OrderStatus.PREPARING);
  };

  const handleMarkReady = (orderId: string) => {
    updateOrderStatus(orderId, OrderStatus.READY);
  };

  return (
    <div className="min-h-screen bg-brand-dark">
      {/* Header */}
      <div className="bg-brand-darker border-b border-brand-border sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-2">👨‍🍳 Kitchen Display System</h1>
            <p className="text-gray-400">Chef {user?.name}</p>
          </div>
          <button
            onClick={() => navigate('/profile')}
            className="p-3 bg-brand-primary hover:bg-orange-600 text-white rounded-lg transition-colors"
            title="My Profile"
          >
            <MdPerson className="text-xl" />
          </button>
        </div>
      </div>

      {/* KDS Main View */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Pending Orders */}
          <div className="bg-red-900/20 border-2 border-red-700 rounded-lg p-6">
            <h2 className="text-2xl font-bold text-red-300 mb-4 flex items-center gap-2">
              <MdNewReleases /> New Orders ({pendingOrders.length})
            </h2>
            <div className="space-y-4">
              {pendingOrders.length === 0 ? (
                <p className="text-gray-400 text-center py-8">No new orders</p>
              ) : (
                pendingOrders.map((order) => (
                  <button
                    key={order.id}
                    onClick={() => setSelectedOrder(order.id)}
                    className={`cursor-pointer p-4 rounded-lg transition-all w-full text-left border ${
                      selectedOrder === order.id
                        ? 'bg-red-700/50 border-red-500 ring-2 ring-red-400'
                        : 'bg-brand-darker border-red-700 hover:border-red-500'
                    }`}
                  >
                    <p className="text-lg font-bold text-red-300">Order #{order.id.slice(-6)}</p>
                    <p className="text-sm text-gray-400 mb-2">{order.customerName}</p>
                    <ul className="text-sm text-gray-300 mb-3 space-y-1">
                      {order.items.map((item) => (
                        <li key={item.id}>
                          <span className="font-semibold">{item.quantity}x</span> {item.menuItem.name}
                          {item.specialRequests && (
                            <p className="text-yellow-400 text-xs mt-1"><MdWarning className="inline mr-1" /> {item.specialRequests}</p>
                          )}
                        </li>
                      ))}
                    </ul>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStartPreparing(order.id);
                      }}
                      className="w-full py-2 px-3 bg-yellow-600 hover:bg-yellow-700 text-white rounded font-semibold transition-colors text-sm flex items-center justify-center gap-1"
                    >
                      <FaChalkboardUser /> Start Cooking
                    </button>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Preparing Orders */}
          <div className="bg-yellow-900/20 border-2 border-yellow-700 rounded-lg p-6">
            <h2 className="text-2xl font-bold text-yellow-300 mb-4 flex items-center gap-2">
              🔥 Preparing ({preparingOrders.length})
            </h2>
            <div className="space-y-4">
              {preparingOrders.length === 0 ? (
                <p className="text-gray-400 text-center py-8">No orders cooking</p>
              ) : (
                preparingOrders.map((order) => (
                  <button
                    key={order.id}
                    onClick={() => setSelectedOrder(order.id)}
                    className={`cursor-pointer p-4 rounded-lg transition-all w-full text-left border ${
                      selectedOrder === order.id
                        ? 'bg-yellow-700/50 border-yellow-500 ring-2 ring-yellow-400'
                        : 'bg-brand-darker border-yellow-700 hover:border-yellow-500'
                    }`}
                  >
                    <p className="text-lg font-bold text-yellow-300">Order #{order.id.slice(-6)}</p>
                    <p className="text-sm text-gray-400 mb-2">{order.customerName}</p>
                    <ul className="text-sm text-gray-300 mb-3 space-y-1">
                      {order.items.map((item) => (
                        <li key={item.id}>
                          <span className="font-semibold">{item.quantity}x</span> {item.menuItem.name} ({item.menuItem.preparationTime}min)
                        </li>
                      ))}
                    </ul>
                    <div className="w-full bg-gray-700 rounded-full h-2 mb-2">
                      <div className="bg-yellow-500 h-2 rounded-full" style={{ width: '60%' }} />
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMarkReady(order.id);
                      }}
                      className="w-full py-2 px-3 bg-green-600 hover:bg-green-700 text-white rounded font-semibold transition-colors text-sm flex items-center justify-center gap-1"
                    >
                      <MdCheckCircle /> Ready for Pickup
                    </button>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Ready for Pickup */}
          <div className="bg-green-900/20 border-2 border-green-700 rounded-lg p-6">
            <h2 className="text-2xl font-bold text-green-300 mb-4 flex items-center gap-2">
              <MdCheckCircle /> Ready ({readyOrders.length})
            </h2>
            <div className="space-y-4">
              {readyOrders.length === 0 ? (
                <p className="text-gray-400 text-center py-8">All caught up!</p>
              ) : (
                readyOrders.map((order) => (
                  <div
                    key={order.id}
                    className="p-4 rounded-lg bg-brand-darker border border-green-700"
                  >
                    <p className="text-lg font-bold text-green-300">Order #{order.id.slice(-6)}</p>
                    <p className="text-sm text-gray-400 mb-2">{order.customerName}</p>
                    <ul className="text-sm text-gray-300 mb-3 space-y-1">
                      {order.items.map((item) => (
                        <li key={item.id}>
                          <span className="font-semibold">{item.quantity}x</span> {item.menuItem.name}
                        </li>
                      ))}
                    </ul>
                    <p className="text-xs text-green-400 font-semibold animate-pulse">
                      Waiting for pickup ⏱️
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Selected Order Details */}
        {selectedOrder && (
          <div className="mt-8 card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-2xl font-bold text-white">Order Details</h3>
              <button
                onClick={() => setSelectedOrder(null)}
                className="text-gray-400 hover:text-white text-2xl transition-colors"
              >
                ×
              </button>
            </div>
            {orders.find((o) => o.id === selectedOrder) && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-400">Order ID</p>
                    <p className="text-lg font-semibold text-white">#{selectedOrder.slice(-6)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Customer</p>
                    <p className="text-lg font-semibold text-white">{orders.find((o) => o.id === selectedOrder)?.customerName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Time Ordered</p>
                    <p className="text-lg font-semibold text-white">{new Date(orders.find((o) => o.id === selectedOrder)?.orderTime || '').toLocaleTimeString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Status</p>
                    <p className="text-lg font-semibold capitalize text-brand-primary">{orders.find((o) => o.id === selectedOrder)?.status}</p>
                  </div>
                </div>

                <div className="border-t border-brand-border pt-4">
                  <h4 className="font-semibold mb-3 text-white">Items to Prepare:</h4>
                  <ul className="space-y-2">
                    {orders.find((o) => o.id === selectedOrder)?.items.map((item) => (
                      <li key={item.id} className="flex items-center justify-between p-3 bg-brand-darker rounded-lg border border-brand-border">
                        <div>
                          <p className="font-semibold text-white">{item.quantity}x {item.menuItem.name}</p>
                          <p className="text-sm text-gray-400">Prep time: {item.menuItem.preparationTime} min</p>
                          {item.specialRequests && (
                            <p className="text-sm text-yellow-400 font-semibold">⚠️ {item.specialRequests}</p>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

