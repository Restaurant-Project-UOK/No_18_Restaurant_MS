# Frontend API Documentation with Dummy Data

This document provides API endpoints and dummy data for testing the frontend without a running backend.

---

## Configuration

### Environment Variables
```bash
# .env.local
VITE_BASE_URL=http://localhost:8080/api/
```

### API Client Setup
```typescript
// src/utils/api.ts - fetchWithAuth handles auth automatically
import { fetchWithAuth } from "../utils/api";
```

---

## Authentication API

### POST `/api/auth/login`

**Request:**
```typescript
const response = await fetchWithAuth("auth/login", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    email: "customer@test.com",
    password: "password123"
  })
});
```

**Dummy Response:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIiwiZW1haWwiOiJjdXN0b21lckB0ZXN0LmNvbSIsInJvbGUiOjEsImV4cCI6MTcwOTQwMDAwMH0.test",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.refresh_token_here",
  "tokenType": "Bearer"
}
```

**Test Users:**
| Email | Password | Role | Role ID |
|-------|----------|------|---------|
| customer@test.com | password123 | Customer | 1 |
| admin@test.com | admin123 | Admin | 2 |
| kitchen@test.com | kitchen123 | Kitchen | 3 |

---

### POST `/api/auth/register`

**Request:**
```typescript
const response = await fetchWithAuth("auth/register", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    fullName: "John Doe",
    email: "john@example.com",
    password: "password123",
    role: 1,
    phone: "+94771234567"
  })
});
```

**Dummy Response:**
```json
{
  "id": 5,
  "email": "john@example.com",
  "fullName": "John Doe",
  "role": 1,
  "phone": "+94771234567",
  "createdAt": "2024-02-14T10:30:00Z"
}
```

---

### POST `/api/auth/logout`

**Request:**
```typescript
const response = await fetchWithAuth("auth/logout", {
  method: "POST",
  headers: { "Authorization": "Bearer <token>" }
});
```

**Dummy Response:**
```json
"Logged out successfully"
```

---

## Profile API

### GET `/api/profile/me`

**Request:**
```typescript
const profile = await fetchWithAuth("profile/me", { method: "GET" });
```

**Dummy Response:**
```json
{
  "id": 1,
  "fullName": "Test Customer",
  "email": "customer@test.com",
  "phone": "+94771234567",
  "role": 1,
  "createdAt": "2024-01-15T08:00:00Z"
}
```

---

### PUT `/api/profile/me`

**Request:**
```typescript
const updated = await fetchWithAuth("profile/me", {
  method: "PUT",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    fullName: "Updated Name",
    phone: "+94779876543"
  })
});
```

**Dummy Response:**
```json
{
  "id": 1,
  "fullName": "Updated Name",
  "email": "customer@test.com",
  "phone": "+94779876543",
  "role": 1,
  "createdAt": "2024-01-15T08:00:00Z"
}
```

---

## Menu API

### GET `/api/menu`

**Request:**
```typescript
const menu = await fetchWithAuth("menu", { method: "GET" });
```

**Dummy Response:**
```json
[
  {
    "id": 1,
    "name": "Margherita Pizza",
    "description": "Classic Italian pizza with tomato sauce, mozzarella, and fresh basil",
    "price": 1200,
    "category": "Pizza",
    "imageUrl": "/api/media/pizza-001",
    "isActive": true,
    "createdAt": "2024-01-01T00:00:00Z"
  },
  {
    "id": 2,
    "name": "Classic Burger",
    "description": "Juicy beef patty with lettuce, tomato, cheese, and special sauce",
    "price": 800,
    "category": "Burgers",
    "imageUrl": "/api/media/burger-001",
    "isActive": true,
    "createdAt": "2024-01-01T00:00:00Z"
  },
  {
    "id": 3,
    "name": "Spaghetti Carbonara",
    "description": "Creamy pasta with bacon, egg, and parmesan cheese",
    "price": 1000,
    "category": "Pasta",
    "imageUrl": "/api/media/pasta-001",
    "isActive": true,
    "createdAt": "2024-01-01T00:00:00Z"
  },
  {
    "id": 4,
    "name": "Caesar Salad",
    "description": "Fresh romaine lettuce with caesar dressing, croutons, and parmesan",
    "price": 600,
    "category": "Salads",
    "imageUrl": "/api/media/salad-001",
    "isActive": true,
    "createdAt": "2024-01-01T00:00:00Z"
  },
  {
    "id": 5,
    "name": "Chicken Noodles",
    "description": "Stir-fried noodles with chicken and vegetables",
    "price": 750,
    "category": "Asian",
    "imageUrl": "/api/media/noodles-001",
    "isActive": true,
    "createdAt": "2024-01-01T00:00:00Z"
  },
  {
    "id": 6,
    "name": "Sushi Combo",
    "description": "Assorted sushi platter with salmon, tuna, and shrimp (12 pcs)",
    "price": 2500,
    "category": "Japanese",
    "imageUrl": "/api/media/sushi-001",
    "isActive": true,
    "createdAt": "2024-01-01T00:00:00Z"
  },
  {
    "id": 7,
    "name": "Chocolate Lava Cake",
    "description": "Warm chocolate cake with molten center, served with vanilla ice cream",
    "price": 500,
    "category": "Desserts",
    "imageUrl": "/api/media/cake-001",
    "isActive": true,
    "createdAt": "2024-01-01T00:00:00Z"
  },
  {
    "id": 8,
    "name": "Fresh Lime Soda",
    "description": "Refreshing lime juice with soda water",
    "price": 200,
    "category": "Beverages",
    "imageUrl": "/api/media/drink-001",
    "isActive": true,
    "createdAt": "2024-01-01T00:00:00Z"
  }
]
```

---

### GET `/api/menu/{itemId}`

**Request:**
```typescript
const item = await fetchWithAuth("menu/1", { method: "GET" });
```

**Dummy Response:**
```json
{
  "id": 1,
  "name": "Margherita Pizza",
  "description": "Classic Italian pizza with tomato sauce, mozzarella, and fresh basil",
  "price": 1200,
  "category": "Pizza",
  "imageUrl": "/api/media/pizza-001",
  "isActive": true,
  "ingredients": ["tomato sauce", "mozzarella", "basil", "olive oil"],
  "preparationTime": 15,
  "calories": 850,
  "createdAt": "2024-01-01T00:00:00Z"
}
```

---

## Admin Menu API

### GET `/api/admin/menu`

Returns all items including inactive ones.

**Request:**
```typescript
const allItems = await fetchWithAuth("admin/menu", { method: "GET" });
```

**Dummy Response:**
```json
[
  {
    "id": 1,
    "name": "Margherita Pizza",
    "price": 1200,
    "category": "Pizza",
    "isActive": true
  },
  {
    "id": 9,
    "name": "BBQ Chicken Wings (INACTIVE)",
    "price": 900,
    "category": "Appetizers",
    "isActive": false
  }
]
```

---

### POST `/api/admin/menu`

**Request (multipart/form-data):**
```typescript
const formData = new FormData();
formData.append("menuItem", JSON.stringify({
  name: "New Item",
  price: 999,
  description: "Description here",
  category: "Main",
  isActive: true
}));
formData.append("image", imageFile); // Optional

const response = await fetch(`${BASE_URL}admin/menu`, {
  method: "POST",
  headers: { "Authorization": `Bearer ${token}` },
  body: formData
});
```

**Dummy Response:**
```json
{
  "id": 10,
  "name": "New Item",
  "price": 999,
  "description": "Description here",
  "category": "Main",
  "imageUrl": "/api/media/new-item-001",
  "isActive": true,
  "createdAt": "2024-02-14T10:30:00Z"
}
```

---

### PATCH `/api/admin/menu/{itemId}/availability`

**Request:**
```typescript
const response = await fetchWithAuth("admin/menu/1/availability?isActive=false", {
  method: "PATCH"
});
```

**Dummy Response:**
```json
{
  "id": 1,
  "name": "Margherita Pizza",
  "isActive": false,
  "updatedAt": "2024-02-14T10:30:00Z"
}
```

---

### DELETE `/api/admin/menu/{itemId}`

**Request:**
```typescript
const response = await fetchWithAuth("admin/menu/1", { method: "DELETE" });
// Returns 204 No Content
```

---

## Cart API

### POST `/api/cart/open`

**Request:**
```typescript
const cart = await fetchWithAuth("cart/open", {
  method: "POST",
  headers: { 
    "X-Table-Name": "Table-5",
    "X-User-Id": "1"
  }
});
```

**Dummy Response:**
```json
{
  "id": "cart-uuid-12345",
  "userId": 1,
  "tableName": "Table-5",
  "items": [],
  "totalAmount": 0,
  "status": "OPEN",
  "createdAt": "2024-02-14T10:30:00Z"
}
```

---

### GET `/api/cart/items`

**Request:**
```typescript
const items = await fetchWithAuth("cart/items", {
  method: "GET",
  headers: { 
    "X-Table-Name": "Table-5",
    "X-User-Id": "1"
  }
});
```

**Dummy Response:**
```json
[
  {
    "id": 101,
    "menuItemId": 1,
    "itemName": "Margherita Pizza",
    "quantity": 2,
    "price": 1200,
    "notes": "Extra cheese"
  },
  {
    "id": 102,
    "menuItemId": 2,
    "itemName": "Classic Burger",
    "quantity": 1,
    "price": 800,
    "notes": ""
  }
]
```

---

### POST `/api/cart/items`

**Request:**
```typescript
const cart = await fetchWithAuth("cart/items", {
  method: "POST",
  headers: { 
    "Content-Type": "application/json",
    "X-Table-Name": "Table-5",
    "X-User-Id": "1"
  },
  body: JSON.stringify({
    menuItemId: 1,
    quantity: 2,
    specialInstructions: "Extra cheese"
  })
});
```

**Dummy Response:**
```json
{
  "id": "cart-uuid-12345",
  "userId": 1,
  "tableName": "Table-5",
  "items": [
    {
      "id": 101,
      "menuItemId": 1,
      "itemName": "Margherita Pizza",
      "quantity": 2,
      "price": 1200,
      "notes": "Extra cheese"
    }
  ],
  "totalAmount": 2400,
  "status": "OPEN"
}
```

---

### PUT `/api/cart/items/{itemId}`

**Request:**
```typescript
const cart = await fetchWithAuth("cart/items/101", {
  method: "PUT",
  headers: { 
    "Content-Type": "application/json",
    "X-Table-Name": "Table-5",
    "X-User-Id": "1"
  },
  body: JSON.stringify({
    quantity: 3
  })
});
```

---

### DELETE `/api/cart/items/{itemId}`

**Request:**
```typescript
const cart = await fetchWithAuth("cart/items/101", {
  method: "DELETE",
  headers: { 
    "X-Table-Name": "Table-5",
    "X-User-Id": "1"
  }
});
```

---

### POST `/api/cart/checkout`

**Request:**
```typescript
const checkout = await fetchWithAuth("cart/checkout", {
  method: "POST",
  headers: { 
    "X-Table-Name": "Table-5",
    "X-User-Id": "1"
  }
});
```

**Dummy Response:**
```json
{
  "orderId": "ORD-1234567890",
  "status": "PENDING",
  "totalAmount": 3520,
  "items": [
    { "name": "Margherita Pizza", "quantity": 2, "subtotal": 2400 },
    { "name": "Classic Burger", "quantity": 1, "subtotal": 800 }
  ],
  "serviceFee": 320,
  "createdAt": "2024-02-14T10:35:00Z"
}
```

---

## Order API

### POST `/api/orders`

**Request:**
```typescript
const order = await fetchWithAuth("orders", {
  method: "POST",
  headers: { 
    "Authorization": "Bearer <token>",
    "X-User-Id": "1",
    "X-Table-Id": "5"
  }
});
```

**Dummy Response:**
```json
{
  "id": 1234,
  "orderId": "ORD-1234567890",
  "userId": 1,
  "tableId": 5,
  "status": "PENDING",
  "items": [
    {
      "menuItemId": 1,
      "name": "Margherita Pizza",
      "quantity": 2,
      "unitPrice": 1200,
      "subtotal": 2400
    },
    {
      "menuItemId": 2,
      "name": "Classic Burger",
      "quantity": 1,
      "unitPrice": 800,
      "subtotal": 800
    }
  ],
  "subtotal": 3200,
  "serviceFee": 320,
  "totalAmount": 3520,
  "createdAt": "2024-02-14T10:35:00Z"
}
```

---

### GET `/api/orders/table`

**Request:**
```typescript
const orders = await fetchWithAuth("orders/table", {
  method: "GET",
  headers: { "X-Table-Id": "5" }
});
```

**Dummy Response:**
```json
[
  {
    "id": 1234,
    "orderId": "ORD-1234567890",
    "tableId": 5,
    "status": "PREPARING",
    "totalAmount": 3520,
    "createdAt": "2024-02-14T10:35:00Z",
    "items": [
      { "name": "Margherita Pizza", "quantity": 2 },
      { "name": "Classic Burger", "quantity": 1 }
    ]
  },
  {
    "id": 1230,
    "orderId": "ORD-1234567886",
    "tableId": 5,
    "status": "DELIVERED",
    "totalAmount": 1100,
    "createdAt": "2024-02-14T09:15:00Z",
    "items": [
      { "name": "Spaghetti Carbonara", "quantity": 1 }
    ]
  }
]
```

---

### GET `/api/orders/active`

**Request:**
```typescript
const activeOrders = await fetchWithAuth("orders/active", { method: "GET" });
```

**Dummy Response (Kitchen View):**
```json
[
  {
    "id": 1235,
    "orderId": "ORD-1234567891",
    "tableId": 8,
    "status": "PENDING",
    "createdAt": "2024-02-14T10:40:00Z",
    "items": [
      { "name": "Caesar Salad", "quantity": 1, "notes": "" }
    ]
  },
  {
    "id": 1234,
    "orderId": "ORD-1234567890",
    "tableId": 5,
    "status": "PREPARING",
    "createdAt": "2024-02-14T10:35:00Z",
    "items": [
      { "name": "Margherita Pizza", "quantity": 2, "notes": "Extra cheese" },
      { "name": "Classic Burger", "quantity": 1, "notes": "" }
    ]
  },
  {
    "id": 1232,
    "orderId": "ORD-1234567888",
    "tableId": 3,
    "status": "PREPARING",
    "createdAt": "2024-02-14T10:25:00Z",
    "items": [
      { "name": "Sushi Combo", "quantity": 1, "notes": "No wasabi" },
      { "name": "Chicken Noodles", "quantity": 2, "notes": "" }
    ]
  }
]
```

---

### PATCH `/api/orders/{orderId}/status`

**Request:**
```typescript
const updated = await fetchWithAuth("orders/1234/status", {
  method: "PATCH",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    status: "PREPARING"
  })
});
```

**Valid Statuses:** `PENDING`, `PREPARING`, `READY`, `DELIVERED`, `CANCELLED`

**Dummy Response:**
```json
{
  "id": 1234,
  "orderId": "ORD-1234567890",
  "status": "PREPARING",
  "updatedAt": "2024-02-14T10:37:00Z"
}
```

---

## Payment API

### POST `/api/payments/create`

**Request:**
```typescript
const payment = await fetchWithAuth("payments/create", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    amount: 3520.00
  })
});
```

**Dummy Response:**
```json
"https://www.sandbox.paypal.com/checkoutnow?token=EC-ABC123456789"
```

---

## AI Chatbot API

### POST `/api/ai/ask`

**Request:**
```typescript
const answer = await fetch(`${BASE_URL}ai/ask`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    question: "What vegetarian options do you have?"
  })
});
```

**Dummy Response:**
```json
{
  "answer": "We have several vegetarian options! Our Caesar Salad (රු 600) is a popular choice with fresh romaine lettuce. We also have Spaghetti Carbonara (රු 1000) which can be made vegetarian on request, and our Margherita Pizza (රු 1200) is a classic vegetarian favorite with fresh mozzarella and basil. Would you like me to tell you more about any of these dishes?"
}
```

---

## Mock Data Service

Create a mock service file for frontend testing:

```typescript
// src/services/mockData.ts

export const MOCK_USERS = {
  customer: {
    id: 1,
    email: "customer@test.com",
    fullName: "Test Customer",
    role: 1,
    token: "mock-customer-token"
  },
  admin: {
    id: 2,
    email: "admin@test.com",
    fullName: "Test Admin",
    role: 2,
    token: "mock-admin-token"
  },
  kitchen: {
    id: 3,
    email: "kitchen@test.com",
    fullName: "Kitchen Staff",
    role: 3,
    token: "mock-kitchen-token"
  }
};

export const MOCK_MENU: MenuItem[] = [
  { id: 1, name: "Margherita Pizza", price: 1200, category: "Pizza", description: "Classic Italian pizza", available: true },
  { id: 2, name: "Classic Burger", price: 800, category: "Burgers", description: "Juicy beef patty", available: true },
  { id: 3, name: "Spaghetti Carbonara", price: 1000, category: "Pasta", description: "Creamy bacon pasta", available: true },
  { id: 4, name: "Caesar Salad", price: 600, category: "Salads", description: "Fresh romaine salad", available: true },
  { id: 5, name: "Chicken Noodles", price: 750, category: "Asian", description: "Stir-fried noodles", available: true },
  { id: 6, name: "Sushi Combo", price: 2500, category: "Japanese", description: "12pc sushi platter", available: true },
  { id: 7, name: "Chocolate Lava Cake", price: 500, category: "Desserts", description: "Warm chocolate cake", available: true },
  { id: 8, name: "Fresh Lime Soda", price: 200, category: "Beverages", description: "Refreshing lime drink", available: true }
];

export const MOCK_ORDERS: Order[] = [
  {
    id: 1234,
    orderId: "ORD-1234567890",
    tableId: 5,
    status: "PREPARING",
    totalAmount: 3520,
    createdAt: new Date().toISOString(),
    items: [
      { menuItemId: 1, name: "Margherita Pizza", quantity: 2 },
      { menuItemId: 2, name: "Classic Burger", quantity: 1 }
    ]
  },
  {
    id: 1230,
    orderId: "ORD-1234567886",
    tableId: 5,
    status: "DELIVERED",
    totalAmount: 1100,
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    items: [
      { menuItemId: 3, name: "Spaghetti Carbonara", quantity: 1 }
    ]
  }
];

export const TABLES = [
  { id: 1, name: "Table-1", capacity: 2 },
  { id: 2, name: "Table-2", capacity: 4 },
  { id: 3, name: "Table-3", capacity: 4 },
  { id: 4, name: "Table-4", capacity: 6 },
  { id: 5, name: "Table-5", capacity: 6 },
  { id: 6, name: "Table-6", capacity: 8 },
  { id: 7, name: "Table-7", capacity: 2 },
  { id: 8, name: "Table-8", capacity: 4 }
];
```

---

## Testing Workflow

### 1. Test Login Flow
```
1. Go to /login
2. Enter: customer@test.com / password123
3. Should redirect to /menu
4. Check cart icon shows in header
```

### 2. Test Menu & Cart Flow
```
1. View menu items (8 items should show)
2. Click "Add to Cart" on Pizza
3. Cart badge should show "1"
4. Add Burger to cart
5. Open cart sidebar
6. Update Pizza quantity to 2
7. Verify total: රු 3200 + රු 320 (10%) = රු 3520
```

### 3. Test Order Flow
```
1. Click "Checkout" in cart
2. Order created with status "PENDING"
3. Go to /order page
4. See order in list
5. Status updates: PENDING → PREPARING → READY → DELIVERED
```

### 4. Test Kitchen Flow
```
1. Login as kitchen@test.com
2. Go to /kitchen
3. See pending orders
4. Click "Start Preparing" on an order
5. Click "Mark Ready" when done
```

### 5. Test Admin Flow
```
1. Login as admin@test.com
2. Go to /admin/dashboard
3. See stats: Revenue, Orders, Customers
4. Go to /admin/menu
5. Add new menu item
6. Toggle item availability
7. Delete an item
```

---

## Error Responses

All endpoints may return these error responses:

```json
// 400 Bad Request
{ "error": "Invalid request body", "details": "name is required" }

// 401 Unauthorized
{ "error": "Invalid or expired token" }

// 403 Forbidden
{ "error": "Insufficient permissions" }

// 404 Not Found
{ "error": "Resource not found" }

// 500 Internal Server Error
{ "error": "Internal server error", "message": "Something went wrong" }
```

---

## Quick Reference

| Action | Method | Endpoint | Auth |
|--------|--------|----------|------|
| Login | POST | `/api/auth/login` | No |
| Register | POST | `/api/auth/register` | No |
| Get Menu | GET | `/api/menu` | No |
| Add to Cart | POST | `/api/cart/items` | Yes |
| Create Order | POST | `/api/orders` | Yes |
| Get My Orders | GET | `/api/orders/user` | Yes |
| Update Status | PATCH | `/api/orders/{id}/status` | Kitchen/Admin |
| Create Payment | POST | `/api/payments/create` | Yes |
| Admin: Add Item | POST | `/api/admin/menu` | Admin |
