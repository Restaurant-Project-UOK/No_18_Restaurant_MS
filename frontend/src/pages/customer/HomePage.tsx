import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useMenu } from '../../context/MenuContext';
import { useCart } from '../../context/CartContext';
import { useOrders } from '../../context/OrderContext';
import { Order, OrderStatus, MenuItem } from '../../types';
import { MdRestaurant, MdHistory, MdShoppingCart, MdPerson, MdCheckCircle, MdAdd, MdRemove, MdSearch, MdClose, MdLocalDining, MdRoomService, MdReceiptLong, MdPayment, MdAccessTime, MdLocalOffer } from 'react-icons/md';
import { getAccessToken } from '../../utils/cookieStorage';
import { paymentService } from '../../services/paymentService';
import { promotionService, Promotion } from '../../services/promotionService';
import { ChatbotWidget } from '../../components/ChatbotWidget';

export default function CustomerHomePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { categories, getItemsByCategory } = useMenu();
  const { cartItems, addToCart, removeFromCart, updateQuantity, getTotalPrice, checkout: checkoutCart, loading: cartLoading, initCart } = useCart();
  const { orders, loadUserHistory, getOrdersByCustomer, loadingAPI: orderLoading } = useOrders();
  const [activeCategory, setActiveCategory] = useState<string>('');
  const [showCart, setShowCart] = useState(false);
  const [showOrderHistory, setShowOrderHistory] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState<'cart' | 'checkout' | 'confirmation'>('cart');
  const [checkoutData, setCheckoutData] = useState({
    specialRequests: '',
    tableNumber: '',
  });
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [lastOrderId, setLastOrderId] = useState('');
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [showPromotions, setShowPromotions] = useState(false);

  // Get Table ID
  const [searchParams] = useSearchParams();
  const tableIdFromUrl = searchParams.get('tableId');
  const tableIdFromCookie = document.cookie.match(/(?:^|;\s*)tableId=(\d+)/)?.[1];
  const tableId = tableIdFromUrl || tableIdFromCookie;

  // Initialize cart session when menu page loads (POST /api/cart/open)
  useEffect(() => {
    const token = getAccessToken();
    if (token) {
      initCart(token).catch((err: unknown) => {
        console.warn('[HomePage] Cart init failed (may already be open):', err);
      });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Load my orders when requested (calls GET /api/orders/user)
  const handleShowOrders = async () => {
    setShowOrderHistory(true);
    await loadUserHistory();
  };

  // Fetch promotions on load
  useEffect(() => {
    const fetchPromotions = async () => {
      try {
        const data = await promotionService.getAvailablePromotions();
        setPromotions(data);
      } catch (error) {
        console.error('Failed to load promotions:', error);
      }
    };
    fetchPromotions();
  }, []);

  let menuItems = getItemsByCategory(activeCategory || (categories[0]?.name || ''));

  // Filter menu items based on search query
  if (searchQuery.trim()) {
    menuItems = menuItems.filter((item) =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }

  const customerOrders = showOrderHistory ? orders : getOrdersByCustomer(user?.id || '');

  const handleAddToCart = async (menuItem: MenuItem) => {
    await addToCart(menuItem, 1);
  };

  const handleProfileClick = () => {
    navigate('/profile');
  };

  const handleCheckout = async () => {
    if (cartItems.length === 0) return;
    setLoading(true);

    try {
      const token = getAccessToken();
      if (!token) {
        navigate('/login');
        return;
      }

      if (checkoutData.tableNumber) {
        // Update tableId cookie if user entered a table number
        const expires = new Date(Date.now() + 5 * 60 * 60 * 1000).toUTCString();
        document.cookie = `tableId=${checkoutData.tableNumber}; expires=${expires}; path=/; SameSite=Lax`;
        // Also update search params for subsequent navigation
        navigate(`.?tableId=${checkoutData.tableNumber}`, { replace: true });
      }

      const result = await checkoutCart(token);
      setLastOrderId(result.orderId.slice(-6));
      setCheckoutStep('confirmation');

      await loadUserHistory();
    } catch (err) {
      console.error('Checkout failed:', err);
      alert('Checkout failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen bg-brand-dark flex flex-col overflow-hidden">
      <ChatbotWidget />
      {/* MOBILE HEADER - Fixed */}
      <div className="bg-brand-darker border-b border-brand-border px-4 py-3 flex-shrink-0">
        {/* Desktop/Tablet Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <MdRestaurant className="text-2xl text-brand-primary" />
            <div>
              <h1 className="text-lg font-bold text-white">No 18 Restaurant</h1>
              <p className="text-xs text-gray-400">
                {tableId ? `Table ${tableId}` : 'Welcome'} • {user?.name?.split(' ')[0] || 'Guest'}
              </p>
            </div>
          </div>
          <button
            onClick={handleProfileClick}
            className="p-2 text-brand-primary hover:bg-brand-primary/20 rounded-lg transition-colors flex items-center gap-1"
            title="Profile"
          >
            <MdPerson className="text-xl" />
            <span className="text-xs font-medium hidden sm:inline">{user?.name?.split(' ')[0]}</span>
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative">
          {isSearchOpen ? (
            <div className="flex items-center gap-2">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search foods..."
                  autoFocus
                  className="w-full px-3 py-2 pl-9 bg-brand-dark border border-brand-border rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:border-brand-primary transition-colors"
                />
                <MdSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-lg" />
              </div>
              <button
                onClick={() => {
                  setIsSearchOpen(false);
                  setSearchQuery('');
                }}
                className="p-2 text-gray-400 hover:text-white rounded-lg transition-colors"
                title="Close"
              >
                <MdClose className="text-xl" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsSearchOpen(true)}
              className="w-full px-3 py-2 bg-brand-dark border border-brand-border rounded-lg text-gray-400 hover:text-white hover:border-brand-primary transition-colors flex items-center gap-2 text-sm"
            >
              <MdSearch className="text-lg" /> Search foods...
            </button>
          )}
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 overflow-y-auto flex flex-col">
        {/* Show Cart Overlay */}
        {showCart ? (
          <div className="flex-1 bg-brand-dark p-4 flex flex-col">
            {/* Cart Header */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <MdShoppingCart />
                {checkoutStep === 'confirmation' ? 'Checkout Complete' : 'Your Order'}
              </h2>
              <button
                onClick={() => {
                  setShowCart(false);
                  setCheckoutStep('cart');
                  setCheckoutData({ specialRequests: '', tableNumber: '' });
                }}
                className="text-gray-400 hover:text-white text-2xl"
              >
                ×
              </button>
            </div>

            {/* Confirmation Screen */}
            {checkoutStep === 'confirmation' ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center py-8">
                <div className="text-6xl text-green-400 mb-3"><MdCheckCircle /></div>
                <h3 className="text-xl font-bold text-white mb-2">Order Placed!</h3>
                <p className="text-gray-400 mb-6">Your order is on the way.</p>
                <p className="text-sm text-gray-500 mb-6">Order ID: #{lastOrderId}</p>
                <button
                  onClick={() => {
                    setShowCart(false);
                    setCheckoutStep('cart');
                    setCheckoutData({ specialRequests: '', tableNumber: '' });
                  }}
                  className="w-full py-3 bg-brand-primary hover:bg-orange-600 text-white rounded-lg font-semibold transition-colors"
                >
                  Back to Menu
                </button>
              </div>
            ) : (
              <>
                {/* Cart Items Scroll Section */}
                <div className="flex-1 overflow-y-auto mb-4 space-y-3">
                  {cartItems.length === 0 ? (
                    <p className="text-center text-gray-400 py-8">Your cart is empty</p>
                  ) : (
                    cartItems.map((item) => (
                      <div key={item.id} className="bg-brand-darker border border-brand-border p-3 rounded-lg">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1">
                            <p className="font-semibold text-white text-sm">{item.menuItem.name}</p>
                            <p className="text-xs text-gray-400">${item.menuItem.price.toFixed(2)} each</p>
                          </div>
                          <p className="font-bold text-brand-primary text-sm">${(item.menuItem.price * item.quantity).toFixed(2)}</p>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => updateQuantity(item.menuItem.id, item.quantity - 1)}
                              disabled={cartLoading}
                              className="p-1 bg-brand-dark border border-brand-border rounded hover:bg-black transition-colors disabled:opacity-50"
                            >
                              <MdRemove className="text-white" />
                            </button>
                            <span className="w-6 text-center text-sm font-semibold text-white">{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item.menuItem.id, item.quantity + 1)}
                              disabled={cartLoading}
                              className="p-1 bg-brand-dark border border-brand-border rounded hover:bg-black transition-colors disabled:opacity-50"
                            >
                              <MdAdd className="text-white" />
                            </button>
                          </div>
                          <button
                            onClick={() => removeFromCart(item.menuItem.id)}
                            disabled={cartLoading}
                            className="text-red-400 hover:text-red-300 text-xs font-semibold transition-colors disabled:opacity-50"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Checkout Steps */}
                {checkoutStep === 'cart' && cartItems.length > 0 && (
                  <div className="border-t border-brand-border pt-4 space-y-3">
                    <div className="bg-brand-darker p-3 rounded-lg">
                      <div className="flex justify-between mb-2">
                        <span className="text-gray-400 text-sm">Subtotal:</span>
                        <span className="text-white font-semibold">${getTotalPrice().toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-brand-primary font-bold">Total:</span>
                        <span className="text-brand-primary font-bold">${getTotalPrice().toFixed(2)}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => setCheckoutStep('checkout')}
                      className="w-full py-3 bg-brand-primary hover:bg-orange-600 text-white rounded-lg font-semibold transition-colors"
                    >
                      Proceed to Order
                    </button>
                  </div>
                )}

                {checkoutStep === 'checkout' && (
                  <div className="border-t border-brand-border pt-4 space-y-3">
                    <div>
                      <label htmlFor="tableNum" className="text-xs font-medium text-gray-300 block mb-2">Table Number (Optional)</label>
                      <input
                        id="tableNum"
                        type="number"
                        value={checkoutData.tableNumber}
                        onChange={(e) => setCheckoutData({ ...checkoutData, tableNumber: e.target.value })}
                        className="w-full px-3 py-2 bg-brand-dark border border-brand-border rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:border-brand-primary"
                        placeholder="e.g., 5"
                      />
                    </div>


                    <div>
                      <label htmlFor="specrequests" className="text-xs font-medium text-gray-300 block mb-2">Special Requests</label>
                      <textarea
                        id="specrequests"
                        value={checkoutData.specialRequests}
                        onChange={(e) => setCheckoutData({ ...checkoutData, specialRequests: e.target.value })}
                        className="w-full px-3 py-2 bg-brand-dark border border-brand-border rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:border-brand-primary"
                        placeholder="No onions, extra cheese..."
                        rows={2}
                      />
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => setCheckoutStep('cart')}
                        className="flex-1 py-2 bg-brand-darker hover:bg-black text-gray-300 border border-brand-border rounded-lg font-semibold transition-colors text-sm"
                      >
                        Back
                      </button>
                      <button
                        onClick={handleCheckout}
                        disabled={loading || cartLoading}
                        className="flex-1 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded-lg font-semibold transition-colors text-sm"
                      >
                        Place Order
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        ) : showOrderHistory ? (
          <div className="flex-1 bg-brand-dark p-4 flex flex-col md:p-6 lg:max-w-4xl lg:mx-auto lg:w-full">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  <MdHistory className="text-brand-primary" />  My Orders
                </h2>
                <p className="text-sm text-gray-400 mt-1">Track your active and past orders</p>
              </div>
              <button
                onClick={() => setShowOrderHistory(false)}
                className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-all"
              >
                <MdClose className="text-2xl" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-1 custom-scrollbar">
              {orderLoading ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <div className="w-10 h-10 border-4 border-brand-primary border-t-transparent rounded-full animate-spin mb-4"></div>
                  <p className="text-gray-400">Loading your orders...</p>
                </div>
              ) : customerOrders.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 opacity-50">
                  <MdReceiptLong className="text-6xl mb-4 text-gray-600" />
                  <p className="text-xl text-gray-400">No orders history found</p>
                  <p className="text-sm text-gray-500">Your ordered items will appear here</p>
                </div>
              ) : (
                customerOrders
                  .sort((a, b) => new Date(b.createdAt || b.orderTime || '').getTime() - new Date(a.createdAt || a.orderTime || '').getTime())
                  .map((order: Order) => {
                    const isServed = order.status === OrderStatus.SERVED;
                    const isPaid = order.isPaid;

                    // Status Progress Logic
                    const steps = [
                      { status: OrderStatus.CONFIRMED, icon: MdAccessTime, label: 'Confirmed' },
                      { status: OrderStatus.PREPARING, icon: MdLocalDining, label: 'Preparing' },
                      { status: OrderStatus.READY, icon: MdRoomService, label: 'Ready' },
                      { status: OrderStatus.SERVED, icon: MdCheckCircle, label: 'Served' },
                    ];

                    const currentStepIndex = steps.findIndex(s => s.status === order.status);
                    const stepIndex = currentStepIndex === -1 && order.status === OrderStatus.CREATED ? 0 : currentStepIndex;

                    return (
                      <div key={String(order.id)} className="bg-brand-darker border border-brand-border p-5 rounded-xl shadow-lg hover:border-brand-primary/50 transition-colors">
                        {/* Header */}
                        <div className="flex flex-wrap gap-4 items-start justify-between mb-6 border-b border-brand-border/50 pb-4">
                          <div>
                            <div className="flex items-baseline gap-2">
                              <span className="text-lg font-bold text-white">Order #{String(order.id).slice(-6)}</span>
                              <span className="text-xs text-gray-500 font-mono">{String(order.id)}</span>
                            </div>
                            <p className="text-xs text-gray-400 mt-1">
                              {new Date(order.createdAt || order.orderTime || Date.now()).toLocaleString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-brand-primary">
                              ${(order.totalAmount ?? order.totalPrice ?? 0).toFixed(2)}
                            </div>
                            <div className="text-xs text-gray-400">Total Amount</div>
                          </div>
                        </div>

                        {/* Status Tracker */}
                        <div className="mb-6 relative">
                          <div className="absolute top-3 left-0 w-full h-1 bg-gray-800 rounded-full"></div>
                          <div
                            className="absolute top-3 left-0 h-1 bg-brand-primary rounded-full transition-all duration-500"
                            style={{ width: `${(Math.max(0, stepIndex) / (steps.length - 1)) * 100}%` }}
                          ></div>
                          <div className="relative flex justify-between">
                            {steps.map((step, idx) => {
                              const isActive = idx <= stepIndex;
                              const isCurrent = idx === stepIndex;
                              const Icon = step.icon;
                              return (
                                <div key={step.label} className="flex flex-col items-center gap-2">
                                  <div className={`w-7 h-7 rounded-full flex items-center justify-center z-10 border-2 transition-colors ${isActive ? 'bg-brand-primary border-brand-primary text-white' : 'bg-brand-dark border-gray-600 text-gray-600'
                                    } ${isCurrent ? 'ring-2 ring-brand-primary/40 ring-offset-2 ring-offset-brand-darker' : ''}`}>
                                    <Icon className="text-xs" />
                                  </div>
                                  <span className={`text-[10px] font-medium uppercase tracking-wider ${isActive ? 'text-brand-primary' : 'text-gray-600'}`}>
                                    {step.label}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Items */}
                        <div className="bg-black/20 rounded-lg p-3 mb-4 space-y-2">
                          {order.items.map((item) => (
                            <div key={item.id} className="flex items-center justify-between text-sm">
                              <div className="flex items-center gap-2">
                                <span className="w-5 h-5 flex items-center justify-center bg-gray-800 text-gray-400 rounded text-xs font-medium">
                                  {item.quantity}
                                </span>
                                <span className="text-gray-300">{item.itemName || item.menuItem?.name || 'Item'}</span>
                              </div>
                              <div className="text-gray-400">
                                ${(item.unitPrice ?? item.price ?? 0).toFixed(2)}
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Actions */}
                        <div className="flex justify-end pt-2">
                          {isServed ? (
                            isPaid ? (
                              <div className="px-5 py-2.5 bg-green-900/20 text-green-400 border border-green-900/50 rounded-lg flex items-center gap-2 font-medium cursor-default">
                                <MdCheckCircle /> Paid
                              </div>
                            ) : (
                              <button
                                onClick={async () => {
                                  try {
                                    setLoading(true);
                                    const { approvalUrl } = await paymentService.createPayment({
                                      orderId: Number(order.id),
                                      amount: order.totalAmount ?? order.totalPrice ?? 0
                                    });
                                    window.location.href = approvalUrl;
                                  } catch {
                                    alert('Failed to initiate payment. Please try again.');
                                  } finally {
                                    setLoading(false);
                                  }
                                }}
                                disabled={loading}
                                className="px-6 py-2.5 bg-brand-primary hover:bg-orange-600 text-white font-bold rounded-lg shadow-lg shadow-brand-primary/20 transition-all transform hover:-translate-y-0.5 flex items-center gap-2"
                              >
                                <MdPayment /> Pay Now
                              </button>
                            )
                          ) : (
                            <div className="text-xs text-brand-primary font-medium italic flex items-center gap-1 bg-brand-primary/10 px-3 py-1 rounded">
                              <MdAccessTime /> Wait for "Served" status to pay
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
              )}
            </div>
          </div>
        ) : (
          <>
            {/* Show search results or no results message */}
            {searchQuery.trim() && menuItems.length === 0 && (
              <div className="flex-1 flex flex-col items-center justify-center py-12">
                <MdSearch className="text-5xl text-gray-600 mb-3" />
                <p className="text-gray-400 text-lg">No foods found</p>
                <p className="text-gray-500 text-sm mt-1">Try searching with different keywords</p>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setIsSearchOpen(false);
                  }}
                  className="mt-4 px-4 py-2 bg-brand-primary hover:bg-orange-600 text-white rounded-lg font-semibold text-sm transition-colors"
                >
                  Clear Search
                </button>
              </div>
            )}

            {/* CATEGORY TABS - Horizontal Scroll - Hidden when searching */}
            {!searchQuery.trim() && (
              <div className="bg-brand-darker border-b border-brand-border px-3 py-3 flex gap-2 overflow-x-auto flex-shrink-0">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setActiveCategory(category.name)}
                    className={`px-4 py-2 rounded-lg whitespace-nowrap text-sm font-medium transition-colors flex-shrink-0 ${(activeCategory || categories[0]?.name) === category.name
                      ? 'bg-brand-primary text-white'
                      : 'bg-brand-dark text-gray-300 border border-brand-border hover:border-brand-primary'
                      }`}
                  >
                    {category.name}
                  </button>
                ))}
              </div>
            )}

            {/* MENU ITEMS - Vertical Stack */}
            <div className="flex-1 overflow-y-auto px-3 py-4 space-y-3">
              {menuItems.map((item) => {
                const cartItem = cartItems.find(ci => ci.menuItem.id === item.id);
                const isAvailable = item.available ?? item.isActive;
                return (
                  <div key={item.id} className="bg-brand-darker border border-brand-border rounded-lg overflow-hidden hover:border-brand-primary transition-colors">
                    <div className="flex gap-3 p-3">
                      {/* Item Image */}
                      <div className="w-16 h-16 bg-brand-dark flex items-center justify-center rounded-lg overflow-hidden flex-shrink-0">
                        {item.imageUrl ? (
                          <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                        ) : (
                          <MdRestaurant className="text-2xl text-gray-500" />
                        )}
                      </div>

                      {/* Item Details */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-white text-sm mb-1">{item.name}</h3>
                        <p className="text-xs text-gray-400 mb-2 line-clamp-2">{item.description}</p>

                        <div className="flex justify-between items-center">
                          <span className="text-lg font-bold text-brand-primary">${item.price?.toFixed(2) || '0.00'}</span>

                          {/* Show +/- controls if item is in cart, otherwise show Add button */}
                          {cartItem ? (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => updateQuantity(item.id, cartItem.quantity - 1)}
                                disabled={cartLoading}
                                className="w-7 h-7 flex items-center justify-center bg-brand-dark border border-brand-border rounded-md hover:bg-red-900/30 hover:border-red-700 transition-colors disabled:opacity-50"
                              >
                                <MdRemove className="text-white text-sm" />
                              </button>
                              <span className="w-7 text-center text-sm font-bold text-white">{cartItem.quantity}</span>
                              <button
                                onClick={() => updateQuantity(item.id, cartItem.quantity + 1)}
                                disabled={cartLoading}
                                className="w-7 h-7 flex items-center justify-center bg-brand-primary hover:bg-orange-600 rounded-md transition-colors disabled:opacity-50"
                              >
                                <MdAdd className="text-white text-sm" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleAddToCart(item)}
                              disabled={!isAvailable || cartLoading}
                              className={`px-3 py-1 rounded text-sm font-semibold transition-colors flex items-center gap-1 ${isAvailable && !cartLoading
                                ? 'bg-brand-primary hover:bg-orange-600 text-white'
                                : 'bg-gray-700 text-gray-400 cursor-not-allowed'
                                }`}
                            >
                              <MdAdd className="text-base" /> Add
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              <div className="h-4" />
            </div>
          </>
        )}
      </div>


      {/* Floating Promotion Icon */}
      {promotions.length > 0 && (
        <>
          <button
            onClick={() => setShowPromotions(true)}
            className="fixed bottom-24 right-4 md:bottom-8 md:right-8 w-14 h-14 bg-gradient-to-r from-pink-500 to-rose-500 rounded-full shadow-lg shadow-pink-500/30 flex items-center justify-center text-white hover:scale-110 transition-transform z-40 animate-bounce"
          >
            <MdLocalOffer className="text-2xl" />
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-yellow-400 text-black text-xs font-bold rounded-full flex items-center justify-center border-2 border-brand-dark">
              {promotions.length}
            </span>
          </button>

          {/* Promotions Modal */}
          {showPromotions && (
            <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
              <div className="bg-brand-darker border border-brand-border rounded-xl max-w-lg w-full p-6 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-pink-500 to-rose-500"></div>
                <button
                  onClick={() => setShowPromotions(false)}
                  className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white rounded-lg transition-colors"
                >
                  <MdClose className="text-xl" />
                </button>

                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-pink-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <MdLocalOffer className="text-3xl text-pink-500" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">Special Offers</h3>
                  <p className="text-gray-400">Limited time promotions just for you!</p>
                </div>

                <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                  {promotions.map((promo) => (
                    <div key={promo.id} className="bg-gradient-to-br from-brand-dark to-brand-darker border border-brand-border p-4 rounded-lg relative overflow-hidden group hover:border-pink-500/50 transition-colors">
                      <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                        <MdLocalOffer className="text-6xl text-pink-500" />
                      </div>
                      <div className="flex justify-between items-start relative z-10">
                        <div>
                          <h4 className="text-lg font-bold text-white mb-1 group-hover:text-pink-400 transition-colors">{promo.name}</h4>
                          <p className="text-sm text-gray-400 mb-3">
                            Valid until {new Date(promo.endAt).toLocaleDateString()}
                          </p>
                          <div className="inline-flex items-baseline gap-1 bg-pink-500/10 px-3 py-1 rounded-full border border-pink-500/20">
                            <span className="text-xl font-bold text-pink-500">
                              {promo.discountType === 'PERCENTAGE' ? `${promo.discountValue}%` : `$${promo.discountValue}`}
                            </span>
                            <span className="text-xs font-semibold text-pink-400 uppercase tracking-wide">OFF</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 pt-4 border-t border-brand-border text-center">
                  <button
                    onClick={() => setShowPromotions(false)}
                    className="text-gray-400 hover:text-white text-sm font-medium transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* MOBILE BOTTOM ACTION BAR - Fixed */}
      {!showCart && !showOrderHistory && (
        <div className="bg-brand-darker border-t border-brand-border px-4 py-3 flex gap-3 flex-shrink-0">
          <button
            onClick={handleShowOrders}
            className="flex-1 py-2 px-3 bg-brand-dark hover:bg-black text-gray-300 border border-brand-border rounded-lg font-semibold text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            disabled={loading || cartLoading}
          >
            <MdHistory className="text-lg" /> My Orders
          </button>
          <button
            onClick={() => setShowCart(true)}
            disabled={loading || cartLoading}
            className="flex-1 py-2 px-3 bg-brand-primary hover:bg-orange-600 text-white rounded-lg font-semibold text-sm transition-colors flex items-center justify-center gap-2 relative disabled:opacity-50"
          >
            <MdShoppingCart className="text-lg" />
            {cartItems.length > 0 && (
              <span className="absolute top-1 right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                {cartItems.length}
              </span>
            )}
            Cart
          </button>
        </div>
      )}
    </div>
  );
}

