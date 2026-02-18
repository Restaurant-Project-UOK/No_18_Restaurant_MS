# Backend Gateway Integration Guide

## Overview

Your frontend has been updated to connect with the backend gateway at:
```
https://gateway-app.mangofield-91faac5e.southeastasia.azurecontainerapps.io
```

## Configuration

### API Config File
Created: [src/config/api.ts](src/config/api.ts)

This file provides:
- **API_CONFIG**: Gateway URL and endpoint definitions
- **getApiUrl()**: Helper to construct full API URLs
- **apiRequest()**: Universal API request wrapper with automatic JWT handling and error handling

**Key Features:**
- Automatic JWT token injection from Bearer header
- X-User-Id and X-Role header propagation for internal services
- 401 Unauthorized handling (clears auth and redirects to login)
- Consistent error handling across all services

### Usage Example
```typescript
import { apiRequest } from '../config/api';

// GET request with JWT
const orders = await apiRequest<Order[]>('/api/orders/active', {
  jwt: token,
});

// POST request with JWT
const order = await apiRequest<Order>('/api/orders', {
  method: 'POST',
  jwt: token,
  body: JSON.stringify(orderData),
});
```

## Updated Services

### 1. **Authentication Service** ([src/services/authService.ts](src/services/authService.ts))
✅ **UPDATED** - Now uses gateway API

**Endpoints (via Gateway):**
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login (returns JWT tokens)
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Logout user

**Example:**
```typescript
const response = await authService.login({
  email: 'user@example.com',
  password: 'password123',
});
// Response: { accessToken, refreshToken, user }
```

### 2. **Profile Service** ([src/services/profileService.ts](src/services/profileService.ts))
✅ **UPDATED** - Now uses gateway API

**Endpoints (via Gateway):**
- `GET /api/profile/me` - Get current user profile
- `PUT /api/profile/me` - Update current user profile

**Example:**
```typescript
const profile = await profileService.getMyProfile(token);
const updated = await profileService.updateMyProfile({
  fullName: 'New Name',
  phone: '+1234567890',
}, token);
```

### 3. **Order Service** ([src/services/orderService.ts](src/services/orderService.ts))
✅ **UPDATED** - Now uses gateway API (partial)

**Endpoints (via Gateway):**
- `POST /api/orders` - Create new order
- `PATCH /api/orders/:id` - Update order status
- `GET /api/orders/active` - Get all active orders (public)
- `GET /api/orders/user` - Get user's order history
- `GET /api/orders/table/:tableNumber` - Get orders for a table

**Example:**
```typescript
// Create order
const order = await orderService.createOrder({
  items: [
    { itemId: '1', quantity: 2, unitPrice: 10.99 },
  ],
  tableNumber: 5,
}, token);

// Update status
const updated = await orderService.updateOrderStatus('ORD-123', {
  status: 'SERVED',
}, token);
```

### 4. **Cart Service** ([src/services/cartService.ts](src/services/cartService.ts))
⏳ **PENDING** - Still uses mock data

**Recommended API Endpoints:**
- `POST /api/cart/open` - Open new cart
- `POST /api/cart/items` - Add item to cart
- `POST /api/cart/checkout` - Checkout (creates order)
- `GET /api/cart/:cartId` - Get cart contents
- `DELETE /api/cart/:cartId` - Clear cart

### 5. **Kitchen Service** ([src/services/kitchenService.ts](src/services/kitchenService.ts))
⏳ **PENDING** - Still uses mock data

**Recommended API Endpoints:**
- `GET /api/orders?status=PENDING,CONFIRMED,PREPARING` - Get kitchen orders
- `PATCH /api/orders/:id` - Mark order as created/preparing/ready
- `GET /api/admin/analytics/kitchen-health` - Get kitchen metrics

### 6. **Waiter Service** ([src/services/waiterService.ts](src/services/waiterService.ts))
⏳ **PENDING** - Still uses mock data

**Recommended API Endpoints:**
- `GET /api/orders?status=READY` - Get ready-to-pickup orders
- `PATCH /api/orders/:id` - Mark order as served/completed
- `GET /api/orders/table/:tableNumber` - Get table orders

### 7. **Payment Service** ([src/services/paymentService.ts](src/services/paymentService.ts))
⏳ **PENDING** - Still uses mock data

**Recommended API Endpoints:**
- `POST /api/payments` - Create payment
- `GET /api/payments/:id` - Get payment details
- `PATCH /api/payments/:id` - Update payment status

## Local Development Setup

### For Local Backend
If running backend services locally without the gateway, update [src/config/api.ts](src/config/api.ts):

```typescript
export const API_CONFIG = {
  // Local development - comment out production URL
  GATEWAY_BASE_URL: 'http://localhost:8000',
  // Or direct service URLs:
  // GATEWAY_BASE_URL: 'http://localhost:8081', // auth-service
};
```

### Manual Header Testing
If testing services directly (bypassing gateway), manually add headers:

```typescript
const response = await fetch('http://localhost:8084/api/orders', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    'X-User-Id': '1',
    'X-Role': 'WAITER',
  },
  body: JSON.stringify(orderData),
});
```

## Service Routing Reference

| Path | Service | Port | Gateway Route |
|------|---------|------|---------------|
| `/api/auth/**` | auth-service | 8081 | ✅ Active |
| `/api/profile/**` | auth-service | 8081 | ✅ Active |
| `/api/menu/**` | menu-service | 8082 | ⏳ Ready |
| `/api/categories/**` | menu-service | 8082 | ⏳ Ready |
| `/api/cart/**` | cart-service | 8083 | ⏳ Ready |
| `/api/orders/**` | order-service | 8084 | ✅ Partially Active |
| `/api/admin/**` | analytics-service | 8000 | ⏳ Ready |

## Next Steps

### High Priority
1. **Update CartService** - Implement real API calls for `/api/cart/**` endpoints
2. **Update KitchenService** - Implement real API calls for kitchen-specific order queries
3. **Update WaiterService** - Implement real API calls for waiter workflows
4. **Testing** - Test each service with backend gateway to ensure proper integration

### Integration Checklist
- [ ] Test authentication (register/login/logout)
- [ ] Test order creation via cartService
- [ ] Test order status updates for kitchen staff
- [ ] Test order status updates for waiters
- [ ] Test payment collection flow
- [ ] Test multi-user scenarios with different roles
- [ ] Test error handling (401, 400, 500 errors)
- [ ] Test token refresh on 401

### Error Handling Examples
```typescript
try {
  const orders = await orderService.getActiveOrders();
} catch (error) {
  if (error.message.includes('Unauthorized')) {
    // Redirect to login
    window.location.href = '/login';
  } else {
    // Show user-friendly error message
    console.error('Failed to load orders:', error.message);
  }
}
```

## Security Notes

### Token Management
- Tokens are stored in `localStorage` with keys:
  - `auth_access_token` - Short-lived access token (1 hour)
  - `auth_refresh_token` - Long-lived refresh token (7 days)
  - `auth_user` - Cached user profile object
- 401 responses automatically clear tokens and redirect to login
- Token automatically included in all authenticated requests via `apiRequest()`

### CORS Policy (Gateway)
Allowed origins:
- `http://localhost:3000` (development)
- `https://*.vercel.app` (production preview)

Update if deploying to different domain.

## Testing with Mock Data (Fallback)

While transitioning to real API, you can keep mock services as fallback:
```typescript
// Toggle between API and mock in AuthContext/OrderContext
const useRealAPI = true; // Change to false for mock data

if (useRealAPI) {
  await authService.login(credentials);
} else {
  await mockAuthService.login(credentials);
}
```

## Build & Deployment

### Building with new API config
```bash
npm run build
```

No changes needed - the API configuration is loaded at runtime.

### Environment Variables (Recommended for Production)
Create `.env.local`:
```
VITE_API_GATEWAY_URL=https://gateway-app.mangofield-91faac5e.southeastasia.azurecontainerapps.io
VITE_API_TIMEOUT=30000
```

Update [src/config/api.ts](src/config/api.ts) to use these variables:
```typescript
export const API_CONFIG = {
  GATEWAY_BASE_URL: import.meta.env.VITE_API_GATEWAY_URL || 
    'https://gateway-app.mangofield-91faac5e.southeastasia.azurecontainerapps.io',
};
```

---

**Last Updated:** February 17, 2026
**Status:** ✅ Authentication & Order Services Connected | ⏳ Other Services Pending
