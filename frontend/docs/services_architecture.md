# Backend Services Architecture & Responsibilities
## API Gateway Service Distribution

**Document Version:** 1.0  
**Last Updated:** February 16, 2026  
**Purpose:** Define responsibilities of each backend service and their integration with API Gateway

---

## Services Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    API Gateway (Port 8080)                      │
│         Routes incoming requests to appropriate services        │
└────────────────────────────────────┬────────────────────────────┘
                                     │
        ┌────────────────────────────┼────────────────────────────┐
        │                            │                            │
        ▼                            ▼                            ▼
    auth-service             menu-service                  order-service
    (Port 3001)              (Port 3003)                   (Port 3004)
                                     │                            │
        ┌────────────┬───────────────┴────────────┬───────────────┴────────────┐
        │            │                            │                            │
        ▼            ▼                            ▼                            ▼
   cart-service  payment-service           waiter-service              kds-service
   (Port 3002)   (Port 3008)                (Port 3009)                (Port 3010)
                                                                            │
        ┌────────────────────────────────────────────────────────────────────┘
        │
        ▼
 analytics-service
 (Port 3011)
  ai-service
 (Port 3007)
```

---

## 1. AUTH-SERVICE (Port 3001)
### Authentication & User Management

**Primary Responsibility:**
Handle user authentication, authorization, profile management, and JWT token validation.

**Owned Endpoints:**
```
POST   /api/auth/register          - User registration
POST   /api/auth/login             - User login
POST   /api/auth/logout            - User logout
POST   /api/auth/refresh           - Refresh access token
GET    /api/profile/me             - Get current user profile
PUT    /api/profile/me             - Update user profile
GET    /api/auth/validate-token    - Validate JWT token (internal)
POST   /api/auth/verify-email      - Email verification (future)
```

**Key Responsibilities:**
- User registration with role assignment (Customer, Admin, Kitchen, Waiter)
- Password hashing and security
- JWT token generation and management
- Token expiration and refresh logic
- User profile storage and retrieval
- Role-based access validation
- Session management
- Email verification (future)
- Password reset (future)

**Database Schema (Example):**
```sql
users (
  id INT PRIMARY KEY,
  email VARCHAR(255) UNIQUE,
  password_hash VARCHAR(255),
  fullName VARCHAR(255),
  phone VARCHAR(20),
  role INT (1=Customer, 2=Admin, 3=Kitchen, 4=Waiter),
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  is_active BOOLEAN
)

tokens (
  id INT PRIMARY KEY,
  user_id INT,
  refresh_token VARCHAR(500),
  expires_at TIMESTAMP,
  created_at TIMESTAMP
)
```

**Interactions with Other Services:**
- Called by: API Gateway (every request for validation)
- Calls: None (standalone)
- Updates: None specific to other services

**Frontend Integration Points:**
- Login → `POST /api/auth/login` → Returns JWT tokens
- Register → `POST /api/auth/register` → Creates new user
- Edit Profile → `PUT /api/profile/me` → Updates profile
- View Profile → `GET /api/profile/me` → Returns user details

**Error Handling:**
- 401: Invalid credentials or expired token
- 409: Email already registered (duplicate)
- 400: Validation errors
- 500: Internal server error

---

## 2. MENU-SERVICE (Port 3003)
### Menu Items, Categories, and Availability Management

**Primary Responsibility:**
Manage restaurant menu items, categories, descriptions, pricing, and availability status.

**Owned Endpoints:**
```
GET    /api/menu                    - Get all menu items (with pagination/filters)
GET    /api/menu/{id}               - Get single menu item
GET    /api/menu/categories         - Get all categories
POST   /api/menu                    - Create menu item (Admin only)
PUT    /api/menu/{id}               - Update menu item (Admin only)
DELETE /api/menu/{id}               - Delete menu item (Admin only)
POST   /api/menu/categories         - Create category (Admin only)
PUT    /api/menu/categories/{id}    - Update category (Admin only)
DELETE /api/menu/categories/{id}    - Delete category (Admin only)
GET    /api/menu/search             - Search menu items
```

**Key Responsibilities:**
- Store menu item details (name, description, price, image)
- Manage menu categories (Appetizers, Mains, Desserts, Beverages)
- Track item availability status (available/unavailable)
- Mark items as spicy or special
- Store item images (or image URLs)
- Handle menu item sorting and filtering
- Search functionality
- Cache management (popular items)

**Database Schema (Example):**
```sql
categories (
  id INT PRIMARY KEY,
  name VARCHAR(100),
  icon VARCHAR(50),
  display_order INT,
  created_at TIMESTAMP
)

menu_items (
  id INT PRIMARY KEY,
  category_id INT,
  name VARCHAR(255),
  description TEXT,
  price DECIMAL(10, 2),
  image_url VARCHAR(500),
  is_available BOOLEAN,
  is_spicy BOOLEAN,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id)
)
```

**Interactions with Other Services:**
- Called by: Order Service (verify items), Waiter Service, KDS, Analytics
- Calls: None
- Updates: Inventory Service (when items purchased)

**Frontend Integration Points:**
- Browse Menu → `GET /api/menu` → List all items
- Filter by Category → `GET /api/menu?categoryId=1` → Filter items
- View Item Details → `GET /api/menu/{id}` → Single item details
- Add Menu Item (Admin) → `POST /api/menu` → Create item
- Edit Menu Item (Admin) → `PUT /api/menu/{id}` → Update item
- Delete Menu Item (Admin) → `DELETE /api/menu/{id}` → Remove item

**Caching Strategy:**
- Cache entire menu list (update every 5 minutes or on change)
- Cache categories (update rarely)
- Invalidate cache when items added/updated/deleted

---

## 3. ORDER-SERVICE (Port 3004)
### Order Management and Order Lifecycle

**Primary Responsibility:**
Handle order creation, retrieval, status tracking, and order history management for customers and kitchen.

**Owned Endpoints:**
```
POST   /api/orders                  - Create new order
GET    /api/orders                  - Get all orders (Admin, Kitchen filters)
GET    /api/orders/{id}             - Get specific order details
GET    /api/orders/by-table/{tableId} - Get orders for specific table
GET    /api/orders/active           - Get active orders (PLACED, PREPARING, READY)
GET    /api/orders/my-orders        - Get current user's orders
PUT    /api/orders/{id}/status      - Update order status
GET    /api/orders/analytics        - Get order stats (Admin)
POST   /api/orders/{id}/cancel      - Cancel order
```

**Key Responsibilities:**
- Create orders with line items (menu items, quantities)
- Assign orders to tables
- Track order status lifecycle (PLACED → PREPARING → READY → SERVED → COMPLETED)
- Store order items with prices (lock prices at order time)
- Calculate order totals
- Maintain order history
- Support order search and filtering
- Generate order IDs
- Estimate preparation time
- Handle order cancellations

**Database Schema (Example):**
```sql
orders (
  id VARCHAR(20) PRIMARY KEY,  -- Format: ORD-00001
  customer_id INT,
  waiter_id INT,
  table_id VARCHAR(10),
  status VARCHAR(50),  -- PLACED, PREPARING, READY, SERVED, COMPLETED, CANCELLED
  total_amount DECIMAL(10, 2),
  payment_method VARCHAR(50),
  estimated_time INT,  -- minutes
  special_notes TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  served_at TIMESTAMP,
  completed_at TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES users(id),
  FOREIGN KEY (waiter_id) REFERENCES users(id)
)

order_items (
  id INT PRIMARY KEY,
  order_id VARCHAR(20),
  menu_item_id INT,
  quantity INT,
  unit_price DECIMAL(10, 2),  -- Price at time of order
  special_notes TEXT,
  FOREIGN KEY (order_id) REFERENCES orders(id),
  FOREIGN KEY (menu_item_id) REFERENCES menu_items(id)
)
```

**Order Status Lifecycle:**
```
PLACED → PREPARING → READY → SERVED → COMPLETED
             │
             └──────────────→ CANCELLED (anytime before SERVED)
```

**Interactions with Other Services:**
- Called by: Customers, Waiters, Kitchen, Admin, Analytics, Payment
- Calls: Menu Service (validate items), Inventory (optional: check stock)
- Updates: Kitchen (via KDS), Payment Service (after completion)

**Frontend Integration Points:**
- Customer Places Order → `POST /api/orders` → Creates order
- Customer Tracks Order → `GET /api/orders/{id}` → Retrieves status
- Customer Views History → `GET /api/orders/my-orders` → Order history
- Kitchen Views Active Orders → `GET /api/orders/active` → Active orders
- Kitchen Updates Status → `PUT /api/orders/{id}/status` → Status change
- Waiter Views Orders → `GET /api/orders/by-table/{tableId}` → Table orders
- Admin Views All Orders → `GET /api/orders` → Full list with filters

---

## 4. CART-SERVICE (Port 3002)
### Shopping Cart Management (Optional Backend)

**Primary Responsibility:**
Manage shopping cart state and persistence (optional - can be frontend-only).

**Owned Endpoints (Optional):**
```
POST   /api/cart/create             - Create new shopping session
GET    /api/cart/{sessionId}        - Get cart contents
POST   /api/cart/{sessionId}/items  - Add item to cart
PUT    /api/cart/{sessionId}/items/{itemId} - Update item quantity
DELETE /api/cart/{sessionId}/items/{itemId} - Remove item
POST   /api/cart/{sessionId}/checkout - Convert cart to order
DELETE /api/cart/{sessionId}        - Clear cart (abandon session)
```

**Current Frontend Status:**
⚠️ **Currently implemented as Frontend-Only (CartContext + localStorage)**
- No backend calls needed
- Cart stored in browser localStorage
- When user checks out, order is sent to Order Service

**Future Backend Integration (Optional):**
- Persist carts for returning customers
- Cross-device cart sync
- Cart analytics
- Abandoned cart recovery

**Benefits of Backend Cart Service:**
- Users can access carts from multiple devices
- Analytics on abandoned carts
- Personalized recommendations based on cart
- Better performance (reduces payload to checkout)

**When to Use:**
- Keep frontend-only for MVP ✅ (Current setup)
- Add backend cart service for multi-device support (future)

---

## 5. PAYMENT-SERVICE (Port 3008)
### Payment Processing and Transaction Management

**Primary Responsibility:**
Process payments, manage payment methods, handle transactions, and provide payment history.

**Owned Endpoints:**
```
POST   /api/payments/process        - Process payment for order
POST   /api/payments/verify         - Verify payment status
GET    /api/payments/{transactionId} - Get payment details
GET    /api/payments/order/{orderId} - Get order payment info
POST   /api/payments/refund         - Process refund
GET    /api/payments/methods        - Get available payment methods
```

**Key Responsibilities:**
- Process multiple payment methods (CARD, CASH, PAYPAL, UPI, etc.)
- Handle payment security (PCI compliance)
- Transaction logging and history
- Payment status tracking (PENDING, COMPLETED, FAILED, REFUNDED)
- Integration with payment gateways (Stripe, PayPal, local providers)
- Refund processing
- Receipt generation
- Tax calculations
- Commission tracking (for wallets/loyalty)

**Database Schema (Example):**
```sql
payments (
  id VARCHAR(30) PRIMARY KEY,  -- TXN-XXXXX
  order_id VARCHAR(20),
  user_id INT,
  amount DECIMAL(10, 2),
  payment_method VARCHAR(50),  -- CARD, CASH, PAYPAL, UPI
  payment_gateway VARCHAR(50), -- STRIPE, PAYPAL, etc
  status VARCHAR(50),          -- PENDING, COMPLETED, FAILED, REFUNDED
  reference_id VARCHAR(255),   -- Reference from payment gateway
  error_message TEXT,
  created_at TIMESTAMP,
  completed_at TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
)

refunds (
  id INT PRIMARY KEY,
  payment_id VARCHAR(30),
  amount DECIMAL(10, 2),
  reason TEXT,
  status VARCHAR(50),
  created_at TIMESTAMP,
  FOREIGN KEY (payment_id) REFERENCES payments(id)
)
```

**Payment Methods to Support:**
- Card (Debit/Credit)
- Cash (At table or counter)
- Wallet/Prepaid
- Digital wallets (Apple Pay, Google Pay)
- UPI (for India market)
- Bank Transfer

**Interactions with Other Services:**
- Called by: Order Service (after order completion), Frontend (during checkout)
- Calls: Order Service (update order payment status), Analytics (log transaction)
- Updates: Order Service (payment_method, payment_status)

**Frontend Integration Points:**
- Customer selects payment method during checkout
- Customer provides payment details
- Frontend calls Order Service with payment method
- Order Service coordinates with Payment Service
- Frontend receives order confirmation with payment status

---

## 6. WAITER-SERVICE (Port 3009)
### Waiter-Specific Operations and Proxy Orders

**Primary Responsibility:**
Handle waiter operations including proxy orders, table management, and cash collection tracking.

**Owned Endpoints:**
```
GET    /api/waiter/dashboard        - Get waiter dashboard info
POST   /api/waiter/proxy-orders     - Create proxy order
GET    /api/waiter/proxy-orders     - Get waiter's proxy orders
GET    /api/waiter/pending-cash     - Get pending cash collections
PUT    /api/waiter/orders/{id}/serve - Mark order as served
GET    /api/waiter/tables           - Get table status
PUT    /api/waiter/tables/{id}      - Update table status
GET    /api/waiter/stats            - Get waiter performance stats
```

**Key Responsibilities:**
- Manage proxy orders (orders created by waiter on customer's behalf)
- Track pending cash collections
- Table status management (OCCUPIED, READY_TO_SERVE, AVAILABLE)
- Serve order tracking (mark orders as SERVED)
- Waiter performance metrics
- QR code data validation
- Pending cash collection persistence

**Database Schema (Example):**
```sql
proxy_orders (
  id VARCHAR(20) PRIMARY KEY,
  waiter_id INT,
  order_id VARCHAR(20),
  created_at TIMESTAMP,
  FOREIGN KEY (waiter_id) REFERENCES users(id),
  FOREIGN KEY (order_id) REFERENCES orders(id)
)

cash_collections (
  id INT PRIMARY KEY,
  waiter_id INT,
  order_id VARCHAR(20),
  amount DECIMAL(10, 2),
  status VARCHAR(50),  -- PENDING, HANDED_OVER, RECEIVED_BY_CASHIER
  collected_at TIMESTAMP,
  received_at TIMESTAMP,
  received_by_user_id INT,
  FOREIGN KEY (waiter_id) REFERENCES users(id),
  FOREIGN KEY (order_id) REFERENCES orders(id),
  FOREIGN KEY (received_by_user_id) REFERENCES users(id)
)

table_status (
  table_id VARCHAR(10) PRIMARY KEY,
  status VARCHAR(50),  -- AVAILABLE, OCCUPIED, READY_TO_SERVE
  current_order_id VARCHAR(20),
  occupied_since TIMESTAMP,
  updated_at TIMESTAMP,
  FOREIGN KEY (current_order_id) REFERENCES orders(id)
)
```

**Interactions with Other Services:**
- Called by: Waiter Frontend, Order Service (for table association)
- Calls: Order Service (proxy order creation), Table Service (status updates)
- Updates: Order Service (mark as served), Cashier Service (cash confirmation)

**Frontend Integration Points:**
- Proxy Order Creation → `POST /api/waiter/proxy-orders` → Creates order
- View Pending Cash → `GET /api/waiter/pending-cash` → List collections
- Mark Order Served → `PUT /api/waiter/orders/{id}/serve` → Update status
- Check Table Status → `GET /api/waiter/tables` → Table availability
- Update Table Status → `PUT /api/waiter/tables/{id}` → Change status

**Cash Collection Workflow:**
```
1. Waiter creates proxy order → QR generated (frontend)
2. Waiter collects cash → Marks pending
3. Waiter gives to cashier → Sends QR data
4. Cashier confirms → POST /api/cashier/receive-cash (calls this service)
5. Service updates cash_collections.status = "RECEIVED_BY_CASHIER"
```

---

## 7. KDS-SERVICE (Port 3010)
### Kitchen Display System & Order Preparation

**Primary Responsibility:**
Manage kitchen operations, order preparation tracking, and kitchen display system (KDS) functionality.

**Owned Endpoints:**
```
GET    /api/kitchen/orders          - Get active kitchen orders
GET    /api/kitchen/orders/{id}     - Get order details for item
PUT    /api/kitchen/orders/{id}/status - Update order status
GET    /api/kitchen/stats           - Get kitchen stats (time, volume)
POST   /api/kitchen/set-ready       - Mark item as ready
GET    /api/kitchen/pending         - Get pending items only
GET    /api/kitchen/in-progress     - Get in-progress items
```

**Key Responsibilities:**
- Order preparation status tracking
- Kitchen staff assignment (which chef prepares what)
- Estimated preparation time calculation
- Alert/notification for new orders
- Print kitchen tickets (optional)
- Timer for items in preparation
- Performance metrics (average prep time)
- Queue management (FIFO - First In First Out)

**Database Schema (Example):**
```sql
kitchen_order_status (
  id INT PRIMARY KEY,
  order_id VARCHAR(20),
  item_id INT,
  kitchen_staff_id INT,
  status VARCHAR(50),  -- WAITING, IN_PROGRESS, READY, SERVED
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  estimated_time INT,  -- minutes
  FOREIGN KEY (order_id) REFERENCES orders(id),
  FOREIGN KEY (item_id) REFERENCES menu_items(id),
  FOREIGN KEY (kitchen_staff_id) REFERENCES users(id)
)

kitchen_stats (
  id INT PRIMARY KEY,
  kitchen_staff_id INT,
  date DATE,
  items_prepared INT,
  avg_prep_time INT,
  FOREIGN KEY (kitchen_staff_id) REFERENCES users(id)
)
```

**Order Status in Kitchen:**
```
1. PLACED → Order arrives in KDS
2. Wait for kitchen to accept
3. IN_PROGRESS → Kitchen starts preparing
4. READY → All items ready, waiting for service
5. SERVED → Waiter picked up order
6. COMPLETED → Order marked complete
```

**Interactions with Other Services:**
- Called by: Kitchen Frontend, Order Service (for updates)
- Calls: Order Service (update status), Menu Service (item details)
- Updates: Order Service (order status), Waiter Service (ready notification)

**Frontend Integration Points:**
- Kitchen sees active orders → `GET /api/kitchen/orders` → Active list
- Kitchen marks as preparing → `PUT /api/kitchen/orders/{id}/status` (PREPARING)
- Kitchen marks as ready → `PUT /api/kitchen/orders/{id}/status` (READY)
- Kitchen sees stats → `GET /api/kitchen/stats` → Performance metrics

**Performance Considerations:**
- Real-time updates (WebSocket) for order arrivals
- Sound/visual alerts for critical orders
- Auto-refresh KDS display
- Estimated time adjustment based on queue

---

## 8. CASHIER-SERVICE (Future Enhancement)
### Cash and Payment Receipt Management

**Primary Responsibility:**
Track cash collections from waiters, issue receipts, and manage cashier operations.

**Planned Endpoints:**
```
POST   /api/cashier/receive-cash    - Confirm cash receipt from waiter QR
GET    /api/cashier/transactions    - Get all transactions
GET    /api/cashier/daily-summary   - Daily cash summary
POST   /api/cashier/reconcile       - End-of-day reconciliation
GET    /api/cashier/pending         - Get pending cash from waiters
```

**Key Responsibilities:**
- Validate waiter QR codes
- Track cash receipts from waiters
- Generate receipts
- Daily cash reconciliation
- Discrepancy tracking
- Cash float management
- Transaction audit log

**Database Schema (Example):**
```sql
cashier_transactions (
  id VARCHAR(30) PRIMARY KEY,  -- TXN-XXXXX
  order_id VARCHAR(20),
  waiter_id INT,
  cashier_id INT,
  amount DECIMAL(10, 2),
  payment_method VARCHAR(50),  -- CASH
  transaction_type VARCHAR(50), -- COLLECTION, REFUND
  status VARCHAR(50),          -- CONFIRMED, RECONCILED
  created_at TIMESTAMP,
  received_at TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id),
  FOREIGN KEY (waiter_id) REFERENCES users(id),
  FOREIGN KEY (cashier_id) REFERENCES users(id)
)

cashier_reconciliation (
  id INT PRIMARY KEY,
  cashier_id INT,
  date DATE,
  opening_balance DECIMAL(10, 2),
  cash_received DECIMAL(10, 2),
  cash_returned DECIMAL(10, 2),
  expected_closing DECIMAL(10, 2),
  actual_closing DECIMAL(10, 2),
  discrepancy DECIMAL(10, 2),
  created_at TIMESTAMP,
  FOREIGN KEY (cashier_id) REFERENCES users(id)
)
```

**Interactions with Other Services:**
- Called by: Admin/Cashier Frontend, Payment Service
- Calls: Waiter Service (update cash status), Order Service (reconcile)
- Updates: Waiter Service (pending cash), Analytics (daily metrics)

**Current Status:**
- ⏳ Frontend ready (CashierReceiveCash.tsx implemented)
- 🚧 Backend implementation pending

---

## 9. ANALYTICS-SERVICE (Port 3011)
### Business Intelligence and Reporting

**Primary Responsibility:**
Collect, aggregate, and provide analytics data for business reporting and insights.

**Owned Endpoints:**
```
GET    /api/analytics/orders        - Order statistics
GET    /api/analytics/revenue       - Revenue reports
GET    /api/analytics/popular-items - Popular menu items
GET    /api/analytics/performance   - Staff performance metrics
GET    /api/analytics/trends        - Sales trends over time
GET    /api/analytics/waste         - Waste/cancellation analysis
POST   /api/analytics/export        - Export data (CSV/PDF)
```

**Key Responsibilities:**
- Order count and patterns
- Revenue calculations and trends
- Popular menu items analysis
- Staff performance tracking
- Customer behavior analysis
- Waste tracking
- Peak hour identification
- Forecasting (future)
- Custom report generation

**Data Aggregated From:**
- Orders (volume, total, items)
- Payments (revenue, methods)
- Kitchen (prep times, staffing)
- Waiter (service times, customer satisfaction)
- Menu (item popularity, profitability)

**Analytics Dashboard Metrics:**
```
Real-time:
- Today's orders: X
- Today's revenue: ₹X
- Average order value: ₹X
- Orders in progress: X

Trends:
- Daily revenue (last 7 days)
- Weekly comparison
- Popular items this week
- Peak hours
- Staff efficiency ratings
```

**Interactions with Other Services:**
- Called by: Admin Frontend
- Calls: Order Service (fetch orders), Payment Service (revenue data), Menu Service (item data)
- Updates: None (read-only)

**Frontend Integration Points:**
- Admin Dashboard → `GET /api/analytics/orders` → Order stats
- Admin Views Revenue → `GET /api/analytics/revenue` → Revenue reports
- Admin Views Trends → `GET /api/analytics/trends` → Historical trends

---

## 10. AI-SERVICE (Port 3007)
### AI Features and Recommendations (Future)

**Primary Responsibility:**
Provide AI-powered features like recommendations, forecast, and insights.

**Potential Endpoints:**
```
POST   /api/ai/recommend            - Get menu recommendations
POST   /api/ai/forecast             - Sales forecast
POST   /api/ai/inventory-predict    - Predict inventory needs
POST   /api/ai/cook-time-estimate   - Estimate order prep time
```

**Key Responsibilities:**
- Personalized recommendations (based on customer history)
- Sales forecasting
- Inventory prediction
- Prep time optimization
- Dynamic pricing (future)
- Waste prediction
- Customer behavior analysis
- Kitchen demand forecasting

**Current Status:**
- 🎯 Not yet implemented
- Planned for future enhancement

---

## API Gateway Routing Configuration

The API Gateway should route incoming requests as follows:

```typescript
// Gateway Routes Configuration (Example: Node.js/Express)

const routes = {
  // Auth Service
  '/api/auth/*': 'http://auth-service:3001',
  '/api/profile/*': 'http://auth-service:3001',

  // Menu Service
  '/api/menu/*': 'http://menu-service:3003',

  // Order Service
  '/api/orders/*': 'http://order-service:3004',

  // Cart Service (Optional)
  '/api/cart/*': 'http://cart-service:3002',

  // Payment Service
  '/api/payments/*': 'http://payment-service:3008',

  // Waiter Service
  '/api/waiter/*': 'http://waiter-service:3009',

  // Kitchen Service
  '/api/kitchen/*': 'http://kds-service:3010',

  // Cashier Service
  '/api/cashier/*': 'http://cashier-service:3008', // or separate Port 3012
  
  // Staff Management (part of Auth or separate)
  '/api/staff/*': 'http://auth-service:3001',

  // Analytics Service
  '/api/analytics/*': 'http://analytics-service:3011',

  // AI Service
  '/api/ai/*': 'http://ai-service:3007',
};
```

---

## Middleware in API Gateway

The API Gateway must implement these middleware layers:

### 1. Request Validation Middleware
```
- Parse JSON
- Validate Content-Type header
- Check required fields
- Validate data types
```

### 2. Authentication Middleware
```
- Extract Authorization header
- Validate JWT token
- Check token expiry
- Handle token refresh
```

### 3. Authorization Middleware
```
- Extract user role from token
- Check endpoint permissions
- Enforce role-based access
  - Customer (1): Can only access /api/orders/my-orders, /api/menu
  - Admin (2): Full access
  - Kitchen (3): Can access /api/kitchen/*, /api/menu (read-only)
  - Waiter (4): Can access /api/waiter/*, /api/orders
```

### 4. Rate Limiting Middleware
```
- Limit requests per IP
- Implement exponential backoff
- Return 429 Too Many Requests when exceeded
```

### 5. Logging Middleware
```
- Log all requests with timestamp
- Log response status codes
- Log errors for debugging
- Track performance metrics
```

### 6. CORS Middleware
```
- Allow requests from frontend (http://localhost:5173)
- Send proper CORS headers
- Handle preflight OPTIONS requests
```

### 7. Error Handling Middleware
```
- Catch errors from services
- Standardize error responses
- Send appropriate HTTP status codes
- Don't expose sensitive information
```

---

## Service Communication Patterns

### Synchronous Communication (Request-Response)
```
Frontend → API Gateway → Order Service
                            ├─ Validates user (calls Auth Service internally)
                            ├─ Checks menu items (calls Menu Service internally)
                            └─ Returns response
```

**When to Use:** User-facing operations that need immediate confirmation

### Asynchronous Communication (Eventually Consistent)
```
Frontend Creates Order → Order Service
                            ├─ Creates order
                            └─ Publishes "OrderCreated" event

                              ├→ Analytics Service (update stats)
                              ├→ Kitchen Service (add to queue)
                              ├→ Waiter Service (notify)
                              └→ Payment Service (if auto-pay)
```

**When to Use:** Background tasks, notifications, analytics

### Recommended Message Queue
- RabbitMQ or Kafka for event-driven architecture
- Use events like:
  - `order.created`
  - `order.status.changed`
  - `payment.completed`
  - `menu.item.updated`

---

## Service Deployment Topology

```yaml
# Docker Compose or Kubernetes deployment

services:
  api-gateway:
    port: 8080
    environment:
      - API_GATEWAY_URL=http://localhost:8080
    depends_on: [auth-service, menu-service, order-service, ...]

  auth-service:
    port: 3001
    environment:
      - DATABASE_URL=postgres://db:5432/auth_db
      - JWT_SECRET=your-secret-key

  menu-service:
    port: 3003
    environment:
      - DATABASE_URL=postgres://db:5432/menu_db
      - REDIS_URL=redis://cache:6379

  order-service:
    port: 3004
    environment:
      - DATABASE_URL=postgres://db:5432/order_db
      - MESSAGE_QUEUE_URL=rabbitmq://queue:5672

  # ... other services ...

  database:
    image: postgres:15
    environment:
      - POSTGRES_PASSWORD=root
    ports:
      - "5432:5432"

  cache:
    image: redis:7
    ports:
      - "6379:6379"

  message-queue:
    image: rabbitmq:latest
    ports:
      - "5672:5672"
      - "15672:15672"
```

---

## Service Health Checks

Each service should implement health check endpoint:

```
GET /health
GET /health/ready (checks dependencies)

Response:
{
  "status": "healthy",
  "service": "order-service",
  "timestamp": "2024-02-16T10:30:00Z",
  "dependencies": {
    "database": "connected",
    "message_queue": "connected"
  }
}
```

API Gateway can use these to detect and route around failing services.

---

## Service-to-Service Communication Security

### Internal vs External APIs
```
External (Frontend-accessible):
- /api/auth/login
- /api/menu
- /api/orders
- /api/payments
- etc.

Internal (Service-to-service only):
- /internal/orders/validate
- /internal/menu/get-by-ids
- /internal/user/get-role
- etc.
```

### Authentication Between Services
```
Option 1: Service Mesh (Istio)
- Automatic mTLS between services
- No code changes needed

Option 2: Service Tokens
- Each service has internal JWT
- Use for internal API calls
- Different keys than user tokens

Option 3: API Keys
- Each service gets unique API key
- Passed in x-api-key header
```

---

## Summary: Service Responsibilities at a Glance

| Service | Port | Primary Role | Key Operations |
|---------|------|-------------|-----------------|
| **auth-service** | 3001 | User Auth & Profiles | Login, Register, Token Refresh, Profile |
| **menu-service** | 3003 | Menu Management | Items, Categories, Search, Availability |
| **order-service** | 3004 | Order Lifecycle | Create, Track, Status Updates, History |
| **cart-service** | 3002 | Shopping Cart | Add, Remove, Update (Frontend currently) |
| **payment-service** | 3008 | Payment Processing | Process, Verify, Refund, Gateway Integration |
| **waiter-service** | 3009 | Waiter Operations | Proxy Orders, Cash Tracking, Table Status |
| **kds-service** | 3010 | Kitchen Display | Prep Tracking, Queue, Readiness |
| **cashier-service** | 3012 | Cashier Ops | Cash Receipts, Reconciliation (Future) |
| **analytics-service** | 3011 | Business Intelligence | Reports, Trends, Performance Metrics |
| **ai-service** | 3007 | AI Features | Recommendations, Forecasting (Future) |

---

## Next Steps

1. **Implement each service** following the endpoint specifications
2. **Setup API Gateway** with proper routing and middleware
3. **Implement inter-service communication** (sync/async patterns)
4. **Add health checks** and service discovery
5. **Setup logging and monitoring** across all services
6. **Test end-to-end flows** with frontend
7. **Deploy to staging** for integration testing
8. **Performance optimize** caching and queries

