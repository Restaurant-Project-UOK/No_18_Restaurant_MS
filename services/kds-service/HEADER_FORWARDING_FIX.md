# Header Forwarding Fix - KDS Service

## Problem
The KDS (Kitchen Display Service) was **NOT** forwarding authorization headers (`X-User-ID` and `X-Table-ID`) when calling the Order Service's PATCH endpoint to update order status.

When the kitchen staff marked an order as READY, PREPARING, or CREATED, the authorization headers from the incoming request were being lost, which could cause authorization issues in the Order Service.

## Solution
Updated both the controller and service layers to extract, pass through, and forward these authorization headers.

---

## Changes Made

### 1. KitchenController.java
Updated all three status update endpoints to extract headers from incoming requests:

#### `/orders/{orderId}/ready` endpoint
```java
@PostMapping("/orders/{orderId}/ready")
public ResponseEntity<KitchenOrderResponse> markOrderReady(
        @PathVariable Long orderId,
        @RequestHeader(value = "X-User-ID", required = false) String userId,
        @RequestHeader(value = "X-Table-ID", required = false) String tableId) {
    logger.info("POST /api/kitchen/orders/{}/ready - Marking order as READY (userId: {}, tableId: {})", 
            orderId, userId, tableId);
    KitchenOrderResponse updatedOrder = kitchenService.markOrderAsReady(orderId, userId, tableId);
    logger.info("Order {} marked as READY successfully", orderId);
    return ResponseEntity.ok(updatedOrder);
}
```

#### `/orders/{orderId}/preparing` endpoint
```java
@PostMapping("/orders/{orderId}/preparing")
public ResponseEntity<KitchenOrderResponse> markOrderPreparing(
        @PathVariable Long orderId,
        @RequestHeader(value = "X-User-ID", required = false) String userId,
        @RequestHeader(value = "X-Table-ID", required = false) String tableId) {
    logger.info("POST /api/kitchen/orders/{}/preparing - Marking order as PREPARING (userId: {}, tableId: {})", 
            orderId, userId, tableId);
    KitchenOrderResponse updatedOrder = kitchenService.updateOrderStatus(orderId, "PREPARING", userId, tableId);
    logger.info("Order {} marked as PREPARING successfully", orderId);
    return ResponseEntity.ok(updatedOrder);
}
```

#### `/orders/{orderId}/created` endpoint
```java
@PostMapping("/orders/{orderId}/created")
public ResponseEntity<KitchenOrderResponse> markOrderCreated(
        @PathVariable Long orderId,
        @RequestHeader(value = "X-User-ID", required = false) String userId,
        @RequestHeader(value = "X-Table-ID", required = false) String tableId) {
    logger.info("POST /api/kitchen/orders/{}/created - Marking order as CREATED (userId: {}, tableId: {})",
            orderId, userId, tableId);
    KitchenOrderResponse updatedOrder = kitchenService.updateOrderStatus(orderId, "CREATED", userId, tableId);
    logger.info("Order {} marked as CREATED successfully", orderId);
    return ResponseEntity.ok(updatedOrder);
}
```

**Key Changes:**
- Added `@RequestHeader` parameters to extract `X-User-ID` and `X-Table-ID`
- Headers are marked as `required = false` to maintain backward compatibility
- Headers are passed to service methods
- Logging includes userId and tableId for better traceability

---

### 2. KitchenService.java
Updated both service methods to accept headers and forward them to Order Service:

#### `markOrderAsReady()` method
```java
public KitchenOrderResponse markOrderAsReady(Long orderId, String userId, String tableId) {
    logger.info("Marking order {} as READY (userId: {}, tableId: {})", orderId, userId, tableId);

    String url = orderServiceBaseUrl + "/" + orderId + "/status";
    UpdateOrderStatusRequest request = new UpdateOrderStatusRequest("READY");
    
    // Add authorization headers
    org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
    if (userId != null) {
        headers.set("X-User-ID", userId);
        logger.debug("Adding X-User-ID header: {}", userId);
    }
    if (tableId != null) {
        headers.set("X-Table-ID", tableId);
        logger.debug("Adding X-Table-ID header: {}", tableId);
    }
    
    HttpEntity<UpdateOrderStatusRequest> requestEntity = new HttpEntity<>(request, headers);

    // ... rest of the method (RestTemplate call, etc.)
}
```

#### `updateOrderStatus()` method
```java
public KitchenOrderResponse updateOrderStatus(Long orderId, String status, String userId, String tableId) {
    logger.info("Updating order {} status to {} (userId: {}, tableId: {})", orderId, status, userId, tableId);

    String url = orderServiceBaseUrl + "/" + orderId + "/status";
    UpdateOrderStatusRequest request = new UpdateOrderStatusRequest(status);
    
    // Add authorization headers
    org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
    if (userId != null) {
        headers.set("X-User-ID", userId);
        logger.debug("Adding X-User-ID header: {}", userId);
    }
    if (tableId != null) {
        headers.set("X-Table-ID", tableId);
        logger.debug("Adding X-Table-ID header: {}", tableId);
    }
    
    HttpEntity<UpdateOrderStatusRequest> requestEntity = new HttpEntity<>(request, headers);

    // ... rest of the method (RestTemplate call, etc.)
}
```

**Key Changes:**
- Added `userId` and `tableId` parameters to method signatures
- Created `HttpHeaders` object to hold authorization headers
- Only add headers if they are not null (defensive programming)
- Pass headers in `HttpEntity` constructor along with request body
- Added debug logging for header addition

---

## Flow Diagram

### Before Fix
```
Kitchen Frontend
    ↓ (with X-User-ID and X-Table-ID headers)
KDS Controller (receives headers but doesn't extract them)
    ↓ (no headers)
KDS Service
    ↓ (PATCH request WITHOUT headers)
Order Service (may reject due to missing authorization)
```

### After Fix
```
Kitchen Frontend
    ↓ (with X-User-ID and X-Table-ID headers)
KDS Controller (extracts headers via @RequestHeader)
    ↓ (passes userId, tableId as parameters)
KDS Service (adds headers to HttpEntity)
    ↓ (PATCH request WITH X-User-ID and X-Table-ID headers)
Order Service (receives proper authorization headers)
```

---

## Testing Recommendations

### 1. Test with Headers
```bash
curl -X POST http://localhost:8080/api/kitchen/orders/1/ready \
  -H "X-User-ID: 123" \
  -H "X-Table-ID: 5"
```

### 2. Test without Headers (backward compatibility)
```bash
curl -X POST http://localhost:8080/api/kitchen/orders/1/ready
```

### 3. Verify Order Service receives headers
Check Order Service logs to confirm it receives the headers:
```
Received X-User-ID: 123
Received X-Table-ID: 5
```

---

## Benefits

1. **Authorization Support**: Order Service can now properly authorize requests from KDS
2. **Audit Trail**: User ID is preserved throughout the request chain for better logging
3. **Context Preservation**: Table ID is maintained for business logic validation
4. **Backward Compatible**: Headers are optional (required = false), existing calls without headers will still work
5. **Better Logging**: Debug logs show exactly when headers are being added

---

## Notes

- Headers are marked as `required = false` to maintain backward compatibility
- Null checks prevent NPEs when headers are not provided
- Debug logging helps troubleshoot header propagation issues
- All three status endpoints (ready, preparing, created) have been updated consistently

---

## Date
February 15, 2026

