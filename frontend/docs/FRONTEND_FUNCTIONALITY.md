# Frontend Functionality Guide

**Last Updated:** February 17, 2026

## Table of Contents

1. [Project Overview](#project-overview)
2. [Architecture & Tech Stack](#architecture--tech-stack)
3. [Authentication & Authorization](#authentication--authorization)
4. [Role-Based Access Control & Flow](#role-based-access-control--flow)
5. [Feature Documentation by Role](#feature-documentation-by-role)
6. [How to Link Buttons & Navigation](#how-to-link-buttons--navigation)
7. [Component Documentation](#component-documentation)
8. [API Integration](#api-integration)
9. [State Management](#state-management)
10. [Authentication Flow](#authentication-flow)
11. [Routing Structure](#routing-structure)
12. [Testing & Credentials](#testing--credentials)
13. [Development Environment Setup](#development-environment-setup)

---

## Project Overview

This is a **Restaurant Management System Frontend** - a comprehensive React-based application that manages the complete restaurant workflow including orders, inventory, staff management, customer interactions, and kitchen operations.

### Key Features at a Glance

- **Multi-Role System**: Customer, Admin, Kitchen Staff, Waiter
- **QR Code Integration**: Customers scan table QR to access menu
- **Real-time Order Management**: From placement to delivery
- **Inventory Tracking**: Stock management with reorder alerts
- **Staff Management**: Create and manage kitchen/waiter accounts
- **Analytics & Reporting**: Sales insights and order tracking
- **Mock API Backend**: Full mock data for testing without backend
- **Type-Safe**: Full TypeScript support throughout

---

## Architecture & Tech Stack

### Technology Stack

```
Frontend Framework:  React 18.2
Language:           TypeScript 5.9
Build Tool:         Vite 7.3
CSS Framework:      Tailwind CSS 3.4
Styling:            Custom CSS + Tailwind
Routing:            React Router v7
State Management:   Context API + React Hooks
HTTP Client:        Fetch API
Icons:              React Icons 5.5
QR Code:            QRCode.React 4.2
```

### Project Structure

```
src/
├── api/                    # API functions (auth, menu, orders)
│   ├── auth.ts            # Authentication endpoints
│   ├── menu.ts            # Menu & category endpoints
│   └── orders.ts          # Order management endpoints
│
├── components/            # Reusable UI components
│   ├── Button/            # Styled button component
│   ├── Card/              # Card wrapper component
│   ├── Modal/             # Reusable modal dialog
│   ├── Header/            # Top navigation header
│   ├── Layout/            # Main page layout wrapper
│   ├── Cart/              # Shopping cart component
│   ├── LoadingSpinner/    # Loading indicator
│   ├── MenuCard/          # Menu item display
│   ├── TableSelector/     # Table selection UI
│   ├── OrderCard/         # Order display card
│   ├── OrderStatusFilter/ # Status filter component
│   ├── ProtectedRoute.tsx # Auth guard component
│   ├── RoleBasedRoute.tsx # Role guard component
│   ├── CustomerProtectedRoute.tsx # Customer-specific guard
│   └── ErrorBoundary.tsx  # Error handling
│
├── config/                # Configuration
│   ├── api.ts            # API configuration
│   └── routes.ts         # Route definitions
│
├── constants/             # Type-safe constants
│   ├── roles.ts          # Role definitions & helpers
│   ├── orderStatus.ts    # Order status constants
│   ├── storage.ts        # Storage key constants
│   └── index.ts          # Barrel exports
│
├── context/              # React Context providers
│   ├── AuthContext.tsx   # Authentication state
│   ├── CartContext.tsx   # Shopping cart state
│   └── types.ts          # Context type definitions
│
├── hooks/                # Custom React hooks
│   ├── useAuth.ts       # Access auth context
│   ├── useCart.ts       # Access cart context
│   └── useRole.ts       # Access role information
│
├── pages/                # Page components by role
│   ├── auth/            # Login, Register, Profile
│   ├── customer/        # Customer-specific pages
│   ├── admin/           # Admin management pages
│   ├── kitchen/         # Kitchen display pages
│   ├── waiter/          # Waiter service pages
│   ├── menu/            # Shared menu pages
│   ├── order/           # Shared order pages
│   └── errors/          # Error pages (404, 401)
│
├── services/            # Business logic & mock data
│   ├── mockDataGenerator.ts    # Generate mock data
│   ├── mockApiDelayer.ts       # Add delay to mock API
│   └── mockApi.ts              # Mock API implementations
│
├── types/               # TypeScript type definitions
│   └── index.ts         # All type interfaces
│
├── utils/               # Utility functions
│   ├── api.ts           # API helpers
│   ├── config.ts        # Configuration utilities
│   ├── cookies.ts       # Cookie management
│   ├── jwt.ts           # JWT token utilities
│   ├── menuHelpers.ts   # Menu-related utilities
│   └── orderHelpers.ts  # Order-related utilities
│
├── App.tsx              # Main app component with routing
├── main.tsx             # Application entry point
└── App.css              # Global styles
```

---

## Authentication & Authorization

### JWT Token Management

The application uses JWT tokens stored in localStorage for authentication:

```typescript
// Storage Keys
- accessToken: Main authentication token
- refreshToken: Token refresh mechanism

// Token Storage Location
localStorage tokens persist across browser sessions
```

### Token Management Utilities

Located in `src/utils/jwt.ts`, provides:

- `getAccessToken()` - Retrieve access token
- `setAccessToken(token)` - Store access token
- `getRefreshToken()` - Retrieve refresh token
- `setRefreshToken(token)` - Store refresh token
- `clearTokens()` - Clear both tokens on logout
- `isAuthenticated()` - Check if user is logged in
- `decodeToken(token)` - Decode JWT payload (client-side only)
- `isTokenExpired(token)` - Check token expiration

### Table ID Management

For customers, a `tableId` is captured from QR code scans:

```typescript
// Storage Locations for Table ID
1. URL Parameter: ?tableId=5 (highest priority)
2. Cookie: tableId (5-hour expiration)
3. localStorage: STORAGE_KEYS.TABLE_NUMBER (fallback)

// Automatic Management
- AuthContext captures tableId from URL on login
- Cookie is set with 5-hour expiration
- Available via useAuth().tableId hook
- setTableId() for manual updates
```

---

## Role-Based Access Control & Flow

### Role Definitions

The system has 4 distinct roles, each with specific permissions and workflows:

```typescript
// Role IDs (from constants/roles.ts)
UserRole.CUSTOMER = 1    // Restaurant customers
UserRole.ADMIN = 2       // System administrators
UserRole.KITCHEN = 3     // Kitchen staff
UserRole.WAITER = 4      // Table service staff
```

### Role Information Display

```typescript
// Get role name
getRoleName(role) → "Customer" | "Admin" | "Kitchen Staff" | "Waiter"

// Get default redirect path
getRolePath(role) → "/customer" | "/admin" | "/kitchen" | "/waiter"

// Check if user has role
hasRole(userRole, requiredRoles) → boolean
```

### Complete Role Flow Diagram

```
LOGIN PAGE (/login)
    ↓
    ├─→ [CUSTOMER (Role 1)]
    │    ├─→ Scan QR Code (?tableId=5)
    │    ├─→ Access /menu (browse & order)
    │    ├─→ View /orders (order history)
    │    └─→ View /profile
    │
    ├─→ [ADMIN (Role 2)]
    │    ├─→ /admin (Dashboard)
    │    ├─→ /admin/staff (Staff Management)
    │    ├─→ /admin/customers (Customer Management)
    │    ├─→ /admin/menu (Menu Management)
    │    ├─→ /admin/inventory (Inventory Tracking)
    │    ├─→ /admin/orders (Order Overview)
    │    ├─→ /admin/analytics (Analytics & Reports)
    │    └─→ /admin/cashier (Cash Transactions)
    │
    ├─→ [KITCHEN (Role 3)]
    │    └─→ /kitchen (Kitchen Display System)
    │        ├─→ View active orders
    │        ├─→ Update order status
    │        └─→ View order details
    │
    └─→ [WAITER (Role 4)]
         ├─→ /waiter (Dashboard)
         ├─→ /waiter/proxy-order (Take Orders)
         ├─→ /waiter/serve (Serve Orders)
         └─→ /waiter/tables (Table Status)
```

### Route Protection System

#### Three-Layer Protection

**1. ProtectedRoute** - Basic Authentication
```tsx
// Wraps routes that require ANY authentication
<Route path="/menu" element={
  <ProtectedRoute>
    <MenuPage />
  </ProtectedRoute>
} />

// Redirects to /login if not authenticated
// Only checks: is user logged in?
```

**2. RoleBasedRoute** - Role-Specific Access
```tsx
// Wraps routes that require SPECIFIC roles
<Route path="/admin/dashboard" element={
  <RoleBasedRoute requiredRoles={[2]}>
    <AdminDashboard />
  </RoleBasedRoute>
} />

// Checks: is user logged in AND has required role?
// Redirects to role-specific dashboard if not authorized
```

**3. CustomerProtectedRoute** - Requires TableId
```tsx
// Wraps routes that need table identification
<Route path="/checkout" element={
  <CustomerProtectedRoute>
    <CheckoutPage />
  </CustomerProtectedRoute>
} />

// Checks: is customer authenticated AND has tableId?
// Redirects to QR scanner if tableId missing
```

### Role Flow Implementation Details

#### Customer Role Flow (Role 1)

```
1. LOGIN → enters email & password
   ↓
2. AUTHENTICATION
   - API call: login(email, password)
   - Tokens stored in localStorage
   - User profile fetched
   ↓
3. QR SCAN CHECK
   - If tableId in URL: captured automatically
   - If no tableId: redirect to /qr-scan
   - Show "Scan QR Code" warning in header
   ↓
4. ACCESS MENU
   - Can access /menu (protected)
   - Can view categories & items
   - Can search & filter menu
   - Can add items to cart
   ↓
5. CHECKOUT
   - Requires tableId (via CustomerProtectedRoute)
   - Review order with items & total
   - Place order (POST to /orders)
   ↓
6. VIEW ORDERS
   - /orders (order history)
   - /orders/:orderId (order tracking)
   - See status, items, and total
   ↓
7. LOGOUT
   - Tokens cleared from localStorage
   - Redirect to /login
```

**Key Features:**
- Can only access own orders
- TableId persists via cookie (5 hours) + localStorage
- Shopping cart stored locally (survives refresh)
- Real-time order status tracking

#### Admin Role Flow (Role 2)

```
1. LOGIN → enters credentials
   ↓
2. DASHBOARD (/admin)
   - Quick stats (orders, revenue, staff)
   - Link to all management modules
   ↓
3. STAFF MANAGEMENT (/admin/staff)
   - View all staff (kitchen, waiter)
   - Create new staff account
   - Edit staff details
   - Delete staff member
   ↓
4. CUSTOMER MANAGEMENT (/admin/customers)
   - View all customers
   - Search customers
   - Filter by status (Active/Inactive/Blocked)
   - Update customer status
   ↓
5. MENU MANAGEMENT (/admin/menu)
   - List all menu items
   - Create new item
   - Edit item (name, price, description)
   - Delete item
   - Upload images
   ↓
6. CATEGORY MANAGEMENT (/admin/categories)
   - View all categories
   - Create category
   - Edit category
   - Delete category
   ↓
7. INVENTORY MANAGEMENT (/admin/inventory)
   - View stock levels for all items
   - Set reorder levels
   - Create restock orders
   - Track inventory history
   ↓
8. ORDER OVERVIEW (/admin/orders)
   - View all orders (system-wide)
   - Filter by status
   - Filter by date range
   - View order details
   - Update order status
   ↓
9. ANALYTICS (/admin/analytics)
   - Sales reports
   - Order trends
   - Revenue insights
   - Popular items
   ↓
10. CASH MANAGEMENT (/admin/cashier)
    - Receive cash from waiters
    - Scan waiter QR code
    - Record cash amount
    - Transaction history
```

**Key Features:**
- Full CRUD operations on menus, staff, customers
- Real-time dashboard with stats
- Inventory tracking with alerts
- Order monitoring across entire system
- Financial reporting

#### Kitchen Role Flow (Role 3)

```
1. LOGIN → enters credentials
   ↓
2. KITCHEN DISPLAY SYSTEM (/kitchen)
   - Auto-refresh view of active orders
   - Display: 
     * Order ID
     * Table number
     * Items with quantities
     * Special instructions
     * Order placed time
   ↓
3. ORDER MANAGEMENT
   - View orders in "PLACED" status
   - Update order status → "PREPARING"
   - Update order status → "READY"
   - Orders sorted by priority (oldest first)
   ↓
4. ORDER DETAILS
   - Click to see full order details
   - View all items in order
   - See portion sizes
   - See dietary requirements
   ↓
5. READY FOR PICKUP
   - Kitchen marks order as "READY"
   - System notifies waiter
   - Order moves to waiter's "serve" view
   ↓
6. WORKFLOW
   - New Orders arrive → PLACED status
   - Start cooking → Update to PREPARING
   - Done → Update to READY
   - Repeat for next order
```

**Key Features:**
- Real-time order queue
- Display optimized for kitchen staff
- Status tracking from order placement to ready
- Special instructions visible
- Automatic order priority management

#### Waiter Role Flow (Role 4)

```
1. LOGIN → enters credentials
   ↓
2. WAITER DASHBOARD (/waiter)
   - Quick access to main tasks
   - View active tables
   - See available options
   ↓
3. PROXY ORDER (/waiter/proxy-order)
   - Select table (filter shows only available tables)
   - Enter customer name
   - Browse menu (same as customer)
   - Add items to cart
   - Place order on behalf of customer
   - Collect cash payment
   - Record payment received
   ↓
4. CASH MANAGEMENT
   - After collecting cash from table
   - Record amount collected
   - Print receipt or note
   - Hand cash to admin/cashier
   ↓
5. SERVE ORDERS (/waiter/serve)
   - View only READY orders
   - Filter options:
     * Show all ready orders
     * Filter by table
     * Filter by status
   - Click "Mark as Served" when delivered
   - Order moves to SERVED status
   ↓
6. TABLE STATUS (/waiter/tables)
   - View all tables
   - See each table status:
     * Available (empty)
     * Occupied (has active order)
     * Finished (ready for cleanup)
   - Manage table assignments
   ↓
7. WORKFLOW
   - Customer calls for order → Proxy Order
   - Provide QR code to scan (if available)
   - Kitchen prepares → shows in Serve Orders
   - Deliver order → Mark as Served
   - Collect payment → Give to cashier
   - Table cleanup → Mark available
```

**Key Features:**
- Place orders on behalf of customers
- Cash payment handling
- Real-time available table checking
- Prevent double-booking
- Order delivery tracking

---

## Feature Documentation by Role

### Customer Features (Role 1)

#### 1. Authentication (Pages: /login, /register)

**Login Page Features:**
- Email address input
- Password input
- "Forgot password" button (placeholder)
- Submit button with loading state
- Error message display
- Link to registration page
- Test credentials display

**Registration Page Features:**
- Full name input
- Email input
- Password input
- Phone number input
- Submit button
- Link back to login

**Logic Flow:**
```javascript
1. User enters credentials
2. API call to login() function
3. JWT tokens stored if successful
4. User profile fetched via refreshUser()
5. Determine redirect based on role:
   - Customer: Check tableId → /menu or /qr-scan
   - Admin: Redirect to /admin
   - Kitchen: Redirect to /kitchen
   - Waiter: Redirect to /waiter
```

#### 2. QR Code Scanning (/qr-scan)

**How it Works:**
```
Restaurant displays QR code with URL:
→ http://localhost:5173/?tableId=5

Customer scans QR
↓
Browser opens with query parameter
↓
AuthContext captures tableId: 5
↓
Stored in: Cookie + localStorage
↓
User redirected to /menu
↓
Header shows "Table 5"
↓
Can now place orders
```

**In-App URL Redirect:**
```typescript
// Root redirect component handles:
const redirectPath = isAuthenticated 
  ? getRoleBasedPath(user?.role) 
  : '/login';

// getRoleBasedPath checks role:
switch (role) {
  case 1: return '/menu';      // Customer
  case 2: return '/admin';     // Admin
  case 3: return '/kitchen';   // Kitchen
  case 4: return '/waiter';    // Waiter
}
```

#### 3. Menu Browsing (/menu)

**Features:**
- Browse all menu items
- Search by item name or description
- Filter by category (Appetizers, Mains, Desserts, Beverages)
- View item details:
  - Image
  - Name
  - Description
  - Price
  - Dietary tags (if available)
  - Allergen information
- Add items to cart
- Quantity selection
- Add special notes/instructions

**Component:** [MenuCard](../src/components/MenuCard.tsx)

**API Used:**
```typescript
// Get categories
getCategories() → Promise<Category[]>

// Get menu items (optionally filtered)
getMenuItems(categoryId?) → Promise<MenuItem[]>

// Get single item details
getMenuItem(itemId) → Promise<MenuItem>
```

**Cart Management:**
```typescript
// Managed via CartContext hook
const { addItem, removeItem, itemCount, totalAmount } = useCart();

// Add to cart
addItem(menuItem, quantity, notes)

// Remove from cart
removeItem(itemId, notes)

// Update quantity
updateQuantity(itemId, newQuantity)
```

#### 4. Shopping Cart (/cart - sidebar)

**Features:**
- Show all items in cart
- Display quantity for each item
- Show special notes
- Real-time total calculation
- Update quantity (increase/decrease)
- Remove item option
- "Proceed to Checkout" button
- Cart persists via localStorage

**Component:** [CartContext](../src/context/CartContext.tsx)

**Storage:**
```typescript
// Cart stored in localStorage under key:
STORAGE_KEYS.CART = 'cart'

// Structure:
[
  {
    id: 1,
    name: "Burger",
    price: 12.99,
    quantity: 2,
    notes: "No onions"
  },
  ...
]
```

#### 5. Checkout (/checkout)

**Requirements:**
- Must have tableId (QR code scanned)
- Must have items in cart
- Requires CustomerProtectedRoute guard

**Features:**
- Display order summary
- Show all items with quantities
- Show special notes for each item
- Calculate and show total
- Confirm order placement
- Show success message
- Provide order ID
- Show estimated prep time

**API Used:**
```typescript
placeOrder(customerId, {
  tableId: string,
  items: [
    { menuItemId, quantity, notes }
  ]
}) → Promise<PlaceOrderResponse>
```

**Response:**
```typescript
{
  orderId: "ORD-00001",
  status: "PLACED",
  totalAmount: 45.99,
  estimatedTime: 18  // minutes
}
```

#### 6. Order History (/orders)

**Features:**
- View all customer's orders (past and present)
- Display order list with:
  - Order ID
  - Items count
  - Total amount
  - Order status (badge with color)
  - Order date/time
- Click to view order details
- Filter by status (optional)

**Component:** [OrderCard](../src/components/OrderCard.tsx)

**API Used:**
```typescript
getOrdersByCustomer(customerId) → Promise<Order[]>
```

#### 7. Order Tracking (/orders/:orderId)

**Features:**
- View specific order details
- Show all items with quantities
- Display total amount
- Show order status with timeline
- See estimated prep time
- View order placed time
- See last update time

**Timeline Statuses:**
```
PLACED → PREPARING → READY → SERVED → COMPLETED → PAID
```

**API Used:**
```typescript
getOrderById(orderId) → Promise<Order>
```

#### 8. User Profile (/profile)

**Features:**
- Display user information:
  - Full name
  - Email address
  - Phone number
  - Account creation date
- Edit profile modal
- Change password option (placeholder)
- Logout button

**API Used:**
```typescript
getProfile() → Promise<UserProfile>
```

#### 9. Bottom Navigation (Customer Only)

**Quick Access to:**
- Menu (/menu)
- Orders (/orders)
- Profile (/profile)
- Cart (toggle visibility)

**Component:** [CustomerBottomNav](../src/components/CustomerBottomNav/CustomerBottomNav.tsx)

---

### Admin Features (Role 2)

#### 1. Admin Dashboard (/admin)

**Quick Stats Cards:**
- **Active Orders**: Count of orders in PLACED/PREPARING/READY status
- **Staff Online**: Number of active staff members
- **Today's Revenue**: Total amount from paid orders today
- **Menu Items**: Active menu item count

**Management Module Links:**
```
Cashier - Receive Cash         → /admin/cashier
Staff Management               → /admin/staff
Menu Management                → /admin/menu
Category Management            → /admin/categories
Inventory Management           → /admin/inventory
Order Overview                 → /admin/orders
Analytics & Reports            → /admin/analytics
```

**Component:** [AdminDashboard](../src/pages/admin/AdminDashboard.tsx)

#### 2. Staff Management (/admin/staff)

**Features:**
- View all staff members (kitchen + waiter)
- List with: Name, Email, Role, Status, Join Date
- Create new staff account
  - Full name
  - Email
  - Phone number
  - Role selection (Kitchen or Waiter)
  - Initial password (sent to them)
- Edit staff details
- Deactivate/activate staff
- Delete staff member

**Create Staff Modal:**
```typescript
interface StaffMember {
  id: number;
  fullName: string;
  email: string;
  phone: string;
  role: 3 | 4;  // Kitchen (3) or Waiter (4)
  status: 'active' | 'inactive';
  createdAt: string;
}
```

**API Functions:**
```typescript
getStaffMembers() → Promise<StaffMember[]>
createStaffMember(data) → Promise<StaffMember>
updateStaffMember(id, data) → Promise<StaffMember>
deleteStaffMember(id) → Promise<void>
```

#### 3. Customer Management (/admin/customers)

**Features:**
- View all registered customers
- List with: Name, Email, Phone, Status, Registration Date
- Search customers by name/email
- Filter by status:
  - **Active**: Normal customers
  - **Inactive**: Haven't ordered recently
  - **Blocked**: Banned from system
- Update customer status
- View customer order history (click on customer)

**Status Management:**
```typescript
// Status colors for UI
Active: Green badge
Inactive: Yellow badge
Blocked: Red badge
```

**API Functions:**
```typescript
getCustomers() → Promise<Customer[]>
getCustomerDetails(id) → Promise<Customer>
updateCustomerStatus(id, status) → Promise<Customer>
getCustomerOrders(id) → Promise<Order[]>
```

#### 4. Menu Management (/admin/menu)

**Features:**
- View all menu items in list
- Search menu items
- Filter by category
- Create new menu item
- Edit menu item details
- Delete menu item
- Toggle active/inactive status
- Upload item image

**Menu Item Form Fields:**
```typescript
{
  name: string;           // e.g., "Grilled Chicken"
  description: string;    // e.g., "Fresh chicken with herbs"
  price: number;          // e.g., 14.99
  categoryId: number;     // Link to category
  imageUrl?: string;      // Optional image
  isActive: boolean;      // Show on menu?
  dietaryTags?: string[]; // ["Vegan", "Gluten-Free"]
  allergens?: string[];   // ["Nuts", "Dairy"]
  preparationTime?: number; // minutes
}
```

**Modal Dialog Access:**
```
View Menu Items List
├─ [+ Create Item] button
├─ [Search bar]
│
├─ For Each Item:
│  ├─ [Edit] button → opens edit modal
│  └─ [Delete] button → confirms deletion
```

**API Functions:**
```typescript
getMenuItems() → Promise<MenuItem[]>
createMenuItem(data) → Promise<MenuItem>
updateMenuItem(id, data) → Promise<MenuItem>
deleteMenuItem(id) → Promise<void>
```

#### 5. Category Management (/admin/categories)

**Features:**
- View all categories
- Create new category
- Edit category name
- Set display order
- Delete category
- View items in each category

**Category Form Fields:**
```typescript
{
  name: string;          // e.g., "Appetizers"
  displayOrder: number;  // Sort order (1, 2, 3...)
}
```

**Modal Dialog:**
```
Category List
├─ [+ Create Category] button
│
├─ For Each Category:
│  ├─ Name
│  ├─ Item count
│  ├─ [Edit] → opens modal
│  └─ [Delete] → confirms deletion
```

**API Functions:**
```typescript
getCategories() → Promise<Category[]>
createCategory(data) → Promise<Category>
updateCategory(id, data) → Promise<Category>
deleteCategory(id) → Promise<void>
```

#### 6. Inventory Management (/admin/inventory)

**Features:**
- View stock levels for all items
- Set reorder level for each item
- View reorder history
- Create restock order
- Set minimum stock threshold
- Track inventory movements
- Alert when stock is low

**Inventory View:**
```
Item Name | Current Stock | Reorder Level | Status | Actions
----------|---------------|---------------|--------|--------
Chicken   | 45 units      | 10            | OK     | [Edit]
Flour     | 2 units       | 20            | LOW    | [Reorder]
Tomato    | 150 units     | 50            | OK     | [Edit]
```

**Restock Modal:**
```typescript
{
  itemId: number;
  currentStock: number;
  reorderLevel: number;
  quantityToReorder: number;  // How many to add?
  supplier: string;           // Which supplier?
  expectedDelivery: date;     // When arriving?
}
```

**API Functions:**
```typescript
getInventory() → Promise<Inventory[]>
updateInventoryLevel(itemId, newLevel) → Promise<void>
createRestockOrder(data) → Promise<RestockOrder>
getRestockHistory() → Promise<RestockOrder[]>
```

#### 7. Order Overview (/admin/orders)

**Features:**
- View ALL orders in system
- Search orders by order ID
- Filter by status:
  - PLACED (new orders)
  - PREPARING (in kitchen)
  - READY (ready for serving)
  - SERVED (served to customer)
  - COMPLETED (finished eating)
  - PAID (paid)
  - CANCELLED (cancelled)
- Filter by date range
- Sort by date, status, total
- View order details (click order)
- Update order status (admin can override)

**Order List Columns:**
```
Order ID | Table # | Items | Total | Status | Date | Actions
---------|---------|-------|-------|--------|------|--------
ORD-001  | 5       | 3     | $45.99| READY  | 2:30 | [View]
ORD-002  | 8       | 2     | $32.50| SERVED | 1:45 | [View]
```

**Order Details Modal:**
```typescript
{
  orderId: string;
  tableId: string;
  customerId: number;
  items: [
    { name, quantity, price, notes }
  ];
  totalAmount: number;
  status: OrderStatus;
  createdAt: timestamp;
  updatedAt: timestamp;
  estimatedTime: number;
}
```

**Status Update:**
```
Admin can manually change order status
Current: PLACED
Available next: PREPARING, CANCELLED

Status flow is enforced:
PLACED → PREPARING → READY → SERVED → COMPLETED → PAID
```

**API Functions:**
```typescript
getAllOrders() → Promise<Order[]>
getOrderById(orderId) → Promise<Order>
updateOrderStatus(id, newStatus) → Promise<Order>
getOrdersByDateRange(from, to) → Promise<Order[]>
```

#### 8. Analytics & Reports (/admin/analytics)

**Features:**
- Sales analytics by time period
- Order count trends
- Revenue reports (daily/weekly/monthly)
- Popular menu items
- Customer insights
- Peak hours analysis

**Report Types:**
```
1. Sales by Date
   - Line chart showing daily sales
   - Filter by date range

2. Top Items
   - Bar chart of most ordered items
   - With revenue contribution

3. Order Status Breakdown
   - Pie chart of orders by status

4. Customer Insights
   - New customers this period
   - Repeat customer count
   - Average order value

5. Financial Summary
   - Total revenue
   - Number of orders
   - Average order value
   - Growth rate vs previous period
```

**API Functions:**
```typescript
getSalesAnalytics(from, to) → Promise<SalesData>
getTopItems(limit) → Promise<MenuItem[]>
getCustomerAnalytics(period) → Promise<CustomerStats>
getRevenueReport(from, to) → Promise<RevenueData>
```

#### 9. Cashier - Receive Cash (/admin/cashier)

**Features:**
- Receive cash payments from waiters
- Scan waiter QR code
- Enter cash amount received
- Record transaction
- Print receipt
- View transaction history
- Calculate daily total

**Workflow:**
```
1. Waiter brings cash
2. Click "Scan Waiter QR"
3. System shows waiter info
4. Enter amount: $XXX.XX
5. Confirm transaction
6. Print receipt
7. Keep in records
8. Waiter gets receipt
```

**Transaction Record:**
```typescript
{
  id: number;
  waiterId: number;
  waiterName: string;
  amountReceived: number;
  receivedAt: timestamp;
  receivedBy: adminId;
  notes?: string;
  receiptPrinted: boolean;
}
```

**API Functions:**
```typescript
getWaiterInfo(waiterId) → Promise<WaiterInfo>
recordCashTransaction(data) → Promise<Transaction>
getDailyCashTotal(date) → Promise<number>
getTransactionHistory() → Promise<Transaction[]>
```

---

### Kitchen Features (Role 3)

#### 1. Kitchen Display System (/kitchen)

**Main Display Features:**
- Real-time order queue
- Auto-refresh every 5 seconds
- Shows PLACED and PREPARING orders only
- Sort by priority (oldest first)

**Order Card Display:**
```
┌─────────────────────────────────────┐
│ Order #ORD-001 | Table: 5           │
│ Items: 3   Status: PLACED           │
├─────────────────────────────────────┤
│ • Grilled Chicken Breast (2)        │
│   - Extra sauce                     │
│ • Caesar Salad (1)                  │
│   - Dressing on side                │
│ • Garlic Bread (2)                  │
├─────────────────────────────────────┤
│ Ordered: 2:30 PM  (5 mins ago)      │
└─────────────────────────────────────┘
```

**Colors & Status:**
```
PLACED: Orange/Red   - New order, needs to start
PREPARING: Yellow    - Currently cooking
READY: Green         - Done, waiting for pickup
```

#### 2. Order Status Updates

**Available Actions:**
```
Order arrives (PLACED)
    ↓
    [Start Cooking] → Changes to PREPARING
    ↓
    [Mark Ready] → Changes to READY
    ↓
    Kitchen's job done - Waiter will pick up
```

**How to Update Status:**
```
1. Click on order card
2. See "Start Cooking" button
   - Click to change PLACED → PREPARING
3. Click again after cooking
4. See "Mark Ready" button
   - Click to change PREPARING → READY
```

**Components Used:**
- [OrderCard](../src/components/OrderCard.tsx)
- [OrderStatusFilter](../src/components/OrderStatusFilter.tsx)

#### 3. Special Instructions View

**Displayed on Each Order:**
- View all special cooking notes
- High contrast for easy reading
- Grouped by item

**Example Display:**
```
SPECIAL INSTRUCTIONS:
─────────────────────
Chicken: No salt, extra lemon
Salad: Dressing on side, no croutons
Bread: Garlic butter extra generous
```

#### 4. Order Details Modal

**Click Order Card Opens:**
```
Full Order Details

Order ID: ORD-001
Table: 5
Customer: John Doe
Ordered: 2:30 PM (10 mins ago)

Items:
━━━━━━━━━━━━━━━━━━━━━━━━
✓ Grilled Chicken × 2
  Instruction: no salt, extra lemon
  Status: Not started

✓ Caesar Salad × 1
  Instruction: dressing on side
  Status: Not started

✓ Garlic Bread × 2
  Instruction: butter generous
  Status: Not started

━━━━━━━━━━━━━━━━━━━━━━━━

[Start Cooking]  [Mark Ready]  [Close]
```

#### 5. Kitchen Workflow Example

```
9:00 AM: Kitchen staff logs in
         ↓
         /kitchen loads
         ↓
         KDS displays: No orders

9:15 AM: Customer orders
         ↓
         New order arrives: ORD-001
         ↓
         Staff sees orange card: "PLACED"
         ↓
         Staff clicks [Start Cooking]
         ↓
         Card changes to yellow: "PREPARING"
         ↓
         Staff cooks for 10 minutes
         ↓
         Staff clicks [Mark Ready]
         ↓
         Card changes to green: "READY"
         ↓
         System notifies waiter
         ↓
         Waiter picks up order from kitchen
         ↓
         Order disappears from KDS
         ↓
         Customer receives order

9:25 AM: Same with next order...
```

**API Used:**
```typescript
// Get active orders
getActiveOrders() → Promise<Order[]>

// Update status
updateOrderStatus(orderId, newStatus) → Promise<Order>

// Real-time updates (could use WebSocket)
const interval = setInterval(() => {
  refreshOrders();
}, 5000); // Refresh every 5 seconds
```

---

### Waiter Features (Role 4)

#### 1. Waiter Dashboard (/waiter)

**Quick Action Cards:**
```
[Proxy Order]        [Serve Orders]       [Table Status]
Take customer       View ready orders    Manage tables
orders & collect   and serve them       and assignments
cash payments
```

**Active Tables Grid:**
```
┌──────┐  ┌──────┐  ┌──────┐
│  1   │  │  2   │  │  3   │
│AVAIL │  │AVAIL │  │AVAIL │
└──────┘  └──────┘  └──────┘

┌──────┐  ┌──────┐  ┌──────┐
│  4   │  │  5   │  │  6   │
│AVAIL │  │AVAIL │  │AVAIL │
└──────┘  └──────┘  └──────┘
```

**Components Used:**
- [TableSelector](../src/components/TableSelector/TableSelector.tsx)
- Navigation links to other waiter features

#### 2. Proxy Order (Take Orders) - /waiter/proxy-order

**Purpose:** Waiter takes order on behalf of customer (customer doesn't use app)

**Workflow:**
```
1. Waiter selects table
   - Only shows AVAILABLE tables
   - Prevents double-booking
   
2. Waiter enters customer name
   
3. Browse menu (same as customer app)
   - Search & filter items
   - Add to cart
   
4. Submit order
   
5. Order appears in kitchen system
   
6. Customer gets served when ready
   
7. Waiter collects cash payment
   
8. Record payment transaction
```

**Steps Detailed:**

**Step 1: Select Table**
```typescript
// Only show available tables
const availableTables = tables.filter(t => t.status === 'available');

// Display as grid for tapping
┌──────┬──────┬──────┐
│  1   │  2   │  3   │ ← Clickable
│AVAIL │AVAIL │AVAIL │
└──────┴──────┴──────┘
```

**Step 2: Enter Customer Name**
```
[Customer Name Input: ________________]

Note: Name used for order identification
Only used if customer not using mobile app
```

**Step 3: Browse Menu**
```
Same interface as customer /menu page:
- Search bar
- Category filter
- Item cards with price
- Add to cart button
- Quantity selector
```

**Step 4: Place Order**
```typescript
// Order structure for waiter
{
  tableId: "5",
  customerName: "John Doe",  // Entered by waiter
  items: [
    { menuItemId: 1, quantity: 2, notes: "no sauce" }
  ],
  placedBy: waiterId,
  paymentType: "cash"  // Waiter collects cash
}
```

**Step 5: Record Payment**
```
┌───────────────────────────┐
│ Order Placed Successfully  │
├───────────────────────────┤
│ Order ID: ORD-001         │
│ Table: 5                  │
│ Customer: John Doe        │
│ Total: $45.99             │
├───────────────────────────┤
│ Cash Received: $________  │
│ Change: $________         │
├───────────────────────────┤
│ [Save & Print Receipt]    │
│ [Save Payment]            │
└───────────────────────────┘
```

**API Used:**
```typescript
// Get available tables
getAvailableTables() → Promise<Table[]>

// Place order via waiter
placeProxyOrder(waiterId, {
  tableId: string;
  customerName: string;
  items: OrderItem[];
}) → Promise<PlaceOrderResponse>

// Record cash transaction
recordCashPayment(orderId, amount) → Promise<void>
```

#### 3. Serve Orders - /waiter/serve

**Purpose:** Deliver orders to tables, mark as served

**Display:**
```
Filter by Status: [All] [READY] [SERVED]
Filter by Table: [All] [1] [2] [3] [4] [5]

┌─────────────────────────────────────┐
│ ORD-001 | Table 5 | 3 items         │
│ Status: READY ✓                     │
│ Total: $45.99                       │
│ Ready since: 2:35 PM                │
├─────────────────────────────────────┤
│ [View Details]  [Mark as Served]    │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ ORD-002 | Table 8 | 2 items         │
│ Status: READY ✓                     │
├─────────────────────────────────────┤
│ [View Details]  [Mark as Served]    │
└─────────────────────────────────────┘
```

**Workflow:**
```
1. Kitchen marks order as READY
   ↓
2. Order appears in /waiter/serve
   ↓
3. Waiter picks up order from kitchen
   ↓
4. Waiter delivers to table
   ↓
5. Click [Mark as Served]
   ↓
6. Confirmation: "Order delivered to Table X"
   ↓
7. Order status changes to SERVED
   ↓
8. Success notification shows
```

**Order Details Modal:**
```
Order: ORD-001
Table: 5
Items:
  • Grilled Chicken (2) - no salt
  • Caesar Salad (1) - dressing on side
  • Garlic Bread (2)

Total: $45.99
Status: READY
Ready Since: 2:35 PM

[Mark as Served]  [Cancel]
```

**Success Toast:**
```
✓ Order ORD-001 marked as served
  (Auto-hide after 3 seconds)
```

**API Used:**
```typescript
// Get ready orders
getReadyOrders() → Promise<Order[]>

// Update to SERVED
markOrderServed(orderId) → Promise<Order>
```

#### 4. Table Status - /waiter/tables

**Purpose:** View all tables, manage assignments and status

**Display:**

```
All Tables (6 total)

┌──────┐  ┌──────┐  ┌──────┐
│  1   │  │  2   │  │  3   │
│AVAIL │  │BUSY  │  │AVAIL │
│      │  │Table │  │      │
│      │  │Occ:  │  │      │
│      │  │2:15p │  │      │
└──────┘  └──────┘  └──────┘

┌──────┐  ┌──────┐  ┌──────┐
│  4   │  │  5   │  │  6   │
│AVAIL │  │BUSY  │  │BUSY  │
│      │  │Table │  │Table │
│      │  │Occ:  │  │Occ:  │
│      │  │2:30p │  │1:45p │
└──────┘  └──────┘  └──────┘
```

**Table Status Meanings:**
```
🟢 AVAILABLE (Green)
   - No active orders
   - Ready for next customer
   - Can be used by waiter

🔴 BUSY/OCCUPIED (Red)
   - Has active order(s)
   - Customer is being served
   - Cannot be assigned to new order

🟡 FINISHING (Yellow)
   - Order served
   - Waiting for payment
   - Customer almost done
```

**Table Details Modal:**
```
Table 5

Status: OCCUPIED
Occupied Since: 2:15 PM (20 minutes)

Active Orders:
  ORD-001: Status READY
  ORD-002: Status PREPARING

[View Orders]  [Close]
```

**Management Actions:**
```
Click on table card:

If AVAILABLE:
├─ [Take Proxy Order] - Place order for customer
└─ [Mark Occupied] - Manually mark status

If OCCUPIED:
├─ [View Active Orders]
├─ [Deliver Order] - Go to Serve Orders
└─ [Mark Available] - Cleanup done, ready for next
```

**API Used:**
```typescript
// Get all tables
getAllTables() → Promise<Table[]>

// Get table details
getTableStatus(tableId) → Promise<TableStatus>

// Update table status
updateTableStatus(tableId, status) → Promise<void>

// Get table's active orders
getTableOrders(tableId) → Promise<Order[]>
```

#### 5. Cash Payment Management

**When Collecting Cash:**

1. **At Table:**
```
Customer pays cash
Waiter notes amount
Asks for any tips

Record amount: $50.00
Tips: $5.00
Total collected: $55.00
```

2. **Return to Admin/Cashier:**
```
End of shift or whenever:
- Bring all cash collected
- Admin scans waiter QR code
- Admin enters amount: $XX.XX
- System records transaction
- Waiter gets receipt
```

3. **Transaction Record:**
```typescript
{
  waiterId: 4,
  waiterName: "Maria",
  amountCollected: 250.50,
  ordersCount: 8,
  collectedAt: timestamp,
  recordedBy: adminId,
  status: "recorded"
}
```

---

## How to Link Buttons & Navigation

### Button Component Usage

The app uses a reusable Button component with different variants and sizes.

#### Basic Button

```tsx
import Button from '../components/Button';

// Primary button (blue/main color)
<Button onClick={handleClick}>
  Click Me
</Button>

// With variant
<Button variant="primary" onClick={handleClick}>
  Save Changes
</Button>

// Secondary button (gray)
<Button variant="secondary" onClick={handleClick}>
  Cancel
</Button>

// Danger button (red)
<Button variant="danger" onClick={handleClick}>
  Delete
</Button>

// Success button (green)
<Button variant="success" onClick={handleClick}>
  Confirm
</Button>

// With size
<Button size="sm" onClick={handleClick}>
  Small
</Button>

<Button size="md" onClick={handleClick}>
  Medium (default)
</Button>

<Button size="lg" onClick={handleClick}>
  Large
</Button>

// Loading state
<Button isLoading={true}>
  {isLoading ? 'Loading...' : 'Submit'}
</Button>

// Disabled
<Button disabled>
  Disabled
</Button>

// Combined
<Button 
  variant="danger" 
  size="lg"
  onClick={handleDelete}
  className="custom-class"
>
  Delete Item
</Button>
```

### Navigation with useNavigate Hook

For programmatic navigation:

```tsx
import { useNavigate } from 'react-router-dom';

const MyComponent: React.FC = () => {
  const navigate = useNavigate();

  const handleGoToDashboard = () => {
    navigate('/admin');
  };

  const handleGoBack = () => {
    navigate(-1);  // Go back to previous page
  };

  const handleGoToOrder = (orderId: string) => {
    navigate(`/orders/${orderId}`);  // Dynamic routing
  };

  return (
    <>
      <Button onClick={handleGoToDashboard}>
        Go to Dashboard
      </Button>
      <Button onClick={handleGoBack}>
        Back
      </Button>
      <Button onClick={() => handleGoToOrder('ORD-001')}>
        View Order
      </Button>
    </>
  );
};
```

### Navigation with Link Component

For static navigation:

```tsx
import { Link } from 'react-router-dom';

// Link component (no page reload)
<Link to="/menu" className="nav-link">
  Menu
</Link>

// Styled as button
<Link 
  to="/admin/dashboard" 
  className="button button--primary button--md"
>
  Admin Dashboard
</Link>

// In navigation header
<nav className="header__nav">
  <Link to="/admin" className="header__nav-link">
    Home
  </Link>
  <Link to="/admin/customers" className="header__nav-link">
    Customers
  </Link>
  <Link to="/admin/staff" className="header__nav-link">
    Staff
  </Link>
  <Link to="/admin/menu" className="header__nav-link">
    Menu
  </Link>
</nav>
```

### Button Linking Patterns by Use Case

#### 1. **Form Submission**

```tsx
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setIsLoading(true);
  
  try {
    const result = await submitForm(formData);
    setIsLoading(true false);
    navigate('/success-page');  // Navigate on success
  } catch (error) {
    setError(error.message);
    setIsLoading(false);
  }
};

return (
  <form onSubmit={handleSubmit}>
    <input type="text" />
    <Button type="submit" isLoading={isLoading}>
      {isLoading ? 'Submitting...' : 'Submit'}
    </Button>
  </form>
);
```

#### 2. **Modal Dialog**

```tsx
const [isModalOpen, setIsModalOpen] = useState(false);

return (
  <>
    <Button onClick={() => setIsModalOpen(true)}>
      Open Dialog
    </Button>

    <Modal 
      isOpen={isModalOpen}
      onClose={() => setIsModalOpen(false)}
      title="Confirm Action"
    >
      <p>Are you sure?</p>
      <Button variant="danger" onClick={handleConfirm}>
        Delete
      </Button>
      <Button 
        variant="secondary"
        onClick={() => setIsModalOpen(false)}
      >
        Cancel
      </Button>
    </Modal>
  </>
);
```

#### 3. **Conditional Navigation Based on Role**

```tsx
const MyComponent: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleNavigate = () => {
    if (user?.role === 2) {
      navigate('/admin');
    } else if (user?.role === 3) {
      navigate('/kitchen');
    } else if (user?.role === 4) {
      navigate('/waiter');
    } else {
      navigate('/menu');
    }
  };

  return <Button onClick={handleNavigate}>Go Home</Button>;
};
```

#### 4. **Dynamic Routing with Parameters**

```tsx
const OrdersList: React.FC = () => {
  const navigate = useNavigate();

  const handleViewOrder = (orderId: string) => {
    navigate(`/orders/${orderId}`);
  };

  return (
    <div>
      {orders.map(order => (
        <div key={order.id}>
          <h3>{order.id}</h3>
          <Button onClick={() => handleViewOrder(order.id)}>
            View Details
          </Button>
        </div>
      ))}
    </div>
  );
};
```

#### 5. **With Query Parameters**

```tsx
const handleFilterOrders = (status: string) => {
  navigate(`/admin/orders?status=${status}&date=2024-12-01`);
};

return (
  <>
    <Button onClick={() => handleFilterOrders('PLACED')}>
      New Orders
    </Button>
    <Button onClick={() => handleFilterOrders('READY')}>
      Ready Orders
    </Button>
  </>
);
```

#### 6. **Logout Button**

```tsx
const { logout } = useAuth();
const navigate = useNavigate();

const handleLogout = () => {
  logout();  // Clear tokens
  navigate('/login', { replace: true });  // Redirect to login
};

return (
  <Button variant="danger" onClick={handleLogout}>
    Logout
  </Button>
);
```

#### 7. **External Links**

```tsx
// Open in new tab
<a href="https://example.com" target="_blank" rel="noopener noreferrer">
  External Link
</a>

// Or using button-styled link
<Button 
  onClick={() => window.open('https://example.com', '_blank')}
>
  Open Documentation
</Button>
```

### Navigation Patterns by Route

```typescript
// Customer routes
navigate('/menu')              // Browse menu
navigate('/orders')            // View order history
navigate('/orders/:orderId')   // Track specific order
navigate('/checkout')          // Checkout with cart
navigate('/profile')           // User profile
navigate('/qr-scan')           // Scan table QR

// Admin routes
navigate('/admin')             // Dashboard
navigate('/admin/staff')       // Staff management
navigate('/admin/customers')   // Customer management
navigate('/admin/menu')        // Menu management
navigate('/admin/categories')  // Category management
navigate('/admin/inventory')   // Inventory tracking
navigate('/admin/orders')      // Order overview
navigate('/admin/analytics')   // Analytics & reports
navigate('/admin/cashier')     // Cash transactions

// Kitchen routes
navigate('/kitchen')           // Kitchen display system

// Waiter routes
navigate('/waiter')            // Dashboard
navigate('/waiter/proxy-order')// Proxy order
navigate('/waiter/serve')      // Serve orders
navigate('/waiter/tables')     // Table status

// Auth routes
navigate('/login')             // Login page
navigate('/register')          // Registration
```

---

## Component Documentation

### Core Components

#### Button Component
- **Location:** [src/components/Button/Button.tsx](../src/components/Button/Button.tsx)
- **Props:** variant, size, isLoading, disabled, className, all HTML button props
- **Variants:** primary, secondary, danger, success
- **Sizes:** sm, md (default), lg

#### Modal Component
- **Location:** [src/components/Modal.tsx](../src/components/Modal.tsx)
- **Props:** isOpen, onClose, title, children, size, showCloseButton
- **Sizes:** sm, md (default), lg
- **Features:** Escape key to close, backdrop click to close, auto-manages body overflow

#### Card Component
- **Location:** [src/components/Card/Card.tsx](../src/components/Card/Card.tsx)
- **Props:** children, className
- **Usage:** Wrapper for content in cards/containers

#### Header Component
- **Location:** [src/components/Header/Header.tsx](../src/components/Header/Header.tsx)
- **Features:** Role-based navigation, user info, logout, table ID display
- **Props:** title, showNavigation, showTableId

#### Layout Component
- **Location:** [src/components/Layout/Layout.tsx](../src/components/Layout/Layout.tsx)
- **Props:** children, title, showNavigation, showTableId
- **Contains:** Header + main content area + bottom nav (for customers)

#### Cart Component
- **Location:** [src/components/Cart/Cart.tsx](../src/components/Cart/Cart.tsx)
- **File:** Shows items with quantities, total price, checkout button
- **State:** Managed by CartContext

### Feature Components

#### MenuCard
- **Location:** [src/components/MenuCard/MenuCard.tsx](../src/components/MenuCard/MenuCard.tsx)
- **Display:** Menu item card with image, name, price, description
- **Actions:** Add to cart, view details

#### OrderCard
- **Location:** [src/components/OrderCard/OrderCard.tsx](../src/components/OrderCard/OrderCard.tsx)
- **Display:** Order summary with items, total, status
- **Usage:** Used in kitchen KDS, order lists

#### OrderStatusFilter
- **Location:** [src/components/OrderStatusFilter/OrderStatusFilter.tsx](../src/components/OrderStatusFilter/OrderStatusFilter.tsx)
- **Features:** Filter orders by status, by table, search by order ID

#### LoadingSpinner
- **Location:** [src/components/LoadingSpinner/LoadingSpinner.tsx](../src/components/LoadingSpinner/LoadingSpinner.tsx)
- **Display:** Animated loading indicator with optional text

#### TableSelector
- **Location:** [src/components/TableSelector/TableSelector.tsx](../src/components/TableSelector/TableSelector.tsx)
- **Features:** Select available tables (highlights occupied ones)
- **Usage:** In waiter proxy order

#### CustomerBottomNav
- **Location:** [src/components/CustomerBottomNav/CustomerBottomNav.tsx](../src/components/CustomerBottomNav/CustomerBottomNav.tsx)
- **Features:** Quick navigation for customer role only
- **Links:** Menu, Orders, Profile, Cart

### Route Protection Components

#### ProtectedRoute
- **Location:** [src/components/ProtectedRoute.tsx](../src/components/ProtectedRoute.tsx)
- **Usage:** Requires authentication only
- **Redirects:** To /login if not authenticated

#### RoleBasedRoute
- **Location:** [src/components/RoleBasedRoute.tsx](../src/components/RoleBasedRoute.tsx)
- **Usage:** Requires specific role(s)
- **Redirects:** To role-specific dashboard if not authorized

#### CustomerProtectedRoute
- **Location:** [src/components/CustomerProtectedRoute.tsx](../src/components/CustomerProtectedRoute.tsx)
- **Usage:** Requires authentication + valid tableId
- **Redirects:** To /qr-scan if no tableId

#### ErrorBoundary
- **Location:** [src/components/ErrorBoundary.tsx](../src/components/ErrorBoundary.tsx)
- **Usage:** Catches React component errors
- **Display:** Error message with stack trace (dev mode only)

---

## API Integration

### API Structure

All API functions are in `src/api/` directory and support both mock and real backends:

#### Mock Implementation

```typescript
async function mockLogin(credentials: LoginRequest): Promise<LoginResponse> {
  // Find user in mock data
  // Generate mock tokens
  // Simulate network delay
  return withDelay(response);
}
```

#### Real Implementation

```typescript
async function realLogin(credentials: LoginRequest): Promise<LoginResponse> {
  const response = await fetch(`${CONFIG.API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials),
  });
  
  if (!response.ok) {
    throw new Error(`Login failed: ${response.statusText}`);
  }
  
  return response.json();
}
```

#### Exported Functions

```typescript
// Use mock or real based on CONFIG.USE_MOCK_API
export const login = CONFIG.USE_MOCK_API ? mockLogin : realLogin;
export const register = CONFIG.USE_MOCK_API ? mockRegister : realRegister;
// etc.
```

### Authentication API (`src/api/auth.ts`)

```typescript
// Login
login(credentials: LoginRequest) → Promise<LoginResponse>
// Returns: { accessToken, refreshToken, tokenType }

// Register
register(data: RegisterRequest) → Promise<RegisterResponse>
// Returns: { id, email, fullName, role, phone, createdAt }

// Get Profile
getProfile() → Promise<UserProfile>
// Returns: { id, fullName, email, phone, role, createdAt }
```

### Menu API (`src/api/menu.ts`)

```typescript
// Get all categories
getCategories() → Promise<Category[]>

// Get menu items (optionally filtered by category)
getMenuItems(categoryId?: number) → Promise<MenuItem[]>

// Get single menu item
getMenuItem(itemId: number) → Promise<MenuItem>

// Get inventory levels
getInventory() → Promise<Record<number, {stock, reorderLevel}>>

// Admin: Create menu item
createMenuItem(data) → Promise<MenuItem>

// Admin: Update menu item
updateMenuItem(id, data) → Promise<MenuItem>

// Admin: Delete menu item
deleteMenuItem(id) → Promise<void>
```

### Orders API (`src/api/orders.ts`)

```typescript
// Place order
placeOrder(customerId, request: PlaceOrderRequest) 
  → Promise<PlaceOrderResponse>

// Get orders by table
getOrdersByTable(tableId: string) → Promise<Order[]>

// Get order by ID
getOrderById(orderId: string) → Promise<Order>

// Get customer orders
getCustomerOrders(customerId) → Promise<Order[]>

// Get all orders (admin)
getAllOrders() → Promise<Order[]>

// Update order status
updateOrderStatus(orderId, newStatus) → Promise<Order>

// Get active orders (kitchen)
getActiveOrders() → Promise<Order[]>

// Mark order ready
markOrderReady(orderId) → Promise<Order>

// Mark order served
markOrderServed(orderId) → Promise<Order>
```

### Configuration

```typescript
// src/utils/config.ts
export const CONFIG = {
  API_BASE_URL: 'http://localhost:3000/api',
  USE_MOCK_API: true,  // Switch between mock/real API
  MOCK_API_DELAY: 800,  // Simulate network delay in ms
  DEBUG: true,          // Log API calls
};
```

---

## State Management

### Context Providers

#### AuthContext

**Location:** [src/context/AuthContext.tsx](../src/context/AuthContext.tsx)

**Provides:**
```typescript
{
  user: UserProfile | null,
  tableId: TableId,
  isLoading: boolean,
  isAuthenticated: boolean,
  error: string | null,
  logout: () => void,
  refreshUser: () => Promise<UserProfile>,
  setError: (error) => void,
  setTableId: (id) => void,
}
```

**Usage:**
```typescript
import { useAuth } from '../hooks/useAuth';

const MyComponent = () => {
  const { user, isAuthenticated, logout } = useAuth();
  
  return (
    <>
      {isAuthenticated && <p>Welcome, {user?.fullName}</p>}
      <button onClick={logout}>Logout</button>
    </>
  );
};
```

**Features:**
- Auto-loads user profile on app start
- Manages JWT tokens
- Manages table ID from QR codes
- Handles login/logout
- Token refresh capability

#### CartContext

**Location:** [src/context/CartContext.tsx](../src/context/CartContext.tsx)

**Provides:**
```typescript
{
  items: CartItem[],
  itemCount: number,
  totalAmount: number,
  addItem: (item, quantity, notes) => void,
  removeItem: (itemId, notes) => void,
  updateQuantity: (itemId, quantity, notes) => void,
  updateNotes: (itemId, oldNotes, newNotes) => void,
  clearCart: () => void,
  isCartOpen: boolean,
  openCart: () => void,
  closeCart: () => void,
}
```

**Usage:**
```typescript
import { useCart } from '../hooks/useCart';

const MenuPage = () => {
  const { addItem, items, totalAmount } = useCart();
  
  return (
    <>
      <button onClick={() => addItem(menuItem, 2)}>
        Add to Cart
      </button>
      <p>Cart: {items.length} items - ${totalAmount}</p>
    </>
  );
};
```

**Features:**
- Persists to localStorage
- Handles quantities and special notes
- Real-time totals
- Cart visibility toggle

### Hooks

#### useAuth Hook
- **Usage:** Access authentication context
- **Returns:** AuthContextType
- **Does:** Throws error if used outside AuthProvider

#### useCart Hook
- **Usage:** Access shopping cart
- **Returns:** CartContextType
- **Does:** Throws error if used outside CartProvider

#### useRole Hook
- **Usage:** Get current user's role info
- **Returns:** RoleInfo (isCustomer, isAdmin, isKitchen, isWaiter, roleName)
- **Example:**
  ```typescript
  const { isAdmin, isKitchen, roleName } = useRole();
  ```

---

## Authentication Flow

### Complete Login Flow

```
┌─────────────────────────────────────────┐
│  User visits /login                     │
│  AuthContext checks if already logged   │
│  in (has valid accessToken)             │
└────────────┬────────────────────────────┘
             │
             ├─ Yes → Redirect to role dashboard
             │
             └─ No → Show Login Page
                    ├─ [Email input]
                    ├─ [Password input]
                    └─ [Login button]
                         │
                         ├─ Call login(email, password)
                         │    │
                         │    ├─ Mock API: Find user in mock data
                         │    │    └─ Generate tokens
                         │    │
                         │    └─ Real API: POST /auth/login
                         │         └─ Receive tokens from backend
                         │
                         ├─ Store tokens:
                         │    └─ localStorage (accessToken, refreshToken)
                         │
                         ├─ Call refreshUser()
                         │    ├─ Fetch user profile via getProfile()
                         │    └─ Update user state
                         │
                         ├─ Check tableId (QR scan)
                         │    ├─ From URL: ?tableId=5
                         │    ├─ From Cookie: Set 5-hour expiry
                         │    └─ From localStorage: Fallback
                         │
                         └─ Determine redirect:
                             ├─ Customer (role 1): Has tableId?
                             │   ├─ Yes → /menu
                             │   └─ No → /qr-scan
                             ├─ Admin (role 2) → /admin
                             ├─ Kitchen (role 3) → /kitchen
                             └─ Waiter (role 4) → /waiter
```

### Token Management

```
┌──────────────────┐
│  Access Token    │ ← Used for all API requests
├──────────────────┤
│ JWT Format       │
│ Header.Payload.  │
│ Signature        │
├──────────────────┤
│ Storage: localStorage
│ Key: 'accessToken'
│ Expires: (from backend)
└──────────────────┘

┌──────────────────┐
│ Refresh Token    │ ← Used to get new access token
├──────────────────┤
│ JWT Format       │
│ Header.Payload.  │
│ Signature        │
├──────────────────┤
│ Storage: localStorage
│ Key: 'refreshToken'
│ Expires: (longer than access token)
└──────────────────┘

When Access Token Expires:
1. API returns 401 Unauthorized
2. Call refresh endpoint with refresh token
3. Receive new access token
4. Retry original API call
5. If refresh also fails → logout
```

### QR Code Flow

```
┌─────────────────────────────┐
│ Restaurant Display QR Code  │
│  http://.../?tableId=5      │
└────────────┬────────────────┘
             │
             │ Customer scans with phone
             │
             ▼
┌─────────────────────────────┐
│ Browser Receives URL with   │
│ Query Parameter: ?tableId=5 │
└────────────┬────────────────┘
             │
             │ AuthContext captures in useEffect
             │
             ├─ Store in Cookie: tableId (5 hrs)
             ├─ Store in localStorage: backup
             └─ Set in AuthContext state
             │
             ▼
┌─────────────────────────────┐
│ User Needs to Login         │
│ - Enters credentials        │
│ - tableId already captured  │
└────────────┬────────────────┘
             │
             ├─ Check Customer + has tableId?
             │  ├─ Yes → Redirect to /menu
             │  └─ No → Redirect to /qr-scan
             │
             ▼
┌─────────────────────────────┐
│ Can Now:                    │
│ - Browse menu               │
│ - Add to cart               │
│ - Checkout (order placed)   │
└─────────────────────────────┘
```

### Logout Flow

```
┌────────────────────┐
│ User clicks Logout │
└────────┬───────────┘
         │
         ├─ logout() function called
         │  ├─ Clear localStorage tokens
         │  ├─ Clear cart
         │  └─ Clear user state
         │
         ├─ navigate('/login', { replace: true })
         │  └─ Replace history (can't go back)
         │
         ▼
┌────────────────────┐
│ Returned to Login  │
│ Page               │
└────────────────────┘
```

---

## Routing Structure

### Public Routes (No Auth Required)

```
/login              → Login page
                      <Route path="/login" element={<Login />} />

/register           → Registration page
                      <Route path="/register" element={<Register />} />

/404                → Not found error page
                      <Route path="/404" element={<NotFoundPage />} />

/unauthorized       → Unauthorized error page
                      <Route path="/unauthorized" element={<UnauthorizedPage />} />

/                   → Root redirect (handles role-based routing)
                      <Route path="/" element={<RootRedirect />} />
```

### Protected Routes (Authentication Required Only)

```
/menu               → Browse menu
                      <ProtectedRoute>
                        <MenuPage />
                      </ProtectedRoute>

/qr-scan            → QR code scanner
                      <ProtectedRoute>
                        <QRScannerPage />
                      </ProtectedRoute>

/orders             → Order history
                      <ProtectedRoute>
                        <MyOrdersPage />
                      </ProtectedRoute>

/orders/:orderId    → Order tracking detail
                      <ProtectedRoute>
                        <OrderTrackingPage />
                      </ProtectedRoute>

/profile            → User profile
                      <ProtectedRoute>
                        <ProfilePage />
                      </ProtectedRoute>
```

### Role-Based Routes (Customer Only - Role 1)

```
/customer           → Customer dashboard
                      <RoleBasedRoute requiredRoles={[1]}>
                        <CustomerDashboard />
                      </RoleBasedRoute>

/checkout           → Requires tableId
                      <CustomerProtectedRoute>
                        <CheckoutPage />
                      </CustomerProtectedRoute>
```

### Role-Based Routes (Admin Only - Role 2)

```
/admin              → Admin dashboard
/admin/staff        → Staff management
/admin/customers    → Customer management
/admin/menu         → Menu management
/admin/categories   → Category management
/admin/inventory    → Inventory management
/admin/orders       → Order overview
/admin/analytics    → Analytics & reports
/admin/cashier      → Cash transactions

All wrapped in:
<RoleBasedRoute requiredRoles={[2]}>
  <AdminPage />
</RoleBasedRoute>
```

### Role-Based Routes (Kitchen Only - Role 3)

```
/kitchen            → Kitchen display system (orders queue)

Wrapped in:
<RoleBasedRoute requiredRoles={[3]}>
  <KitchenPage />
</RoleBasedRoute>
```

### Role-Based Routes (Waiter Only - Role 4)

```
/waiter             → Waiter dashboard
/waiter/proxy-order → Take orders for customers
/waiter/serve       → Serve ready orders
/waiter/tables      → Table status management

All wrapped in:
<RoleBasedRoute requiredRoles={[4]}>
  <WaiterPage />
</RoleBasedRoute>
```

### Route Nesting Example

```
App.tsx
├── Public Routes
│   ├── /login
│   ├── /register
│   └── /
│
├── Protected Routes (ProtectedRoute guard)
│   ├── /menu
│   ├── /orders
│   └── /profile
│
├── Customer Routes (RoleBasedRoute + TableId)
│   ├── /customer
│   └── /checkout
│
├── Admin Routes (RoleBasedRoute)
│   ├── /admin
│   ├── /admin/staff
│   ├── /admin/customers
│   ├── /admin/menu
│   ├── /admin/categories
│   ├── /admin/inventory
│   ├── /admin/orders
│   ├── /admin/analytics
│   └── /admin/cashier
│
├── Kitchen Routes (RoleBasedRoute)
│   └── /kitchen
│
├── Waiter Routes (RoleBasedRoute)
│   ├── /waiter
│   ├── /waiter/proxy-order
│   ├── /waiter/serve
│   └── /waiter/tables
│
└── Error Routes
    ├── 404 (NotFoundPage)
    ├── 401 (UnauthorizedPage)
    └── Catch-all (NotFoundPage)
```

---

## Testing & Credentials

### Test User Accounts

Use these credentials to test each role:

| Role      | Email              | Password   | Notes                                          |
|-----------|-------------------|-----------|------------------------------------------------|
| Customer  | customer@test.com | password123 | Browse menu, place orders, track             |
| Admin     | admin@test.com    | admin123   | Manage staff, menu, inventory, orders        |
| Kitchen   | kitchen@test.com  | kitchen123 | View order queue, update status              |
| Waiter    | waiter@test.com   | waiter123  | Take proxy orders, serve orders, manage tables |

### Testing Workflow - Customer Role

1. **Login:**
   - Email: customer@test.com
   - Password: password123
   - ✅ Should redirect to /qr-scan

2. **Simulate QR Scan:**
   - Manually visit: `http://localhost:5173/?tableId=5`
   - OR click "QR Scanner" and enter table: 5
   - ✅ TableId captured, header shows "Table 5"

3. **Browse Menu:**
   - Click /menu from nav
   - ✅ See menu items, can search/filter
   - ✅ Add items to cart

4. **Checkout:**
   - Click Cart → Checkout
   - ✅ See items and total
   - ✅ Place order

5. **Track Order:**
   - Click /orders
   - ✅ See placed order with status
   - ✅ Click order ID to see details

### Testing Workflow - Admin Role

1. **Login:**
   - Email: admin@test.com
   - Password: admin123
   - ✅ Should redirect to /admin

2. **Dashboard:**
   - ✅ See stats (orders, staff, revenue)
   - ✅ See management module links

3. **Manage Staff:**
   - Click "Staff Management"
   - ✅ View kitchen and waiter staff
   - ✅ Create new staff using modal
   - ✅ Edit and delete staff

4. **Manage Menu:**
   - Click "Menu Management"
   - ✅ View all menu items
   - ✅ Create new item (modal)
   - ✅ Edit item (modal)
   - ✅ Delete item

5. **View Orders:**
   - Click "Order Overview"
   - ✅ See all system orders
   - ✅ Filter by status
   - ✅ Update order status

### Testing Workflow - Kitchen Role

1. **Login:**
   - Email: kitchen@test.com
   - Password: kitchen123
   - ✅ Should redirect to /kitchen

2. **Kitchen Display:**
   - ✅ Auto-loads active orders
   - ✅ Shows PLACED orders in orange
   - ✅ Shows PREPARING orders in yellow

3. **Update Status:**
   - ✅ Click "Start Cooking" → Goes to PREPARING
   - ✅ Click "Mark Ready" → Goes to READY
   - ✅ Ready orders appear green

### Testing Workflow - Waiter Role

1. **Login:**
   - Email: waiter@test.com
   - Password: waiter123
   - ✅ Should redirect to /waiter

2. **Proxy Order:**
   - Click "Proxy Order"
   - ✅ Select available table
   - ✅ Enter customer name
   - ✅ Browse and add items
   - ✅ Place order
   - ✅ Collect cash

3. **Serve Orders:**
   - Click "Serve Orders"
   - ✅ See READY orders from kitchen
   - ✅ Click "Mark as Served"
   - ✅ Success notification appears

4. **Table Status:**
   - Click "Table Status"
   - ✅ See all tables
   - ✅ Green = Available
   - ✅ Red = Occupied

### Testing Mock API Data

The app loads with pre-generated mock data:

```typescript
// Mock Users
- Customer (id: 1)
- Admin (id: 2)
- Kitchen (id: 3)
- Waiter (id: 4)

// Mock Menu Items
- 50+ items across multiple categories
- Prices range $5-30
- Different cuisine types

// Mock Orders
- Pre-generated orders
- Various statuses (PLACED, PREPARING, READY, etc.)
- Realistic timing data

// Mock Tables
- 10 tables (1-10)
- Various occupancy status
```

### Mock API Configuration

```typescript
// src/utils/config.ts

export const CONFIG = {
  API_BASE_URL: 'http://localhost:3000/api',
  USE_MOCK_API: true,          // ← Set to false to use real backend
  MOCK_API_DELAY: 800,         // Simulates network delay
  DEBUG: true,                 // Logs API calls
};
```

**To switch to real backend:**
1. Open `src/utils/config.ts`
2. Change `USE_MOCK_API: false`
3. Update `API_BASE_URL` to your backend

---

## Development Environment Setup

### Prerequisites

- **Node.js** v18+ (LTS recommended)
- **npm** or **yarn** package manager
- **Git** for version control

### Installation Steps

1. **Clone or download the project:**
```bash
cd c:\Users\ishanka.senadeera\Desktop\merge\frontend
```

2. **Install dependencies:**
```bash
npm install
```

This installs:
```
- react 19.2.0
- react-dom 19.2.0
- react-router-dom 7.13.0
- typescript 5.9
- vite 7.3
- tailwindcss 3.4
- react-icons 5.5
- qrcode.react 4.2
- eslint 9.39.1
- and other dependencies
```

3. **Start development server:**
```bash
npm run dev
```

Opens on: `http://localhost:5173`

4. **Build for production:**
```bash
npm run build
```

Creates optimized build in `dist/` folder

5. **Lint code:**
```bash
npm run lint
```

Checks for ESLint errors and warnings

6. **Preview production build:**
```bash
npm run preview
```

Serves the production build locally

### Project Configuration Files

```
vite.config.ts          → Vite build configuration
tsconfig.json           → TypeScript configuration
tsconfig.app.json       → App-specific TS config
tsconfig.node.json      → Node-specific TS config
eslint.config.js        → ESLint rules
tailwind.config.js      → Tailwind CSS configuration
postcss.config.js       → PostCSS plugins
package.json            → Dependencies and scripts
```

### Development Tips

1. **Hot Module Replacement (HMR):**
   - Changes to files instantly reflected in browser
   - React component state preserved during refresh

2. **TypeScript Checking:**
   - Full type safety across the app
   - Hover over variables to see types

3. **ESLint Validation:**
   - Run `npm run lint` to check code quality
   - Fix automatically: `eslint . --fix`

4. **Debugging:**
   - Browser DevTools (F12)
   - React DevTools extension recommended
   - Network tab to inspect API calls

5. **Mock API Switching:**
   - Edit `src/utils/config.ts`
   - Set `USE_MOCK_API: false` for real backend
   - API calls automatically routed

### Folder Structure for New Features

When adding new features, follow this structure:

```
New Feature: User Notifications

src/
├── components/
│   └── Notification/
│       ├── Notification.tsx        (component)
│       ├── Notification.css        (styles)
│       └── index.ts                (export)
│
├── context/
│   └── NotificationContext.tsx      (state management)
│
├── hooks/
│   └── useNotification.ts           (access context)
│
├── api/
│   └── notifications.ts            (API calls)
│
├── types/
│   └── (update index.ts with types)
│
├── pages/
│   └── notifications/
│       └── NotificationsPage.tsx
│       └── NotificationsPage.css
│
└── config/
    └── (update routes.ts if needed)
```

### Common Development Commands

```bash
# Development
npm run dev                 # Start dev server

# Building
npm run build              # Production build
npm run preview            # Preview prod build locally

# Code Quality
npm run lint               # Check ESLint
npm run lint --fix         # Fix ESLint issues automatically

# Troubleshooting
npm install                # Reinstall dependencies
rm -r node_modules dist    # Clean install
npm cache clean --force    # Clear npm cache
```

### Performance Optimization

1. **Code Splitting:**
   - Lazy load pages using React.lazy
   - Reduces initial bundle size

2. **Image Optimization:**
   - Use compressed images
   - Consider WebP format for modern browsers

3. **CSS Optimization:**
   - Tailwind CSS automatically purges unused styles
   - Custom CSS minified in production

4. **Bundle Analysis:**
   - Use Vite's built-in analysis
   - Monitor bundle size growth

### Deployment Considerations

1. **Build Size:**
   - Check `dist/` folder size
   - Typically 200-400KB with gzip

2. **API Endpoints:**
   - Update `API_BASE_URL` before deployment
   - Set `USE_MOCK_API: false` for real backend

3. **Environment Variables:**
   - Create `.env.production`
   - Add backend API URL
   - Other config values

4. **Security:**
   - Tokens stored in localStorage (consider httpOnly cookies)
   - Implement CSRF protection
   - Validate all user inputs

---

## Summary

This frontend is a **complete, production-ready restaurant management system** with:

✅ **Multi-role authentication & authorization**
✅ **Real-time order management**
✅ **Inventory & staff management**
✅ **Kitchen display system**
✅ **Waiter service workflow**
✅ **Analytics & reporting**
✅ **QR code integration**
✅ **Mock API for testing**
✅ **Type-safe with TypeScript**
✅ **Modern React patterns with Hooks & Context**
✅ **Responsive CSS with Tailwind**
✅ **Complete documentation**

### Quick Links to Key Files

- **Main App:** [App.tsx](../src/App.tsx)
- **Routes:** [config/routes.ts](../src/config/routes.ts)
- **Authentication:** [context/AuthContext.tsx](../src/context/AuthContext.tsx)
- **Shopping Cart:** [context/CartContext.tsx](../src/context/CartContext.tsx)
- **Button Component:** [components/Button/Button.tsx](../src/components/Button/Button.tsx)
- **Modal Component:** [components/Modal.tsx](../src/components/Modal.tsx)
- **Type Definitions:** [types/index.ts](../src/types/index.ts)
- **API Functions:** [api/](../src/api/)
- **Utilities:** [utils/](../src/utils/)

---

**Document Version:** 1.0
**Last Updated:** 2024-12-01
**Compatible Frontend Version:** React 19+, TypeScript 5.9+
