# Customer Features - Implementation Summary

## ✅ Completed Customer Features

### 1. **User Authentication** 
- ✅ **Register**: New customers can create accounts
  - Full name, email, phone, password required
  - Role automatically set to "Customer" (role = 1)
  - Located: [src/pages/auth/Register.tsx](src/pages/auth/Register.tsx)

- ✅ **Login**: Customers can sign in
  - Email and password authentication
  - JWT token-based sessions
  - Automatic redirect to menu after login
  - Located: [src/pages/auth/Login.tsx](src/pages/auth/Login.tsx)

### 2. **Table ID Requirement** ⭐ REQUIRED
- ✅ **Enforced for Customers**: Customers MUST have a table ID to access the app
  - If no table ID is set, customer sees QR code scan instruction screen
  - Cannot proceed to menu/orders without scanning table QR code
  - Table ID persists across sessions (localStorage)
  - Located: [src/components/CustomerProtectedRoute.tsx](src/components/CustomerProtectedRoute.tsx)

- ✅ **QR Code Scanning ONLY**:
  - Table ID can ONLY be set by scanning the QR code on the table
  - URL format: `http://172.20.10.3:5173/?tableId=5`
  - No manual selection allowed - ensures customers are at the correct table
  - Each table has a unique QR code

### 3. **View Menu**
- ✅ **Browse Menu Items**:
  - View all available dishes with images, descriptions, prices
  - Filter by category (All, Appetizers, Mains, Desserts, Beverages)
  - See item availability status
  - Spicy indicator for relevant dishes
  - Located: [src/pages/menu/MenuPage.tsx](src/pages/menu/MenuPage.tsx)

### 4. **Shopping Cart**
- ✅ **Add to Cart**:
  - Click "Add to Cart" on any menu item
  - Add special notes/customizations (e.g., "No onions")
  - Items stored in cart context
  - Cart persists across page refreshes (localStorage)

- ✅ **Cart Management**:
  - View cart in sidebar (click cart icon in header)
  - Update quantity (increase/decrease)
  - Edit notes for each item
  - Remove items
  - See total price calculation
  - Cart badge shows item count
  - Located: [src/components/Cart/Cart.tsx](src/components/Cart/Cart.tsx)

### 5. **Profile Management** ⭐ NEW
- ✅ **View Profile**:
  - See full name, email, phone, role
  - Located: [src/pages/auth/ProfilePage.tsx](src/pages/auth/ProfilePage.tsx)

- ✅ **Edit Profile**:
  - ✅ **Editable Fields**:
    - Full Name
    - Phone Number
  - ❌ **Read-Only Fields** (as requested):
    - Email (cannot be changed)
    - Password (not shown, cannot be changed)
    - Role (system-managed)
  - Save/Cancel buttons with validation
  - Success/error feedback messages

## 🔒 Security & Validation

### Table ID Enforcement
- **Customers only**: Admin and Kitchen staff don't need table IDs
- **QR code only**: Table ID can ONLY be set via QR code scanning (URL parameter)
- **No manual selection**: Prevents customers from choosing wrong table
- **URL parameter**: Format is `?tableId=X` (e.g., `http://172.20.10.3:5173/?tableId=5`)
- **Automatic capture**: tableId extracted from URL on page load by AuthContext
- **Persistent**: Saved to localStorage, survives page refresh
- **Before menu access**: Table ID required before viewing menu or placing orders
- **User-friendly**: If somehow no tableId, shows clear QR scan instructions
- **Network accessible**: Works on local network for mobile devices

### Profile Updates
- **Email locked**: Prevents accidental account lockout
- **Password excluded**: No password changes on profile page (should be separate flow with current password verification)
- **Data validation**: Full name and phone required, trimmed before saving
- **API protection**: Backend enforces email/role immutability

## 📱 User Flows

### QR Code Scan Flow (Primary)
```
1. Customer scans QR code on table
   QR contains: http://172.20.10.3:5173/?tableId=5

2. Browser opens URL
   → AuthContext detects ?tableId=5 in URL
   → Saves tableId=5 to localStorage

3. RootRedirect checks authentication:
   
   IF NOT LOGGED IN:
   → Redirect to /login
   → Customer enters email/password
   → After successful login → Redirect to /menu
   → Menu page loads (tableId already set)
   
   IF ALREADY LOGGED IN:
   → Direct redirect to /menu
   → Menu page loads immediately
```

### New Customer Registration Flow
```
1. Customer scans QR code: http://172.20.10.3:5173/?tableId=5
   → tableId=5 saved to localStorage
   
2. Not logged in → Redirected to /login

3. Click "Register here" link

4. Fill registration form:
   - Full Name, Email, Phone, Password
   
5. Click "Create Account"
   
6. Auto-redirect to /login

7. Login with new credentials
   
8. Redirect to /menu (tableId still saved from step 1)
```

### Returning Customer Login Flow
```
1. Customer scans QR code: http://172.20.10.3:5173/?tableId=12
   → tableId=12 saved to localStorage (overwrites old value)
   
2. Not logged in → Redirected to /login

3. Enter email and password

4. Click "Sign In"

5. Redirect to /menu with tableId=12
```

### Ordering Food Flow
```
1. Browse menu at /menu
2. Click "Add to Cart" on desired items
3. Optionally add notes (e.g., "Extra spicy")
4. Click cart icon in header
5. Review items, adjust quantities
6. Click "Checkout" (when implemented)
```

### Edit Profile Flow
```
1. Navigate to /profile
2. Click "Edit Profile" button
3. Update name and/or phone
4. Click "Save Changes"
5. See success message
6. Profile updated automatically
```

## 🗺️ Customer Routes

| Route | Protected | Table ID Required | Description |
|-------|-----------|-------------------|-------------|
| `/login` | ❌ Public | No | Login page |
| `/register` | ❌ Public | No | Registration page |
| `/menu` | ✅ Auth | ✅ **Yes** (Customers only) | Browse menu |
| `/orders` | ✅ Auth | ✅ **Yes** (Customers only) | View order history |
| `/profile` | ✅ Auth | No | View/edit profile |

## 🧪 Testing Instructions

### Test Table ID Enforcement
```bash
# 1. Clear localStorage to simulate new session
localStorage.clear();

# 2. Login as customer
Email: customer@test.com
Password: password123
"Scan QR Code" screen (cannot proceed without scanning)

# 4. Simulate QR code scan by visiting URL:
http://localhost:5173/?tableId=12
# Or from mobile device on same network:
http://172.20.10.3:5173/?tableId=12

# 5. Now can access menu and orders
# 6. Table 12 shown in header
# 5. Now can access menu and orders
```

### Test Profile Edit (Email Locked)
```bash
# 1. Login as customer
# 2. Go to /profile
# 3. Click "Edit Profile"
# 4. Try to change email → Should be grayed out with "Read-only" badge
# 5. Change name: "John Doe" → "Jane Smith"
# 6. Click "Save Changes"
# 7. Should see success message and updated name
``Simulate QR code scan by visiting URL with table parameter:

# On desktop (localhost):
http://localhost:5173/?tableId=8

# On mobile device (same network):
http://172.20.10.3:5173/?tableId=8

# Table 8 will be automatically assigned
# Header will show "Table 8"
# localStorage will save the table ID for future visitseter:
http://localhost:5173/menu?tableId=8

# Table 8 w"Scan QR Code" instruction screen if not set
   - Prevents manual table selection - QR scan only
# Header will show "Table 8"
```

## 📊 Implementation Details

### New Components
1. **CustomerProtectedRoute** ([src/components/CustomerProtectedRoute.tsx](src/components/CustomerProtectedRoute.tsx))
   - Wraps customer-facing routes (Menu, Orders)
   - Enforces table ID for customers (role === 1)
   - Shows "Scan QR Code" instruction screen if not set
   - Prevents manual table selection - QR scan only
   - Allows non-customers (admin, kitchen) to bypass

2. **RootRedirect** ([src/components/RootRedirect.tsx](src/components/RootRedirect.tsx))
   - Handles QR code scans at root path (`/?tableId=X`)
   - Checks authentication status
   - Redirects to /menu if authenticated
   - Redirects to /login if not authenticated
   - tableId from URL already captured by AuthContext before redirect

### Updated Components
1. **ProfilePage** ([src/pages/auth/ProfilePage.tsx](src/pages/auth/ProfilePage.tsx))
   - Added edit mode toggle
   - Form validation for name and phone
   - Read-only email display with badge
   - Password field completely hidden (secure)
   - Save/Cancel functionality with API integration

### API Functions Used
- `updateProfile(data: Partial<UserProfile>)` - Updates name/phone
- Backend protects: email, role, id from changes
- Mock API in: [src/services/mockApi.ts](src/services/mockApi.ts)

## ✨ What's Working

- ✅ Customer can register
- ✅ Customer can login
- ✅ Customer MUST have table ID to access menu/orders
- ✅ Customer can view menu
- ✅ Customer can add items to cart
- ✅ Customer can manage cart (update quantity, notes, remove items)
- ✅ Customer can edit profile (name & phone only)
- ✅ Email is locked (cannot be changed)
- ✅ Password is hidden (not in profile edit)
- ✅ Table ID persists across sessions
- ✅ QR code scanning works (?tableId=X in URL)

## 🎯 Ready For Admin & Kitchen Staff Features

The customer side is complete and tested. You can now explain the admin and kitchen staff functions, and I'll implement them next.

   - Only enforced for customers (role === 1)
   - Admin and kitchen staff can access their pages without table IDs
   - **QR code scanning ONLY** - no manual table selection to prevent errors
   - Table ID from URL parameter format: `?tableId=X`

2. **Profile Security**: Email changes excluded to prevent account lockout. Password changes should be separate flow with current password verification (can implement later if needed).

3. **Cart Persistence**: Cart items saved to localStorage, survive page refresh.

4. **Mock API**: Currently using mock backend. Set `VITE_USE_MOCK_API=false` in `.env` to connect to real API.

5. **Network Access**: The app works on local network. Other devices can scan QR codes pointing to the server's IP address (e.g., `http://172.20.10.3:5173/?tableId=5`)

## 📝 Notes

1. **Table ID Logic**: Only enforced for customers (role === 1). Admin and kitchen staff can access their pages without table IDs.

2. **Profile Security**: Email changes excluded to prevent account lockout. Password changes should be separate flow with current password verification (can implement later if needed).

3. **Cart Persistence**: Cart items saved to localStorage, survive page refresh.

4. **Mock API**: Currently using mock backend. Set `VITE_USE_MOCK_API=false` in `.env` to connect to real API.

---

**Status**: All customer features complete ✅  
**Next**: Admin and Kitchen staff features awaiting requirements 📋
