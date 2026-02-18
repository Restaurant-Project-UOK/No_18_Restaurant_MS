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

export interface MenuCategory {
  id: number;
  name: string;
  description?: string;
  sortOrder?: number;
}

export interface MenuItem {
  id: number;
  name: string;
  description: string;
  price: number;
  imageUrl?: string;
  /** Backend field: isActive (not `available`) */
  isActive: boolean;
  /** Kept for backward compat — maps to isActive */
  available?: boolean;
  categories: MenuCategory[];
  createdAt?: string;
  updatedAt?: string;
}

// ============================================
// ORDERS
// ============================================

export interface OrderItem {
  id: string;
  /** Backend field name: itemId */
  itemId: number;
  /** Backend field name: itemName */
  itemName: string;
  quantity: number;
  /** Backend field name: unitPrice */
  unitPrice: number;
  // Legacy aliases kept for backward compat
  menuItemId?: number;
  menuItem?: { name: string };
  specialRequests?: string;
  price?: number;
}

/**
 * OrderStatus enum — matches backend Order.OrderStatus exactly.
 * Values: CREATED → CONFIRMED → PREPARING → READY → SERVED
 */
export enum OrderStatus {
  CREATED = 'CREATED',
  CONFIRMED = 'CONFIRMED',
  PREPARING = 'PREPARING',
  READY = 'READY',
  SERVED = 'SERVED',
}

export interface Order {
  /** Backend field: id (Long) */
  id: string;
  /** Backend field: tableId (Long) — replaces tableNumber */
  tableId: number;
  /** Backend field: userId (Long) */
  userId?: number;
  status: OrderStatus;
  /** Backend field: totalAmount (BigDecimal) — replaces totalPrice */
  totalAmount: number;
  /** Backend field: createdAt (LocalDateTime) — replaces orderTime */
  createdAt: string;
  items: OrderItem[];

  // Legacy aliases kept for backward compat with existing UI components
  tableNumber?: number;
  totalPrice?: number;
  orderTime?: string;
  customerName?: string;
  customerId?: string;
  notes?: string;
  isPaid?: boolean;
  paymentMethod?: 'cash' | 'card' | 'digital';
  estimatedTime?: string;
  completedTime?: string;
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
