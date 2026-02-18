import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useMenu } from '../../context/MenuContext';
import { useCart } from '../../context/CartContext';
import { useOrders } from '../../context/OrderContext';
import { Order, OrderStatus, MenuItem } from '../../types';
import { MdRestaurant, MdHistory, MdShoppingCart, MdPerson, MdCheckCircle, MdAdd, MdRemove, MdSearch, MdClose } from 'react-icons/md';

export default function CustomerHomePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { categories, getItemsByCategory } = useMenu();
  const { cartItems, addToCart, removeFromCart, updateQuantity, getTotalPrice, checkout: checkoutCart, loading: cartLoading } = useCart();
  const { loadUserHistory, getOrdersByCustomer } = useOrders();
  const [activeCategory, setActiveCategory] = useState<string>('');
  const [showCart, setShowCart] = useState(false);
  const [showOrderHistory, setShowOrderHistory] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState<'cart' | 'checkout' | 'confirmation'>('cart');
  const [checkoutData, setCheckoutData] = useState({
    paymentMethod: 'card',
    specialRequests: '',
    tableNumber: '',
  });
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [lastOrderId, setLastOrderId] = useState('');

  // Load order history when requested
  const handleShowHistory = async () => {
    setShowOrderHistory(true);
    await loadUserHistory();
  };

  let menuItems = getItemsByCategory(activeCategory || (categories[0]?.name || ''));

  // Filter menu items based on search query
  if (searchQuery.trim()) {
    menuItems = menuItems.filter((item) =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }

  const customerOrders = getOrdersByCustomer(user?.id || '');

  const handleAddToCart = async (menuItem: MenuItem) => {
    await addToCart(menuItem as never, 1);
  };

  const handleProfileClick = () => {
    navigate('/profile');
  };

  const handleCheckout = async () => {
    if (cartItems.length === 0) return;
    setLoading(true);

    try {
      const token = localStorage.getItem('auth_access_token');
      if (!token) {
        navigate('/login');
        return;
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
      {/* MOBILE HEADER - Fixed */}
      <div className="bg-brand-darker border-b border-brand-border px-4 py-3 flex-shrink-0">
        {/* Desktop/Tablet Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <MdRestaurant className="text-2xl text-brand-primary" />
            <div>
              <h1 className="text-lg font-bold text-white">Menu</h1>
              <p className="text-xs text-gray-400">{user?.name}</p>
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
                {checkoutStep === 'confirmation' ? 'Order Confirmed' : 'Your Order'}
              </h2>
              <button
                onClick={() => {
                  setShowCart(false);
                  setCheckoutStep('cart');
                  setCheckoutData({ paymentMethod: 'card', specialRequests: '', tableNumber: '' });
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
                    setCheckoutData({ paymentMethod: 'card', specialRequests: '', tableNumber: '' });
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
                      Proceed to Checkout
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
                      <label htmlFor="paymentMeth" className="text-xs font-medium text-gray-300 block mb-2">Payment Method</label>
                      <select
                        id="paymentMeth"
                        value={checkoutData.paymentMethod}
                        onChange={(e) => setCheckoutData({ ...checkoutData, paymentMethod: e.target.value })}
                        className="w-full px-3 py-2 bg-brand-dark border border-brand-border rounded-lg text-white text-sm focus:outline-none focus:border-brand-primary"
                      >
                        <option value="card">Credit Card</option>
                        <option value="cash">Cash</option>
                        <option value="digital">Digital Wallet</option>
                      </select>
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
          <div className="flex-1 bg-brand-dark p-4 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <MdHistory /> Order History
              </h2>
              <button
                onClick={() => setShowOrderHistory(false)}
                className="text-gray-400 hover:text-white text-2xl"
              >
                ×
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3">
              {customerOrders.length === 0 ? (
                <p className="text-center text-gray-400 py-8">No orders yet</p>
              ) : (
                customerOrders.map((order: Order) => (
                  <div key={order.id} className="bg-brand-darker border border-brand-border p-3 rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-semibold text-white text-sm">Order #{order.id.slice(-6)}</p>
                        <p className="text-xs text-gray-400">{new Date(order.orderTime).toLocaleDateString()}</p>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${order.status === OrderStatus.PENDING
                        ? 'bg-yellow-900/30 text-yellow-300'
                        : order.status === OrderStatus.PREPARING
                          ? 'bg-blue-900/30 text-blue-300'
                          : order.status === OrderStatus.READY
                            ? 'bg-green-900/30 text-green-300'
                            : 'bg-gray-900/30 text-gray-300'
                        }`}>
                        {order.status.toUpperCase()}
                      </span>
                    </div>
                    <div className="space-y-1 mb-2 pb-2 border-b border-brand-border">
                      {order.items.map((item: any) => (
                        <p key={item.id} className="text-xs text-gray-300">
                          {item.quantity}x {item.menuItem.name}
                        </p>
                      ))}
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400 text-xs">Total:</span>
                      <span className="text-brand-primary font-semibold text-sm">${order.totalPrice.toFixed(2)}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        ) : (
          <>
            {/* Show search results or no results message */}
            {searchQuery.trim() && menuItems.length === 0 && (
              <div className="flex-1 flex flex-col items-center justify-center py-12">
                <div className="text-5xl text-gray-600 mb-3">🔍</div>
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
              {menuItems.map((item) => (
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
                        <span className="text-lg font-bold text-brand-primary">${item.price.toFixed(2)}</span>
                        <button
                          onClick={() => handleAddToCart(item)}
                          disabled={!item.available || cartLoading}
                          className={`px-3 py-1 rounded text-sm font-semibold transition-colors flex items-center gap-1 ${item.available && !cartLoading
                            ? 'bg-brand-primary hover:bg-orange-600 text-white'
                            : 'bg-gray-700 text-gray-400 cursor-not-allowed'
                            }`}
                        >
                          <MdAdd className="text-base" /> Add
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              <div className="h-4" />
            </div>
          </>
        )}
      </div>

      {/* MOBILE BOTTOM ACTION BAR - Fixed */}
      {!showCart && !showOrderHistory && (
        <div className="bg-brand-darker border-t border-brand-border px-4 py-3 flex gap-3 flex-shrink-0">
          <button
            onClick={handleShowHistory}
            className="flex-1 py-2 px-3 bg-brand-dark hover:bg-black text-gray-300 border border-brand-border rounded-lg font-semibold text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            disabled={loading || cartLoading}
          >
            <MdHistory className="text-lg" /> History
          </button>
          <button
            onClick={() => setShowCart(true)}
            disabled={cartItems.length === 0 || loading || cartLoading}
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

