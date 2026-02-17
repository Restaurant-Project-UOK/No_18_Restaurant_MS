import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useOrders } from '../../context/OrderContext';
import { useMenu } from '../../context/MenuContext';
import { useTables } from '../../context/TableContext';
import { OrderStatus, UserRole, Staff, MenuItem } from '../../types';
import { MOCK_STAFF } from '../../data/mockData';
import { MdDashboard, MdReceiptLong, MdPeople, MdRestaurant, MdChair, MdEdit, MdPerson, MdClose, MdSave, MdShowChart, MdTrendingUp, MdAccessTime, MdHealthAndSafety, MdCheckCircle, MdWarning, MdError, MdAdd, MdDelete, MdImage } from 'react-icons/md';
import { analyticsService, AnalyticsSummary, TopItem, DailyForecast, HourlyForecast, HealthLog } from '../../services/analyticsService';

export default function AdminDashboardPage() {
  const navigate = useNavigate();
  const { user, addStaff, getJwtToken } = useAuth();
  const { orders, updateOrderStatus } = useOrders();
  const { menuItems, updateMenuItem, createMenuItem, deleteMenuItem: deleteMenuItemService } = useMenu();
  const { tables } = useTables();
  const [activeTab, setActiveTab] = useState<'overview' | 'orders' | 'staff' | 'menu' | 'tables' | 'analytics'>('overview');
  
  // Analytics state
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analyticsSummary, setAnalyticsSummary] = useState<AnalyticsSummary | null>(null);
  const [topItems, setTopItems] = useState<TopItem[]>([]);
  const [dailyForecast, setDailyForecast] = useState<DailyForecast[]>([]);
  const [hourlyForecast, setHourlyForecast] = useState<HourlyForecast[]>([]);
  const [healthLogs, setHealthLogs] = useState<HealthLog[]>([]);
  
  // Staff form state
  const [staffForm, setStaffForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    role: '',
  });
  const [staffLoading, setStaffLoading] = useState(false);
  const [staffError, setStaffError] = useState<string | null>(null);
  const [staffSuccess, setStaffSuccess] = useState<string | null>(null);
  
  // Staff edit state
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
  const [staffList, setStaffList] = useState<Staff[]>(MOCK_STAFF);
  
  // Menu edit state
  const [editingMenuItem, setEditingMenuItem] = useState<MenuItem | null>(null);
  const [menuEditForm, setMenuEditForm] = useState<Partial<MenuItem>>({});
  
  // Menu add state
  const [showAddMenuModal, setShowAddMenuModal] = useState(false);
  const [newMenuForm, setNewMenuForm] = useState({
    name: '',
    description: '',
    category: 'mains',
    price: '',
    preparationTime: '15',
    available: true,
  });
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [menuActionLoading, setMenuActionLoading] = useState(false);
  const [menuActionError, setMenuActionError] = useState<string | null>(null);
  const [menuActionSuccess, setMenuActionSuccess] = useState<string | null>(null);

  const handleStaffInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setStaffForm((prev) => ({ ...prev, [name]: value }));
    setStaffError(null);
    setStaffSuccess(null);
  };

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!staffForm.name.trim() || !staffForm.email.trim() || !staffForm.phone.trim() || !staffForm.password.trim() || !staffForm.role) {
      setStaffError('All fields are required');
      return;
    }

    if (staffForm.password.length < 6) {
      setStaffError('Password must be at least 6 characters');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(staffForm.email)) {
      setStaffError('Invalid email format');
      return;
    }

    setStaffLoading(true);
    setStaffError(null);
    setStaffSuccess(null);

    try {
      await addStaff(
        staffForm.name,
        staffForm.email,
        staffForm.password,
        parseInt(staffForm.role) as UserRole,
        staffForm.phone
      );
      
      // Reset form
      setStaffForm({ name: '', email: '', phone: '', password: '', role: '' });
      setStaffSuccess('Staff member added successfully! They can now log in.');
    } catch (error) {
      setStaffError(error instanceof Error ? error.message : 'Failed to add staff');
    } finally {
      setStaffLoading(false);
    }
  };

  const handleEditStaff = (staff: Staff) => {
    setEditingStaff(staff);
  };

  const handleUpdateStaffStatus = (staffId: string, newStatus: 'active' | 'inactive' | 'on-break') => {
    setStaffList((prev) =>
      prev.map((s) => (s.id === staffId ? { ...s, status: newStatus } : s))
    );
    if (editingStaff?.id === staffId) {
      setEditingStaff({ ...editingStaff, status: newStatus });
    }
  };

  const handleCloseStaffEdit = () => {
    setEditingStaff(null);
  };

  const handleEditMenuItem = (item: MenuItem) => {
    setEditingMenuItem(item);
    setMenuEditForm({
      name: item.name,
      description: item.description,
      price: item.price,
      category: item.category,
      available: item.available,
    });
  };

  const handleMenuEditChange = (field: keyof MenuItem, value: unknown) => {
    setMenuEditForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveMenuItem = () => {
    if (!editingMenuItem) return;
    
    // Update the menu item in context
    updateMenuItem(editingMenuItem.id, menuEditForm);
    
    setEditingMenuItem(null);
    setMenuEditForm({});
  };

  const handleCloseMenuEdit = () => {
    setEditingMenuItem(null);
    setMenuEditForm({});
  };

  const handleOpenAddMenu = () => {
    setShowAddMenuModal(true);
    setMenuActionError(null);
    setMenuActionSuccess(null);
  };

  const handleCloseAddMenu = () => {
    setShowAddMenuModal(false);
    setNewMenuForm({
      name: '',
      description: '',
      category: 'mains',
      price: '',
      preparationTime: '15',
      available: true,
    });
    setSelectedImage(null);
    setImagePreview(null);
    setMenuActionError(null);
    setMenuActionSuccess(null);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setMenuActionError('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setMenuActionError('Image size must be less than 5MB');
      return;
    }

    setSelectedImage(file);
    setMenuActionError(null);

    // Create preview
    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleAddMenuItem = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!newMenuForm.name.trim() || !newMenuForm.price || !selectedImage) {
      setMenuActionError('Please fill in all required fields and select an image');
      return;
    }

    const price = parseFloat(newMenuForm.price);
    if (isNaN(price) || price <= 0) {
      setMenuActionError('Please enter a valid price');
      return;
    }

    setMenuActionLoading(true);
    setMenuActionError(null);
    setMenuActionSuccess(null);

    try {
      const jwt = getJwtToken();
      if (!jwt) {
        throw new Error('Authentication required');
      }

      // Prepare FormData
      const formData = new FormData();
      
      const menuItemData = {
        name: newMenuForm.name.trim(),
        description: newMenuForm.description.trim(),
        category: newMenuForm.category,
        price: price,
        available: newMenuForm.available,
        preparationTime: parseInt(newMenuForm.preparationTime) || 15,
        ingredients: [],
        allergens: [],
      };

      formData.append('menuItem', JSON.stringify(menuItemData));
      formData.append('image', selectedImage);

      // Create menu item
      await createMenuItem(formData, jwt);
      
      setMenuActionSuccess('Menu item added successfully!');
      
      // Close modal after 1.5 seconds
      setTimeout(() => {
        handleCloseAddMenu();
      }, 1500);
    } catch (error) {
      setMenuActionError(error instanceof Error ? error.message : 'Failed to add menu item');
    } finally {
      setMenuActionLoading(false);
    }
  };

  const handleDeleteMenuItem = async (itemId: string, itemName: string) => {
    if (!confirm(`Are you sure you want to delete "${itemName}"? This action cannot be undone.`)) {
      return;
    }

    setMenuActionLoading(true);
    setMenuActionError(null);

    try {
      const jwt = getJwtToken();
      if (!jwt) {
        throw new Error('Authentication required');
      }

      await deleteMenuItemService(itemId, jwt);
      
      setMenuActionSuccess(`"${itemName}" deleted successfully!`);
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setMenuActionSuccess(null);
      }, 3000);
    } catch (error) {
      setMenuActionError(error instanceof Error ? error.message : 'Failed to delete menu item');
      setTimeout(() => {
        setMenuActionError(null);
      }, 5000);
    } finally {
      setMenuActionLoading(false);
    }
  };

  // Load analytics data
  useEffect(() => {
    if (activeTab === 'analytics') {
      loadAnalyticsData();
    }
  }, [activeTab]);

  const loadAnalyticsData = async () => {
    setAnalyticsLoading(true);
    try {
      const [summary, items, daily, hourly, health] = await Promise.all([
        analyticsService.getSummary(),
        analyticsService.getTopItems(),
        analyticsService.getDailyForecast(),
        analyticsService.getHourlyForecast(),
        analyticsService.getHealthLogs(),
      ]);
      
      setAnalyticsSummary(summary);
      setTopItems(items);
      setDailyForecast(daily);
      setHourlyForecast(hourly);
      setHealthLogs(health);
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const totalRevenue = orders.reduce((sum, order) => sum + order.totalPrice, 0);
  const completedOrders = orders.filter((o) => o.status === OrderStatus.COMPLETED).length;
  const pendingOrders = orders.filter((o) => o.status === OrderStatus.PENDING).length;
  const availableTables = tables.filter((t) => t.status === 'available').length;

  return (
    <div className="min-h-screen bg-brand-dark">
      {/* Header */}
      <div className="bg-brand-darker border-b border-brand-border sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-2"><MdDashboard /> Admin Dashboard</h1>
            <p className="text-gray-400">Welcome, {user?.name}</p>
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

      {/* Navigation Tabs */}
      <div className="bg-brand-darker border-b border-brand-border">
        <div className="max-w-7xl mx-auto px-4 flex gap-6">
          {(['overview', 'analytics', 'orders', 'staff', 'menu', 'tables'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-4 px-2 border-b-2 transition-colors capitalize font-medium flex items-center gap-2 ${
                activeTab === tab
                  ? 'border-brand-primary text-brand-primary'
                  : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              {tab === 'overview' && <><MdDashboard /> Overview</>}
              {tab === 'analytics' && <><MdShowChart /> Analytics</>}
              {tab === 'orders' && <><MdReceiptLong /> Orders</>}
              {tab === 'staff' && <><MdPeople /> Staff</>}
              {tab === 'menu' && <><MdRestaurant /> Menu</>}
              {tab === 'tables' && <><MdChair /> Tables</>}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div>
            <h2 className="section-title">System Overview</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
              <div className="stat-card">
                <p className="text-gray-400 text-sm font-medium mb-2">Total Orders</p>
                <p className="text-4xl font-bold text-white">{orders.length}</p>
              </div>
              <div className="stat-card">
                <p className="text-gray-400 text-sm font-medium mb-2">Pending</p>
                <p className="text-4xl font-bold text-yellow-400">{pendingOrders}</p>
              </div>
              <div className="stat-card">
                <p className="text-gray-400 text-sm font-medium mb-2">Completed</p>
                <p className="text-4xl font-bold text-green-400">{completedOrders}</p>
              </div>
              <div className="stat-card">
                <p className="text-gray-400 text-sm font-medium mb-2">Total Revenue</p>
                <p className="text-4xl font-bold text-brand-primary">${totalRevenue.toFixed(2)}</p>
              </div>
              <div className="stat-card">
                <p className="text-gray-400 text-sm font-medium mb-2">Available Tables</p>
                <p className="text-4xl font-bold text-purple-400">{availableTables}/12</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Orders */}
              <div className="card">
                <h3 className="text-xl font-bold mb-4 text-white">Recent Orders</h3>
                <div className="space-y-3">
                  {orders.slice(0, 5).map((order) => (
                    <div key={order.id} className="flex items-center justify-between pb-3 border-b border-brand-border">
                      <div>
                        <p className="font-semibold text-white">{order.customerName}</p>
                        <p className="text-sm text-gray-500">{order.items.length} items</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-white">${order.totalPrice.toFixed(2)}</p>
                        <p className={`text-xs font-medium ${
                          order.status === OrderStatus.PENDING ? 'text-yellow-400' :
                          order.status === OrderStatus.PREPARING ? 'text-blue-400' :
                          'text-green-400'
                        }`}>
                        {order.status.toUpperCase()}
                      </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Popular Items */}
              <div className="card">
                <h3 className="text-xl font-bold mb-4 text-white">Top Items</h3>
                <div className="space-y-3">
                  {menuItems.slice(0, 5).map((item) => (
                    <div key={item.id} className="flex items-center justify-between pb-3 border-b border-brand-border">
                      <div>
                        <p className="font-semibold text-white">{item.name}</p>
                        <p className="text-sm text-gray-500">${item.price.toFixed(2)}</p>
                      </div>
                      <p className="font-bold text-brand-primary">{item.image}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div>
            <h2 className="section-title flex items-center gap-2">
              <MdShowChart /> Analytics & Insights
            </h2>

            {analyticsLoading ? (
              <div className="flex items-center justify-center py-20">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-brand-primary mx-auto mb-4"></div>
                  <p className="text-gray-400">Loading analytics...</p>
                </div>
              </div>
            ) : (
              <>
                {/* Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                  <div className="card">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-gray-400 text-sm font-medium">Total Revenue</p>
                      <MdTrendingUp className="text-green-400 text-2xl" />
                    </div>
                    <p className="text-4xl font-bold text-brand-primary mb-1">
                      ${analyticsSummary?.totalRevenue.toFixed(2) || '0.00'}
                    </p>
                    <p className="text-xs text-gray-500">All-time revenue</p>
                  </div>
                  <div className="card">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-gray-400 text-sm font-medium">Total Orders</p>
                      <MdReceiptLong className="text-blue-400 text-2xl" />
                    </div>
                    <p className="text-4xl font-bold text-white mb-1">
                      {analyticsSummary?.totalOrders || 0}
                    </p>
                    <p className="text-xs text-gray-500">Orders completed</p>
                  </div>
                </div>

                {/* Top Selling Items */}
                <div className="card mb-8">
                  <h3 className="text-xl font-bold mb-4 text-white flex items-center gap-2">
                    <MdRestaurant /> Top Selling Items
                  </h3>
                  <div className="space-y-3">
                    {topItems.map((item, index) => (
                      <div key={index} className="flex items-center justify-between pb-3 border-b border-brand-border last:border-0">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-brand-primary/20 rounded-full flex items-center justify-center">
                            <span className="text-brand-primary font-bold text-sm">#{index + 1}</span>
                          </div>
                          <div>
                            <p className="font-semibold text-white">{item.name}</p>
                            <p className="text-sm text-gray-500">{item.count} orders</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-brand-primary">${item.revenue?.toFixed(2)}</p>
                          <p className="text-xs text-gray-500">revenue</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Forecasts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                  {/* Daily Forecast */}
                  <div className="card">
                    <h3 className="text-xl font-bold mb-4 text-white flex items-center gap-2">
                      <MdTrendingUp /> Daily Revenue Forecast (7 Days)
                    </h3>
                    <div className="space-y-3">
                      {dailyForecast.map((forecast, index) => {
                        const date = new Date(forecast.date);
                        const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
                        const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                        const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                        
                        return (
                          <div key={index} className="flex items-center justify-between pb-3 border-b border-brand-border last:border-0">
                            <div>
                              <p className="font-semibold text-white">{dayName}, {dateStr}</p>
                              {isWeekend && <p className="text-xs text-yellow-400">Weekend</p>}
                            </div>
                            <div className="text-right">
                              <p className="text-lg font-bold text-green-400">
                                ${forecast.predictedRevenue.toFixed(2)}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Hourly Forecast */}
                  <div className="card">
                    <h3 className="text-xl font-bold mb-4 text-white flex items-center gap-2">
                      <MdAccessTime /> Hourly Order Forecast (Today)
                    </h3>
                    <div className="space-y-2">
                      {hourlyForecast.map((forecast, index) => {
                        const hour12 = forecast.hour > 12 ? forecast.hour - 12 : forecast.hour;
                        const ampm = forecast.hour >= 12 ? 'PM' : 'AM';
                        const timeStr = `${hour12}:00 ${ampm}`;
                        
                        // Determine if it's peak hours
                        const isPeak = (forecast.hour >= 12 && forecast.hour <= 14) || 
                                      (forecast.hour >= 18 && forecast.hour <= 20);
                        
                        return (
                          <div key={index} className="flex items-center gap-3">
                            <div className="w-20 text-sm text-gray-400">{timeStr}</div>
                            <div className="flex-1 bg-brand-dark rounded-full h-6 overflow-hidden">
                              <div
                                className={`h-full rounded-full flex items-center justify-end pr-2 ${
                                  isPeak ? 'bg-brand-primary' : 'bg-blue-600'
                                }`}
                                style={{ width: `${(forecast.predictedOrders / 25) * 100}%` }}
                              >
                                <span className="text-xs font-semibold text-white">
                                  {forecast.predictedOrders}
                                </span>
                              </div>
                            </div>
                            {isPeak && <span className="text-xs text-brand-primary font-semibold">Peak</span>}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* System Health */}
                <div className="card">
                  <h3 className="text-xl font-bold mb-4 text-white flex items-center gap-2">
                    <MdHealthAndSafety /> System Health & Task Logs
                  </h3>
                  <div className="space-y-3">
                    {healthLogs.map((log, index) => {
                      const logTime = new Date(log.timestamp);
                      const timeAgo = Math.floor((Date.now() - logTime.getTime()) / 60000);
                      const timeStr = timeAgo < 1 ? 'Just now' : `${timeAgo} min ago`;
                      
                      return (
                        <div key={index} className="flex items-start gap-3 pb-3 border-b border-brand-border last:border-0">
                          <div className="mt-1">
                            {log.status === 'success' && <MdCheckCircle className="text-green-400 text-xl" />}
                            {log.status === 'warning' && <MdWarning className="text-yellow-400 text-xl" />}
                            {log.status === 'error' && <MdError className="text-red-400 text-xl" />}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <p className="font-semibold text-white">{log.task}</p>
                              <p className="text-xs text-gray-500">{timeStr}</p>
                            </div>
                            <p className="text-sm text-gray-400">{log.message}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Orders Tab */}
        {activeTab === 'orders' && (
          <div>
            <h2 className="section-title">Order Management</h2>
            <div className="card overflow-hidden">
              <table className="w-full">
                <thead className="bg-brand-darker border-b border-brand-border">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-white">Order ID</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-white">Customer</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-white">Items</th>
                    <th className="px-6 py-3 text-right text-sm font-semibold text-white">Amount</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-white">Status</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-white">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-border">
                  {orders.map((order) => (
                    <tr key={order.id} className="hover:bg-brand-darker/50 transition-colors">
                      <td className="px-6 py-4 text-sm text-gray-300 font-mono">#{order.id.slice(-6)}</td>
                      <td className="px-6 py-4 text-sm text-white">{order.customerName}</td>
                      <td className="px-6 py-4 text-sm text-gray-400">{order.items.length} items</td>
                      <td className="px-6 py-4 text-right text-sm font-semibold text-brand-primary">${order.totalPrice.toFixed(2)}</td>
                      <td className="px-6 py-4">
                        <select
                          value={order.status}
                          onChange={(e) => updateOrderStatus(order.id, e.target.value as OrderStatus)}
                          className="px-3 py-1 bg-brand-darker border border-brand-border rounded-lg text-sm text-white focus:outline-none focus:border-brand-primary"
                        >
                          {Object.values(OrderStatus).map((status) => (
                            <option key={status} value={status}>
                              {status.charAt(0).toUpperCase() + status.slice(1)}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <button className="text-brand-primary hover:text-orange-400 font-medium transition-colors">View Details</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Staff Tab */}
        {activeTab === 'staff' && (
          <div>
            <h2 className="section-title">Staff Management</h2>
            
            {/* Add Staff Form */}
            <div className="card mb-8">
              <h3 className="text-xl font-bold mb-4 text-white flex items-center gap-2">
                <MdPerson /> Add New Staff Member
              </h3>
              
              {staffError && (
                <div className="mb-4 p-3 bg-red-900/30 border border-red-700 rounded-lg text-red-300 text-sm">
                  {staffError}
                </div>
              )}

              {staffSuccess && (
                <div className="mb-4 p-3 bg-green-900/30 border border-green-700 rounded-lg text-green-300 text-sm">
                  {staffSuccess}
                </div>
              )}

              <form onSubmit={handleAddStaff} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Full Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={staffForm.name}
                    onChange={handleStaffInputChange}
                    placeholder="Enter full name"
                    className="w-full px-4 py-2 bg-brand-darker border border-brand-border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-brand-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Email *</label>
                  <input
                    type="email"
                    name="email"
                    value={staffForm.email}
                    onChange={handleStaffInputChange}
                    placeholder="staff@restaurant.com"
                    className="w-full px-4 py-2 bg-brand-darker border border-brand-border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-brand-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Phone *</label>
                  <input
                    type="tel"
                    name="phone"
                    value={staffForm.phone}
                    onChange={handleStaffInputChange}
                    placeholder="+1 234 567 890"
                    className="w-full px-4 py-2 bg-brand-darker border border-brand-border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-brand-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Password *</label>
                  <input
                    type="password"
                    name="password"
                    value={staffForm.password}
                    onChange={handleStaffInputChange}
                    placeholder="Minimum 6 characters"
                    className="w-full px-4 py-2 bg-brand-darker border border-brand-border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-brand-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Role *</label>
                  <select
                    name="role"
                    value={staffForm.role}
                    onChange={handleStaffInputChange}
                    className="w-full px-4 py-2 bg-brand-darker border border-brand-border rounded-lg text-white focus:outline-none focus:border-brand-primary"
                  >
                    <option value="">Select role</option>
                    <option value="2">Admin</option>
                    <option value="3">Kitchen Staff</option>
                    <option value="4">Waiter</option>
                  </select>
                </div>
                <div className="flex items-end">
                  <button
                    type="submit"
                    disabled={staffLoading}
                    className="btn-primary w-full disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {staffLoading ? 'Adding...' : <><MdPerson /> Add Staff</>}
                  </button>
                </div>
              </form>
            </div>

            {/* Staff List */}
            <h3 className="text-xl font-bold mb-4 text-white">Current Staff</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {staffList.map((staff) => (
                <div key={staff.id} className="card">
                  <div className="mb-3">
                    <p className="text-lg font-bold text-white">{staff.name}</p>
                    <p className="text-sm text-gray-400">{staff.email}</p>
                  </div>
                  <div className="space-y-2 mb-4 text-sm">
                    <p className="text-gray-300"><span className="font-medium">Role:</span> <span className="flex items-center gap-1 ml-1 inline-flex">{staff.role === 3 ? <>👨‍🍳 Kitchen</> : <><MdPerson /> Waiter</>}</span></p>
                    <p className="text-gray-300"><span className="font-medium">Phone:</span> {staff.phone}</p>
                    <p className="text-gray-300"><span className="font-medium">Status:</span> <span className={`px-2 py-0.5 rounded text-xs font-medium ml-1 ${
                      staff.status === 'active' ? 'bg-green-900/30 text-green-400' : staff.status === 'inactive' ? 'bg-gray-900/30 text-gray-400' : 'bg-yellow-900/30 text-yellow-400'
                    }`}>{staff.status}</span></p>
                  </div>
                  <button onClick={() => handleEditStaff(staff)} className="btn-primary w-full text-sm flex items-center justify-center gap-1">
                    <MdEdit /> Edit
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Menu Tab */}
        {activeTab === 'menu' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="section-title mb-0">Menu Management</h2>
              <button
                onClick={handleOpenAddMenu}
                disabled={menuActionLoading}
                className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <MdAdd className="text-xl" /> Add Menu Item
              </button>
            </div>

            {/* Success/Error Messages */}
            {menuActionSuccess && (
              <div className="mb-4 p-4 bg-green-900/30 border border-green-700 rounded-lg text-green-300 flex items-center gap-2">
                <MdCheckCircle className="text-xl" />
                {menuActionSuccess}
              </div>
            )}
            {menuActionError && (
              <div className="mb-4 p-4 bg-red-900/30 border border-red-700 rounded-lg text-red-300 flex items-center gap-2">
                <MdError className="text-xl" />
                {menuActionError}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {menuItems.map((item) => (
                <div key={item.id} className="card">
                  <div className="text-5xl text-center mb-3">{item.image}</div>
                  <p className="text-lg font-bold text-white mb-1">{item.name}</p>
                  <p className="text-sm text-gray-400 mb-3">{item.description}</p>
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-2xl font-bold text-brand-primary">${item.price.toFixed(2)}</p>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      item.available ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'
                    }`}>{item.available ? 'Available' : 'Out of Stock'}</span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditMenuItem(item)}
                      disabled={menuActionLoading}
                      className="flex-1 btn-primary text-sm flex items-center justify-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <MdEdit /> Edit
                    </button>
                    <button
                      onClick={() => handleDeleteMenuItem(item.id, item.name)}
                      disabled={menuActionLoading}
                      className="px-4 py-2 bg-red-900/30 hover:bg-red-900/50 border border-red-700 text-red-300 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <MdDelete className="text-xl" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tables Tab */}
        {activeTab === 'tables' && (
          <div>
            <h2 className="section-title">Table Management</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {tables.map((table) => (
                <div
                  key={table.id}
                  className={`stat-card ${
                    table.status === 'available'
                      ? 'bg-green-900/20 border-green-700'
                      : table.status === 'occupied'
                        ? 'bg-red-900/20 border-red-700'
                        : 'bg-yellow-900/20 border-yellow-700'
                  }`}
                >
                  <p className="text-3xl font-bold mb-1">{table.tableNumber}</p>
                  <p className="text-sm text-gray-400 mb-2">Capacity: {table.capacity}</p>
                  <p className={`text-xs font-semibold uppercase ${
                    table.status === 'available' ? 'text-green-400' :
                    table.status === 'occupied' ? 'text-red-400' :
                    'text-yellow-400'
                  }`}>
                    {table.status}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Staff Edit Modal */}
      {editingStaff && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-brand-darker border border-brand-border rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white">Edit Staff Member</h3>
              <button onClick={handleCloseStaffEdit} className="p-2 text-gray-400 hover:text-white rounded-lg transition-colors">
                <MdClose className="text-xl" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <p className="text-lg font-semibold text-white mb-1">{editingStaff.name}</p>
                <p className="text-sm text-gray-400">{editingStaff.email}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Status *</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleUpdateStaffStatus(editingStaff.id, 'active')}
                    className={`flex-1 py-2 px-4 rounded-lg font-semibold transition-colors ${
                      editingStaff.status === 'active'
                        ? 'bg-green-900/50 border-2 border-green-600 text-green-300'
                        : 'bg-brand-dark border border-brand-border text-gray-400 hover:border-green-600'
                    }`}
                  >
                    Active
                  </button>
                  <button
                    onClick={() => handleUpdateStaffStatus(editingStaff.id, 'inactive')}
                    className={`flex-1 py-2 px-4 rounded-lg font-semibold transition-colors ${
                      editingStaff.status === 'inactive'
                        ? 'bg-gray-900/50 border-2 border-gray-600 text-gray-300'
                        : 'bg-brand-dark border border-brand-border text-gray-400 hover:border-gray-600'
                    }`}
                  >
                    Inactive
                  </button>
                  <button
                    onClick={() => handleUpdateStaffStatus(editingStaff.id, 'on-break')}
                    className={`flex-1 py-2 px-4 rounded-lg font-semibold transition-colors ${
                      editingStaff.status === 'on-break'
                        ? 'bg-yellow-900/50 border-2 border-yellow-600 text-yellow-300'
                        : 'bg-brand-dark border border-brand-border text-gray-400 hover:border-yellow-600'
                    }`}
                  >
                    On Break
                  </button>
                </div>
              </div>

              <div className="pt-4">
                <button onClick={handleCloseStaffEdit} className="btn-primary w-full">
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Menu Edit Modal */}
      {editingMenuItem && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-brand-darker border border-brand-border rounded-lg max-w-2xl w-full p-6 my-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white">Edit Menu Item</h3>
              <button onClick={handleCloseMenuEdit} className="p-2 text-gray-400 hover:text-white rounded-lg transition-colors">
                <MdClose className="text-xl" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Item Name *</label>
                  <input
                    type="text"
                    value={menuEditForm.name || ''}
                    onChange={(e) => handleMenuEditChange('name', e.target.value)}
                    className="w-full px-4 py-2 bg-brand-dark border border-brand-border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-brand-primary"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Price *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={menuEditForm.price || ''}
                    onChange={(e) => handleMenuEditChange('price', parseFloat(e.target.value))}
                    className="w-full px-4 py-2 bg-brand-dark border border-brand-border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-brand-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                <textarea
                  value={menuEditForm.description || ''}
                  onChange={(e) => handleMenuEditChange('description', e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 bg-brand-dark border border-brand-border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-brand-primary"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Category *</label>
                  <select
                    value={menuEditForm.category || ''}
                    onChange={(e) => handleMenuEditChange('category', e.target.value)}
                    className="w-full px-4 py-2 bg-brand-dark border border-brand-border rounded-lg text-white focus:outline-none focus:border-brand-primary"
                  >
                    <option value="appetizers">Appetizers</option>
                    <option value="mains">Main Courses</option>
                    <option value="desserts">Desserts</option>
                    <option value="beverages">Beverages</option>
                    <option value="specials">Specials</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Availability *</label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleMenuEditChange('available', true)}
                      className={`flex-1 py-2 px-4 rounded-lg font-semibold transition-colors ${
                        menuEditForm.available
                          ? 'bg-green-900/50 border-2 border-green-600 text-green-300'
                          : 'bg-brand-dark border border-brand-border text-gray-400 hover:border-green-600'
                      }`}
                    >
                      Available
                    </button>
                    <button
                      onClick={() => handleMenuEditChange('available', false)}
                      className={`flex-1 py-2 px-4 rounded-lg font-semibold transition-colors ${
                        !menuEditForm.available
                          ? 'bg-red-900/50 border-2 border-red-600 text-red-300'
                          : 'bg-brand-dark border border-brand-border text-gray-400 hover:border-red-600'
                      }`}
                    >
                      Out of Stock
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button onClick={handleCloseMenuEdit} className="flex-1 py-3 px-6 bg-brand-dark hover:bg-black border border-brand-border text-gray-300 rounded-lg font-semibold transition-colors">
                  Cancel
                </button>
                <button onClick={handleSaveMenuItem} className="flex-1 py-3 px-6 bg-brand-primary hover:bg-orange-600 text-white rounded-lg font-semibold transition-colors flex items-center justify-center gap-2">
                  <MdSave /> Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Menu Item Modal */}
      {showAddMenuModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-brand-darker border border-brand-border rounded-lg max-w-2xl w-full p-6 my-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white">Add New Menu Item</h3>
              <button onClick={handleCloseAddMenu} disabled={menuActionLoading} className="p-2 text-gray-400 hover:text-white rounded-lg transition-colors disabled:opacity-50">
                <MdClose className="text-xl" />
              </button>
            </div>
            
            <form onSubmit={handleAddMenuItem} className="space-y-4">
              {/* Success/Error Messages */}
              {menuActionSuccess && (
                <div className="p-3 bg-green-900/30 border border-green-700 rounded-lg text-green-300 text-sm flex items-center gap-2">
                  <MdCheckCircle />
                  {menuActionSuccess}
                </div>
              )}
              {menuActionError && (
                <div className="p-3 bg-red-900/30 border border-red-700 rounded-lg text-red-300 text-sm flex items-center gap-2">
                  <MdError />
                  {menuActionError}
                </div>
              )}

              {/* Image Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Image *</label>
                <div className="flex flex-col items-center gap-4">
                  {imagePreview && (
                    <div className="w-full max-w-xs">
                      <img src={imagePreview} alt="Preview" className="w-full h-48 object-cover rounded-lg border-2 border-brand-border" />
                    </div>
                  )}
                  <label className="w-full cursor-pointer">
                    <div className="flex items-center justify-center gap-2 px-4 py-3 bg-brand-dark hover:bg-black border-2 border-dashed border-brand-border hover:border-brand-primary text-gray-300 rounded-lg transition-colors">
                      <MdImage className="text-2xl" />
                      <span className="font-medium">{selectedImage ? 'Change Image' : 'Select Image'}</span>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageSelect}
                      className="hidden"
                      disabled={menuActionLoading}
                    />
                  </label>
                  {selectedImage && (
                    <p className="text-xs text-gray-400 text-center">{selectedImage.name} ({(selectedImage.size / 1024).toFixed(1)} KB)</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Item Name *</label>
                  <input
                    type="text"
                    value={newMenuForm.name}
                    onChange={(e) => setNewMenuForm({ ...newMenuForm, name: e.target.value })}
                    placeholder="e.g., Margherita Pizza"
                    disabled={menuActionLoading}
                    className="w-full px-4 py-2 bg-brand-dark border border-brand-border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-brand-primary disabled:opacity-50"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Price ($) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={newMenuForm.price}
                    onChange={(e) => setNewMenuForm({ ...newMenuForm, price: e.target.value })}
                    placeholder="0.00"
                    disabled={menuActionLoading}
                    className="w-full px-4 py-2 bg-brand-dark border border-brand-border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-brand-primary disabled:opacity-50"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                <textarea
                  value={newMenuForm.description}
                  onChange={(e) => setNewMenuForm({ ...newMenuForm, description: e.target.value })}
                  placeholder="Describe the dish..."
                  rows={3}
                  disabled={menuActionLoading}
                  className="w-full px-4 py-2 bg-brand-dark border border-brand-border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-brand-primary disabled:opacity-50"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Category *</label>
                  <select
                    value={newMenuForm.category}
                    onChange={(e) => setNewMenuForm({ ...newMenuForm, category: e.target.value })}
                    disabled={menuActionLoading}
                    className="w-full px-4 py-2 bg-brand-dark border border-brand-border rounded-lg text-white focus:outline-none focus:border-brand-primary disabled:opacity-50"
                  >
                    <option value="appetizers">Appetizers</option>
                    <option value="mains">Main Courses</option>
                    <option value="desserts">Desserts</option>
                    <option value="beverages">Beverages</option>
                    <option value="specials">Specials</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Prep Time (min)</label>
                  <input
                    type="number"
                    min="1"
                    value={newMenuForm.preparationTime}
                    onChange={(e) => setNewMenuForm({ ...newMenuForm, preparationTime: e.target.value })}
                    disabled={menuActionLoading}
                    className="w-full px-4 py-2 bg-brand-dark border border-brand-border rounded-lg text-white focus:outline-none focus:border-brand-primary disabled:opacity-50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Initial Availability</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setNewMenuForm({ ...newMenuForm, available: true })}
                    disabled={menuActionLoading}
                    className={`flex-1 py-2 px-4 rounded-lg font-semibold transition-colors disabled:opacity-50 ${
                      newMenuForm.available
                        ? 'bg-green-900/50 border-2 border-green-600 text-green-300'
                        : 'bg-brand-dark border border-brand-border text-gray-400 hover:border-green-600'
                    }`}
                  >
                    Available
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewMenuForm({ ...newMenuForm, available: false })}
                    disabled={menuActionLoading}
                    className={`flex-1 py-2 px-4 rounded-lg font-semibold transition-colors disabled:opacity-50 ${
                      !newMenuForm.available
                        ? 'bg-red-900/50 border-2 border-red-600 text-red-300'
                        : 'bg-brand-dark border border-brand-border text-gray-400 hover:border-red-600'
                    }`}
                  >
                    Out of Stock
                  </button>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={handleCloseAddMenu}
                  disabled={menuActionLoading}
                  className="flex-1 py-3 px-6 bg-brand-dark hover:bg-black border border-brand-border text-gray-300 rounded-lg font-semibold transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={menuActionLoading}
                  className="flex-1 py-3 px-6 bg-brand-primary hover:bg-orange-600 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {menuActionLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      Adding...
                    </>
                  ) : (
                    <>
                      <MdAdd /> Add Menu Item
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

