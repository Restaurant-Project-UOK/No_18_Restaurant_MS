# Restaurant Management System - Frontend Flow Paths

## 1. AUTHENTICATION FLOWS

### 1.1 New User Registration Flow
```
START
  ↓
Enter Table ID (URL param or optional)
  ↓
Navigate to Register (/register)
  ↓
Fill Registration Form:
  - Full Name (min 3 chars)
  - Email (valid format)
  - Password (min 6 chars)
  - Confirm Password (must match)
  - Phone (optional, 10+ digits)
  ↓
Form Validation
  ├─ Invalid → Show Error Message
  └─ Valid → Continue
  ↓
Send POST /api/auth/register with tableId
  ├─ Error → Display error
  └─ Success → Continue
  ↓
Navigate to Login (/login)
  ↓
END
```

### 1.2 User Login Flow
```
START
  ↓
Navigate to Login (/login or /)
  ↓
Fill Login Form:
  - Email
  - Password
  - Table ID (displayed if in URL)
  ↓
Form Validation
  ├─ Invalid → Show Error
  └─ Valid → Continue
  ↓
Send POST /api/auth/login with:
  - email
  - password
  - tableId (optional/converted to number)
  ↓
API Response
  ├─ Error → Show error message
  └─ Success → Get tokens & role
  ↓
Store Tokens:
  - setAccessToken()
  - setRefreshToken()
  - localStorage.tableId
  ↓
Role-Based Navigation:
  ├─ Role 1 (Customer) → /menu
  ├─ Role 2 (Admin) → /profile
  └─ Role 3 (Kitchen) → /order
  ↓
END
```

---

## 2. CUSTOMER FLOW (Role: 1)

```
LOGIN (/login)
  ↓
/menu (Main Customer Page)
  ├─ Fetch Menu Items (GET /api/menu/)
  ├─ Display Menu Items with:
  │  ├─ Name
  │  ├─ Price
  │  ├─ Description
  │  ├─ Category
  │  └─ Availability
  ├─ Select Quantity
  ├─ Add Special Notes
  └─ Click "Add to Cart"
  ↓
CartContext Updated
  ├─ addToCart(item, quantity, notes)
  ├─ Show confirmation
  └─ Keep shopping or checkout
  ↓
Navigate to /order
  ├─ GET /api/order/ (fetch order history)
  ├─ View Shopping Cart
  │  ├─ Cart Items
  │  ├─ Quantity Controls
  │  ├─ Special Notes
  │  ├─ Subtotal per item
  │  └─ Total Price
  ├─ Modify Cart:
  │  ├─ Change Quantity
  │  ├─ Remove Item
  │  └─ Clear Cart
  └─ Add Special Requests (textarea)
  ↓
Click "Place Order"
  ├─ Send POST /api/order/
  │  ├─ items: OrderItem[]
  │  ├─ tableId: number (if available)
  │  └─ specialRequests: string
  ├─ Get Order Confirmation
  └─ Clear Cart
  ↓
View Order History
  ├─ Display all past orders
  ├─ Order ID
  ├─ Status (pending/completed/cancelled)
  ├─ Total Price
  ├─ Items Count
  └─ Timestamp
  ↓
Navigate to /profile
  ├─ GET /api/profile/me
  ├─ View Profile:
  │  ├─ Name
  │  ├─ Email
  │  ├─ Role (displays as "Customer")
  │  ├─ Phone
  │  └─ Address
  ├─ Click "Edit Profile"
  ├─ Modify:
  │  ├─ Full Name
  │  ├─ Phone
  │  └─ Address
  ├─ PUT /api/profile/me (save changes)
  └─ Success confirmation
  ↓
Logout
  ├─ clearTokens()
  ├─ Clear localStorage
  └─ Redirect to /login
  ↓
END
```

---

## 3. ADMIN FLOW (Role: 2)

```
LOGIN (/login)
  ↓
/profile (Admin Home - Default)
  ├─ GET /api/profile/me
  ├─ View Admin Profile:
  │  ├─ Name
  │  ├─ Email
  │  ├─ Role (displays as "Admin")
  │  ├─ Phone
  │  └─ Address
  ├─ Click "Edit Profile"
  ├─ Update Fields:
  │  ├─ Full Name (editable)
  │  ├─ Email (disabled/read-only)
  │  ├─ Phone (editable)
  │  └─ Address (editable)
  ├─ PUT /api/profile/me (save)
  └─ Confirmation message
  ↓
Navigation Buttons:
  ├─ Menu Button → /menu
  │  ├─ GET /api/menu/
  │  ├─ Browse all menu items
  │  ├─ View details
  │  ├─ Can add to cart if needed
  │  └─ Back to profile
  ├─ Orders Button → /order
  │  ├─ GET /api/order/
  │  ├─ View all orders in system
  │  ├─ See statuses
  │  ├─ Can place own orders
  │  └─ Back to profile
  └─ Profile (Current)
  ↓
Logout
  ├─ clearTokens()
  ├─ Clear localStorage
  └─ Redirect to /login
  ↓
END
```

---

## 4. KITCHEN STAFF FLOW (Role: 3)

```
LOGIN (/login)
  ↓
/order (Kitchen Dashboard - Default)
  ├─ GET /api/order/
  ├─ View All Orders:
  │  ├─ Order ID
  │  ├─ Table ID
  │  ├─ Status
  │  ├─ Items List
  │  ├─ Total Price
  │  └─ Timestamp
  ├─ Filter/Sort Orders
  ├─ View Order Details
  └─ Monitor Status
  ↓
Navigation Buttons:
  ├─ Menu Button → /menu
  │  ├─ GET /api/menu/
  │  ├─ Browse menu items (reference)
  │  ├─ View descriptions
  │  └─ Back to orders
  ├─ Profile Button → /profile
  │  ├─ GET /api/profile/me
  │  ├─ View Profile:
  │  │  ├─ Name
  │  │  ├─ Email
  │  │  ├─ Role (displays as "Kitchen Staff")
  │  │  ├─ Phone
  │  │  └─ Address
  │  ├─ Click "Edit Profile"
  │  ├─ Update (Phone, Address, etc)
  │  ├─ PUT /api/profile/me
  │  └─ Back to orders
  └─ Orders (Current)
  ↓
Logout
  ├─ clearTokens()
  ├─ Clear localStorage
  └─ Redirect to /login
  ↓
END
```

---

## 5. COMPLETE NAVIGATION GRAPH

```
┌─────────────────────────────────────────────────────────────┐
│                    PROTECTED ROUTES                         │
│                  (Require Authentication)                   │
└─────────────────────────────────────────────────────────────┘

                          ┌─────────┐
                          │ /menu   │
                          │(Browse) │
                          └────┬────┘
                         /     │     \
                        /      │      \
              ┌─────────────┐  │  ┌─────────────┐
              │  /order     │◄─┼─►│  /profile   │
              │(Checkout)   │  │  │ (Settings)  │
              └─────────────┘  │  └─────────────┘
                         \     │      /
                          \    │     /
                           \   │    /
                            └──┴──┘
                         Logout Button
                              ↓
                          /login (/)

┌─────────────────────────────────────────────────────────────┐
│                    PUBLIC ROUTES                            │
│              (No Authentication Required)                   │
└─────────────────────────────────────────────────────────────┘

        ┌──────────────┐                ┌──────────────┐
        │  /login      │◄──────────────►│ /register    │
        │  (/)         │                │              │
        └──────────────┘                └──────────────┘
             ↓                               ↓
        Authenticate                 Create Account
             ↓                               ↓
        Role-Based                     Redirect to
        Navigation                     Login
```

---

## 6. DATA FLOW PATHS

### 6.1 Authentication Data Flow
```
User Input (Form)
  ├─ Email
  ├─ Password
  └─ TableId (optional)
  ↓
validateForm()
  ├─ Email: not empty + valid format
  ├─ Password: min 6 chars
  └─ Return boolean
  ↓
login(payload) / register(payload)
  ├─ Add Authorization header (if exists)
  ├─ POST request to backend
  └─ Automatic token injection
  ↓
fetchWithAuth() Handler
  ├─ Add Bearer token
  ├─ Send request
  ├─ Check response status
  ├─ If 403: Refresh token automatically
  └─ Return parsed JSON
  ↓
Response Data
  ├─ accessToken
  ├─ refreshToken
  ├─ role (1|2|3)
  └─ user data
  ↓
Store in Frontend
  ├─ localStorage: tokens, tableId
  ├─ Context: user data, auth state
  └─ Memory: JWT decoded values
```

### 6.2 Menu to Order Flow
```
GET /api/menu/
  ↓
menuItems: MenuItem[]
  ├─ id
  ├─ name
  ├─ price
  ├─ description
  ├─ category
  └─ available
  ↓
User selects items with:
  ├─ Quantity
  └─ Special notes
  ↓
addToCart(item, qty, notes)
  ├─ Update CartContext
  ├─ cartItems stored in memory
  └─ Display in /order
  ↓
Checkout: Create OrderPayload
  ├─ items: [{menuItemId, quantity, notes}]
  ├─ tableId: number (optional)
  └─ specialRequests: string
  ↓
POST /api/order/
  ├─ Send order data
  ├─ Get OrderResponse
  └─ Clear cart on success
  ↓
GET /api/order/
  ├─ Fetch all user orders
  └─ Display order history
```

### 6.3 Profile Data Flow
```
GET /api/profile/me
  ├─ fullName
  ├─ email
  ├─ role (1|2|3)
  ├─ phone
  └─ address
  ↓
Display in /profile
  ├─ Show current values
  ├─ Format role name
  └─ Add edit button
  ↓
User edits → Show form
  ├─ fullName (editable)
  ├─ email (disabled)
  ├─ phone (editable)
  └─ address (editable)
  ↓
User saves
  ├─ Create update payload
  ├─ PUT /api/profile/me
  └─ Update local state
  ↓
Success notification
```

---

## 7. API ENDPOINTS MAP

| Feature | Method | Endpoint | Auth | Payload | Response |
|---------|--------|----------|------|---------|----------|
| **AUTH** |
| Login | POST | /auth/login | No | {email, password, tableId?} | {accessToken, refreshToken, role} |
| Register | POST | /auth/register | No | {fullName, email, password, role, phone?, tableId?} | User data |
| Refresh | POST | /auth/refresh | No | {refreshToken} | New access token |
| **PROFILE** |
| Get | GET | /profile/me | Yes | - | User profile data |
| Update | PUT | /profile/me | Yes | {fullName?, phone?, address?} | Updated user data |
| **MENU** |
| List | GET | /menu/ | Yes | - | MenuItem[] |
| Get One | GET | /menu/{id} | Yes | - | MenuItem |
| **ORDER** |
| Create | POST | /order/ | Yes | {items[], tableId?, specialRequests?} | {id, orderId, success, message} |
| List | GET | /order/ | Yes | - | Order[] |
| Get One | GET | /order/{id} | Yes | - | Order |
| Update | PUT | /order/{id} | Yes | {items?, tableId?, specialRequests?} | OrderResponse |
| Cancel | DELETE | /order/{id} | Yes | - | OrderResponse |

---

## 8. TOKEN REFRESH MECHANISM

```
User Request
  ↓
fetchWithAuth() executes
  ├─ Get access token
  ├─ Add: "Authorization: Bearer {token}"
  └─ Send request
  ↓
API Response
  ├─ 200-399: Success
  │  └─ Parse & return JSON
  ├─ 403: Forbidden
  │  ├─ Token expired
  │  ├─ Call refreshAccessToken()
  │  ├─ Get refresh token from localStorage
  │  ├─ POST /auth/refresh
  │  ├─ Get new access token
  │  ├─ setAccessToken(newToken)
  │  ├─ Retry original request
  │  └─ Return new response
  └─ Other Errors
     └─ Throw error to component
```

---

## 9. STATE MANAGEMENT STRUCTURE

```
AuthContext
├─ user: {fullName, email, role, phone, address}
├─ isLoading: boolean
├─ isAuthenticated: boolean (based on token + user)
├─ error: string | null
├─ logout(): void
├─ refreshUser(): Promise<void>
└─ setError(error: string): void

TableContext
├─ tableId: string | null
├─ setTableId(id: string | null): void
└─ Auto-updates from URL params

CartContext
├─ cartItems: CartItem[]
│  ├─ id, name, price (from menu)
│  ├─ quantity (user input)
│  └─ notes (special requests)
├─ addToCart(item, qty, notes): void
├─ removeFromCart(id): void
├─ updateQuantity(id, qty): void
├─ updateNotes(id, notes): void
├─ getTotalPrice(): number
├─ getTotalItems(): number
└─ clearCart(): void
```

---

## 10. ERROR HANDLING FLOW

```
API Call
  ↓
fetchWithAuth()
  ├─ Send request
  └─ Receive response
  ↓
Check response.ok
  ├─ true (200-299)
  │  └─ Parse JSON & return
  └─ false
     ↓
     Try parse error response
     ├─ Has backend message?
     │  └─ Use it
     └─ No?
        └─ Generic: "Error {status}"
     ↓
     Throw Error(message)
     ↓
Component catches
  ├─ setError(message)
  ├─ Show error UI
  ├─ Log to console
  ├─ setLoading(false)
  └─ User can retry/fix

Special: 403 Status
  ├─ Try refresh token
  ├─ Success?
  │  ├─ setAccessToken()
  │  ├─ Retry request
  │  └─ Continue
  └─ Failed?
     ├─ clearTokens()
     ├─ Redirect to /login
     ├─ isAuthenticated = false
     └─ Show login page
```

---

## 11. PROTECTED ROUTE LOGIC

```
ProtectedRoute Component
  ↓
Check isAuthenticated
  ├─ false & isLoading → Show "Loading..."
  ├─ false & !isLoading → Redirect to /login
  └─ true → Render children
  ↓
Children Component
  ├─ Access all page data
  ├─ Make authenticated API calls
  └─ Display content
```

---

## 12. QUICK REFERENCE: USER JOURNEYS

### Fast Path: Customer
```
/login → /menu → /order → Place Order → /profile → Logout
```

### Fast Path: Admin
```
/login → /profile → /menu → /order → Logout
```

### Fast Path: Kitchen
```
/login → /order → /menu → /profile → Logout
```

### Fast Path: New User
```
/register → /login → [Role-based page] → Navigate → Logout
```

---

## 13. URL PATTERNS

### With Table ID
```
/login?tableId=5           # Kitchen mode with table
/register?tableId=5        # Register for specific table
```

### Protected Routes (Auto-redirect if not authenticated)
```
/menu                      # Menu browsing
/order                     # Orders & checkout
/profile                   # User profile & settings
```

### Public Routes
```
/                          # Alias for /login
/login                     # Login page
/register                  # Registration page
```

---

## 14. FORM VALIDATION RULES

### Login
- Email: Required + Valid email format
- Password: Required + Min 6 characters

### Register
- Full Name: Required + Min 3 characters
- Email: Required + Valid email format
- Password: Required + Min 6 characters
- Confirm Password: Must match password
- Phone: Optional + Min 10 digits (if provided)

### Profile Edit
- Full Name: Min length 1 (required if edited)
- Email: Disabled (cannot edit)
- Phone: Optional
- Address: Optional
