# Restaurant Management System - API Reference

All endpoints are accessed through the **API Gateway** at `http://localhost:8080`.

---

## Table of Contents
- [Authentication Service](#authentication-service)
- [Profile Service](#profile-service)
- [Menu Service](#menu-service)
- [Admin Menu Service](#admin-menu-service)
- [Media Service](#media-service)
- [Order Service](#order-service)
- [Cart Service](#cart-service)
- [Payment Service](#payment-service)
- [AI Service](#ai-service)

---

## Authentication Service

**Base Path:** `/api/auth`  
**Backend:** Auth Service (Port 8081)  
**Authentication:** Public (No JWT Required)

| Method | Endpoint | Description | Request Body |
|--------|----------|-------------|--------------|
| POST | `/api/auth/register` | Register a new user | `RegisterRequestDto` |
| POST | `/api/auth/login` | Login and get tokens | `LoginRequestDto` |
| POST | `/api/auth/refresh` | Refresh access token | `{ "refreshToken": "..." }` |
| POST | `/api/auth/logout` | Logout and invalidate token | - |

### Request/Response Examples

**Register:**
```json
// POST /api/auth/register
{
  "email": "user@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Login:**
```json
// POST /api/auth/login
{
  "email": "user@example.com",
  "password": "password123"
}

// Response
{
  "accessToken": "eyJ...",
  "refreshToken": "eyJ...",
  "tokenType": "Bearer"
}
```

---

## Profile Service

**Base Path:** `/api/profile`  
**Backend:** Auth Service (Port 8081)  
**Authentication:** Required (Bearer Token)

| Method | Endpoint | Description | Headers |
|--------|----------|-------------|---------|
| GET | `/api/profile/me` | Get current user profile | `Authorization: Bearer <token>` |
| PUT | `/api/profile/me` | Update current user profile | `Authorization: Bearer <token>` |

---

## Menu Service

**Base Path:** `/api/menu`  
**Backend:** Menu Service (Port 8082)  
**Authentication:** Public

| Method | Endpoint | Description | Parameters |
|--------|----------|-------------|------------|
| GET | `/api/menu` | Get all available menu items | - |
| GET | `/api/menu/{itemId}` | Get single menu item by ID | `itemId`: Long |

### Response Example

```json
// GET /api/menu
[
  {
    "id": 1,
    "name": "Margherita Pizza",
    "description": "Classic Italian pizza",
    "price": 12.99,
    "category": "Pizza",
    "imageUrl": "/api/media/abc123",
    "isActive": true
  }
]
```

---

## Admin Menu Service

**Base Path:** `/api/admin/menu`  
**Backend:** Menu Service (Port 8082)  
**Authentication:** Required (Admin Role)

| Method | Endpoint | Description | Content-Type |
|--------|----------|-------------|--------------|
| GET | `/api/admin/menu` | Get all menu items (including inactive) | - |
| POST | `/api/admin/menu` | Create new menu item with optional image | `multipart/form-data` |
| PUT | `/api/admin/menu/{itemId}` | Update existing menu item | `multipart/form-data` |
| PATCH | `/api/admin/menu/{itemId}/availability` | Update item availability | `?isActive=true/false` |
| DELETE | `/api/admin/menu/{itemId}` | Soft delete menu item | - |

### Create Menu Item Example

```
POST /api/admin/menu
Content-Type: multipart/form-data

Parts:
- menuItem: { "name": "...", "price": 9.99, "category": "..." }
- image: (file upload, optional)
```

---

## Media Service

**Base Path:** `/api/media`  
**Backend:** Menu Service (Port 8082)  
**Authentication:** Public for GET, Admin for DELETE

| Method | Endpoint | Description | Response |
|--------|----------|-------------|----------|
| GET | `/api/media/{imageId}` | Stream image from storage | Image binary |
| DELETE | `/api/media/{imageId}` | Delete an image (admin only) | 204 No Content |

---

## Order Service

**Base Path:** `/api/orders`  
**Backend:** Order Service (Port 8083)  
**Authentication:** Required

| Method | Endpoint | Description | Headers |
|--------|----------|-------------|---------|
| POST | `/api/orders` | Create a new order | `X-User-Id`, `X-Table-Id`, `Authorization` |
| GET | `/api/orders/{orderId}` | Get order by ID | - |
| GET | `/api/orders/table` | Get orders for a table | `X-Table-Id` |
| GET | `/api/orders/user` | Get orders for a user | `X-User-Id` |
| GET | `/api/orders/active` | Get all active orders | - |
| PATCH | `/api/orders/{orderId}/status` | Update order status | Body: `UpdateOrderStatusRequest` |

### Create Order Example

```json
// POST /api/orders
// Headers: X-User-Id: 1, X-Table-Id: 5, Authorization: Bearer <token>

// Request body is optional - cart items are fetched from cart service
{}
```

### Update Status Example

```json
// PATCH /api/orders/{orderId}/status
{
  "status": "PREPARING" // PENDING, PREPARING, READY, DELIVERED, CANCELLED
}
```

---

## Cart Service

**Base Path:** `/api/cart`  
**Backend:** Cart Service (Port 8086)  
**Authentication:** Required

| Method | Endpoint | Description | Headers |
|--------|----------|-------------|---------|
| POST | `/api/cart/open` | Open/create a new cart | `X-Table-Name`, `X-User-Id` |
| GET | `/api/cart/items` | Get cart items | `X-Table-Name`, `X-User-Id` |
| GET | `/api/cart/order/{orderId}` | Get cart by order ID | - |
| POST | `/api/cart/items` | Add item to cart | `X-Table-Name`, `X-User-Id` |
| PUT | `/api/cart/items/{itemId}` | Update cart item quantity | `X-Table-Name`, `X-User-Id` |
| DELETE | `/api/cart/items/{itemId}` | Remove item from cart | `X-Table-Name`, `X-User-Id` |
| DELETE | `/api/cart` | Clear entire cart | `X-Table-Name`, `X-User-Id` |
| POST | `/api/cart/checkout` | Checkout cart | `X-Table-Name`, `X-User-Id` |
| GET | `/api/cart` | Get items formatted for order | `X-Table-Name`, `X-User-Id` |

### Add to Cart Example

```json
// POST /api/cart/items
// Headers: X-Table-Name: Table-5, X-User-Id: 1

{
  "menuItemId": 1,
  "quantity": 2,
  "specialInstructions": "No onions"
}
```

### Update Cart Item Example

```json
// PUT /api/cart/items/{itemId}
{
  "quantity": 3
}
```

---

## Payment Service

**Base Path:** `/api/payments`  
**Backend:** Payment Service (Port 8087)  
**Authentication:** Required

| Method | Endpoint | Description | Request Body |
|--------|----------|-------------|--------------|
| POST | `/api/payments/create` | Create a PayPal payment | `PaymentRequest` |

### Create Payment Example

```json
// POST /api/payments/create
{
  "amount": 25.99
}

// Response: PayPal approval URL
"https://www.paypal.com/checkoutnow?token=..."
```

---

## AI Service

**Base Path:** `/api/ai`  
**Backend:** AI Service - FastAPI (Port 8000)  
**Authentication:** Public

| Method | Endpoint | Description | Request Body |
|--------|----------|-------------|--------------|
| GET | `/api/ai/widget` | Get chatbot widget HTML | - |
| GET | `/api/ai/embed.js` | Get embed script | - |
| POST | `/api/ai/ask` | Ask the AI chatbot | `{ "question": "..." }` |
| POST | `/api/ai/sync-now` | Manually sync menu data | - |

### Ask AI Example

```json
// POST /api/ai/ask
{
  "question": "What vegetarian options do you have?"
}

// Response
{
  "answer": "We have several vegetarian options including..."
}
```

---

## Common Headers

| Header | Description | Usage |
|--------|-------------|-------|
| `Authorization` | Bearer JWT token | Required for authenticated endpoints |
| `X-User-Id` | User ID from JWT | Set by gateway for downstream services |
| `X-Table-Id` | Table ID (numeric) | Used by order service |
| `X-Table-Name` | Table name/identifier | Used by cart service |
| `Content-Type` | Request content type | `application/json` or `multipart/form-data` |

---

## Gateway Routes Summary

| Route ID | Gateway Path | Backend Service | Port |
|----------|--------------|-----------------|------|
| auth-service | `/api/auth/**` | Auth Service | 8081 |
| menu-service | `/api/menu/**` | Menu Service | 8082 |
| admin-menu-service | `/api/admin/menu/**` | Menu Service | 8082 |
| media-service | `/api/media/**` | Menu Service | 8082 |
| order-service | `/api/orders/**` | Order Service | 8083 |
| analytics-service | `/api/analytics/**` | Analytics Service | 8084 |
| kds-service | `/api/kds/**` | KDS Service | 8085 |
| cart-service | `/api/cart/**` | Cart Service | 8086 |
| payment-service | `/api/payments/**` | Payment Service | 8087 |
| ai-service | `/api/ai/**` | AI Service | 8000 |

---

## Environment Variables

Gateway expects these environment variables:

| Variable | Default | Description |
|----------|---------|-------------|
| `SERVER_PORT` | 8080 | Gateway port |
| `AUTH_SERVICE_URL` | http://localhost:8081 | Auth service URL |
| `MENU_SERVICE_URL` | http://localhost:8082 | Menu service URL |
| `ORDER_SERVICE_URL` | http://localhost:8083 | Order service URL |
| `ANALYTICS_SERVICE_URL` | http://localhost:8084 | Analytics service URL |
| `KDS_SERVICE_URL` | http://localhost:8085 | KDS service URL |
| `CART_SERVICE_URL` | http://localhost:8086 | Cart service URL |
| `PAYMENT_SERVICE_URL` | http://localhost:8087 | Payment service URL |
| `AI_SERVICE_URL` | http://localhost:8000 | AI service URL |
| `JWT_SECRET` | (required) | JWT signing secret |

---

## Notes

- **Analytics Service** and **KDS Service** directories are currently empty (not implemented)
- All services use JSON for request/response unless otherwise noted
- The gateway handles CORS globally - individual services don't need CORS configuration
- JWT validation is performed at the gateway level for protected routes
