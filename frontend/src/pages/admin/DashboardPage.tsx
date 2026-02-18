import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useOrders } from '../../context/OrderContext';
import { useMenu } from '../../context/MenuContext';
import { useTables } from '../../context/TableContext';
import { OrderStatus, UserRole, Staff, MenuItem } from '../../types';
import { MdDashboard, MdReceiptLong, MdPeople, MdRestaurant, MdEdit, MdPerson, MdClose, MdSave, MdShowChart, MdTrendingUp, MdAccessTime, MdCheckCircle, MdError, MdAdd, MdDelete, MdImage, MdLocalOffer } from 'react-icons/md';
import { analyticsService, DailySummaryResponse, TopItem, ForecastItem, HourlyBreakdown } from '../../services/analyticsService';
import { staffService } from '../../services/staffService';
import { promotionService, Promotion } from '../../services/promotionService';

export default function AdminDashboardPage() {
  const navigate = useNavigate();
  const { user, addStaff, getJwtToken } = useAuth();
  const { orders, updateOrderStatusAPI, refreshOrders } = useOrders();
  const { menuItems, categories, updateMenuItem, createMenuItem, deleteMenuItem: deleteMenuItemService, refreshMenuData, toggleAvailability } = useMenu();
  const { tables, refreshTables } = useTables();
  const [activeTab, setActiveTab] = useState<'overview' | 'orders' | 'staff' | 'menu' | 'promotions' | 'analytics'>('overview');

  // Analytics state
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analyticsDates, setAnalyticsDates] = useState({
    start: new Date(new Date().setDate(new Date().getDate() - 7)).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0],
  });
  const [analyticsSummary, setAnalyticsSummary] = useState<DailySummaryResponse | null>(null);
  const [topItems, setTopItems] = useState<TopItem[]>([]);
  const [dailyForecast, setDailyForecast] = useState<ForecastItem[]>([]);
  const [hourlyData, setHourlyData] = useState<HourlyBreakdown[]>([]);

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

  // Staff list state
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [isStaffListLoading, setIsStaffListLoading] = useState(false);
  const [showAddStaffForm, setShowAddStaffForm] = useState(false);
  const [staffFilter, setStaffFilter] = useState<'all' | UserRole>('all');

  const loadStaffData = useCallback(async () => {
    setIsStaffListLoading(true);
    try {
      const jwt = getJwtToken() || undefined;
      const data = await staffService.getAllStaff(jwt);
      setStaffList(data);
    } catch (error) {
      console.error('Failed to load staff:', error);
    } finally {
      setIsStaffListLoading(false);
    }
  }, [getJwtToken]);



  // Promotions State & Logic
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [isPromotionsLoading, setIsPromotionsLoading] = useState(false);
  const [showPromotionModal, setShowPromotionModal] = useState(false);
  const [editingPromotionId, setEditingPromotionId] = useState<number | null>(null);
  const [promotionForm, setPromotionForm] = useState({
    name: '',
    discountType: 'PERCENTAGE' as 'PERCENTAGE' | 'FIXED',
    discountValue: '',
    startAt: '',
    endAt: '',
  });
  const [promotionActionLoading, setPromotionActionLoading] = useState(false);
  const [promotionActionError, setPromotionActionError] = useState<string | null>(null);
  const [promotionActionSuccess, setPromotionActionSuccess] = useState<string | null>(null);

  const loadPromotionsData = useCallback(async () => {
    setIsPromotionsLoading(true);
    try {
      const jwt = getJwtToken() || undefined;
      const data = await promotionService.getAllPromotions(jwt);
      setPromotions(data);
    } catch (error) {
      console.error('Failed to load promotions:', error);
    } finally {
      setIsPromotionsLoading(false);
    }
  }, [getJwtToken]);

  // Load tab data
  useEffect(() => {
    if (activeTab === 'staff') {
      loadStaffData();
    } else if (activeTab === 'promotions') {
      loadPromotionsData();
    }
  }, [activeTab, loadStaffData, loadPromotionsData]);

  const handleOpenPromotionModal = (promotion?: Promotion) => {
    setPromotionActionError(null);
    setPromotionActionSuccess(null);
    if (promotion) {
      setEditingPromotionId(promotion.id);
      setPromotionForm({
        name: promotion.name,
        discountType: promotion.discountType,
        discountValue: promotion.discountValue.toString(),
        startAt: promotion.startAt,
        endAt: promotion.endAt,
      });
    } else {
      setEditingPromotionId(null);
      // Default dates: Start now, end in 7 days
      const now = new Date();
      const end = new Date();
      end.setDate(end.getDate() + 7);

      // ISO string format without timezone (YYYY-MM-DDTHH:mm:ss) to match input type="datetime-local"
      const formatDateForInput = (date: Date) => {
        return date.toISOString().slice(0, 19);
      };

      setPromotionForm({
        name: '',
        discountType: 'PERCENTAGE',
        discountValue: '',
        startAt: formatDateForInput(now),
        endAt: formatDateForInput(end),
      });
    }
    setShowPromotionModal(true);
  };

  const handleClosePromotionModal = () => {
    setShowPromotionModal(false);
    setEditingPromotionId(null);
    setPromotionActionError(null);
    setPromotionActionSuccess(null);
  };

  const handleSavePromotion = async (e: React.FormEvent) => {
    e.preventDefault();
    setPromotionActionLoading(true);
    setPromotionActionError(null);
    setPromotionActionSuccess(null);

    try {
      if (!promotionForm.name || !promotionForm.discountValue || !promotionForm.startAt || !promotionForm.endAt) {
        throw new Error('All fields are required');
      }

      const jwt = getJwtToken() || undefined;
      // Ensure we send valid CreatePromotionRequest / UpdatePromotionRequest payload
      const payload = {
        name: promotionForm.name,
        discountType: promotionForm.discountType,
        discountValue: parseFloat(promotionForm.discountValue),
        startAt: promotionForm.startAt, // Assuming input returns ISO format or close to it
        endAt: promotionForm.endAt,
      };

      if (editingPromotionId) {
        await promotionService.updatePromotion(editingPromotionId, payload, jwt);
        setPromotionActionSuccess('Promotion updated successfully');
      } else {
        await promotionService.createPromotion(payload, jwt);
        setPromotionActionSuccess('Promotion created successfully');
      }

      await loadPromotionsData();

      // Close modal after short delay on success
      setTimeout(() => {
        handleClosePromotionModal();
      }, 1500);
    } catch (error) {
      setPromotionActionError(error instanceof Error ? error.message : 'Failed to save promotion');
    } finally {
      setPromotionActionLoading(false);
    }
  };

  const handleDeletePromotion = async (id: number) => {
    if (!confirm('Are you sure you want to delete this promotion? This action cannot be undone.')) return;

    setPromotionActionLoading(true);
    try {
      const jwt = getJwtToken() || undefined;
      await promotionService.deletePromotion(id, jwt);
      await loadPromotionsData();
    } catch (error) {
      console.error('Delete failed:', error);
      alert('Failed to delete promotion');
    } finally {
      setPromotionActionLoading(false);
    }
  };

  // Refresh data once when the overview tab is first loaded.
  // Context providers already load data on mount, so this is a one-time refresh
  // to ensure freshness when switching back to the overview tab.
  const hasLoadedOverview = useRef(false);
  useEffect(() => {
    if (activeTab === 'overview' && !hasLoadedOverview.current) {
      hasLoadedOverview.current = true;
      refreshOrders();
      refreshMenuData();
      refreshTables();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

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
      available: item.available,
      categories: item.categories,
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
        categoryIds: [parseInt(newMenuForm.category)], // Convert to ID
        price: price,
        available: newMenuForm.available,
        preparationTime: parseInt(newMenuForm.preparationTime) || 15,
        ingredients: [],
        allergens: [],
      };

      formData.append('menuItem', new Blob([JSON.stringify(menuItemData)], { type: 'application/json' }));
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

  const handleDeleteMenuItem = async (itemId: number, itemName: string) => {
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

  const handleToggleAvailability = async (itemId: number, currentStatus: boolean) => {
    try {
      const jwt = getJwtToken();
      if (!jwt) throw new Error('Authentication required');
      await toggleAvailability(itemId, !currentStatus, jwt);
      setMenuActionSuccess(`Status updated successfully!`);
      setTimeout(() => setMenuActionSuccess(null), 3000);
    } catch (error) {
      setMenuActionError(error instanceof Error ? error.message : 'Failed to update status');
      setTimeout(() => setMenuActionError(null), 5000);
    }
  };

  const loadAnalyticsData = useCallback(async () => {
    setAnalyticsLoading(true);
    try {
      const [summary, itemsData, forecastData, hourlyRes] = await Promise.all([
        analyticsService.getSummary(analyticsDates.start, analyticsDates.end),
        analyticsService.getTopItems(),
        analyticsService.getDailyForecast(),
        analyticsService.getHourlyOrders(),
      ]);

      setAnalyticsSummary(summary);
      setTopItems(itemsData.top_items);
      setDailyForecast(forecastData.forecasts);
      setHourlyData(hourlyRes.hourly_data);
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setAnalyticsLoading(false);
    }
  }, [analyticsDates]);

  // Load analytics data
  useEffect(() => {
    if (activeTab === 'analytics') {
      loadAnalyticsData();
    }
  }, [activeTab, loadAnalyticsData]);

  const totalRevenue = orders.reduce((sum, order) => sum + (order.totalAmount ?? order.totalPrice ?? 0), 0);
  const completedOrders = orders.filter((o) => o.status === OrderStatus.SERVED).length;
  const pendingOrders = orders.filter((o) => o.status === OrderStatus.CREATED).length;
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
          {(['overview', 'analytics', 'orders', 'staff', 'menu', 'promotions'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-4 px-2 border-b-2 transition-colors capitalize font-medium flex items-center gap-2 ${activeTab === tab
                ? 'border-brand-primary text-brand-primary'
                : 'border-transparent text-gray-400 hover:text-white'
                }`}
            >
              {tab === 'overview' && <><MdDashboard /> Overview</>}
              {tab === 'analytics' && <><MdShowChart /> Analytics</>}
              {tab === 'orders' && <><MdReceiptLong /> Orders</>}
              {tab === 'staff' && <><MdPeople /> Staff</>}
              {tab === 'menu' && <><MdRestaurant /> Menu</>}
              {tab === 'promotions' && <><MdLocalOffer /> Promotions</>}
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
                    <div key={String(order.id)} className="flex items-center justify-between pb-3 border-b border-brand-border">
                      <div>
                        <p className="font-semibold text-white">{order.customerName || (order.userId ? `User #${order.userId}` : `Table #${order.tableId || '-'}`)}</p>
                        <p className="text-sm text-gray-500">{(order.items || []).length} items</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-white">${(order.totalAmount ?? order.totalPrice ?? 0).toFixed(2)}</p>
                        <p className={`text-xs font-medium ${order.status === OrderStatus.CREATED ? 'text-yellow-400' :
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
                {menuItems.slice(0, 5).map((item) => (
                  <div key={item.id} className="flex items-center justify-between pb-3 border-b border-brand-border">
                    <div className="flex items-center gap-3">
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt={item.name} className="w-10 h-10 object-cover rounded" />
                      ) : (
                        <div className="w-10 h-10 bg-brand-dark flex items-center justify-center rounded">
                          <MdRestaurant className="text-gray-500" />
                        </div>
                      )}
                      <div>
                        <p className="font-semibold text-white">{item.name}</p>
                        <p className="text-sm text-gray-500">${item.price?.toFixed(2) || '0.00'}</p>
                      </div>
                    </div>
                    <p className="font-bold text-brand-primary">{item.categories?.[0]?.name || 'Uncategorized'}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <h2 className="section-title mb-0 flex items-center gap-2">
                <MdShowChart /> Analytics & Insights
              </h2>
              <div className="flex items-center gap-2 bg-brand-darker p-2 rounded-lg border border-brand-border">
                <div className="flex items-center gap-2">
                  <label className="text-xs text-gray-500 font-medium">From</label>
                  <input
                    type="date"
                    value={analyticsDates.start}
                    onChange={(e) => setAnalyticsDates({ ...analyticsDates, start: e.target.value })}
                    className="bg-brand-dark border border-brand-border rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-brand-primary"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-xs text-gray-500 font-medium">To</label>
                  <input
                    type="date"
                    value={analyticsDates.end}
                    onChange={(e) => setAnalyticsDates({ ...analyticsDates, end: e.target.value })}
                    className="bg-brand-dark border border-brand-border rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-brand-primary"
                  />
                </div>
              </div>
            </div>

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
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                  <div className="card">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-gray-400 text-sm font-medium">Daily Revenue</p>
                      <MdTrendingUp className="text-green-400 text-2xl" />
                    </div>
                    <p className="text-4xl font-bold text-brand-primary mb-1">
                      ${analyticsSummary?.daily_summaries[0]?.total_revenue || '0.00'}
                    </p>
                    <p className="text-xs text-gray-500">
                      For {analyticsSummary?.daily_summaries[0]?.date || 'selected date'}
                    </p>
                  </div>
                  <div className="card">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-gray-400 text-sm font-medium">Order Count</p>
                      <MdReceiptLong className="text-blue-400 text-2xl" />
                    </div>
                    <p className="text-4xl font-bold text-white mb-1">
                      {analyticsSummary?.daily_summaries[0]?.order_count || 0}
                    </p>
                    <p className="text-xs text-gray-500">Orders placed</p>
                  </div>
                  <div className="card">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-gray-400 text-sm font-medium">Avg Order Value</p>
                      <MdRestaurant className="text-purple-400 text-2xl" />
                    </div>
                    <p className="text-4xl font-bold text-white mb-1">
                      ${analyticsSummary?.daily_summaries[0]?.average_order_value || '0.00'}
                    </p>
                    <p className="text-xs text-gray-500">Per order average</p>
                  </div>
                </div>

                {/* Top Selling Items */}
                <div className="card mb-8">
                  <h3 className="text-xl font-bold mb-4 text-white flex items-center gap-2">
                    <MdRestaurant /> Top Selling Items
                  </h3>
                  <div className="space-y-3">
                    {topItems.length > 0 ? (
                      topItems.map((item, index) => (
                        <div key={item.item_id} className="flex items-center justify-between pb-3 border-b border-brand-border last:border-0">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-brand-primary/20 rounded-full flex items-center justify-center">
                              <span className="text-brand-primary font-bold text-sm">#{index + 1}</span>
                            </div>
                            <div>
                              <p className="font-semibold text-white">{item.item_name}</p>
                              <p className="text-sm text-gray-500">{item.total_quantity} units sold</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-brand-primary">${Number(item.total_revenue).toFixed(2)}</p>
                            <p className="text-xs text-gray-500">total revenue</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500 text-center py-4">No top items data available</p>
                    )}
                  </div>
                </div>

                {/* Forecasts & Hourly Data */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                  {/* Daily Forecast */}
                  <div className="card">
                    <h3 className="text-xl font-bold mb-4 text-white flex items-center gap-2">
                      <MdTrendingUp /> Daily Revenue Forecast
                    </h3>
                    <div className="space-y-3">
                      {dailyForecast.length > 0 ? (
                        dailyForecast.map((forecast, index) => {
                          const date = new Date(forecast.forecast_date);
                          const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
                          const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

                          return (
                            <div key={index} className="flex items-center justify-between pb-3 border-b border-brand-border last:border-0">
                              <div>
                                <p className="font-semibold text-white">{dayName}, {dateStr}</p>
                                <p className="text-xs text-gray-500">{forecast.forecast_type.replace('_', ' ')}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-lg font-bold text-green-400">
                                  ${Number(forecast.forecast_value).toFixed(2)}
                                </p>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <p className="text-gray-500 text-center py-4">No forecast data available</p>
                      )}
                    </div>
                  </div>

                  {/* Hourly Actual Data */}
                  <div className="card">
                    <h3 className="text-xl font-bold mb-4 text-white flex items-center gap-2">
                      <MdAccessTime /> Hourly Traffic (Actual)
                    </h3>
                    <div className="space-y-4">
                      {hourlyData.length > 0 ? (
                        hourlyData.map((data, index) => {
                          const hour12 = data.hour > 12 ? data.hour - 12 : data.hour === 0 ? 12 : data.hour;
                          const ampm = data.hour >= 12 ? 'PM' : 'AM';
                          const timeStr = `${hour12}:00 ${ampm}`;

                          // Peak hour estimation for visual aid
                          const isPeak = data.order_count > 10;

                          return (
                            <div key={index} className="flex items-center gap-3">
                              <div className="w-20 text-sm text-gray-400">{timeStr}</div>
                              <div className="flex-1 bg-brand-dark rounded-full h-6 overflow-hidden">
                                <div
                                  className={`h-full rounded-full flex items-center justify-end pr-2 transition-all duration-500 ${isPeak ? 'bg-orange-500' : 'bg-blue-600'
                                    }`}
                                  style={{ width: `${Math.min((data.order_count / 30) * 100, 100)}%` }}
                                >
                                  {data.order_count > 0 && (
                                    <span className="text-[10px] font-bold text-white">
                                      {data.order_count}
                                    </span>
                                  )}
                                </div>
                              </div>
                              {data.revenue && (
                                <span className="text-xs text-brand-primary w-16 text-right">${Number(data.revenue).toFixed(0)}</span>
                              )}
                            </div>
                          );
                        })
                      ) : (
                        <p className="text-gray-500 text-center py-4">No hourly data available</p>
                      )}
                    </div>
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
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-border">
                  {orders.map((order) => (
                    <tr key={String(order.id)} className="hover:bg-brand-darker/50 transition-colors">
                      <td className="px-6 py-4 text-sm text-gray-300 font-mono">#{String(order.id).slice(-6)}</td>
                      <td className="px-6 py-4 text-sm text-white">{order.customerName || (order.userId ? `User #${order.userId}` : `Table #${order.tableId || '-'}`)}</td>
                      <td className="px-6 py-4 text-sm text-gray-400">{(order.items || []).length} items</td>
                      <td className="px-6 py-4 text-right text-sm font-semibold text-brand-primary">${(order.totalAmount ?? order.totalPrice ?? 0).toFixed(2)}</td>
                      <td className="px-6 py-4">
                        <select
                          value={order.status}
                          onChange={(e) => updateOrderStatusAPI(String(order.id), e.target.value as OrderStatus)}
                          className="px-3 py-1 bg-brand-darker border border-brand-border rounded-lg text-sm text-white focus:outline-none focus:border-brand-primary"
                        >
                          {Object.values(OrderStatus).map((status) => (
                            <option key={status} value={status}>
                              {status.charAt(0).toUpperCase() + status.slice(1)}
                            </option>
                          ))}
                        </select>
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
            <div className="flex items-center justify-between mb-6">
              <h2 className="section-title mb-0">Staff Management</h2>
              <button
                onClick={() => setShowAddStaffForm(!showAddStaffForm)}
                className="btn-primary flex items-center gap-2"
              >
                {showAddStaffForm ? <><MdClose /> Close Form</> : <><MdAdd /> Add New Staff Member</>}
              </button>
            </div>

            {/* Add Staff Form */}
            {showAddStaffForm && (
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
            )}

            {/* Staff List */}
            <h3 className="text-xl font-bold mb-4 text-white">Current Staff</h3>

            {/* Role Filter */}
            <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
              <button
                onClick={() => setStaffFilter('all')}
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${staffFilter === 'all'
                  ? 'bg-brand-primary text-white'
                  : 'bg-brand-darker border border-brand-border text-gray-400 hover:text-white'
                  }`}
              >
                All Users
              </button>
              <button
                onClick={() => setStaffFilter(UserRole.CUSTOMER)}
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${staffFilter === UserRole.CUSTOMER
                  ? 'bg-brand-primary text-white'
                  : 'bg-brand-darker border border-brand-border text-gray-400 hover:text-white'
                  }`}
              >
                Customers
              </button>
              <button
                onClick={() => setStaffFilter(UserRole.ADMIN)}
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${staffFilter === UserRole.ADMIN
                  ? 'bg-brand-primary text-white'
                  : 'bg-brand-darker border border-brand-border text-gray-400 hover:text-white'
                  }`}
              >
                Admins
              </button>
              <button
                onClick={() => setStaffFilter(UserRole.KITCHEN)}
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${staffFilter === UserRole.KITCHEN
                  ? 'bg-brand-primary text-white'
                  : 'bg-brand-darker border border-brand-border text-gray-400 hover:text-white'
                  }`}
              >
                Kitchen Staff
              </button>
              <button
                onClick={() => setStaffFilter(UserRole.WAITER)}
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${staffFilter === UserRole.WAITER
                  ? 'bg-brand-primary text-white'
                  : 'bg-brand-darker border border-brand-border text-gray-400 hover:text-white'
                  }`}
              >
                Waiters
              </button>
            </div>

            {isStaffListLoading ? (
              <div className="flex items-center justify-center py-10">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary"></div>
              </div>
            ) : (
              <div className="bg-brand-darker border border-brand-border rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-black/20 text-gray-400 text-xs uppercase font-semibold">
                      <tr>
                        <th className="px-6 py-3 text-left">Name</th>
                        <th className="px-6 py-3 text-left">Role</th>
                        <th className="px-6 py-3 text-left">Email</th>
                        <th className="px-6 py-3 text-left">Phone</th>
                        <th className="px-6 py-3 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-brand-border">
                      {staffList
                        .filter(staff => staffFilter === 'all' || staff.role === staffFilter)
                        .length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                            No users found for this filter.
                          </td>
                        </tr>
                      ) : (
                        staffList
                          .filter(staff => staffFilter === 'all' || staff.role === staffFilter)
                          .map((staff) => (
                            <tr key={String(staff.id)} className="hover:bg-white/5 transition-colors">
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full bg-brand-primary/20 flex items-center justify-center text-brand-primary font-bold text-xs">
                                    {(staff.name || staff.profile?.fullName || staff.fullName || '?').charAt(0).toUpperCase()}
                                  </div>
                                  <span className="font-medium text-white">{staff.name || staff.profile?.fullName || staff.fullName || 'No Name'}</span>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${staff.role === UserRole.ADMIN ? 'bg-purple-900/30 text-purple-400 border border-purple-700/50' :
                                  staff.role === UserRole.KITCHEN ? 'bg-orange-900/30 text-orange-400 border border-orange-700/50' :
                                    staff.role === UserRole.WAITER ? 'bg-blue-900/30 text-blue-400 border border-blue-700/50' :
                                      'bg-gray-800 text-gray-400 border border-gray-700'
                                  }`}>
                                  {staff.role === UserRole.ADMIN ? 'Admin' :
                                    staff.role === UserRole.KITCHEN ? 'Kitchen' :
                                      staff.role === UserRole.WAITER ? 'Waiter' :
                                        'Customer'}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-400">
                                {staff.email}
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-400 font-mono">
                                {staff.phone || staff.profile?.phone || '-'}
                              </td>
                              <td className="px-6 py-4 text-center">
                                {staff.status && (
                                  <span className={`px-2 py-1 rounded text-xs font-medium capitalize border ${String(staff.status).toLowerCase() === 'active' ? 'bg-green-900/20 text-green-400 border-green-900' :
                                    String(staff.status).toLowerCase() === 'inactive' ? 'bg-red-900/20 text-red-400 border-red-900' :
                                      'bg-yellow-900/20 text-yellow-400 border-yellow-900'
                                    }`}>
                                    {staff.status}
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
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
                  <div className="h-40 bg-brand-dark flex items-center justify-center mb-3 rounded-lg overflow-hidden">
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      <MdRestaurant className="text-5xl text-gray-500" />
                    )}
                  </div>
                  <p className="text-lg font-bold text-white mb-1">{item.name}</p>
                  <p className="text-sm text-gray-400 mb-1">{item.categories?.map(c => c.name).join(', ') || 'No Category'}</p>
                  <p className="text-sm text-gray-500 mb-3 line-clamp-2">{item.description}</p>
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-2xl font-bold text-brand-primary">${item.price?.toFixed(2) || '0.00'}</p>
                    <button
                      onClick={() => handleToggleAvailability(item.id, item.available ?? item.isActive)}
                      className={`px-3 py-1 rounded-full text-xs font-semibold transition-all hover:scale-105 ${(item.available ?? item.isActive)
                        ? 'bg-green-600/20 text-green-400 border border-green-600/50 hover:bg-green-600/30'
                        : 'bg-red-600/20 text-red-400 border border-red-600/50 hover:bg-red-600/30'
                        }`}
                    >
                      {(item.available ?? item.isActive) ? 'Available' : 'Out of Stock'}
                    </button>
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

        {/* Promotions Tab */}
        {activeTab === 'promotions' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="section-title mb-0">Promotions Management</h2>
              <button
                onClick={() => handleOpenPromotionModal()}
                className="btn-primary flex items-center gap-2"
              >
                <MdAdd className="text-xl" /> Create Promotion
              </button>
            </div>

            {isPromotionsLoading ? (
              <div className="flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary"></div>
              </div>
            ) : promotions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 bg-brand-darker border border-brand-border rounded-lg">
                <MdLocalOffer className="text-6xl text-gray-600 mb-4" />
                <p className="text-gray-400 text-lg">No active promotions</p>
                <button onClick={() => handleOpenPromotionModal()} className="mt-4 text-brand-primary hover:underline">
                  Create your first promotion
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {promotions.map((promo) => {
                  const isActive = new Date() >= new Date(promo.startAt) && new Date() <= new Date(promo.endAt);
                  return (
                    <div key={promo.id} className={`card relative border-l-4 ${isActive ? 'border-l-green-500' : 'border-l-gray-600'}`}>
                      <div className="absolute top-4 right-4 flex gap-2">
                        <button
                          onClick={() => handleOpenPromotionModal(promo)}
                          className="p-1.5 bg-brand-dark hover:bg-black rounded-lg text-gray-400 hover:text-white transition-colors border border-brand-border"
                        >
                          <MdEdit />
                        </button>
                        <button
                          onClick={() => handleDeletePromotion(promo.id)}
                          className="p-1.5 bg-brand-dark hover:bg-black rounded-lg text-red-400 hover:text-red-300 transition-colors border border-brand-border"
                        >
                          <MdDelete />
                        </button>
                      </div>
                      <h3 className="text-xl font-bold text-white mb-1 pr-16">{promo.name}</h3>
                      <div className="flex items-baseline gap-1 mb-4">
                        <span className="text-2xl font-bold text-brand-primary">
                          {promo.discountType === 'PERCENTAGE' ? `${promo.discountValue}%` : `$${promo.discountValue}`}
                        </span>
                        <span className="text-sm text-gray-400">OFF</span>
                      </div>

                      <div className="space-y-2 text-sm text-gray-400">
                        <div className="flex justify-between">
                          <span>Start:</span>
                          <span className="text-white">{new Date(promo.startAt).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>End:</span>
                          <span className="text-white">{new Date(promo.endAt).toLocaleString()}</span>
                        </div>
                        <div className="pt-2 border-t border-brand-border mt-2 flex justify-between items-center">
                          <span className="font-medium">Status:</span>
                          <span className={`px-2 py-0.5 rounded text-xs font-bold ${isActive
                            ? 'bg-green-900/30 text-green-400 border border-green-800'
                            : 'bg-gray-800 text-gray-400 border border-gray-700'}`}>
                            {isActive ? 'ACTIVE' : 'INACTIVE'}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Promotion Modal */}
        {showPromotionModal && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-brand-darker border border-brand-border rounded-lg max-w-lg w-full p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white">
                  {editingPromotionId ? 'Edit Promotion' : 'Create New Promotion'}
                </h3>
                <button onClick={handleClosePromotionModal} className="p-2 text-gray-400 hover:text-white rounded-lg transition-colors">
                  <MdClose className="text-xl" />
                </button>
              </div>

              {promotionActionSuccess && (
                <div className="mb-4 p-3 bg-green-900/30 border border-green-700 rounded-lg text-green-300 text-sm flex items-center gap-2">
                  <MdCheckCircle /> {promotionActionSuccess}
                </div>
              )}
              {promotionActionError && (
                <div className="mb-4 p-3 bg-red-900/30 border border-red-700 rounded-lg text-red-300 text-sm flex items-center gap-2">
                  <MdError /> {promotionActionError}
                </div>
              )}

              <form onSubmit={handleSavePromotion} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Promotion Name</label>
                  <input
                    type="text"
                    value={promotionForm.name}
                    onChange={(e) => setPromotionForm({ ...promotionForm, name: e.target.value })}
                    className="w-full px-4 py-2 bg-brand-dark border border-brand-border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-brand-primary"
                    placeholder="e.g. Summer Sale"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Discount Type</label>
                    <select
                      value={promotionForm.discountType}
                      onChange={(e) => setPromotionForm({ ...promotionForm, discountType: e.target.value as 'PERCENTAGE' | 'FIXED' })}
                      className="w-full px-4 py-2 bg-brand-dark border border-brand-border rounded-lg text-white focus:outline-none focus:border-brand-primary"
                    >
                      <option value="PERCENTAGE">Percentage (%)</option>
                      <option value="FIXED">Fixed Amount ($)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Value</label>
                    <input
                      type="number"
                      step="0.01"
                      value={promotionForm.discountValue}
                      onChange={(e) => setPromotionForm({ ...promotionForm, discountValue: e.target.value })}
                      className="w-full px-4 py-2 bg-brand-dark border border-brand-border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-brand-primary"
                      placeholder="20.00"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Start Date & Time</label>
                    <input
                      type="datetime-local"
                      value={promotionForm.startAt}
                      onChange={(e) => setPromotionForm({ ...promotionForm, startAt: e.target.value })}
                      className="w-full px-4 py-2 bg-brand-dark border border-brand-border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-brand-primary [color-scheme:dark]"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">End Date & Time</label>
                    <input
                      type="datetime-local"
                      value={promotionForm.endAt}
                      onChange={(e) => setPromotionForm({ ...promotionForm, endAt: e.target.value })}
                      className="w-full px-4 py-2 bg-brand-dark border border-brand-border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-brand-primary [color-scheme:dark]"
                      required
                    />
                  </div>
                </div>

                <div className="pt-4 flex gap-4">
                  <button
                    type="button"
                    onClick={handleClosePromotionModal}
                    disabled={promotionActionLoading}
                    className="flex-1 py-3 bg-brand-dark hover:bg-black border border-brand-border text-gray-300 rounded-lg font-semibold transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={promotionActionLoading}
                    className="flex-1 py-3 bg-brand-primary hover:bg-orange-600 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {promotionActionLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                        Saving...
                      </>
                    ) : (
                      <>
                        <MdSave /> Save Promotion
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* Staff Edit Modal */}
      {
        editingStaff && (
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
                  <p className="text-lg font-semibold text-white mb-1">{editingStaff.name || editingStaff.profile?.fullName || 'No Name'}</p>
                  <p className="text-sm text-gray-400">{editingStaff.email}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Status *</label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleUpdateStaffStatus(editingStaff.id, 'active')}
                      className={`flex-1 py-2 px-4 rounded-lg font-semibold transition-colors ${editingStaff.status === 'active'
                        ? 'bg-green-900/50 border-2 border-green-600 text-green-300'
                        : 'bg-brand-dark border border-brand-border text-gray-400 hover:border-green-600'
                        }`}
                    >
                      Active
                    </button>
                    <button
                      onClick={() => handleUpdateStaffStatus(editingStaff.id, 'inactive')}
                      className={`flex-1 py-2 px-4 rounded-lg font-semibold transition-colors ${editingStaff.status === 'inactive'
                        ? 'bg-gray-900/50 border-2 border-gray-600 text-gray-300'
                        : 'bg-brand-dark border border-brand-border text-gray-400 hover:border-gray-600'
                        }`}
                    >
                      Inactive
                    </button>
                    <button
                      onClick={() => handleUpdateStaffStatus(editingStaff.id, 'on-break')}
                      className={`flex-1 py-2 px-4 rounded-lg font-semibold transition-colors ${editingStaff.status === 'on-break'
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
        )
      }

      {/* Menu Edit Modal */}
      {
        editingMenuItem && (
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
                      value={menuEditForm.categories?.[0]?.id || ''}
                      onChange={(e) => {
                        const catId = parseInt(e.target.value);
                        const cat = categories.find(c => c.id === catId);
                        if (cat) handleMenuEditChange('categories', [cat]);
                      }}
                      className="w-full px-4 py-2 bg-brand-dark border border-brand-border rounded-lg text-white focus:outline-none focus:border-brand-primary"
                    >
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Availability *</label>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleMenuEditChange('available', true)}
                        className={`flex-1 py-2 px-4 rounded-lg font-semibold transition-colors ${menuEditForm.available
                          ? 'bg-green-900/50 border-2 border-green-600 text-green-300'
                          : 'bg-brand-dark border border-brand-border text-gray-400 hover:border-green-600'
                          }`}
                      >
                        Available
                      </button>
                      <button
                        onClick={() => handleMenuEditChange('available', false)}
                        className={`flex-1 py-2 px-4 rounded-lg font-semibold transition-colors ${!menuEditForm.available
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
        )
      }

      {/* Add Menu Item Modal */}
      {
        showAddMenuModal && (
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
                      <option value="">Select a category</option>
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
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
                      className={`flex-1 py-2 px-4 rounded-lg font-semibold transition-colors disabled:opacity-50 ${newMenuForm.available
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
                      className={`flex-1 py-2 px-4 rounded-lg font-semibold transition-colors disabled:opacity-50 ${!newMenuForm.available
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
        )
      }
    </div>
  );
}

