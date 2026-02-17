# Frontend Logic Documentation

## Overview

This document outlines the core logic, architecture, and design decisions for the Restaurant Management System frontend. The system is built with **React 18 + TypeScript + Vite + Tailwind CSS** and follows a role-based architecture with distinct UI experiences for different user types.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Authentication Logic](#authentication-logic)
3. [State Management](#state-management)
4. [Routing & Navigation](#routing--navigation)
5. [Role-Based Access Control](#role-based-access-control)
6. [UI/UX Strategy](#uiux-strategy)
7. [Cart Logic](#cart-logic)
8. [Table Management](#table-management)
9. [API Communication](#api-communication)
10. [Error Handling](#error-handling)

---

## Architecture Overview

### Project Structure

```
frontend/
├── src/
│   ├── api/              # API client functions (auth, menu, order, kitchen, admin)
│   ├── components/       # Reusable UI components
│   ├── config/           # Configuration (API endpoints, routes)
│   ├── context/          # React Context for global state
│   │   ├── AuthContext.tsx      # User authentication state
│   │   ├── CartContext.tsx      # Shopping cart state
│   │   └── TableContext.tsx     # Table selection state
│   ├── pages/            # Page components organized by role
│   │   ├── customer/     # Mobile-optimized customer pages
│   │   ├── admin/        # Desktop-optimized admin pages
│   │   ├── kitchen/      # Desktop-optimized kitchen pages
│   │   └── auth/         # Authentication pages
│   ├── services/         # Business logic & mock data
│   └── utils/            # Helper functions (JWT, API, validation)
└── docs/                 # Documentation
```

### Key Design Principles

1. **Role-Based UI Segregation**: Different UI experiences for customers, admins, and kitchen staff
2. **Mobile-First for Customers**: Customer pages optimized for mobile/tablet devices
3. **Desktop-First for Staff**: Admin and kitchen pages designed for desktop workflows
4. **Context-Based State Management**: React Context API for global state (auth, cart, table)
5. **Type Safety**: Full TypeScript coverage for type safety
6. **Protected Routes**: Role-based route protection
7. **Token-Based Authentication**: JWT access/refresh token system

---

## Authentication Logic

### Authentication Flow

```
┌─────────────┐
│   Login     │
│   Page      │
└──────┬──────┘
       │
       ├─► User enters credentials (email, password)
       │
       ├─► Form validation (Zod schema)
       │
       ├─► POST /api/auth/login
       │
       ├─► Receive tokens (accessToken, refreshToken)
       │
       ├─► Store tokens in localStorage
       │
       ├─► Load user profile (GET /api/profile/me)
       │
       └─► Redirect based on role:
           ├─► Customer (role=1) → /menu
           ├─► Admin (role=2)    → /admin/dashboard
           └─► Kitchen (role=3)  → /kitchen
```

### AuthContext Implementation

**Location**: `src/context/AuthContext.tsx`

**Responsibilities**:
- Maintain user authentication state
- Load user profile on app initialization
- Handle logout
- Persist table ID (for customers)
- Provide authentication status to components

**Key Functions**:

```typescript
interface AuthContextType {
  user: UserProfile | null;           // Current user data
  tableId: number | string | null;    // Selected table ID
  isLoading: boolean;                 // Loading state
  isAuthenticated: boolean;           // Auth status
  error: string | null;               // Error message
  logout: () => void;                 // Logout function
  refreshUser: () => Promise<void>;   // Refresh user profile
  setError: (error: string | null) => void;
  setTableId: (id: number | string | null) => void;
}
```

**Initialization Logic**:

1. **On App Load**:
   - Check URL for `?tableId=X` parameter
   - If found, save to localStorage and state
   - If not found, check localStorage for persisted tableId
   - Check for accessToken in localStorage
   - If token exists, fetch user profile
   - Set loading to false

2. **Profile Loading**:
   ```typescript
   const refreshUser = async () => {
     try {
       const profile = await getProfile(); // GET /api/profile/me
       setUser(profile);
     } catch (err) {
       // Token invalid or expired
       setUser(null);
     }
   };
   ```

3. **Logout**:
   ```typescript
   const logout = () => {
     clearTokens();              // Remove tokens from localStorage
     setUser(null);             // Clear user state
     setTableId(null);          // Clear table ID
     window.location.href = "/login";  // Redirect to login
   };
   ```

### Token Management

**Location**: `src/utils/jwt.ts`

**Storage Strategy**: `localStorage`

**Stored Items**:
- `accessToken`: Short-lived JWT token for API requests
- `refreshToken`: Long-lived token for refreshing access token
- `restaurantTableId`: Selected table number (customers only)

**Token Refresh Logic**:

```typescript
// In utils/api.ts
async function refreshAccessToken() {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return false;

  try {
    const res = await fetch(`${BASE_URL}auth/refresh`, {
      method: "POST",
      body: JSON.stringify({ refreshToken }),
    });

    if (!res.ok) return false;

    const newAccessToken = await res.text();
    setAccessToken(newAccessToken);
    return true;
  } catch {
    return false;
  }
}
```

**Auto-Refresh on 401/403**:

When an API request returns 401 or 403:
1. Attempt to refresh access token
2. If successful, retry the original request
3. If failed, clear tokens and redirect to login

### Registration Flow

```
┌──────────────┐
│   Register   │
│   Page       │
└──────┬───────┘
       │
       ├─► User fills form (fullName, email, password, phone)
       │
       ├─► Form validation (Zod schema)
       │   ├─► Email format validation
       │   ├─► Password strength (min 6 chars)
       │   └─► Phone number format
       │
       ├─► POST /api/auth/register
       │
       ├─► Receive user data (without tokens)
       │
       └─► Redirect to /login for authentication
```

**Default Role Assignment**:
- New users registered via customer flow → Role 1 (Customer)
- Admin users created via admin panel → Role 2 or 3 (Admin/Kitchen)

---

## State Management

### Context Providers

The app uses React Context API for global state management with three main contexts:

#### 1. AuthContext

**Purpose**: Manage user authentication and session

**State**:
- `user`: User profile data (id, fullName, email, role, phone)
- `tableId`: Selected table number
- `isLoading`: Initial loading state
- `isAuthenticated`: Boolean authentication status
- `error`: Error messages

**Usage**:
```typescript
import { useAuth } from '../context/AuthContext';

const { user, isAuthenticated, logout } = useAuth();
```

#### 2. CartContext

**Purpose**: Manage shopping cart state (customers only)

**State**:
- `cartItems`: Array of items in cart with quantities and notes
- Cart operations: `addToCart`, `removeFromCart`, `updateQuantity`, `updateNotes`
- Cart calculations: `getTotalPrice`, `getTotalItems`

**Usage**:
```typescript
import { useCart } from '../context/CartContext';

const { cartItems, addToCart, getTotalPrice } = useCart();
```

**Cart Item Structure**:
```typescript
interface CartItem extends MenuItem {
  quantity: number;
  notes?: string;  // Special instructions
}
```

**Key Logic**:

1. **Add to Cart**:
   - If item exists, increment quantity
   - If new item, add to array with quantity 1
   - Optional notes for special requests

2. **Update Quantity**:
   - If quantity <= 0, remove item
   - Otherwise update quantity

3. **Price Calculation**:
   ```typescript
   const getTotalPrice = () => 
     cartItems.reduce((total, item) => 
       total + item.price * item.quantity, 0
     );
   ```

#### 3. TableContext

**Purpose**: Manage table selection for dine-in customers

**State**:
- `tableId`: Selected table number
- `setTableId`: Function to update table

**Persistence**:
- Saved to localStorage as `restaurantTableId`
- Loaded from URL parameter `?tableId=X`
- URL parameter takes priority over localStorage

**Usage**:
```typescript
import { useTable } from '../context/TableContext';

const { tableId, setTableId } = useTable();
```

**Table ID Flow**:

1. Customer scans QR code → URL includes `?tableId=5`
2. TableContext detects URL parameter
3. Saves to localStorage for persistence
4. User navigates around app, tableId persists
5. On logout, tableId is cleared

---

## Routing & Navigation

### Route Configuration

**Location**: `src/config/routes.ts`

**Route Structure**:
```typescript
const ROUTES = {
  LOGIN: {
    path: "/login",
    name: "Login",
    public: true,
  },
  MENU: {
    path: "/menu",
    name: "Menu",
    public: false,
    requiredRoles: [1, 2, 3],  // All authenticated users
  },
  ADMIN_DASHBOARD: {
    path: "/admin/dashboard",
    name: "Admin Dashboard",
    public: false,
    requiredRoles: [2],  // Admin only
  },
  KITCHEN_ORDERS: {
    path: "/kitchen/orders",
    name: "Kitchen Orders",
    public: false,
    requiredRoles: [3],  // Kitchen staff only
  },
};
```

### Route Protection

#### ProtectedRoute Component

**Location**: `src/components/ProtectedRoute.tsx`

**Purpose**: Ensure user is authenticated before accessing route

**Logic**:
```typescript
if (isLoading) return <LoadingSpinner />;
if (!isAuthenticated) return <Navigate to="/login" />;
return <>{children}</>;
```

#### RoleProtectedRoute Component

**Location**: `src/components/RoleProtectedRoute.tsx`

**Purpose**: Ensure user has required role for route

**Logic**:
```typescript
if (isLoading) return <LoadingSpinner />;
if (!isAuthenticated) return <Navigate to="/login" />;
if (!requiredRoles.includes(user.role)) return <Navigate to="/unauthorized" />;
return <>{children}</>;
```

### Navigation Structure

**Customer Navigation** (Mobile UI):
```
/menu → /order → /profile
  ↓
[Cart] → Checkout
```

**Admin Navigation** (Desktop UI):
```
/admin/dashboard → /admin/menu → /admin/staff → /admin/orders
```

**Kitchen Navigation** (Desktop UI):
```
/kitchen → [Order queue management]
```

---

## Role-Based Access Control

### User Roles

| Role ID | Role Name | Description |
|---------|-----------|-------------|
| 1 | Customer | Dine-in or takeaway customers |
| 2 | Admin | Restaurant managers and administrators |
| 3 | Kitchen | Kitchen staff for order management |

### Role Permissions

#### Customer (Role 1)

**Allowed Actions**:
- Browse menu
- Add items to cart
- Place orders
- View order history
- Update profile
- Select table (dine-in)

**Routes**:
- `/menu`
- `/order`
- `/profile`
- `/table-select`

**UI**: Mobile-optimized, touch-friendly, simplified navigation

#### Admin (Role 2)

**Allowed Actions**:
- View dashboard analytics
- Manage menu items (CRUD)
- Manage staff accounts
- View all orders
- Update order status
- View reports

**Routes**:
- `/admin/dashboard`
- `/admin/menu`
- `/admin/staff`
- `/admin/orders`

**UI**: Desktop-first, data-heavy tables, advanced filters

#### Kitchen (Role 3)

**Allowed Actions**:
- View incoming orders
- Update order status (PENDING → PREPARING → READY)
- View menu (read-only)
- Update profile

**Routes**:
- `/kitchen`
- `/menu` (read-only)
- `/profile`

**UI**: Desktop-first, real-time updates, large cards for order tickets

### Authorization Checks

**Frontend Authorization**:
```typescript
// Route-level protection
<RoleProtectedRoute requiredRoles={[2]}>
  <AdminDashboard />
</RoleProtectedRoute>

// Component-level checks
{user?.role === 2 && <AdminButton />}
```

**Backend Authorization**:
- All API requests include `Authorization: Bearer <token>`
- Backend validates token and role before processing
- Frontend re-validates on response

---

## UI/UX Strategy

### Mobile-First Design (Customers)

**Target Devices**: Smartphones (375px - 428px), Tablets (768px - 1024px)

**Design Principles**:

1. **Touch-Optimized**:
   - Large tap targets (min 44x44px)
   - Swipe gestures for cart sidebar
   - Pull-to-refresh on order list

2. **Simplified Navigation**:
   - Bottom navigation bar
   - Minimal steps to checkout
   - Persistent cart badge

3. **Vertical Scrolling**:
   - Single-column layout
   - Card-based menu items
   - Infinite scroll for menu

4. **Mobile Performance**:
   - Lazy loading images
   - Optimized bundle size
   - Fast transitions

**Customer Pages**:
```
CustomerLogin       → Full-screen form with large inputs
CustomerMenu        → Grid of menu cards, sticky category filters
CustomerOrders      → Timeline of order status
CustomerProfile     → Simple form with large buttons
CartSidebar         → Slide-in panel from right
```

### Desktop-First Design (Admin & Kitchen)

**Target Devices**: Desktop (1280px+), Laptop (1024px+)

**Design Principles**:

1. **Data Density**:
   - Multi-column layouts
   - Data tables with sorting/filtering
   - Dashboard widgets

2. **Keyboard Navigation**:
   - Tab navigation
   - Keyboard shortcuts
   - Search-first interfaces

3. **Multi-Panel Layouts**:
   - Sidebar + main content
   - Modal dialogs for forms
   - Split views

4. **Desktop Performance**:
   - Real-time updates (WebSocket/polling)
   - Excel export functionality
   - Batch operations

**Admin Pages**:
```
AdminDashboard      → Grid of analytics cards, charts
AdminMenuPage       → Table with inline editing
AdminStaffPage      → User management table
AdminOrdersPage     → Filterable order list
```

**Kitchen Pages**:
```
KitchenDisplayPage  → Kanban board (Pending → Preparing → Ready)
OrderTicket         → Large card with order details
```

### Responsive Breakpoints

```css
/* Mobile First */
default: 375px - 767px

/* Tablet */
@media (min-width: 768px)

/* Desktop */
@media (min-width: 1024px)

/* Large Desktop */
@media (min-width: 1280px)
```

### Theme & Styling

**Technology**: Tailwind CSS

**Color Scheme**:
- Primary: Indigo/Blue (buttons, links)
- Success: Green (order status)
- Warning: Yellow (pending orders)
- Danger: Red (errors, delete)
- Neutral: Gray scale

**Dark Mode**: Supported via Tailwind dark mode classes

---

## Cart Logic

### Cart State Management

**Location**: `src/context/CartContext.tsx`

**State Structure**:
```typescript
interface CartItem {
  id: number;
  name: string;
  price: number;
  category: string;
  description: string;
  image: string;
  quantity: number;
  notes?: string;  // Special instructions
}
```

### Cart Operations

#### 1. Add to Cart

```typescript
const addToCart = (item: MenuItem, quantity: number, notes?: string) => {
  setCartItems((prev) => {
    const existing = prev.find((ci) => ci.id === item.id);
    
    if (existing) {
      // Item exists: Increment quantity
      return prev.map((ci) =>
        ci.id === item.id
          ? { ...ci, quantity: ci.quantity + quantity, notes: notes || ci.notes }
          : ci
      );
    }
    
    // New item: Add to cart
    return [...prev, { ...item, quantity, notes }];
  });
};
```

**UI Feedback**:
- Toast notification: "Added to cart"
- Cart badge updates with total items
- Temporary highlight on "Add to Cart" button

#### 2. Remove from Cart

```typescript
const removeFromCart = (id: number) => {
  setCartItems((prev) => prev.filter((item) => item.id !== id));
};
```

**UI Confirmation**:
- Optional: Confirm dialog before removal
- Undo option (toast with "Undo" button)

#### 3. Update Quantity

```typescript
const updateQuantity = (id: number, quantity: number) => {
  if (quantity <= 0) {
    removeFromCart(id);
    return;
  }
  setCartItems((prev) =>
    prev.map((item) => (item.id === id ? { ...item, quantity } : item))
  );
};
```

**UI Controls**:
- `[-]` button: Decrement quantity
- `[+]` button: Increment quantity
- Input field: Direct entry

#### 4. Add Notes

```typescript
const updateNotes = (id: number, notes: string) => {
  setCartItems((prev) =>
    prev.map((item) => (item.id === id ? { ...item, notes } : item))
  );
};
```

**Use Case**: Special requests like "No onions", "Extra spicy"

#### 5. Calculate Total

```typescript
const getTotalPrice = () => 
  cartItems.reduce((total, item) => total + item.price * item.quantity, 0);

const getTotalItems = () => 
  cartItems.reduce((total, item) => total + item.quantity, 0);
```

**Display**:
- Subtotal: Sum of all items
- Service charge: 10% of subtotal
- Total: Subtotal + service charge

#### 6. Clear Cart

```typescript
const clearCart = () => setCartItems([]);
```

**When Called**:
- After successful order placement
- User clicks "Clear Cart"
- On logout (optional)

### Cart Persistence

**Current Implementation**: In-memory only (cart cleared on refresh)

**Future Enhancement**: Persist to localStorage or backend

```typescript
// Save to localStorage
useEffect(() => {
  localStorage.setItem('cart', JSON.stringify(cartItems));
}, [cartItems]);

// Load from localStorage on init
const [cartItems, setCartItems] = useState(() => {
  const saved = localStorage.getItem('cart');
  return saved ? JSON.parse(saved) : [];
});
```

### Checkout Flow

```
Cart → Review Items → Enter Table ID → Confirm → Place Order → Clear Cart
```

**API Call**:
```typescript
POST /api/orders
{
  "tableId": 5,
  "items": [
    { "menuItemId": 1, "quantity": 2, "notes": "No onions" },
    { "menuItemId": 3, "quantity": 1 }
  ]
}
```

---

## Table Management

### Table Selection Flow

**Purpose**: Associate customer orders with physical restaurant tables

**Flow**:

1. **QR Code Scan**:
   - Customer scans QR code at table
   - QR contains URL: `https://restaurant.com/menu?tableId=5`

2. **URL Parameter Detection**:
   ```typescript
   // In TableContext
   useEffect(() => {
     const params = new URLSearchParams(location.search);
     const tableFromUrl = params.get("tableId");
     
     if (tableFromUrl) {
       setTableId(tableFromUrl);
       localStorage.setItem("restaurantTableId", tableFromUrl);
     }
   }, [location]);
   ```

3. **Persistence**:
   - Saved to localStorage
   - Included in login/register requests
   - Sent with every order

4. **Display**:
   - Customer header shows: "Table 5"
   - Order confirmation shows table number

**Fallback**:
- If no tableId, customer can manually select from list
- Route: `/table-select`

### Table Context Implementation

```typescript
// TableContext.tsx
const [tableId, setTableIdState] = useState(() => {
  // Initialize from localStorage
  return localStorage.getItem("restaurantTableId");
});

const setTableId = (id: string | null) => {
  setTableIdState(id);
  if (id) {
    localStorage.setItem("restaurantTableId", id);
  } else {
    localStorage.removeItem("restaurantTableId");
  }
};
```

**Table ID Lifecycle**:

1. Customer scans QR → tableId saved
2. Customer browses menu → tableId persists
3. Customer places order → tableId sent to backend
4. Customer logs out → tableId cleared (optional: can persist for next visit)

---

## API Communication

### API Client Setup

**Location**: `src/utils/api.ts`

**Base Configuration**:
```typescript
const BASE_URL = import.meta.env.VITE_BASE_URL;  // http://localhost:8080/api/
```

### fetchWithAuth Utility

**Purpose**: Centralized API client with automatic token management

**Features**:
1. Auto-attach Authorization header
2. Auto-refresh expired tokens
3. Auto-redirect on auth failure
4. Consistent error handling

**Implementation**:
```typescript
export async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
  // Attach access token
  options.headers = {
    ...options.headers,
    'Authorization': `Bearer ${getAccessToken()}`
  };

  let res = await fetch(`${BASE_URL}${endpoint}`, options);

  // Handle 401/403: Refresh token and retry
  if (res.status === 401 || res.status === 403) {
    const refreshed = await refreshAccessToken();
    
    if (!refreshed) {
      clearTokens();
      window.location.href = "/login";
      return;
    }
    
    // Retry with new token
    options.headers['Authorization'] = `Bearer ${getAccessToken()}`;
    res = await fetch(`${BASE_URL}${endpoint}`, options);
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Error ${res.status}`);
  }

  return res.json();
}
```

### API Modules

#### 1. Auth API (`src/api/auth.ts`)

```typescript
// Login
POST /api/auth/login
Body: { email, password, tableId? }
Response: { accessToken, refreshToken, tokenType }

// Register
POST /api/auth/register
Body: { fullName, email, password, role, phone?, provider? }
Response: { id, email, fullName, role, phone, createdAt }

// Get Profile
GET /api/profile/me
Headers: { Authorization: Bearer <token> }
Response: { id, fullName, email, phone, role, provider }

// Update Profile
PUT /api/profile/me
Body: { fullName?, email?, phone?, password? }
Response: Updated profile

// Logout
POST /api/auth/logout
```

#### 2. Menu API (`src/api/menu.ts`)

```typescript
// Get all menu items
GET /api/menu
Response: MenuItem[]

// Get menu item by ID
GET /api/menu/:id
Response: MenuItem

// Create menu item (Admin only)
POST /api/menu
Body: { name, description, price, category, image, isActive }

// Update menu item (Admin only)
PUT /api/menu/:id
Body: Partial<MenuItem>

// Delete menu item (Admin only)
DELETE /api/menu/:id
```

#### 3. Order API (`src/api/order.ts`)

```typescript
// Place order (Customer)
POST /api/orders
Body: {
  tableId: number,
  items: [{ menuItemId, quantity, notes? }]
}
Response: { orderId, status, total, createdAt }

// Get user orders (Customer)
GET /api/orders/my-orders
Response: Order[]

// Get all orders (Admin/Kitchen)
GET /api/orders
Query: ?status=PENDING&tableId=5
Response: Order[]

// Update order status (Kitchen/Admin)
PATCH /api/orders/:id/status
Body: { status: "PREPARING" | "READY" | "DELIVERED" }
```

#### 4. Admin API (`src/api/admin.ts`)

```typescript
// Get dashboard stats
GET /api/admin/stats
Response: {
  totalOrders: number,
  totalRevenue: number,
  activeCustomers: number,
  popularItems: MenuItem[]
}

// Manage staff
GET /api/admin/staff
POST /api/admin/staff
PUT /api/admin/staff/:id
DELETE /api/admin/staff/:id
```

#### 5. Kitchen API (`src/api/kitchen.ts`)

```typescript
// Get kitchen queue
GET /api/kitchen/orders
Query: ?status=PENDING
Response: Order[]

// Update order status
PATCH /api/kitchen/orders/:id/status
Body: { status: "PREPARING" | "READY" }
```

### Error Handling

**HTTP Status Codes**:
- `200`: Success
- `201`: Created
- `400`: Bad Request (validation error)
- `401`: Unauthorized (invalid/expired token)
- `403`: Forbidden (insufficient permissions)
- `404`: Not Found
- `500`: Internal Server Error

**Error Response Format**:
```json
{
  "message": "Error description",
  "statusCode": 400,
  "timestamp": "2024-02-14T10:30:00Z"
}
```

**Frontend Error Handling**:
```typescript
try {
  const data = await fetchWithAuth("orders", { method: "POST", ... });
  // Success handling
} catch (err) {
  if (err instanceof Error) {
    setError(err.message);
  } else {
    setError("An unexpected error occurred");
  }
}
```

---

## Error Handling

### Error Types

#### 1. Network Errors

**Causes**:
- API server down
- Network disconnection
- Timeout

**Handling**:
```typescript
try {
  await fetchWithAuth(...);
} catch (err) {
  setError("Unable to connect to server. Please check your connection.");
}
```

**UI**:
- Toast notification
- Retry button
- Offline indicator

#### 2. Authentication Errors

**Causes**:
- Expired token
- Invalid token
- Missing token

**Handling**:
```typescript
// Automatic in fetchWithAuth
if (res.status === 401) {
  const refreshed = await refreshAccessToken();
  if (!refreshed) {
    clearTokens();
    window.location.href = "/login";
  }
}
```

**UI**:
- Redirect to login
- "Session expired" message

#### 3. Validation Errors

**Causes**:
- Invalid form input
- Missing required fields

**Handling**:
```typescript
// Using React Hook Form + Zod
const { register, handleSubmit, formState: { errors } } = useForm({
  resolver: zodResolver(loginSchema),
});

// Display field-level errors
{errors.email && <span className="error">{errors.email.message}</span>}
```

**UI**:
- Red border on invalid fields
- Error message below field
- Prevent submission

#### 4. Authorization Errors

**Causes**:
- User lacks required role
- Accessing forbidden resource

**Handling**:
```typescript
// Route protection
if (!requiredRoles.includes(user.role)) {
  return <Navigate to="/unauthorized" />;
}
```

**UI**:
- Redirect to `/unauthorized`
- Display "Access Denied" message
- Link to go back

#### 5. Business Logic Errors

**Causes**:
- Order already processed
- Menu item out of stock
- Invalid table ID

**Handling**:
```typescript
try {
  await placeOrder(orderData);
} catch (err) {
  if (err.message.includes("out of stock")) {
    setError("Some items are out of stock. Please update your cart.");
  }
}
```

**UI**:
- Modal with error message
- Suggested actions
- Close button

### Error Boundary

**Location**: `src/components/ErrorBoundary.tsx`

**Purpose**: Catch React rendering errors

**Usage**:
```tsx
<ErrorBoundary>
  <App />
</ErrorBoundary>
```

**Fallback UI**:
- Friendly error message
- "Go to Home" button
- Error details (dev mode only)

### Global Error States

**In Context**:
```typescript
// AuthContext
const [error, setError] = useState<string | null>(null);

// Clear error on navigation
useEffect(() => {
  setError(null);
}, [location.pathname]);
```

**Error Display Component**:
```tsx
{error && (
  <div className="error-toast">
    <span>{error}</span>
    <button onClick={() => setError(null)}>×</button>
  </div>
)}
```

---

## Best Practices & Patterns

### 1. Form Validation

**Library**: React Hook Form + Zod

**Pattern**:
```typescript
// Define schema
const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

// Use in form
const { register, handleSubmit, formState: { errors } } = useForm({
  resolver: zodResolver(loginSchema),
});
```

### 2. Optimistic UI Updates

**Use Case**: Add to cart, update order status

**Pattern**:
```typescript
const handleAddToCart = (item) => {
  // Optimistic update
  addToCart(item, 1);
  
  // Show feedback
  toast.success("Added to cart");
  
  // No need to wait for server (cart is local)
};
```

### 3. Loading States

**Pattern**:
```typescript
const [isLoading, setIsLoading] = useState(false);

const fetchData = async () => {
  setIsLoading(true);
  try {
    const data = await fetchWithAuth("menu");
    setMenu(data);
  } finally {
    setIsLoading(false);
  }
};

// UI
{isLoading ? <Spinner /> : <MenuList items={menu} />}
```

### 4. Debounced Search

**Pattern**:
```typescript
const [searchQuery, setSearchQuery] = useState('');
const debouncedSearch = useDebounce(searchQuery, 300);

useEffect(() => {
  if (debouncedSearch) {
    searchMenu(debouncedSearch);
  }
}, [debouncedSearch]);
```

### 5. Lazy Loading

**Pattern**:
```typescript
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));

<Suspense fallback={<Loading />}>
  <AdminDashboard />
</Suspense>
```

---

## Security Considerations

### 1. Token Storage

**Current**: localStorage
**Risk**: XSS attacks can access localStorage
**Mitigation**:
- Use httpOnly cookies (requires backend support)
- Implement Content Security Policy (CSP)
- Sanitize user input

### 2. Password Handling

- Never log passwords
- Use HTTPS in production
- Validate password strength
- Hash on backend (frontend sends plain text over HTTPS)

### 3. Role Validation

**Frontend**:
- Route protection
- Conditional rendering based on role

**Backend** (Critical):
- All endpoints must validate user role
- Frontend checks are for UX only, not security

### 4. API Security

- Always include Authorization header
- Validate tokens on every request
- Use short-lived access tokens
- Implement CORS properly

### 5. Input Sanitization

- Validate all user input
- Use Zod schemas for type safety
- Escape HTML in user-generated content
- Prevent SQL injection (backend)

---

## Performance Optimization

### 1. Code Splitting

**Implementation**: React.lazy + Suspense

**Strategy**:
- Split by route (customer vs admin vs kitchen)
- Split by feature (dashboard, menu management)
- Lazy load heavy components

### 2. Memoization

**Pattern**:
```typescript
// Expensive calculations
const totalPrice = useMemo(() => 
  cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
  [cartItems]
);

// Callback stability
const handleAddToCart = useCallback((item) => {
  addToCart(item, 1);
}, [addToCart]);
```

### 3. Image Optimization

- Use WebP format with fallbacks
- Lazy load images (Intersection Observer)
- Serve different sizes for mobile/desktop
- Placeholder blur effect

### 4. Bundle Size

**Vite Configuration**:
- Tree shaking (automatic)
- Minification in production
- Gzip compression
- Analyze bundle with `rollup-plugin-visualizer`

### 5. API Optimization

- Implement pagination for large lists
- Use query parameters for filtering
- Cache static data (menu items)
- Debounce search requests

---

## Future Enhancements

### 1. Real-Time Updates

**Technology**: WebSockets or Server-Sent Events

**Use Cases**:
- Kitchen: New order notifications
- Customer: Order status updates
- Admin: Real-time dashboard

**Implementation**:
```typescript
const socket = new WebSocket('ws://localhost:8080/ws');

socket.on('orderStatusUpdate', (data) => {
  updateOrderStatus(data.orderId, data.status);
  toast.info(`Order #${data.orderId} is now ${data.status}`);
});
```

### 2. Progressive Web App (PWA)

**Features**:
- Offline support
- Add to home screen
- Push notifications
- Background sync

**Tools**: Vite PWA plugin

### 3. Multi-Language Support

**Implementation**: i18next

**Languages**: English, Sinhala, Tamil

### 4. Payment Integration

**Providers**: Stripe, PayPal, local payment gateways

**Flow**:
- Cart → Checkout → Payment → Order Confirmation

### 5. Analytics

**Tools**: Google Analytics, Mixpanel

**Metrics**:
- User behavior tracking
- Popular menu items
- Conversion funnel
- Performance metrics

### 6. Advanced Features

- Voice ordering (speech recognition)
- AR menu preview
- Loyalty points system
- Social media integration
- Reviews and ratings

---

## Testing Strategy

### 1. Unit Tests

**Framework**: Vitest + React Testing Library

**Coverage**:
- Utility functions (JWT, validation)
- Context providers
- API client functions

**Example**:
```typescript
describe('CartContext', () => {
  test('adds item to cart', () => {
    const { result } = renderHook(() => useCart(), {
      wrapper: CartProvider
    });
    
    act(() => {
      result.current.addToCart(mockItem, 1);
    });
    
    expect(result.current.cartItems).toHaveLength(1);
  });
});
```

### 2. Integration Tests

**Coverage**:
- Authentication flow
- Cart to checkout flow
- Order placement

### 3. E2E Tests

**Framework**: Playwright or Cypress

**Scenarios**:
- Complete customer journey (login → browse → order)
- Admin dashboard operations
- Kitchen order management

### 4. Accessibility Testing

**Tools**: axe-core, WAVE

**Checks**:
- Keyboard navigation
- Screen reader compatibility
- Color contrast
- ARIA labels

---

## Deployment

### Environment Variables

**Development** (.env.local):
```bash
VITE_BASE_URL=http://localhost:8080/api/
```

**Production** (.env.production):
```bash
VITE_BASE_URL=https://api.restaurant.com/api/
```

### Build Process

```bash
npm run build
```

**Output**: `dist/` folder with optimized assets

### Deployment Platforms

**Options**:
- Vercel (recommended for Vite)
- Netlify
- AWS S3 + CloudFront
- Azure Static Web Apps

**Configuration**: `vercel.json` (SPA routing)

```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

---

## Conclusion

This frontend follows a **role-based, context-driven architecture** with clear separation between customer (mobile) and staff (desktop) experiences. The authentication system uses JWT tokens with automatic refresh, while state management leverages React Context API for simplicity and type safety.

Key architectural decisions:
- **Mobile-first for customers** ensures excellent UX on primary device
- **Desktop-first for staff** optimizes for operational efficiency
- **Protected routes** ensure security at routing level
- **Context API** provides clean, type-safe global state
- **fetchWithAuth** centralizes API logic and token management

For additional details, refer to:
- [API Documentation](./api.md) - Full API endpoints and dummy data
- [Design Documentation](./design.md) - UI/UX designs and mockups
- [Flow Paths](../FLOW_PATHS.md) - User journey diagrams
