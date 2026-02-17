# Product Requirements Document (PRD)
## Restaurant Management System - Technical Analysis & Change Requirements

**Document Version:** 1.0  
**Last Updated:** February 14, 2026  
**Focus Areas:** Frontend, Auth Service, API Gateway

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Current Architecture Overview](#2-current-architecture-overview)
3. [Critical Issues Requiring Immediate Attention](#3-critical-issues-requiring-immediate-attention)
4. [Frontend Changes](#4-frontend-changes)
5. [Auth Service Changes](#5-auth-service-changes)
6. [API Gateway Changes](#6-api-gateway-changes)
7. [Cross-Service Integration Changes](#7-cross-service-integration-changes)
8. [Security Improvements](#8-security-improvements)
9. [Implementation Priority Matrix](#9-implementation-priority-matrix)

---

## 1. Executive Summary

This document outlines required changes to the Restaurant Management System, focusing on the **Frontend**, **Auth Service**, and **API Gateway**. The analysis identified several critical configuration mismatches, missing features, security vulnerabilities, and integration issues that need resolution for production readiness.

---

## 2. Current Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT LAYER                                   │
│  Frontend (React + TypeScript + Vite) - Port 5005                          │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                            API GATEWAY LAYER                                │
│  Spring Cloud Gateway - Port 8080                                           │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │ Filter Chain: Correlation → Logging → JWT Auth → Header Injection → Role││
│  └─────────────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           BACKEND SERVICES                                  │
│  Auth(:8081) Menu(:8082) Order(:8083) Analytics(:8084) KDS(:8085)          │
│  Cart(Redis) AI(FastAPI:8000) Payment(:8081)                               │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Critical Issues Requiring Immediate Attention

### 3.1 ⚠️ CRITICAL: Environment Variable Mismatch (Frontend)

**Location:** `frontend/src/utils/api.ts`

**Problem:** The `api.ts` uses `VITE_BASE_URL` but `.env.development` only defines `VITE_API_GATEWAY_URL`.

```typescript
// Current (BROKEN)
const BASE_URL = import.meta.env.VITE_BASE_URL.endsWith("/")
  ? import.meta.env.VITE_BASE_URL
  : import.meta.env.VITE_BASE_URL + "/";
```

**Impact:** Runtime error - `Cannot read properties of undefined (reading 'endsWith')` when `VITE_BASE_URL` is not defined.

**Required Change:**
```typescript
// Option A: Update api.ts to use existing env var
const gatewayUrl = import.meta.env.VITE_API_GATEWAY_URL || 'http://localhost:8080/api';
const BASE_URL = gatewayUrl.endsWith("/") ? gatewayUrl : gatewayUrl + "/";

// Option B: Add VITE_BASE_URL to .env.development
VITE_BASE_URL=http://localhost:8080/api
```

**Why:** Ensures frontend can communicate with backend services consistently.

---

### 3.2 ⚠️ CRITICAL: JWT Secret Already Synced ✅

**Status:** RESOLVED  
**Details:** Gateway and Auth Service now share the same JWT secret:
```
ue8yLJTAALbJn67rrh4lEGPLgl634dLEEIvRjVbemRFmgei9LggUKZjs/aSh9rvWGRBrze0Af5At6ywPsdO9+g==
```

---

### 3.3 ⚠️ CRITICAL: CORS Configuration Mismatch

**Problem:** Gateway and Auth Service have different CORS configurations.

| Service | Allowed Origins |
|---------|----------------|
| Gateway | `localhost:3000`, `localhost:3001` |
| Auth Service | `localhost:5005`, `*.vercel.app` |

**Frontend runs on:** `port 5005`

**Required Change (Gateway):**
```yaml
# gateway/src/main/resources/application.yaml
allowedOrigins:
  - "http://localhost:5005"    # ADD THIS
  - "http://localhost:3000"
  - "http://localhost:3001"
  - "https://*.vercel.app"     # ADD THIS for production
```

**Why:** Frontend requests from port 5005 will be blocked by CORS if gateway doesn't allow this origin.

---

### 3.4 ⚠️ Gateway Route Path Rewrite Issue (Auth Service)

**Current Configuration:**
```yaml
- id: auth-service
  uri: http://localhost:8081
  predicates:
    - Path=/api/auth/**
  filters:
    - RewritePath=/api/auth/(?<segment>.*), /${segment}
```

**Auth Controller Path:**
```java
@RestController
@RequestMapping("/api/auth")  // ← Expects /api/auth prefix
public class AuthController { ... }
```

**Problem:** Gateway strips `/api/auth/` and sends only `/{segment}`, but Auth Controller expects `/api/auth/{segment}`.

**Required Change:**
```yaml
# Option A: Keep /api/auth prefix
filters:
  - RewritePath=/api/auth/(?<segment>.*), /api/auth/${segment}

# Option B: Remove prefix from AuthController (not recommended - breaks direct access)
```

**Why:** Authentication endpoints (login, register, refresh) will return 404 if paths don't match.

---

## 4. Frontend Changes

### 4.1 Missing Route Definitions

**Location:** `frontend/src/App.tsx`

**Current State:** Missing important routes.

| Route | Status | Component Exists | Action Required |
|-------|--------|------------------|-----------------|
| `/login` | ⚠️ Missing alias | Yes (uses `/`) | Add explicit route |
| `/unauthorized` | ❌ Missing | Yes (`ErrorPages.tsx`) | Add route |
| `/404` | ❌ Missing | Yes (`ErrorPages.tsx`) | Add catch-all route |
| `/kitchen` | ❌ Missing | Yes (`KitchenOrders.tsx`) | Add route |
| `/table-selection` | ❌ Missing | Yes (`TableSelection.tsx`) | Add route |

**Required Change:**
```tsx
// Add to App.tsx Routes
import { NotFound, Unauthorized } from "./pages/errors/ErrorPages";
import KitchenOrders from "./pages/kitchen/KitchenOrders";
import TableSelection from "./pages/TableSelection";

<Routes>
  {/* Existing routes... */}
  <Route path="/login" element={<Login />} />
  <Route path="/unauthorized" element={<Unauthorized />} />
  <Route path="/table-select" element={<TableSelection />} />
  
  <Route
    path="/kitchen"
    element={
      <RoleProtectedRoute requiredRoles={[2, 3]}>
        <KitchenOrders />
      </RoleProtectedRoute>
    }
  />
  
  {/* Catch-all 404 route - MUST BE LAST */}
  <Route path="*" element={<NotFound />} />
</Routes>
```

**Why:** Users navigating to `/unauthorized` or invalid routes will see blank pages instead of proper error handling.

---

### 4.2 Inconsistent API Configuration

**Location:** `frontend/src/config/api.config.ts` vs `frontend/src/utils/api.ts`

**Problem:** Two separate API configuration approaches exist:
- `api.config.ts` uses `VITE_API_GATEWAY_URL` 
- `api.ts` uses `VITE_BASE_URL`

**Required Change:** Consolidate to single source:
```typescript
// frontend/src/utils/api.ts - Use api.config.ts
import { apiConfig } from "../config/api.config";

const BASE_URL = apiConfig.gateway.endsWith("/") 
  ? apiConfig.gateway 
  : apiConfig.gateway + "/";
```

**Why:** Single source of truth prevents configuration drift and debugging headaches.

---

### 4.3 Protected Routes Not Applied to Key Pages

**Current State:**
```tsx
<Route path="/profile" element={<Profile />} />  // ← NOT PROTECTED
<Route path="/menu" element={<Menu />} />        // ← NOT PROTECTED  
<Route path="/order" element={<Order />} />      // ← NOT PROTECTED
```

**Required Change:**
```tsx
<Route path="/profile" element={
  <ProtectedRoute><Profile /></ProtectedRoute>
} />
<Route path="/order" element={
  <ProtectedRoute><Order /></ProtectedRoute>
} />
// Menu can remain public for browsing
```

**Why:** Sensitive user data (profile) and operations (orders) should require authentication.

---

### 4.4 TableContext Not Persisting Across Sessions

**Location:** `frontend/src/context/TableContext.tsx`

**Problem:** TableContext only reads from URL params on mount but doesn't persist to localStorage like AuthContext does.

**Current:**
```tsx
useEffect(() => {
  const params = new URLSearchParams(location.search);
  const tableFromUrl = params.get("tableId");
  if (tableFromUrl) setTableId(tableFromUrl);  // Lost on refresh if not in URL
}, [location]);
```

**Required Change:**
```tsx
useEffect(() => {
  const params = new URLSearchParams(location.search);
  const tableFromUrl = params.get("tableId");
  
  if (tableFromUrl) {
    setTableId(tableFromUrl);
    localStorage.setItem("restaurantTableId", tableFromUrl);
  } else {
    // Restore from localStorage
    const stored = localStorage.getItem("restaurantTableId");
    if (stored) setTableId(stored);
  }
}, [location]);
```

**Why:** Users lose table context on page refresh, breaking the ordering flow.

---

### 4.5 Error Handling in fetchWithAuth

**Location:** `frontend/src/utils/api.ts`

**Problem:** 401 errors not handled (only 403 triggers refresh).

**Current:**
```typescript
if (res.status === 403) {
  const refreshed = await refreshAccessToken();
  // ...
}
```

**Required Change:**
```typescript
if (res.status === 401 || res.status === 403) {
  const refreshed = await refreshAccessToken();
  if (!refreshed) {
    clearTokens();
    window.location.href = "/login";
    return;
  }
  // Retry with new token...
}
```

**Why:** Gateway returns 401 for expired tokens, not 403. Users get stuck instead of being redirected to login.

---

## 5. Auth Service Changes

### 5.1 Missing Email Claim in JWT

**Location:** `auth-service/.../Security/JwtService.java`

**Current JWT Claims:**
```java
.setSubject(user.getId().toString())
.claim("role", user.getRole())
.claim("tableId", tableId)
```

**Missing:** `email`, `fullName` claims that frontend may need.

**Required Change:**
```java
public String generateAccessToken(User user, int tableId) {
    return Jwts.builder()
            .setSubject(user.getId().toString())
            .claim("role", user.getRole())
            .claim("tableId", tableId)
            .claim("email", user.getEmail())           // ADD
            .claim("fullName", user.getProfile() != null 
                ? user.getProfile().getFullName() : null)  // ADD
            .setIssuedAt(new Date())
            .setExpiration(new Date(System.currentTimeMillis() + accessTokenExpirationMs))
            .signWith(SignatureAlgorithm.HS512, jwtSecret)
            .compact();
}
```

**Why:** Reduces API calls - frontend can display user info without calling `/profile/me` after login.

---

### 5.2 Password Returned in Profile DTO (Security Risk)

**Check:** Ensure `ProfileDto` doesn't expose password hash.

**Required:** Audit DTOs to ensure sensitive fields are excluded:
```java
// ProfileDto should NOT contain:
// - password
// - provider (internal use only)
// - createdAt/updatedAt (unless needed)
```

---

### 5.3 Auth Controller CORS vs Gateway CORS

**Problem:** Auth Service has its own CORS config which may conflict with gateway when requests go through gateway.

**Recommendation:** When requests flow through gateway:
1. Gateway handles CORS (preflight OPTIONS)
2. Auth Service should trust gateway headers

**Required Change (Optional):** If all traffic goes through gateway, simplify Auth Service CORS:
```java
@Bean
public CorsConfigurationSource corsConfigurationSource() {
    CorsConfiguration config = new CorsConfiguration();
    config.setAllowedOriginPatterns(List.of("*")); // Trust gateway
    config.setAllowedMethods(List.of("*"));
    config.setAllowedHeaders(List.of("*"));
    config.setAllowCredentials(true);
    
    UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
    source.registerCorsConfiguration("/**", config);
    return source;
}
```

---

### 5.4 TableId Validation

**Location:** `auth-service/.../Service/AuthServiceImpl.java` (assumed)

**Current:** TableId passed from login request goes directly into JWT.

**Required:** Add validation:
```java
// In login method
if (dto.getTableId() <= 0) {
    throw new InvalidTableIdException("Valid table ID required");
}
// Or allow 0 for admin/kitchen staff who don't need tables
```

**Why:** Prevents invalid data in JWT that could cause downstream issues.

---

### 5.5 Missing Logout Token Invalidation

**Current:** `logoutUser()` exists but JWT tokens remain valid until expiration.

**Required (for enhanced security):**
- Implement token blacklist (Redis recommended)
- Or implement refresh token rotation with DB storage

```java
// AuthServiceImpl
public void logoutUser(Integer userId) {
    // Current: just clears server-side state
    
    // Enhanced: invalidate refresh token
    refreshTokenRepository.deleteByUserId(userId);
}
```

---

## 6. API Gateway Changes

### 6.1 CORS Configuration Update

**Location:** `gateway/src/main/resources/application.yaml`

**Required Change:**
```yaml
globalcors:
  corsConfigurations:
    '[/**]':
      allowedOrigins:
        - "http://localhost:5005"      # Frontend dev
        - "http://localhost:3000"      # Alternative
        - "http://localhost:3001"      # Alternative
        - "https://*.vercel.app"       # Production frontend
      allowedMethods:
        - GET
        - POST
        - PUT
        - DELETE
        - PATCH
        - OPTIONS
      allowedHeaders:
        - "*"
      exposedHeaders:
        - X-Correlation-Id
        - X-Service-Name
        - Authorization                # ADD - for token refresh flow
      allowCredentials: true
      maxAge: 3600
```

---

### 6.2 Missing Cart Service Route

**Current Routes:** Auth, Menu, Order, Analytics, KDS

**Missing:** Cart Service

**Required Addition:**
```yaml
# Cart Service
- id: cart-service
  uri: http://localhost:8086  # Verify actual port
  predicates:
    - Path=/api/cart/**
  filters:
    - RewritePath=/api/cart/(?<segment>.*), /api/cart/${segment}
```

---

### 6.3 Missing AI Service Route

**Current:** No route for AI Service (FastAPI on port 8000)

**Required Addition:**
```yaml
# AI Service (ChatBot)
- id: ai-service
  uri: http://localhost:8000
  predicates:
    - Path=/api/ai/**
  filters:
    - RewritePath=/api/ai/(?<segment>.*), /${segment}
```

---

### 6.4 Missing Payment Service Route

**Current:** No route for Payment Service

**Required Addition:**
```yaml
# Payment Service
- id: payment-service
  uri: http://localhost:8081  # NOTE: Same as auth - potential conflict!
  predicates:
    - Path=/api/payments/**
```

**⚠️ Warning:** Payment Service uses port 8081 which conflicts with Auth Service. Change one of them.

---

### 6.5 Add Public Paths for Cart (Anonymous Browsing)

**Current Public Paths:** `/api/auth/**,/api/categories/**,/api/menu/**,/api/media/**`

**Consider Adding:** `/api/cart/**` for guest cart functionality (if supported)

---

### 6.6 Rate Limiting (Security Enhancement)

**Current:** No rate limiting configured.

**Recommended Addition:**
```yaml
spring:
  cloud:
    gateway:
      filter:
        request-rate-limiter:
          enabled: true
          
# Route-specific rate limiting
- id: auth-service
  filters:
    - name: RequestRateLimiter
      args:
        redis-rate-limiter.replenishRate: 10
        redis-rate-limiter.burstCapacity: 20
```

**Why:** Prevents brute-force attacks on login endpoint.

---

### 6.7 HeaderInjectionFilter Optional TableId Handling

**Current:** Skips header injection if tableId is null.

```java
if (userId == null || tableId == null || roleName == null) {
    log.debug("Skipping header injection for public path");
    return chain.filter(exchange);
}
```

**Problem:** Admin/Kitchen users may not have tableId but still need userId and role injected.

**Required Change:**
```java
// Only userId and roleName are required; tableId is optional
if (userId == null || roleName == null) {
    log.debug("Skipping header injection - missing required attributes");
    return chain.filter(exchange);
}

ServerHttpRequest.Builder requestBuilder = exchange.getRequest().mutate()
    .header("X-User-Id", userId.toString())
    .header("X-Role", roleName)
    .header("X-Service-Name", "gateway")
    .header("X-Correlation-Id", correlationId != null ? correlationId : "");

// Only add tableId if present
if (tableId != null) {
    requestBuilder.header("X-Table-Id", tableId.toString());
}

ServerHttpRequest mutatedRequest = requestBuilder.build();
```

---

## 7. Cross-Service Integration Changes

### 7.1 Service Port Conflict Resolution

| Service | Current Port | Conflict | Recommended Port |
|---------|--------------|----------|------------------|
| Auth Service | 8081 | Payment uses 8081 | Keep 8081 |
| Payment Service | 8081 | Auth uses 8081 | **Change to 8086** |
| Cart Service | ? | Unknown | 8087 |

---

### 7.2 Kafka Topics Standardization

**Current Topics (from code analysis):**
- `orders-ready` (Order → Waiter)

**Recommended Standard Topics:**
```
restaurant.orders.created      # New order placed
restaurant.orders.ready        # Order ready for pickup
restaurant.orders.completed    # Order served
restaurant.menu.updated        # Menu item changed
restaurant.analytics.events    # For ClickHouse ingestion
```

---

### 7.3 Consistent Header Naming

All services should expect these gateway-injected headers:
```
X-User-Id       : Long (required for auth'd requests)
X-Table-Id      : Long (optional, for customer context)
X-Role          : String (CUSTOMER|ADMIN|KITCHEN)
X-Correlation-Id: String (for distributed tracing)
X-Service-Name  : String (origin service)
```

---

## 8. Security Improvements

### 8.1 Environment Variables for Secrets

**Current:** JWT secret hardcoded in YAML files.

**Required:** Use environment variables:
```yaml
# gateway/src/main/resources/application.yaml
jwt:
  secret: ${JWT_SECRET:default-dev-secret-change-in-prod}
```

```properties
# auth-service application.properties
jwt.secret=${JWT_SECRET:default-dev-secret-change-in-prod}
```

---

### 8.2 HTTPS Enforcement (Production)

**Add to gateway for production:**
```yaml
server:
  ssl:
    enabled: true
    key-store: classpath:keystore.p12
    key-store-password: ${SSL_KEYSTORE_PASSWORD}
```

---

### 8.3 Security Headers

**Add global response headers:**
```yaml
spring:
  cloud:
    gateway:
      default-filters:
        - AddResponseHeader=X-Content-Type-Options, nosniff
        - AddResponseHeader=X-Frame-Options, DENY
        - AddResponseHeader=X-XSS-Protection, 1; mode=block
```

---

## 9. Implementation Priority Matrix

| Priority | Change | Impact | Effort | Service |
|----------|--------|--------|--------|---------|
| 🔴 P0 | Fix VITE_BASE_URL env var | Critical - App won't start | Low | Frontend |
| 🔴 P0 | Fix Gateway CORS for port 5005 | Critical - All API calls fail | Low | Gateway |
| 🔴 P0 | Fix Auth route path rewrite | Critical - Login/Register broken | Low | Gateway |
| 🟠 P1 | Add missing frontend routes | High - Pages unreachable | Low | Frontend |
| 🟠 P1 | Add Cart/AI/Payment routes | High - Features broken | Low | Gateway |
| 🟠 P1 | Fix 401 handling in fetchWithAuth | High - Poor UX | Low | Frontend |
| 🟠 P1 | Resolve port 8081 conflict | High - Services clash | Medium | Payment |
| 🟡 P2 | Protect routes (Profile, Order) | Medium - Security gap | Low | Frontend |
| 🟡 P2 | TableContext persistence | Medium - UX issue | Low | Frontend |
| 🟡 P2 | Optional tableId in headers | Medium - Admin/Kitchen flow | Low | Gateway |
| 🟢 P3 | Add email to JWT claims | Low - Optimization | Low | Auth |
| 🟢 P3 | Rate limiting | Low - Security hardening | Medium | Gateway |
| 🟢 P3 | Security headers | Low - Best practice | Low | Gateway |
| 🟢 P3 | Env vars for secrets | Low - Production readiness | Low | All |

---

## Appendix A: Configuration Files Reference

| File | Purpose |
|------|---------|
| `gateway/src/main/resources/application.yaml` | Gateway routes, CORS, JWT config |
| `services/auth-service/src/main/resources/application.properties` | Auth DB, JWT config |
| `frontend/.env.development` | API URLs for development |
| `frontend/src/config/api.config.ts` | Centralized API endpoints |
| `frontend/src/utils/api.ts` | HTTP client with auth |
| `infra/docker-compose.yml` | Infrastructure services |

---

## Appendix B: Role Definitions

| Role ID | Role Name | Access Level |
|---------|-----------|--------------|
| 1 | CUSTOMER | Menu, Cart, Orders (own), Profile |
| 2 | ADMIN | All resources, Staff management |
| 3 | KITCHEN | KDS, Order status updates |

---

*Document maintained by: Development Team*  
*Next Review Date: March 2026*
