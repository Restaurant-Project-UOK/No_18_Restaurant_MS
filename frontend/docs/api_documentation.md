# Frontend API Documentation - No. 18 Restaurant Management System

This document provides a comprehensive overview of the frontend API layer, its configuration, security mechanisms, and available services.

## Overview

The frontend communicates with a backend gateway using a unified `apiRequest` helper. The architecture is service-oriented, where each domain (Auth, Menu, Orders, etc.) has its own service file.

## Configuration (`src/config/api.ts`)

The central configuration file defines the gateway URL and provides a helper function for making HTTP requests.

### Key Components

- **`GATEWAY_BASE_URL`**: The base URL for all API requests.
- **`apiRequest<T>`**: A generic wrapper around the `fetch` API that handles:
  - Global headers (`Content-Type: application/json`).
  - JWT Authentication (via the `Authorization: Bearer <token>` header).
  - Identification headers (`X-User-Id`, `X-Role`) extracted from `localStorage`.
  - Automatic 401 Unauthorized handling (clears local storage and redirects to `/login`).
  - Standard error handling and response parsing.

---

## Authentication & Security

Security is managed via JSON Web Tokens (JWT) stored in `localStorage`.

### Automatic Headers
The `apiRequest` function automatically injects the following headers if the user is authenticated:
- `Authorization`: `Bearer ${localStorage.getItem('auth_access_token')}`
- `X-User-Id`: Extracted from the `auth_user` object in storage.
- `X-Role`: Extracted from the `auth_user` object in storage.

### Token Expiration
If any API call returns a `401 Unauthorized` status, the application will:
1. Clear all authentication tokens from `localStorage`.
2. Redirect the user to the `/login` page.

---

## API Services (`src/services/`)

### 1. Auth Service (`authService.ts`)
Handles user registration, login, token refresh, and logout.

| Function | Endpoint | Method | Description |
| :--- | :--- | :--- | :--- |
| `register(data)` | `/api/auth/register` | `POST` | Registers a new user (Customer/Staff). |
| `login(credentials)` | `/api/auth/login` | `POST` | Authenticates and returns tokens. |
| `refreshAccessToken(data)`| `/api/auth/refresh` | `POST` | Gets a new access token using a refresh token. |
| `logout()` | `/api/auth/logout` | `POST` | Invalidate token and clear local state. |

### 2. Menu Service (`menuService.ts`)
Manages menu items, categories, and media. 
*Note: Some endpoints currently use mock data but are structured for API integration.*

| Function | Endpoint | Method | Description |
| :--- | :--- | :--- | :--- |
| `getAllMenuItems()` | `/api/menu` | `GET` | Retrieve all active menu items. |
| `getAllCategories()` | `/api/categories` | `GET` | Retrieve all menu categories. |
| `createMenuItemWithImage(form)`| `/api/admin/menu/with-image`| `POST` | Creates an item with an image (Admin). |
| `deleteMenuItem(id)` | `/api/admin/menu/{id}`| `DELETE` | Removes a menu item (Admin). |

### 3. Order Service (`orderService.ts`)
Handles the lifecycle of orders from creation to history retrieval.

| Function | Endpoint | Method | Description |
| :--- | :--- | :--- | :--- |
| `createOrder(data)` | `/api/orders` | `POST` | Submits a new order. |
| `getUserOrders()` | `/api/orders/user` | `GET` | Retrieves history for the current user. |
| `getActiveOrders()` | `/api/orders/active` | `GET` | Retrieves all current active orders. |
| `getTableOrders(num)` | `/api/orders/table/{num}`| `GET` | Retrieves orders for a specific table. |

### 4. Kitchen Service (`kitchenService.ts`)
Internal service for kitchen staff to manage the preparation queue.

| Function | Endpoint | Method | Description |
| :--- | :--- | :--- | :--- |
| `getKitchenOrders()` | `/api/orders?status=PENDING,CONFIRMED,PREPARING` | `GET` | Orders awaiting preparation. |
| `markOrderPreparing(id)`| `/api/orders/{id}` | `PATCH` | Change status to preparation. |
| `markOrderReady(id)` | `/api/orders/{id}` | `PATCH` | Mark order as ready for pickup. |

### 5. Waitstaff Service (`waiterService.ts`)
Service for waiters to see ready orders and serve them.

| Function | Endpoint | Method | Description |
| :--- | :--- | :--- | :--- |
| `getReceivedOrders()` | `/api/orders?status=READY` | `GET` | Items ready to be delivered to tables. |
| `markOrderServed(id)` | `/api/orders/{id}` | `PATCH` | Mark an order as delivered/served. |

### 6. Analytics Service (`analyticsService.ts`)
Dashboard data for administrators and managers.

| Function | Endpoint | Method | Description |
| :--- | :--- | :--- | :--- |
| `getDashboardStats()` | `/api/admin/analytics/stats` | `GET` | High-level business metrics. |
| `getRevenueData()` | `/api/admin/analytics/revenue` | `GET` | Sales and revenue breakdown. |

### 7. Payment Service (`paymentService.ts`)
Integration for processing customer payments.

| Function | Endpoint | Method | Description |
| :--- | :--- | :--- | :--- |
| `createPayment(id)` | `/api/payments` | `POST` | Initiates a payment session. |
| `getPaymentDetails(id)`| `/api/payments/{id}` | `GET` | Retrieves status of a specific payment. |
| `updatePaymentStatus(id)`| `/api/payments/{id}` | `PATCH` | Manually update status (Approva/Cancel). |

---

## Data Models (`src/types/`)

All API responses and requests are typed using TypeScript interfaces defined in the `src/types` directory. Common models include:
- `Order`, `OrderItem`, `OrderStatus`
- `MenuItem`, `MenuCategory`
- `User`, `UserRole`
- `AnalyticsData`

## Error Handling

Errors from the API are caught in the `apiRequest` helper and re-thrown as standard `Error` objects with descriptive messages. Components should use `try-catch` blocks or React Query error boundaries to handle these.

```typescript
try {
  const result = await menuService.getAllMenuItems();
} catch (error) {
  // error.message will contain the backend error or "API Error: [status]"
}
```
