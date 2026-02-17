// ============================================
// USER & AUTHENTICATION
// ============================================

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  role: UserRole;
  password?: string;
  createdAt: string;
}

export enum UserRole {
  CUSTOMER = 1,
  ADMIN = 2,
  KITCHEN = 3,
  WAITER = 4,
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

// ============================================
// MENU & PRODUCTS
// ============================================

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  image: string;
  available: boolean;
  preparationTime: number; // in minutes
  ingredients?: string[];
  allergens?: string[];
}

export interface MenuCategory {
  id: string;
  name: string;
  description?: string;
  icon?: string;
}

// ============================================
// ORDERS
// ============================================

export interface OrderItem {
  id: string;
  menuItemId: string;
  menuItem: MenuItem;
  quantity: number;
  specialRequests?: string;
  price: number;
}

export enum OrderStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  PREPARING = 'preparing',
  READY = 'ready',
  SERVED = 'served',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export interface Order {
  id: string;
  customerId: string;
  customerName: string;
  items: OrderItem[];
  status: OrderStatus;
  totalPrice: number;
  tableNumber?: number;
  orderTime: string;
  estimatedTime?: string;
  completedTime?: string;
  notes?: string;
  paymentMethod?: 'cash' | 'card' | 'digital';
  isPaid: boolean;
}

// ============================================
// TABLES & RESTAURANTS
// ============================================

export interface Table {
  id: string;
  tableNumber: number;
  capacity: number;
  status: TableStatus;
  currentOrderId?: string;
  occupiedAt?: string;
}

export enum TableStatus {
  AVAILABLE = 'available',
  OCCUPIED = 'occupied',
  RESERVED = 'reserved',
  CLEANING = 'cleaning',
}

// ============================================
// STAFF & KITCHEN
// ============================================

export interface Staff {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone: string;
  shiftStart?: string;
  shiftEnd?: string;
  status: 'active' | 'inactive' | 'on-break';
}

export interface KitchenTicket {
  id: string;
  orderId: string;
  items: OrderItem[];
  status: OrderStatus;
  startTime: string;
  completedTime?: string;
  priority: 'normal' | 'urgent';
}

// ============================================
// INVENTORY
// ============================================

export interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  reorderLevel: number;
  supplier: string;
  lastRestocked: string;
}

// ============================================
// ANALYTICS & REPORTS
// ============================================

export interface SalesReport {
  date: string;
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  topItems: MenuItem[];
}

export interface StaffStats {
  staffId: string;
  staffName: string;
  totalOrders: number;
  rating: number;
  shift: string;
}
