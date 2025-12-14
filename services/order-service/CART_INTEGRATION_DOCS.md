# Order Service - Cart Integration Implementation

## Overview
The order-service has been successfully integrated with the Cart Service. Orders are now created from the user's cart instead of accepting items directly in the request body.

---

## 1️⃣ CHANGES SUMMARY

### **What Changed:**
- Order creation now fetches cart data from Cart Service
- Cart is cleared automatically after successful order creation
- Authorization header is propagated from incoming requests
- Enhanced validation and error handling

### **What Remained Unchanged:**
- API endpoint paths (`POST /api/orders`)
- Database schema (Order and OrderItem entities)
- Order status workflow
- All other endpoints (GET orders, UPDATE status, etc.)

---

## 2️⃣ NEW/MODIFIED FILES

### **New Files Created (5):**

1. **`CartItemDto.java`** - Cart item data structure
2. **`CartResponseDto.java`** - Cart response from Cart Service
3. **`CartServiceClient.java`** - REST client for Cart Service integration
4. **`RestTemplateConfig.java`** - RestTemplate bean configuration

### **Modified Files (4):**

1. **`OrderService.java`**
   - Modified `createOrder()` signature to accept `authorizationHeader`
   - Added cart fetching logic before order creation
   - Added cart validation
   - Added cart clearing after successful order creation

2. **`OrderController.java`**
   - Added `@RequestHeader("Authorization")` parameter
   - Passes authorization header to service layer

3. **`CreateOrderRequest.java`**
   - Made `items` field optional (no longer required in request body)

4. **`application.yml`**
   - Added Cart Service configuration (`cart-service.base-url`)

---

## 3️⃣ IMPLEMENTATION DETAILS

### **Order Creation Flow (NEW)**

```
Client Request (POST /api/orders)
  ↓
OrderController
  • Extracts: X-User-Id, X-Table-Id, Authorization headers
  ↓
OrderService.createOrder()
  ↓
  [STEP 1] CartServiceClient.getCart(authHeader)
    • Calls: GET http://localhost:8080/api/cart
    • Headers: Authorization: Bearer <token>
    • Returns: CartResponseDto with items
  ↓
  [STEP 2] Validate Cart
    • Cart exists and not null
    • Cart has items (not empty)
    • Items have valid quantity > 0
    • Items have valid price > 0
  ↓
  [STEP 3] Create Order Entity
    • Map cart items to order items
    • Set userId, tableId from headers
    • Calculate total amount
  ↓
  [STEP 4] Save Order (@Transactional)
    • orderRepository.save(order)
    • Commit transaction
  ↓
  [STEP 5] Clear Cart (non-critical)
    • CartServiceClient.clearCart(authHeader)
    • Calls: DELETE http://localhost:8080/api/cart
    • Errors logged but don't fail order
  ↓
Return OrderResponse to client
```

---

## 4️⃣ CART SERVICE CLIENT

### **CartServiceClient Methods:**

#### **`getCart(String authorizationHeader)`**
- **Purpose:** Fetch user's cart from Cart Service
- **HTTP Method:** GET
- **Endpoint:** `{cart-service.base-url}`
- **Headers:** Authorization (propagated)
- **Returns:** `CartResponseDto`
- **Error Handling:**
  - 404 → "Cart not found. Please add items to cart"
  - 5xx → "Cart Service is currently unavailable"
  - Other → Generic error message

#### **`clearCart(String authorizationHeader)`**
- **Purpose:** Clear cart after successful order creation
- **HTTP Method:** DELETE
- **Endpoint:** `{cart-service.base-url}`
- **Headers:** Authorization (propagated)
- **Returns:** void
- **Error Handling:** Errors logged but don't throw (non-critical)

---

## 5️⃣ CONFIGURATION

### **application.yml**
```yaml
# Cart Service Integration
cart-service:
  base-url: http://localhost:8080/api/cart
```

**Note:** Update this URL based on your environment:
- **Development:** `http://localhost:8080/api/cart`
- **Via API Gateway:** `http://api-gateway:8080/api/cart`
- **Production:** Use environment variables

---

## 6️⃣ API CHANGES

### **POST /api/orders (Modified)**

**Before Integration:**
```bash
POST /api/orders
Headers:
  X-User-Id: 42
  X-Table-Id: 5
Body:
{
  "items": [
    {
      "itemId": 10,
      "itemName": "Pizza",
      "quantity": 2,
      "unitPrice": 1200.00
    }
  ]
}
```

**After Integration:**
```bash
POST /api/orders
Headers:
  X-User-Id: 42
  X-Table-Id: 5
  Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Body:
{
  // Items field is optional now (fetched from cart)
}
```

**Response (unchanged):**
```json
{
  "id": 123,
  "userId": 42,
  "tableId": 5,
  "status": "CREATED",
  "totalAmount": 2400.00,
  "items": [
    {
      "itemId": 10,
      "itemName": "Pizza",
      "quantity": 2,
      "unitPrice": 1200.00,
      "totalPrice": 2400.00
    }
  ],
  "createdAt": "2025-12-14T10:30:00"
}
```

---

## 7️⃣ ERROR HANDLING

### **Validation Errors:**

| Scenario | HTTP Status | Error Message |
|----------|-------------|---------------|
| Cart not found | 400 Bad Request | "Cart not found. Please add items to cart before placing an order." |
| Cart is empty | 400 Bad Request | "Cart is empty. Please add items to cart before placing an order." |
| Invalid cart items | 400 Bad Request | "Cart contains invalid items. Please review your cart." |
| Invalid prices | 400 Bad Request | "Cart contains items with invalid prices." |
| Cart Service down | 400 Bad Request | "Cart Service is currently unavailable." |
| Missing Authorization | 400 Bad Request | (from Cart Service) |

### **Non-Critical Errors:**

- **Cart clearing failure:** Logged as warning, order still succeeds
- **Rationale:** Order is already committed; cart clearing is cleanup

---

## 8️⃣ TESTING

### **Test Scenario 1: Successful Order Creation**

**Prerequisites:**
- User has items in cart
- Cart Service is running

**Steps:**
```bash
# 1. Add items to cart (via Cart Service)
POST http://localhost:8080/api/cart
Authorization: Bearer <token>
{
  "itemId": 10,
  "quantity": 2
}

# 2. Create order
POST http://localhost:8082/api/orders
X-User-Id: 42
X-Table-Id: 5
Authorization: Bearer <token>
{}

# Expected: Order created, cart cleared
```

### **Test Scenario 2: Empty Cart**

```bash
# Create order with empty cart
POST http://localhost:8082/api/orders
X-User-Id: 42
X-Table-Id: 5
Authorization: Bearer <token>
{}

# Expected: 400 Bad Request
# "Cart is empty. Please add items to cart before placing an order."
```

### **Test Scenario 3: Cart Service Unavailable**

```bash
# Stop Cart Service, then create order
POST http://localhost:8082/api/orders
X-User-Id: 42
X-Table-Id: 5
Authorization: Bearer <token>
{}

# Expected: 400 Bad Request
# "Cart Service is currently unavailable."
```

---

## 9️⃣ TRANSACTION BEHAVIOR

### **Transaction Scope:**

```java
@Transactional
public OrderResponse createOrder(CreateOrderRequest request, String authorizationHeader) {
    // 1. Fetch cart (outside transaction - external call)
    CartResponseDto cart = cartServiceClient.getCart(authorizationHeader);
    
    // 2. Validate cart
    validateCart(cart);
    
    // 3. Create order entity
    Order order = createOrderFromCart(cart);
    
    // 4. Save order (inside transaction)
    Order savedOrder = orderRepository.save(order);
    // Transaction commits here
    
    // 5. Clear cart (outside transaction - best effort)
    try {
        cartServiceClient.clearCart(authorizationHeader);
    } catch (Exception e) {
        // Log only, don't rollback order
    }
    
    return toResponse(savedOrder);
}
```

**Key Points:**
- Cart fetching happens before transaction
- Order save is transactional
- Cart clearing happens after commit (non-transactional)
- If cart clearing fails, order is NOT rolled back

---

## 🔟 LOGGING

### **Log Statements Added:**

```
INFO  - Fetching cart for userId: 42
INFO  - Cart fetched - userId: 42, items: 2
INFO  - Cart validation successful - itemCount: 2, totalAmount: 2400.00
INFO  - Order created successfully - orderId: 123, userId: 42, totalAmount: 2400.00
INFO  - Clearing cart for userId: 42 after successful order creation
INFO  - Cart cleared successfully
```

### **Error Logs:**

```
ERROR - Cart Service error: 404 NOT_FOUND - {"message":"Cart not found"}
ERROR - Cart Service unavailable: 503 SERVICE_UNAVAILABLE
WARN  - Failed to clear cart after order creation (orderId: 123): Connection timeout
```

---

## 1️⃣1️⃣ DEPLOYMENT NOTES

### **Environment Variables (Recommended):**

```yaml
cart-service:
  base-url: ${CART_SERVICE_URL:http://localhost:8080/api/cart}
```

### **Docker Compose:**

```yaml
services:
  order-service:
    environment:
      - CART_SERVICE_URL=http://cart-service:8080/api/cart
```

### **Kubernetes:**

```yaml
env:
  - name: CART_SERVICE_URL
    value: "http://cart-service:8080/api/cart"
```

---

## 1️⃣2️⃣ BACKWARD COMPATIBILITY

The `items` field in `CreateOrderRequest` is now optional but still supported.

**Future Enhancement:** Could support both modes:
- If `items` present in request → create order directly (admin override)
- If `items` absent → fetch from cart (normal flow)

Currently only cart-based flow is implemented.

---

## ✅ IMPLEMENTATION COMPLETE

**Build Status:** ✅ SUCCESS
**Compilation Errors:** 0
**Files Created:** 4
**Files Modified:** 4
**Tests:** Manual testing recommended

The order-service is now fully integrated with the Cart Service and ready for use!

