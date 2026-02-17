# Data Flow Architecture & API Gateway Integration
## Restaurant Management System - Frontend to Backend Communication

**Document Version:** 1.0  
**Last Updated:** February 16, 2026  
**Purpose:** Document how frontend handles data, manages state, and communicates with backend API gateway

---

## Table of Contents

1. [System Architecture Overview](#1-system-architecture-overview)
2. [Authentication Data Flow](#2-authentication-data-flow)
3. [Customer Order Data Flow](#3-customer-order-data-flow)
4. [Waiter Proxy Order & Cash Collection Flow](#4-waiter-proxy-order--cash-collection-flow)
5. [Admin Management Data Flow](#5-admin-management-data-flow)
6. [Kitchen Order Processing Flow](#6-kitchen-order-processing-flow)
7. [State Management & Storage](#7-state-management--storage)
8. [API Gateway Design Patterns](#8-api-gateway-design-patterns)
9. [API Request/Response Formats](#9-api-requestresponse-formats)
10. [Error Handling & Recovery](#10-error-handling--recovery)

---

## 1. System Architecture Overview

### Frontend Architecture Diagram
```
┌─────────────────────────────────────────────────────────────┐
│                     React Application                        │
├─────────────────────────────────────────────────────────────┤
│  Components                                                   │
│  ├── Authentication Pages (Login, Register, Profile)        │
│  ├── Customer Pages (Menu, Orders, Checkout)                │
│  ├── Admin Pages (Dashboard, Staff, Menu, Inventory, etc.)  │
│  ├── Kitchen Pages (Order Lists, Status Updates)            │
│  └── Waiter Pages (Proxy Orders, Cash Collections)          │
├─────────────────────────────────────────────────────────────┤
│  Context & State Management                                  │
│  ├── AuthContext (User, Roles, JWT Tokens)                  │
│  ├── CartContext (Shopping Cart Items)                      │
│  └── Local Component State (useRef, useState)               │
├─────────────────────────────────────────────────────────────┤
│  API Layer (src/api/)                                        │
│  ├── auth.ts (Login, Register, Profile)                     │
│  ├── menu.ts (Menu Items, Categories)                       │
│  ├── orders.ts (Place, Retrieve, Update Orders)             │
│  └── [Future: payment.ts, inventory.ts, staff.ts]           │
├─────────────────────────────────────────────────────────────┤
│  Data Persistence                                            │
│  ├── localStorage (JWT Tokens, Cart, QR Data)               │
│  ├── sessionStorage (Temporary View State)                  │
│  └── Backend Database (Real Data via API)                   │
├─────────────────────────────────────────────────────────────┤
│  Utils & Helpers                                             │
│  ├── api.ts (fetchWithAuth - HTTP client)                   │
│  ├── jwt.ts (Token Management)                              │
│  └── config.ts (Environment & Feature Flags)                │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│              API Gateway (Backend)                           │
├─────────────────────────────────────────────────────────────┤
│  Routes                                                      │
│  ├── /api/auth/* →  Auth Service                            │
│  ├── /api/profile/* → User Service                          │
│  ├── /api/menu/* → Menu Service                             │
│  ├── /api/orders/* → Order Service                          │
│  ├── /api/cashier/* → Cashier Service                       │
│  ├── /api/staff/* → Staff Service                           │
│  ├── /api/kitchen/* → Kitchen Service                       │
│  └── /api/inventory/* → Inventory Service                   │
├─────────────────────────────────────────────────────────────┤
│  Middleware                                                  │
│  ├── Authentication (JWT Validation)                        │
│  ├── Authorization (Role-based Access)                      │
│  ├── Request Validation (Schema)                            │
│  └── Error Handling (Standardized Responses)                │
├─────────────────────────────────────────────────────────────┤
│  Services & Database                                        │
│  ├── User Service ← Database                                │
│  ├── Order Service ← Database                               │
│  ├── Menu Service ← Cache Layer ← Database                  │
│  └── [Other Services]                                       │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Authentication Data Flow

### 2.1 Login Flow

```
User (Browser)
    │
    ├─ Input: Email, Password
    │
    ▼
┌─────────────────────────────────────────┐
│  Login Component (src/pages/auth/Login) │
│  ✓ Validates input                      │
│  ✓ Calls loginUser(email, password)     │
└─────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────┐
│  AuthContext (src/context/AuthContext)  │
│  ✓ Extracts tableId from URL (?tableId) │
│  ✓ Calls api.login()                    │
└─────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────┐
│  API Layer (src/api/auth.ts)            │
│  ✓ Creates request body                 │
│  ✓ Calls fetchWithAuth()                │
└─────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────┐
│  fetchWithAuth (src/utils/api.ts)       │
│  ✓ Adds Content-Type header             │
│  ✓ Sends to: POST /api/auth/login       │
│  ✓ Expects: application/json            │
└─────────────────────────────────────────┘
    │
    ▼
┌──────────────────────────────────────────┐
│  API Gateway                             │
│  ✓ Validates credentials                 │
│  ✓ Generates JWT tokens                  │
│  ✓ Returns {accessToken, refreshToken}  │
└──────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────┐
│  JWT Storage (src/utils/jwt.ts)         │
│  ✓ Saves tokens to localStorage         │
│    - Key: "auth_token"                  │
│    - Key: "refresh_token"               │
│  ✓ Sets token expiry tracking           │
└─────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────┐
│  AuthContext State Update               │
│  ✓ Sets isAuthenticated = true          │
│  ✓ Sets user profile                    │
│  ✓ Sets tableId from URL                │
│  ✓ Redirects to role-based path         │
└─────────────────────────────────────────┘
    │
    ▼
Landing Page (Role-based)
- Customer: /menu
- Admin: /admin
- Kitchen: /kitchen
- Waiter: /waiter
```

### 2.2 Token Refresh Flow

```
User makes API request
    │
    ▼
fetchWithAuth() adds Authorization header
    │
    ├─ Header: Authorization: Bearer {accessToken}
    │
    ▼
API Gateway validates token
    │
    ├─ Status 200: Request succeeds
    │
    └─ Status 401/403: Token expired, response.status === 401
        │
        ▼
    refreshAccessToken() called
        │
        ├─ POST /api/auth/refresh
        │ Body: { refreshToken }
        │
        ▼
    Backend validates refreshToken
        │
        ├─ Valid: Returns new accessToken
        │ Updated in localStorage
        │ Original request retried with new token
        │
        └─ Invalid: Clear tokens, redirect to /login
```

### 2.3 Data Structures

**Login Request:**
```typescript
{
  email: string;
  password: string;
}
```

**Login Response (Success):**
```typescript
{
  accessToken: string;      // JWT token for authenticated requests
  refreshToken: string;     // Token to refresh access token
  tokenType: "Bearer";      // Always Bearer for JWT
}
```

**Login Response (Error):**
```typescript
{
  error: string;
  message: string;
}
```

**AuthContext State:**
```typescript
{
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  tableId: string | null;
  role: number | undefined;
  loginUser: (email: string, password: string) => Promise<void>;
  logout: () => void;
  getAccessToken: () => string | null;
}
```

---

## 3. Customer Order Data Flow

### 3.1 Browse Menu Flow

```
Customer visits /menu
    │
    ▼
MenuPage Component loads
    │
    ├─ useEffect[] triggers
    │
    ▼
fetchCategories(), fetchMenuItems()
    │
    ▼
API Layer (src/api/menu.ts)
    │
    ├─ GET /api/menu/categories
    │ ├─ Response: [{ id, name, icon }, ...]
    │ │
    │ ├─ State: categories[] updated
    │ │
    │ └─ UI re-renders category filter buttons
    │
    ├─ GET /api/menu?categoryId=optional
    │ ├─ Response: [{ id, name, image, price, categoryId }, ...]
    │ │
    │ ├─ State: menuItems[] updated
    │ │
    │ └─ UI renders MenuCard components
    │
    └─ User can filter by category (UI state change)
       └─ Re-fetches with categoryId parameter
```

### 3.2 Add to Cart & Checkout Flow

```
Customer clicks "Add to Cart" on menu item
    │
    ▼
CartContext (src/context/CartContext)
    │
    ├─ Item added to cartItems array
    │ ├─ Structure: {
    │ │   id, name, price, quantity,
    │ │   image, specialNotes
    │ │ }
    │ │
    │ └─ localStorage updated (key: "cart_items")
    │    └─ Persists across page refresh
    │
    ▼
Cart sidebar shows updated count
    │
    ├─ User can edit quantity
    │ └─ cartItems[index].quantity++ or --
    │    └─ localStorage synced
    │
    ├─ User can edit special notes
    │ └─ cartItems[index].specialNotes = newNotes
    │    └─ localStorage synced
    │
    └─ User clicks "Checkout"
```

### 3.3 Place Order Flow

```
Customer submits checkout
    │
    ├─ Input validation
    │ ├─ tableId exists (from QR scan)
    │ ├─ cartItems not empty
    │ └─ paymentMethod selected
    │
    ▼
OrdersAPI.placeOrder(customerId, request)
    │
    ├─ Build request:
    │ {
    │   tableId: "5",
    │   items: [
    │     { menuItemId: 1, quantity: 2 },
    │     { menuItemId: 3, quantity: 1 }
    │   ]
    │ }
    │
    ▼
POST /api/orders
    │
    ├─ Headers:
    │ ├─ Authorization: Bearer {accessToken}
    │ └─ Content-Type: application/json
    │
    ▼
Backend validates:
    │
    ├─ User authenticated & authorized
    │ ├─ Menu items exist
    │ ├─ Prices match current prices
    │ └─ Stock available (if tracking)
    │
    ▼
Backend creates order:
    │
    ├─ Database INSERT order
    │ ├─ Generates orderId
    │ ├─ Records items, amount, time
    │ └─ Sets status = "PLACED"
    │
    ├─ Response:
    │ {
    │   orderId: "ORD-00123",
    │   status: "PLACED",
    │   totalAmount: 2500.00,
    │   estimatedTime: 20
    │ }
    │
    ▼
Frontend updates:
    │
    ├─ CartContext.clearCart()
    │ │
    │ ├─ localStorage cleared (cart_items)
    │ │
    │ └─ UI shows order confirmation
    │    ├─ Order ID displayed
    │    ├─ Estimated time shown
    │    └─ Redirect to order tracking
    │
    ▼
OrderTrackingPage shows live status
    │
    └─ GET /api/orders/{orderId} - polls for updates
```

### 3.4 Order Tracking Data Flow

```
Customer on OrderTrackingPage
    │
    ▼
useEffect[] triggers
    │
    ├─ GET /api/orders/{orderId}
    │
    ▼
Response Structure:
    │
    ├─ {
    │   id: "ORD-00123",
    │   status: "PREPARING",
    │   items: [
    │     { menuItemId: 1, name: "Burger", quantity: 2, price: 500 }
    │   ],
    │   totalAmount: 2500.00,
    │   estimatedTime: 20,
    │   createdAt: "2024-02-16T10:30:00Z",
    │   updatedAt: "2024-02-16T10:32:15Z"
    │ }
    │
    ▼
State Updates:
    │
    ├─ order state = response data
    │ ├─ Status badge updates (PLACED → PREPARING → READY → SERVED)
    │ ├─ Item details displayed
    │ └─ Estimated time countdown
    │
    ▼
Polling/WebSocket (Future Enhancement)
    │
    ├─ Frontend polls every 2 seconds
    │ ├─ GET /api/orders/{orderId}
    │ └─ Updates in real-time
    │
    └─ Or use WebSocket for push updates
       └─ Backend sends updates without polling
```

---

## 4. Waiter Proxy Order & Cash Collection Flow

### 4.1 Waiter Proxy Order Creation

```
Waiter visits /waiter/proxy-order
    │
    ├─ Browsable menu available
    │ └─ GET /api/menu (same as customer)
    │
    ▼
Waiter adds items to cart + selects table
    │
    ├─ CartContext manages items
    │ └─ Table ID selected from dropdown (admin-configured)
    │
    ▼
Waiter clicks "Place Proxy Order"
    │
    ├─ Request sent:
    │ {
    │   tableId: "5",
    │   items: [
    │     { menuItemId: 1, quantity: 2 }
    │   ]
    │ }
    │
    ▼
POST /api/orders (from Waiter context)
    │
    ├─ Backend identifies order as PROXY
    │ ├─ Sets createdBy: "waiter"
    │ └─ Status: "PLACED"
    │
    ▼
Response: { orderId: "ORD-00123", ... }
```

### 4.2 QR Code Generation Flow

```
After placeOrder() succeeds
    │
    ▼
QR Code auto-generated (no API call)
    │
    ├─ Data structure:
    │ {
    │   type: "PROXY_ORDER_PAYMENT",
    │   orderId: "ORD-00123",
    │   amount: 2500.00,
    │   timestamp: "2024-02-16T10:30:00Z",
    │   tableId: "5",
    │   paymentMethod: "CASH"
    │ }
    │
    ├─ QRCodeSVG component renders code
    │ └─ Uses qrcode.react library
    │
    ▼
QR Modal shown to waiter
    │
    ├─ View QR Code
    │ ├─ Print QR Code
    │ ├─ Copy QR Data (special feature)
    │ └─ Mark as Handed Over
    │
    ▼
"Copy QR Data" button
    │
    ├─ Uses navigator.clipboard.writeText()
    │ │
    │ └─ Copies JSON string to clipboard:
    │    {
    │      "type": "PROXY_ORDER_PAYMENT",
    │      "orderId": "ORD-00123",
    │      "amount": 2500.00,
    │      "timestamp": "2024-02-16T10:30:00Z",
    │      "tableId": "5",
    │      "paymentMethod": "CASH"
    │    }
    │
    └─ Waiter can paste in cashier page
```

### 4.3 Pending Cash Collections Management

```
After successful proxy order + QR generation
    │
    ▼
Save to localStorage
    │
    ├─ Key: "waiter_pending_cash_collections"
    │ │
    │ └─ Array structure:
    │    [
    │      {
    │        id: "ORD-00123",
    │        amount: 2500.00,
    │        tableId: "5",
    │        timestamp: "2024-02-16T10:30:00Z",
    │        status: "PENDING"
    │      }
    │    ]
    │
    └─ Persists across:
       ├─ Page refresh
       ├─ Browser restart
       └─ Tab changes
```

### 4.4 Cashier Cash Receipt Flow

```
Waiter gives cash to Cashier
    │
    ├─ Cashier at /admin/cashier
    │
    ▼
Waiter's options:
    │
    ├─ Option 1: Paste QR Data
    │ ├─ Waiter shows QR code (visual)
    │ ├─ Cashier scans with camera/phone
    │ └─ Data pasted in textarea
    │
    └─ Option 2: Copy & Send
      ├─ Waiter copies QR data
      ├─ Waiter sends via (manual/message)
      └─ Cashier pastes in textarea

    ▼
Cashier page - QR Input Textarea
    │
    ├─ Paste JSON data
    │ {
    │   "type": "PROXY_ORDER_PAYMENT",
    │   "orderId": "ORD-00123",
    │   "amount": 2500.00,
    │   ...
    │ }
    │
    ├─ Click "Scan QR" button
    │
    ▼
Frontend Validation:
    │
    ├─ Parse JSON
    ├─ Verify type === "PROXY_ORDER_PAYMENT"
    ├─ Check if already processed (duplicate check)
    │ └─ Cache in state to prevent double-processing
    │
    ├─ Show confirmation modal:
    │ {
    │   Order ID: ORD-00123
    │   Amount: ₹2,500.00
    │   Table: 5
    │   Time: 10:30 AM
    │   [Confirm] [Cancel]
    │ }
    │
    ▼
Cashier clicks "Confirm Receipt"
    │
    ├─ Save to localStorage:
    │ Key: "cashier_received_cash"
    │ [
    │   {
    │     orderId: "ORD-00123",
    │     amount: 2500.00,
    │     timestamp: "2024-02-16T10:35:00Z",
    │     receivedAt: "2024-02-16T10:35:00Z"
    │   }
    │ ]
    │
    ├─ Remove from waiter's pending list
    │ └─ Update waiter's localStorage:
    │    "waiter_pending_cash_collections"
    │    └─ Filter out orderId = "ORD-00123"
    │
    ├─ Show success message
    │ └─ "Cash received for Order ORD-00123"
    │
    ▼
Future: Backend Integration
    │
    └─ POST /api/cashier/receive-cash
       ├─ Request:
       │ {
       │   orderId: "ORD-00123",
       │   amount: 2500.00,
       │   paymentMethod: "CASH"
       │ }
       │
       └─ Response:
          {
            success: true,
            message: "Cash received",
            transactionId: "TXN-12345"
          }
```

### 4.5 Pending Collections UI Management

```
Waiter page shows "Pending Cash Collections" section
    │
    ├─ Loads from localStorage on mount
    │ └─ Runs loadPendingCollections() helper
    │
    ├─ Each collection card shows:
    │ ├─ Order ID
    │ ├─ Amount
    │ ├─ Table
    │ ├─ Timestamp
    │ │
    │ └─ Action buttons:
    │    ├─ "Show QR Code" → Opens modal
    │    └─ "Mark as Handed Over" → Removes from list
    │
    ├─ "Mark as Handed Over" flow:
    │ ├─ Removes from state
    │ ├─ Updates localStorage
    │ └─ No removal until cashier confirms
    │
    └─ Auto-removal after cashier processes
       └─ When waiter refreshes, pending list updates
          (Via polling or future WebSocket)
```

---

## 5. Admin Management Data Flow

### 5.1 Staff Management

```
Admin at /admin/staff
    │
    ▼
GET /api/staff
    │
    ├─ Response: [{ id, fullName, email, phone, role, createdAt }, ...]
    │
    └─ Populate staff table
       │
       ├─ User searches: Filters in-memory
       │ ├─ Input: name or email
       │ └─ No additional API call
       │
       ├─ User filters by role: Filters in-memory
       │ └─ No additional API call
       │
       ├─ User adds staff:
       │ ├─ Modal form
       │ ├─ POST /api/staff
       │ + Body: { fullName, email, phone, role }
       │ ├─ Response: { id, ... }
       │ └─ Add to staffList state
       │
       ├─ User edits staff:
       │ ├─ Modal form with current values
       │ ├─ PUT /api/staff/{id}
       │ ├─ Body: { fullName, email, phone, role }
       │ └─ Update staffList state
       │
       └─ User deletes staff:
          ├─ Confirm dialog
          ├─ DELETE /api/staff/{id}
          └─ Remove from staffList state
```

### 5.2 Menu Management

```
Admin at /admin/menu
    │
    ▼
GET /api/menu (with pagination/filters)
    │
    ├─ Display menu items in table
    │ ├─ Name, Category, Price, Availability
    │ └─ Action buttons: Edit, Delete
    │
    ├─ Add Menu Item:
    │ ├─ Form with:
    │ │ ├─ Name, Description
    │ │ ├─ Price, Category
    │ │ ├─ Image upload
    │ │ ├─ Is Spicy flag
    │ │ └─ Availability flag
    │ │
    │ ├─ POST /api/menu
    │ │ ├─ Headers: multipart/form-data (if image)
    │ │ └─ Body: { name, description, price, categoryId, available, isSpicy }
    │ │
    │ └─ Image upload strategy:
    │    ├─ Option 1: Upload to backend, store URL
    │    │ └─ POST /api/upload
    │    │    Response: { imageUrl: "..." }
    │    │
    │    └─ Option 2: Base64 in JSON
    │       └─ Include image as base64 in request
    │
    ├─ Edit Menu Item:
    │ ├─ PUT /api/menu/{id}
    │ └─ Same structure as POST
    │
    └─ Delete Menu Item:
       ├─ DELETE /api/menu/{id}
       └─ Remove from menuItems state
```

### 5.3 Inventory Management

```
Admin at /admin/inventory
    │
    ▼
GET /api/inventory
    │
    ├─ Response: {
    │   "1": { stock: 50, reorderLevel: 10 },
    │   "2": { stock: 5, reorderLevel: 10 },
    │   ...
    │ }
    │
    └─ Display inventory status
       │
       ├─ Item name, Current Stock, Reorder Level
       │ └─ Highlight low stock items (red)
       │
       ├─ Update stock:
       │ ├─ PUT /api/inventory/{itemId}
       │ ├─ Body: { stock: newValue }
       │ └─ Re-fetch inventory
       │
       └─ Mark for reorder:
          ├─ POST /api/inventory/reorder
          ├─ Body: { itemId: 2 }
          └─ Trigger notification (future)
```

---

## 6. Kitchen Order Processing Flow

### 6.1 Kitchen Dashboard

```
Kitchen staff at /kitchen
    │
    ▼
GET /api/orders/active (status: PLACED, PREPARING)
    │
    ├─ Response: [{ id, items, tableId, createdAt, status }, ...]
    │
    ├─ Auto-refresh every 2 seconds
    │ └─ useEffect interval polling
    │
    ├─ Sort by createdAt (oldest first)
    │ └─ Display oldest unfinished orders first
    │
    └─ For each order:
       │
       ├─ Order card shows:
       │ ├─ Order ID
       │ ├─ Table number
       │ ├─ Items with quantities
       │ ├─ Special notes
       │ └─ Time elapsed since order
       │
       ├─ Kitchen staff clicks "Start Preparing"
       │ ├─ PUT /api/orders/{orderId}/status
       │ ├─ Body: { status: "PREPARING" }
       │ ├─ Card moves to "Preparing" section
       │ └─ UI updates immediately
       │
       └─ Kitchen staff clicks "Ready to Serve"
          ├─ PUT /api/orders/{orderId}/status
          ├─ Body: { status: "READY" }
          ├─ Order moves to "Ready" section
          └─ Waiter gets notification (future: WebSocket)
```

---

## 7. State Management & Storage

### 7.1 Context API Usage

**AuthContext:**
```typescript
// Location: src/context/AuthContext.tsx
{
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  tableId: string | null;
  loginUser: (email, password) => Promise<void>;
  logout: () => void;
  registerUser: (data) => Promise<void>;
}
```

**CartContext:**
```typescript
// Location: src/context/CartContext.tsx
{
  cartItems: CartItem[];
  addToCart: (item) => void;
  removeFromCart: (itemId) => void;
  updateQuantity: (itemId, quantity) => void;
  updateNotes: (itemId, notes) => void;
  clearCart: () => void;
  totalPrice: number;
}
```

### 7.2 localStorage Schema

**Authentication:**
```
Key: "auth_token"
Value: "eyJhbGciOiJIUzI1NiIs..." (JWT)

Key: "refresh_token"
Value: "eyJhbGciOiJIUzI1NiIs..." (JWT)

Key: "user_role"
Value: 1 | 2 | 3 | 4 (Role ID)
```

**Shopping Cart:**
```
Key: "cart_items"
Value: [
  {
    id: 1,
    name: "Burger",
    price: 500,
    quantity: 2,
    specialNotes: "No onions",
    image: "url"
  }
]
```

**Waiter Cash Collections:**
```
Key: "waiter_pending_cash_collections"
Value: [
  {
    id: "ORD-00123",
    amount: 2500.00,
    tableId: "5",
    timestamp: "2024-02-16T10:30:00Z",
    status: "PENDING"
  }
]
```

**Cashier Received Cash:**
```
Key: "cashier_received_cash"
Value: [
  {
    orderId: "ORD-00123",
    amount: 2500.00,
    timestamp: "2024-02-16T10:30:00Z",
    receivedAt: "2024-02-16T10:35:00Z"
  }
]
```

**Table ID:**
```
Key: "table_id"
Value: "5" (String, from URL ?tableId=5)
```

---

## 8. API Gateway Design Patterns

### 8.1 API Gateway Responsibilities

The API gateway must:
1. **Authentication**: Validate JWT tokens on every request
2. **Authorization**: Check role-based permissions
3. **Routing**: Route requests to appropriate microservices
4. **Rate Limiting**: Prevent abuse
5. **CORS**: Handle cross-origin requests from React frontend
6. **Error Standardization**: Return consistent error format

### 8.2 Recommended API Gateway Architecture

```
┌─────────────────────────────────────────────────────┐
│              React Frontend (Port 5173)              │
└────────────────────┬────────────────────────────────┘
                     │ HTTP/HTTPS
                     ▼
┌─────────────────────────────────────────────────────┐
│         API Gateway (Port 8080)                     │
│  - Express.js / Node.js / Spring Boot / FastAPI   │
├─────────────────────────────────────────────────────┤
│ Middleware Chain:                                   │
│  1. CORS Middleware                                │
│  2. Request Logging                                │
│  3. Authentication (JWT Validation)                │
│  4. Authorization (Role-based)                     │
│  5. Request Validation                             │
│  6. Rate Limiting                                  │
│  7. Error Handling                                 │
├─────────────────────────────────────────────────────┤
│ Routes & Service Mapping:                          │
│  /api/auth/* → Auth Service (Port 3001)           │
│  /api/profile/* → User Service (Port 3002)        │
│  /api/menu/* → Menu Service (Port 3003)           │
│  /api/orders/* → Order Service (Port 3004)        │
│  /api/staff/* → Staff Service (Port 3005)         │
│  /api/inventory/* → Inventory Service (Port 3006) │
│  /api/cashier/* → Cashier Service (Port 3007)    │
│  /api/kitchen/* → Kitchen Service (Port 3004)     │
└────────────────────┬────────────────────────────────┘
                     │
        ┌────────────┼────────────┐
        │            │            │
        ▼            ▼            ▼
    Services      Cache       Database
```

### 8.3 CORS Configuration

**Required CORS Headers:**
```
Access-Control-Allow-Origin: http://localhost:5173
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
Access-Control-Allow-Credentials: true
```

**Example (Node.js/Express):**
```javascript
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

---

## 9. API Request/Response Formats

### 9.1 Standard Request Format

**Headers (All Endpoints Except Public):**
```
Content-Type: application/json
Authorization: Bearer {accessToken}
```

### 9.2 Standard Response Format

**Success Response (200):**
```json
{
  "success": true,
  "data": { /* response data */ },
  "message": "Operation successful"
}
```

**Error Response (400/401/403/500):**
```json
{
  "success": false,
  "error": "ERROR_CODE",
  "message": "Human-readable error message",
  "details": { /* optional additional info */ }
}
```

### 9.3 Common Error Codes

| Code | HTTP | Meaning |
|------|------|---------|
| `INVALID_CREDENTIALS` | 401 | Email or password incorrect |
| `TOKEN_EXPIRED` | 401 | Access token needs refresh |
| `UNAUTHORIZED` | 403 | Token valid but permission denied |
| `NOT_FOUND` | 404 | Resource doesn't exist |
| `VALIDATION_ERROR` | 400 | Request data invalid |
| `DUPLICATE_EMAIL` | 409 | Email already registered |
| `SERVER_ERROR` | 500 | Backend error |

---

## 10. Error Handling & Recovery

### 10.1 Frontend Error Handling Strategy

```
API Request
    │
    ├─ Network Error
    │ ├─ No internet connection
    │ ├─ Can't reach API gateway
    │ │
    │ └─ Frontend: retry logic, offline message
    │
    ├─ Authentication Error (401)
    │ ├─ Token expired
    │ ├─ Token invalid
    │ │
    │ ├─ Frontend: Attempt refresh
    │ ├─ If refresh succeeds: Retry request
    │ └─ If refresh fails: Redirect to login
    │
    ├─ Authorization Error (403)
    │ ├─ User doesn't have permission
    │ │
    │ └─ Frontend: Redirect to unauthorized page
    │
    ├─ Validation Error (400)
    │ ├─ Request data invalid
    │ │
    │ └─ Frontend: Show form validation errors
    │
    ├─ Not Found Error (404)
    │ ├─ Resource doesn't exist
    │ │
    │ └─ Frontend: Show "not found" message
    │
    └─ Server Error (5xx)
       ├─ Backend error
       │
       └─ Frontend: Show error boundary, suggest retry
```

### 10.2 Error Boundary Implementation

```typescript
// Error Boundary catches component rendering errors
// Not just API errors, but also runtime errors

ErrorBoundary Component:
├─ getDerivedStateFromError: Set error state
├─ componentDidCatch: Log error for debugging
└─ Render fallback UI with "Go to Landing Page" button
   └─ Redirects to role-specific landing page
```

### 10.3 Retry Strategy

**Auto-Retry Cases:**
- Token refresh (up to 3 times)
- Network errors (exponential backoff)
- 5xx server errors (exponential backoff)

**No-Retry Cases:**
- Authentication errors (4xx except 429)
- Validation errors
- Authorization errors

---

## 11. Transition from Mock API to Real Backend

### 11.1 Current Mock Setup

**Location:** `src/api/` files contain mock implementations

**Configuration:**
```typescript
// src/utils/config.ts
export const CONFIG = {
  USE_MOCK_API: true,  // Set to false for real API
  API_BASE_URL: import.meta.env.VITE_API_GATEWAY_URL,
  MOCK_API_DELAY: 800  // Simulate network delay
};
```

### 11.2 Switch to Real Backend (3 Steps)

**Step 1: Update Environment**
```
# .env.local
VITE_API_GATEWAY_URL=http://localhost:8080/api/
```

**Step 2: Update Config**
```typescript
// src/utils/config.ts
export const CONFIG = {
  USE_MOCK_API: false,  // Use real API
  API_BASE_URL: import.meta.env.VITE_API_GATEWAY_URL,
};
```

**Step 3: Ensure Backend Endpoints Match**

The backend must implement all endpoints in this table:

| Method | Endpoint | Frontend Call | Status |
|--------|----------|---------------|--------|
| POST | `/api/auth/login` | ✅ Implemented | Ready |
| POST | `/api/auth/register` | ✅ Implemented | Ready |
| POST | `/api/auth/refresh` | ✅ Implemented | Ready |
| GET | `/api/profile/me` | ✅ Implemented | Ready |
| PUT | `/api/profile/me` | ✅ Implemented | Ready |
| GET | `/api/menu` | ✅ Implemented | Ready |
| GET | `/api/menu/categories` | ✅ Implemented | Ready |
| POST | `/api/orders` | ✅ Implemented | Ready |
| GET | `/api/orders` | ✅ Implemented | Ready |
| GET | `/api/orders/{id}` | ✅ Implemented | Ready |
| GET | `/api/orders/by-table/{tableId}` | ✅ Implemented | Ready |
| GET | `/api/orders/active` | ✅ Implemented | Ready |
| PUT | `/api/orders/{id}/status` | ✅ Implemented | Ready |
| GET | `/api/staff` | ✅ Implemented | Ready |
| POST | `/api/staff` | ✅ Implemented | Ready |
| PUT | `/api/staff/{id}` | ✅ Implemented | Ready |
| DELETE | `/api/staff/{id}` | ✅ Implemented | Ready |
| GET | `/api/inventory` | ✅ Implemented | Ready |
| PUT | `/api/inventory/{itemId}` | ✅ Implemented | Ready |
| POST | `/api/cashier/receive-cash` | 🚧 Frontend Ready | Awaiting Backend |

---

## 12. Performance Optimization

### 12.1 Data Caching Strategy

```typescript
// Cache menu items (static data, rarely changes)
GET /api/menu → localStorage cache with 1-hour TTL

// Don't cache order data (dynamic, changes frequently)
GET /api/orders/{id} → Always fresh from backend

// Debounce category filter requests
User changes filter → debounce(300ms) → Fetch items
```

### 12.2 Request Optimization

- **Batch requests**: Combine multiple GET calls when possible
- **Pagination**: Use offset/limit for large data sets
- **Filtering**: Filter on backend, not frontend
- **Lazy loading**: Load menu items as user scrolls

---

## 13. Future Enhancements

### 13.1 Real-Time Updates (WebSocket)

```
Current: Frontend polls every 2 seconds
Future: Backend sends updates via WebSocket

Benefits:
- Reduced API calls
- Lower latency
- Better scalability
- Real-time notifications

Implementation:
// src/utils/websocket.ts
websocket.on('order:status:updated', (data) => {
  updateOrderState(data);
});
```

### 13.2 Offline Support

```
- Service Worker for offline caching
- Queue pending requests when offline
- Sync when reconnected
- Offline indicators in UI
```

### 13.3 Push Notifications

```
- Kitchen: New order alert
- Waiter: Order ready notification
- Customer: Order status updates
```

