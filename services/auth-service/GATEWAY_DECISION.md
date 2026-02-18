# Auth Service - Gateway Integration Guide

## 🎯 Current Architecture

You have a **Spring Cloud Gateway** at:
```
C:\Users\ishanka.senadeera\Desktop\merge\No_18_Restaurant_MS\gateway
```

**Gateway Configuration:**
- ✅ Port: 8080
- ✅ Validates JWT tokens for protected routes
- ✅ Handles CORS globally
- ✅ Injects headers to services: `X-User-Id`, `X-Role`, `X-Table-Id`, `X-Correlation-Id`
- ✅ Public paths (no JWT required): `/api/auth/**`, `/api/categories/**`, `/api/menu/**`, `/api/media/**`

**Auth Service:**
- ✅ Port: 8081  
- ✅ Generates JWT tokens (login, register, refresh)
- ✅ Can run standalone OR behind gateway

---

## 📋 Two Operating Modes

### Mode 1: Standalone (Direct Frontend Access) - DEFAULT

**When to use:**
- Development and testing
- Frontend calls auth-service directly
- No gateway in the request path

**Configuration:**
```bash
# Run with default profile (standalone mode)
./mvnw spring-boot:run
```

**What's enabled:**
- ✅ CORS enabled (`cors.enabled=true`)
- ✅ JWT generation for login/register
- ✅ Auth-service handles its own security
- ✅ Direct frontend → auth-service communication

**Frontend calls:**
```javascript
// Frontend directly calls auth-service
fetch('http://localhost:8081/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password })
})
```

---

### Mode 2: Gateway Mode (Behind API Gateway) - PRODUCTION

**When to use:**
- Production deployment
- Multiple microservices
- Frontend calls gateway only

**Configuration:**
```bash
# Run with gateway profile
./mvnw spring-boot:run -Dspring.profiles.active=gateway

# Or with environment variable
export SPRING_PROFILES_ACTIVE=gateway
./mvnw spring-boot:run
```

**What's enabled:**
- ✅ CORS disabled (`cors.enabled=false`) - Gateway handles it
- ✅ JWT generation for login/register
- ✅ Trusts gateway headers: `X-User-Id`, `X-Role`, `X-Table-Id`
- ✅ Gateway → auth-service communication

**Frontend calls:**
```javascript
// Frontend calls gateway, gateway routes to auth-service
fetch('http://localhost:8080/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password })
})
```

---

## 🔧 How It Works

### Request Flow - Standalone Mode
```
Frontend (localhost:3000)
   ↓ HTTP Request
Auth-Service (localhost:8081)
   ↓ CORS Check (✅ Allowed)
   ↓ JWT Generation (login/register)
   ← JWT Token Response
Frontend
```

### Request Flow - Gateway Mode
```
Frontend (localhost:3000)
   ↓ HTTP Request
API Gateway (localhost:8080)
   ↓ CORS Check (✅ Gateway handles)
   ↓ Route: /api/auth/** → auth-service
   ↓ Public path - no JWT validation
Auth-Service (localhost:8081)
   ↓ CORS disabled (gateway already handled)
   ↓ JWT Generation
   ← JWT Token Response
API Gateway
   ↓ Add CORS headers
Frontend
```

### Protected Route Flow - Gateway Mode
```
Frontend (localhost:3000)
   ↓ HTTP Request + Authorization: Bearer <JWT>
API Gateway (localhost:8080)
   ↓ CORS Check (✅)
   ↓ JWT Validation (✅)
   ↓ Extract claims: userId, role, tableId
   ↓ Inject headers: X-User-Id, X-Role, X-Table-Id
Other Services (e.g., order-service)
   ↓ Trust gateway headers
   ↓ Process request
   ← Response
API Gateway
   ← Add CORS headers
Frontend
```

---

## ⚙️ Configuration Files

### Standalone Mode (Default)

**File:** `application.properties`
```properties
# CORS enabled for direct frontend access
cors.enabled=true
cors.allowed-origins=http://localhost:3000,http://localhost:3001,http://localhost:5173

# JWT generation enabled
jwt.secret=${JWT_SECRET}
jwt.access-token-expiration-ms=900000
jwt.refresh-token-expiration-ms=604800000
```

### Gateway Mode

**File:** `application-gateway.properties`
```properties
# CORS disabled - Gateway handles it
cors.enabled=false

# Gateway header configuration
gateway.enabled=true
gateway.header.user-id=X-User-Id
gateway.header.user-role=X-Role
gateway.header.table-id=X-Table-Id
gateway.header.correlation-id=X-Correlation-Id

# JWT settings inherited from application.properties
```

---

## 🚀 Running the Services

### Development (Standalone)
```bash
# Start auth-service only
cd services/auth-service
./mvnw spring-boot:run
```

### Production (With Gateway)
```bash
# Terminal 1: Start Gateway
cd gateway
./mvnw spring-boot:run

# Terminal 2: Start Auth-Service in gateway mode
cd services/auth-service
./mvnw spring-boot:run -Dspring.profiles.active=gateway

# Terminal 3: Start other services...
```

---

## 🔐 Security Comparison

| Feature | Standalone Mode | Gateway Mode |
|---------|----------------|--------------|
| **CORS** | Auth-service handles | Gateway handles |
| **JWT Validation** | Not needed for auth endpoints | Gateway validates (except /api/auth/**) |
| **JWT Generation** | ✅ Auth-service | ✅ Auth-service |
| **Request Headers** | None | Gateway injects X-User-Id, X-Role, X-Table-Id |
| **Public endpoints** | /api/auth/** | Configured in gateway |
| **Protection** | Individual service | Centralized gateway |

---

## ✅ Current Recommendation

**For your setup:**

Since you have a gateway, use **Gateway Mode** for production:

```bash
# Start gateway first
cd C:\Users\ishanka.senadeera\Desktop\merge\No_18_Restaurant_MS\gateway
./mvnw spring-boot:run

# Start auth-service in gateway mode
cd C:\Users\ishanka.senadeera\Desktop\merge\No_18_Restaurant_MS\services\auth-service
./mvnw spring-boot:run -Dspring.profiles.active=gateway
```

**Benefits:**
- ✅ Single entry point (gateway on port 8080)
- ✅ Centralized CORS configuration
- ✅ Centralized JWT validation
- ✅ Better security (services not directly exposed)
- ✅ Consistent header injection across all services

---

## 📝 Gateway Configuration Reference

Your gateway is configured in:
```
gateway/src/main/resources/application.yaml
```

**Key settings:**
- Gateway port: 8080
- Auth-service route: `/api/auth/** → http://localhost:8081`
- CORS origins: `http://localhost:5005`, `http://localhost:3000`, `http://localhost:3001`
- Public paths: `/api/auth/**`, `/api/categories/**`, `/api/menu/**`, `/api/media/**`
- JWT secret: Shared with auth-service (must match)

---

## 🔍 Troubleshooting

### Issue: CORS errors when calling gateway
**Solution:** Make sure gateway's `application.yaml` has correct CORS configuration

### Issue: JWT validation fails at gateway
**Solution:** Ensure `JWT_SECRET` environment variable matches between gateway and auth-service

### Issue: Auth-service returns CORS errors in gateway mode
**Solution:** Verify `cors.enabled=false` in `application-gateway.properties`

### Issue: 401 Unauthorized at gateway
**Solution:** Check if path is in public paths list in gateway configuration

---

## 📌 Summary

**Current Setup:** You have a Spring Cloud Gateway

**Use Gateway Mode:**
```bash
./mvnw spring-boot:run -Dspring.profiles.active=gateway
```

**Architecture:**
```
Frontend → Gateway (CORS ✅, JWT ✅) → Auth-Service (JWT generation only)
                                    → Other Services (trust gateway headers)
```

**Result:** Secure, scalable, centralized security architecture ✅
