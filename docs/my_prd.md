# My Personal PRD - Developer Responsibilities
## Restaurant Management System

**Owner:** Ishanka Senadeera  
**Last Updated:** February 14, 2026  
**Branch:** `dev_ishanka`

---

## Table of Contents

1. [My Ownership Scope](#1-my-ownership-scope)
2. [Architecture & Security Design](#2-architecture--security-design)
3. [Auth Service - Issues & Improvements](#3-auth-service---issues--improvements)
4. [Gateway - Issues & Improvements](#4-gateway---issues--improvements)
5. [Frontend - Issues & Improvements](#5-frontend---issues--improvements)
6. [CI/CD & DevOps](#6-cicd--devops)
7. [External Service Configurations](#7-external-service-configurations)
8. [Implementation Checklist](#8-implementation-checklist)
9. [Maintenance Schedule](#9-maintenance-schedule)

---

## 1. My Ownership Scope

### Full Ownership (Create & Maintain)

| Component | Port | Repository Path | Hosting |
|-----------|------|-----------------|---------|
| **Auth Service** | 8081 | `services/auth-service/` | TBD |
| **API Gateway** | 8080 | `gateway/` | TBD |
| **Frontend** | 5005 (dev) | `frontend/` | Vercel |

### DevOps Responsibilities

| Responsibility | Description |
|----------------|-------------|
| GitHub Admin | Repository management, branch protection, PR reviews |
| CI/CD Pipelines | GitHub Actions workflows for all services |
| Production Hosting | Manage deployments, environment variables, monitoring |
| Secret Management | GitHub Secrets, Vercel env vars, Azure credentials |

### Limited Access (Configuration Only)

| Service | What I Can Change |
|---------|-------------------|
| Menu Service (8082) | Hostname, port in gateway routes |
| Order Service (8083) | Hostname, port in gateway routes |
| Analytics Service (8084) | Hostname, port in gateway routes |
| KDS Service (8085) | Hostname, port in gateway routes |
| Cart Service (8086) | Hostname, port in gateway routes |
| Payment Service (8087) | Hostname, port in gateway routes |
| AI Service (8000) | Hostname, port in gateway routes |

---

## 2. Architecture & Security Design

### 2.1 JWT Authentication Architecture

**Why JWT is needed in BOTH Auth Service AND Gateway:**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              REQUEST FLOW                                   │
└─────────────────────────────────────────────────────────────────────────────┘

    ┌──────────┐         ┌──────────────┐         ┌──────────────┐
    │ Frontend │ ──────► │   Gateway    │ ──────► │ Auth Service │
    │          │         │ (VALIDATES)  │         │ (GENERATES)  │
    └──────────┘         └──────────────┘         └──────────────┘
         │                      │                        │
         │  POST /api/auth/login                         │
         │ ─────────────────────────────────────────────►│
         │                                               │
         │◄──────────────── JWT Token ──────────────────│
         │                      │                        │
         │  GET /api/orders     │                        │
         │  (Authorization:     │                        │
         │   Bearer <token>)    │                        │
         │ ────────────────────►│                        │
         │                      │ Validates JWT          │
         │                      │ Extracts claims        │
         │                      │ Injects X-User-Id      │
         │                      │ ────────► Order Service
```

| Service | JWT Responsibility | What It Needs |
|---------|-------------------|---------------|
| **Auth Service** | GENERATES tokens (login, register, refresh) | Secret + Expiration configs |
| **Gateway** | VALIDATES tokens (all protected requests) | SAME Secret (for signature verification) |

**⚠️ CRITICAL:** Both services MUST have the IDENTICAL `jwt.secret` value!

---

### 2.2 Environment Variable Configuration

**Auth Service (`application.properties`) - Production Pattern:**

```properties
# Server Configuration
server.port=${PORT:8081}
server.address=0.0.0.0

# Application Name
spring.application.name=auth_service

# Database Configuration (Environment Variables)
spring.datasource.url=${SPRING_DATASOURCE_URL}
spring.datasource.username=${SPRING_DATASOURCE_USERNAME}
spring.datasource.password=${SPRING_DATASOURCE_PASSWORD}
spring.datasource.driver-class-name=com.mysql.cj.jdbc.Driver

# JPA/Hibernate
spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=false
spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.MySQL8Dialect
spring.jpa.properties.hibernate.format_sql=true

# JWT Configuration (Environment Variables)
jwt.secret=${JWT_SECRET}
jwt.access-token-expiration-ms=${JWT_ACCESS_EXPIRATION:900000}
jwt.refresh-token-expiration-ms=${JWT_REFRESH_EXPIRATION:604800000}

# Admin Seeding (First Startup)
admin.seed.enabled=${ADMIN_SEED_ENABLED:true}
admin.seed.email=${ADMIN_EMAIL:admin@restaurant.com}
admin.seed.password=${ADMIN_PASSWORD:Admin@123}
```

**Gateway (`application.yaml`) - Production Pattern:**

```yaml
jwt:
  secret: ${JWT_SECRET}  # MUST match Auth Service

gateway:
  public-paths: /api/auth/**,/api/categories/**,/api/menu/**,/api/media/**
```

**Required Environment Variables for Production:**

| Variable | Service | Description | Example |
|----------|---------|-------------|---------|
| `JWT_SECRET` | Auth + Gateway | Shared JWT signing key | `ue8yLJT...` (64+ chars) |
| `SPRING_DATASOURCE_URL` | Auth | MySQL connection URL | `jdbc:mysql://host:3306/db` |
| `SPRING_DATASOURCE_USERNAME` | Auth | Database username | `app_user` |
| `SPRING_DATASOURCE_PASSWORD` | Auth | Database password | `secure_password` |
| `PORT` | All | Server port | `8081` |
| `ADMIN_EMAIL` | Auth | Initial admin email | `admin@restaurant.com` |
| `ADMIN_PASSWORD` | Auth | Initial admin password | `Admin@123` |

---

### 2.3 Admin Seeding on Startup

**Requirement:** Create default admin user when application starts for the first time.

**Implementation - Create `AdminSeeder.java`:**

```java
@Component
@RequiredArgsConstructor
@Slf4j
public class AdminSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final ProfileRepository profileRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${admin.seed.enabled:true}")
    private boolean seedEnabled;

    @Value("${admin.seed.email:admin@restaurant.com}")
    private String adminEmail;

    @Value("${admin.seed.password:Admin@123}")
    private String adminPassword;

    @Override
    public void run(String... args) {
        if (!seedEnabled) {
            log.info("Admin seeding disabled");
            return;
        }

        if (userRepository.findByEmail(adminEmail).isPresent()) {
            log.info("Admin user already exists: {}", adminEmail);
            return;
        }

        // Create admin user
        User admin = new User();
        admin.setEmail(adminEmail);
        admin.setPassword(passwordEncoder.encode(adminPassword));
        admin.setRole(2); // ADMIN role
        admin.setProvider(1); // Local auth
        User savedUser = userRepository.save(admin);

        // Create admin profile
        Profile profile = new Profile();
        profile.setUser(savedUser);
        profile.setFullName("System Administrator");
        profileRepository.save(profile);

        log.info("✅ Admin user created: {}", adminEmail);
        log.warn("⚠️  Change the default password immediately!");
    }
}
```

**Admin Capabilities After Login:**
- Add Kitchen Staff (role=3)
- Add other Admins (role=2)
- Manage menu items
- View analytics
- Manage all orders

---

### 2.4 ✅ Environment Files (Implemented)

**Status:** IMPLEMENTED - Development environment files created

**Files Created:**

| File | Location | Purpose |
|------|----------|---------|
| `.env.development` | `gateway/` | Development config with localhost URLs |
| `.env.example` | `gateway/` | Template for production (no secrets) |
| `.env.development` | `services/auth-service/` | Development config with localhost DB |
| `.env.example` | `services/auth-service/` | Template for production (no secrets) |

**Gateway Service URLs (application.yaml now uses env vars):**
```yaml
# Example from gateway/application.yaml
routes:
  - id: auth-service
    uri: ${AUTH_SERVICE_URL:http://localhost:8081}
  - id: menu-service
    uri: ${MENU_SERVICE_URL:http://localhost:8082}
  - id: order-service
    uri: ${ORDER_SERVICE_URL:http://localhost:8083}
  # ... all services use ${SERVICE_URL:default} pattern
```

**Gateway Environment Variables:**
```bash
# Service URLs
AUTH_SERVICE_URL=http://localhost:8081
MENU_SERVICE_URL=http://localhost:8082
ORDER_SERVICE_URL=http://localhost:8083
ANALYTICS_SERVICE_URL=http://localhost:8084
KDS_SERVICE_URL=http://localhost:8085
CART_SERVICE_URL=http://localhost:8086
PAYMENT_SERVICE_URL=http://localhost:8087
AI_SERVICE_URL=http://localhost:8000

# CORS
CORS_ALLOWED_ORIGIN_1=http://localhost:5005

# JWT (must match auth-service)
JWT_SECRET=<shared-secret>
```

**Auth Service Environment Variables:**
```bash
# Database
SPRING_DATASOURCE_URL=jdbc:mysql://localhost:3306/Restaurant_Proj
SPRING_DATASOURCE_USERNAME=root
SPRING_DATASOURCE_PASSWORD=

# JWT (must match gateway)
JWT_SECRET=<shared-secret>
JWT_ACCESS_EXPIRATION=900000
JWT_REFRESH_EXPIRATION=604800000
```

**How to Use .env Files in Development:**

**Option 1: IntelliJ IDEA**
1. Edit Run Configuration
2. Add "EnvFile" plugin or use "Environment variables" field
3. Point to `.env.development` file

**Option 2: Command Line (PowerShell)**
```powershell
# Load env vars and run
Get-Content .env.development | ForEach-Object {
    if ($_ -match '^([^#=]+)=(.*)$') {
        [System.Environment]::SetEnvironmentVariable($matches[1], $matches[2])
    }
}
mvn spring-boot:run
```

**Option 3: Docker Compose**
```yaml
services:
  gateway:
    env_file:
      - .env.development
```

---

### 2.5 Security Configuration Checklist

**Auth Service Security:**
- [ ] Password encryption with BCrypt
- [ ] JWT token generation with HS512
- [ ] Refresh token rotation
- [ ] Login attempt rate limiting
- [ ] Account lockout after failed attempts

**Gateway Security:**
- [ ] JWT validation on all protected routes
- [ ] Role-based authorization filter
- [ ] CORS configuration for frontend origins
- [ ] Request/response logging with correlation IDs
- [ ] Security headers (X-Frame-Options, etc.)

**Frontend Security:**
- [ ] Token storage in memory (not localStorage for access token)
- [ ] Automatic token refresh on 401/403
- [ ] Input sanitization
- [ ] XSS prevention

---

## 3. Auth Service - Issues & Improvements

### 3.1 🔴 Critical Issues (Must Fix)

#### ISSUE-AUTH-001: AuthServiceImpl Not Implementing Interface
**File:** `services/auth-service/src/main/java/com/example/auth_service/Service/Impl/AuthServiceImpl.java`

**Problems:**
```
- AuthServiceImpl does not override abstract method logoutUser(Integer)
- register() return type UserResponseDto incompatible with AuthService.register()
- login() return type TokenResponseDto incompatible with AuthService.login()
- getAddress() undefined for RegisterRequestDto
```

**Fix Required:**
```java
// 1. Add logoutUser implementation
@Override
public void logoutUser(Integer userId) {
    // Implement logout logic (invalidate refresh token)
}

// 2. Fix return types to match interface
// 3. Either add getAddress() to RegisterRequestDto or remove from impl
```

---

#### ISSUE-AUTH-002: JwtService Method Signature Mismatch
**File:** `services/auth-service/src/main/java/com/example/auth_service/Service/Impl/AuthServiceImpl.java`

**Problem:** Calling `generateAccessToken(user)` but method requires `generateAccessToken(user, tableId)`

**Current (Broken):**
```java
String accessToken = jwtService.generateAccessToken(user);
String refreshToken = jwtService.generateRefreshToken(user);
```

**Fix Required:**
```java
// Option A: Pass tableId from LoginRequestDto
int tableId = dto.getTableId() != null ? dto.getTableId() : 0;
String accessToken = jwtService.generateAccessToken(user, tableId);
String refreshToken = jwtService.generateRefreshToken(user, tableId);

// Option B: Create overloaded methods without tableId in JwtService
```

---

#### ISSUE-AUTH-003: TokenResponseDto Constructor Mismatch
**File:** `services/auth-service/src/main/java/com/example/auth_service/Service/Impl/AuthServiceImpl.java`

**Problem:** Constructor `TokenResponseDto(String, String, int, int, User)` doesn't exist

**Current:**
```java
return new TokenResponseDto(accessToken, refreshToken, 15 * 60, 7 * 24 * 60 * 60, user);
```

**Fix Required:** Update TokenResponseDto to have matching constructor or change call:
```java
// If TokenResponseDto has (token, refresh, UserResponseDto):
UserResponseDto userDto = mapToUserResponseDto(user);
return new TokenResponseDto(accessToken, refreshToken, userDto);
```

---

#### ISSUE-AUTH-004: ProfileDto Constructor Undefined
**File:** `services/auth-service/src/main/java/com/example/auth_service/Service/Impl/ProfileServiceImpl.java`

**Problem:** `ProfileDto(User, Profile)` constructor doesn't exist

**Fix Required:** Add constructor to ProfileDto:
```java
public ProfileDto(User user, Profile profile) {
    this.id = user.getId();
    this.email = user.getEmail();
    this.fullName = profile.getFullName();
    this.phone = profile.getPhone();
    this.address = profile.getAddress();
    // ... map other fields
}
```

---

### 3.2 🟠 Code Quality Issues

#### ISSUE-AUTH-005: Unused Imports
**Files:**
- `ProfileRepository.java` - Unused `java.util.Optional`
- `ProfileServiceImpl.java` - Unused `java.util.Optional`

**Fix:** Remove unused imports

---

#### ISSUE-AUTH-006: Unused Field
**File:** `JwtAuthenticationFilter.java` - `userRepository` is never used

**Fix:** Remove unused field or use it for user validation

---

#### ISSUE-AUTH-007: Null Safety
**File:** `AuthServiceImpl.java`

**Problems:**
```java
user.setRole(dto.getRole() != null ? dto.getRole() : 1);    // Unboxing null
user.setProvider(dto.getProvider() != null ? dto.getProvider() : 1); // Unboxing null
```

**Fix:**
```java
user.setRole(dto.getRole() != null ? dto.getRole().intValue() : 1);
user.setProvider(dto.getProvider() != null ? dto.getProvider().intValue() : 1);
```

---

### 3.3 🟢 Improvements to Implement

#### IMPROVE-AUTH-001: Add Email to JWT Claims
**File:** `JwtService.java`

**Current:** JWT only has userId, role, tableId

**Improvement:** Add email and fullName to reduce API calls:
```java
.claim("email", user.getEmail())
.claim("fullName", user.getProfile() != null ? user.getProfile().getFullName() : null)
```

---

#### IMPROVE-AUTH-002: Token Blacklist for Logout
**Description:** Currently logout doesn't invalidate tokens

**Improvement:** Use Redis to blacklist tokens on logout:
```java
public void logoutUser(Integer userId, String accessToken) {
    // Add token to Redis blacklist with TTL = remaining expiry
    redisTemplate.opsForValue().set("blacklist:" + accessToken, "true", Duration.ofMinutes(15));
}
```

---

#### IMPROVE-AUTH-003: Environment Variables for Secrets
**File:** `application.properties`

**Current:** JWT secret hardcoded

**Improvement:**
```properties
jwt.secret=${JWT_SECRET:default-dev-secret}
```

---

## 4. Gateway - Issues & Improvements

### 4.1 🔴 Critical Issues (Must Fix)

#### ISSUE-GW-001: Missing @Slf4j on RoleAuthorizationFilter
**File:** `gateway/src/main/java/com/example/api_gateway/filter/RoleAuthorizationFilter.java`

**Problem:** `cannot find symbol: variable log`

**Fix:** Add `@Slf4j` annotation:
```java
@Slf4j  // ADD THIS
@Component
public class RoleAuthorizationFilter implements GlobalFilter, Ordered {
```

---

#### ISSUE-GW-002: Lombok Not Processing in GlobalErrorHandler
**File:** `gateway/src/main/java/com/example/api_gateway/exception/GlobalErrorHandler.java`

**Problems:**
- `cannot find symbol: variable log` - @Slf4j not processing
- `cannot find symbol: method builder()` - @Builder not processing

**Fix Options:**
1. Clear IDE cache and rebuild
2. Or add explicit logger:
```java
private static final Logger log = LoggerFactory.getLogger(GlobalErrorHandler.class);
```

---

#### ISSUE-GW-003: Null Safety in RoleAuthorizationFilter
**File:** `RoleAuthorizationFilter.java`

**Problem:** `pathMatcher.match()` gets potentially null String

**Fix:**
```java
if (path != null && pathMatcher.match(rule.getKey(), path)) {
```

---

### 4.2 🟠 Configuration Issues

#### ISSUE-GW-004: application.yaml Warnings
**File:** `gateway/src/main/resources/application.yaml`

**Problems:**
- `Unknown property 'jwt'` - Custom property warning (can ignore)
- `Unknown property 'gateway'` - Custom property warning (can ignore)
- Special characters in logging keys

**Fix for logging:**
```yaml
logging:
  level:
    "[org.springframework.cloud.gateway]": DEBUG
    "[com.example.api_gateway]": DEBUG
```

---

### 4.3 🟢 Improvements to Implement

#### IMPROVE-GW-001: Add Security Headers
**File:** `application.yaml`

**Add:**
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

#### IMPROVE-GW-002: Rate Limiting
**Description:** Prevent brute-force attacks

**Add:**
```yaml
- id: auth-service
  filters:
    - name: RequestRateLimiter
      args:
        redis-rate-limiter.replenishRate: 10
        redis-rate-limiter.burstCapacity: 20
```

---

#### IMPROVE-GW-003: Health Check Endpoint
**Add:** Actuator health endpoint for monitoring

```yaml
management:
  endpoints:
    web:
      exposure:
        include: health,info,metrics
  endpoint:
    health:
      show-details: when_authorized
```

---

#### IMPROVE-GW-004: Request/Response Logging Improvement
**Current:** Basic logging filter exists

**Improvement:** Add request body logging for debugging (disable in prod):
```java
if (log.isTraceEnabled()) {
    // Log request body for debugging
}
```

---

## 5. Frontend - Issues & Improvements

### 5.1 ✅ Recently Fixed Issues

| Issue | Status | Description |
|-------|--------|-------------|
| VITE_BASE_URL | ✅ Fixed | Added to .env.development |
| Missing routes | ✅ Fixed | Added /login, /unauthorized, /kitchen, etc. |
| Protected routes | ✅ Fixed | /profile and /order wrapped in ProtectedRoute |
| TableContext persistence | ✅ Fixed | Now persists to localStorage |
| 401 handling | ✅ Fixed | Now handles both 401 and 403 |

---

### 5.2 🟠 Remaining Improvements

#### IMPROVE-FE-001: Error Boundary
**Description:** Add React Error Boundary for graceful error handling

**Add:** `src/components/ErrorBoundary.tsx`
```tsx
export class ErrorBoundary extends React.Component {
  state = { hasError: false };
  
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  
  render() {
    if (this.state.hasError) {
      return <ErrorFallback />;
    }
    return this.props.children;
  }
}
```

---

#### IMPROVE-FE-002: Loading States
**Description:** Consistent loading indicators across app

**Current:** Basic `isLoading` in AuthContext

**Improvement:** Add loading skeleton components

---

#### IMPROVE-FE-003: Offline Support
**Description:** Handle network errors gracefully

**Add:**
```typescript
// In api.ts
if (!navigator.onLine) {
  throw new Error('You are offline. Please check your connection.');
}
```

---

#### IMPROVE-FE-004: Bundle Size Optimization
**Description:** Lazy load routes for better initial load

**Change:**
```tsx
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const KitchenOrders = lazy(() => import('./pages/kitchen/KitchenOrders'));
```

---

#### IMPROVE-FE-005: Environment Validation
**Description:** Fail fast if required env vars missing

**Add to main.tsx:**
```typescript
const requiredEnvVars = ['VITE_BASE_URL', 'VITE_API_GATEWAY_URL'];
requiredEnvVars.forEach(varName => {
  if (!import.meta.env[varName]) {
    console.error(`Missing required env var: ${varName}`);
  }
});
```

---

### 5.3 🔴 P0: Input Validation & Error Handling (Focus Area)

> **Priority Focus:** As the Frontend owner, robust input validation and user-friendly error handling 
> are critical for system security and UX. All forms must validate client-side AND display backend errors gracefully.

#### IMPROVE-FE-006: Form Validation Library Integration
**Priority:** P0  
**Description:** Standardize form validation across all input forms

**Recommended:** Use `react-hook-form` + `zod` for type-safe validation

**Add dependencies:**
```bash
npm install react-hook-form zod @hookform/resolvers
```

**Example - Login Form Validation:**
```typescript
// src/validation/authSchemas.ts
import { z } from 'zod';

export const loginSchema = z.object({
  username: z.string()
    .min(3, 'Username must be at least 3 characters')
    .max(50, 'Username too long')
    .regex(/^[a-zA-Z0-9_]+$/, 'Only alphanumeric and underscores allowed'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
});

export const registerSchema = z.object({
  username: z.string()
    .min(3, 'Username must be at least 3 characters')
    .max(50, 'Username too long')
    .regex(/^[a-zA-Z0-9_]+$/, 'Only alphanumeric and underscores allowed'),
  email: z.string().email('Invalid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain uppercase letter')
    .regex(/[a-z]/, 'Must contain lowercase letter')
    .regex(/[0-9]/, 'Must contain number'),
  confirmPassword: z.string()
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword']
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
```

---

#### IMPROVE-FE-007: Centralized Error Display Component
**Priority:** P0  
**Description:** Consistent error messages across all API interactions

**Add:** `src/components/ErrorAlert.tsx`
```tsx
interface ErrorAlertProps {
  error: string | null;
  onDismiss?: () => void;
}

export const ErrorAlert: React.FC<ErrorAlertProps> = ({ error, onDismiss }) => {
  if (!error) return null;
  
  return (
    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative">
      <span className="block sm:inline">{error}</span>
      {onDismiss && (
        <button onClick={onDismiss} className="absolute top-0 right-0 px-4 py-3">
          <span className="text-xl">&times;</span>
        </button>
      )}
    </div>
  );
};
```

---

#### IMPROVE-FE-008: API Error Response Handler
**Priority:** P0  
**Description:** Parse and display backend validation errors properly

**Add:** `src/utils/errorHandler.ts`
```typescript
interface ApiError {
  message: string;
  fieldErrors?: Record<string, string>;
}

export function parseApiError(error: unknown): ApiError {
  // Axios error response structure
  if (error && typeof error === 'object' && 'response' in error) {
    const response = (error as any).response;
    
    // Backend validation errors (400)
    if (response?.status === 400 && response?.data?.errors) {
      return {
        message: 'Validation failed',
        fieldErrors: response.data.errors
      };
    }
    
    // Authentication errors
    if (response?.status === 401) {
      return { message: 'Session expired. Please login again.' };
    }
    
    // Authorization errors
    if (response?.status === 403) {
      return { message: 'You do not have permission to perform this action.' };
    }
    
    // Server error with message
    if (response?.data?.message) {
      return { message: response.data.message };
    }
  }
  
  return { message: 'An unexpected error occurred. Please try again.' };
}
```

---

#### IMPROVE-FE-009: Input Sanitization
**Priority:** P1  
**Description:** Sanitize user inputs to prevent XSS

**Add:** `src/utils/sanitize.ts`
```typescript
import DOMPurify from 'dompurify';

export function sanitizeInput(input: string): string {
  return DOMPurify.sanitize(input.trim());
}

// For inputs that should be plain text only
export function stripHtml(input: string): string {
  return input.replace(/<[^>]*>/g, '').trim();
}
```

---

#### IMPROVE-FE-010: Toast Notifications for Actions
**Priority:** P1  
**Description:** Non-blocking feedback for user actions

**Recommended:** Use `react-hot-toast`

```bash
npm install react-hot-toast
```

**Usage pattern:**
```tsx
import toast from 'react-hot-toast';

// Success action
toast.success('Order placed successfully!');

// Error with retry
toast.error('Failed to add item', {
  action: {
    label: 'Retry',
    onClick: () => addToCart(item)
  }
});
```

---

## 6. CI/CD & DevOps

### 6.1 Current Workflows

| Workflow | Trigger | Status |
|----------|---------|--------|
| `frontend_deploy.yml` | Push to `dev_ishanka`, `frontend/**` | ✅ Active |
| `deploy.yml` | Push to `main`, `ai-service/**` | ✅ Active |
| `menuservice-AutoDeployTrigger.yml` | Menu service changes | ✅ Active |
| `hf_sync.yml` | Unknown | ❓ Review |

### 6.2 🔴 Missing Workflows

#### WORKFLOW-001: Auth Service CI/CD
**Create:** `.github/workflows/auth-service.yml`

```yaml
name: Auth Service CI/CD

on:
  push:
    branches: [main, dev_ishanka]
    paths:
      - 'services/auth-service/**'
  pull_request:
    branches: [main]
    paths:
      - 'services/auth-service/**'

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-java@v4
        with:
          java-version: '17'
          distribution: 'temurin'
      - name: Build & Test
        run: mvn clean verify
        working-directory: ./services/auth-service
        
  deploy:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      # Add deployment steps
```

---

#### WORKFLOW-002: Gateway CI/CD
**Create:** `.github/workflows/gateway.yml`

```yaml
name: Gateway CI/CD

on:
  push:
    branches: [main, dev_ishanka]
    paths:
      - 'gateway/**'

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-java@v4
        with:
          java-version: '17'
          distribution: 'temurin'
      - name: Build & Test
        run: mvn clean verify
        working-directory: ./gateway
```

---

#### WORKFLOW-003: PR Validation
**Create:** `.github/workflows/pr-check.yml`

```yaml
name: PR Validation

on:
  pull_request:
    branches: [main, development]

jobs:
  frontend-lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci && npm run lint
        working-directory: ./frontend
```

---

### 6.3 🟠 DevOps Improvements

#### DEVOPS-001: Branch Protection Rules
**Recommended Settings for `main`:**
- [ ] Require pull request reviews (1+ reviewer)
- [ ] Require status checks to pass
- [ ] Require branches to be up to date
- [ ] Restrict who can push

---

#### DEVOPS-002: Environment Secrets Audit
**Required Secrets:**

| Secret | Used By | Status |
|--------|---------|--------|
| `VERCEL_TOKEN` | Frontend deploy | ✅ |
| `AZURE_CREDENTIALS` | AI Service deploy | ✅ |
| `ACR_NAME` | Container registry | ✅ |
| `JWT_SECRET` | Auth/Gateway | ❓ Add |
| `DB_PASSWORD` | Auth Service | ❓ Add |

---

#### DEVOPS-003: Monitoring & Alerts
**Recommended:**
- [ ] Set up Vercel deployment notifications
- [ ] Configure Azure alerts for container apps
- [ ] Add Slack/Discord webhook for deploy status

---

## 7. External Service Configurations

### 7.1 Gateway Route Configuration

**Location:** `gateway/src/main/resources/application.yaml`

**My Responsibility:** Update hostnames/ports when other teams change theirs

| Service | Current Config | Team Contact |
|---------|---------------|--------------|
| Menu Service | `http://localhost:8082` | Menu Team |
| Order Service | `http://localhost:8083` | Order Team |
| Analytics Service | `http://localhost:8084` | Analytics Team |
| KDS Service | `http://localhost:8085` | Kitchen Team |
| Cart Service | `http://localhost:8086` | Cart Team |
| Payment Service | `http://localhost:8087` | Payment Team |
| AI Service | `http://localhost:8000` | AI Team |

### 7.2 Production URL Updates Required

**When deploying to production, update:**

```yaml
# Gateway routes (example)
- id: menu-service
  uri: ${MENU_SERVICE_URL:http://localhost:8082}
```

**Environment Variables to Set:**
```
MENU_SERVICE_URL=https://menu-service.prod.example.com
ORDER_SERVICE_URL=https://order-service.prod.example.com
# etc.
```

---

## 8. Implementation Checklist

### Phase 1: Critical Fixes (This Sprint)

- [ ] **AUTH-001:** Implement `logoutUser()` in AuthServiceImpl
- [ ] **AUTH-002:** Fix JwtService method calls with tableId
- [ ] **AUTH-003:** Fix TokenResponseDto constructor
- [ ] **AUTH-004:** Add ProfileDto constructor
- [ ] **GW-001:** Add @Slf4j to RoleAuthorizationFilter
- [ ] **GW-002:** Fix Lombok in GlobalErrorHandler

### Phase 2: Code Quality (Next Sprint)

- [ ] **AUTH-005:** Remove unused imports
- [ ] **AUTH-006:** Remove unused userRepository field
- [ ] **AUTH-007:** Fix null safety issues
- [ ] **GW-003:** Add null check in RoleAuthorizationFilter

### Phase 3: Improvements (Backlog)

- [ ] **IMPROVE-AUTH-001:** Add email to JWT claims
- [ ] **IMPROVE-AUTH-002:** Token blacklist for logout
- [ ] **IMPROVE-AUTH-003:** Environment variables for secrets
- [ ] **IMPROVE-GW-001:** Security headers
- [ ] **IMPROVE-GW-002:** Rate limiting
- [ ] **IMPROVE-GW-003:** Health check endpoint
- [ ] **IMPROVE-FE-001:** Error boundary
- [ ] **IMPROVE-FE-004:** Bundle optimization

### Phase 4: DevOps (Ongoing)

- [ ] **WORKFLOW-001:** Create Auth Service CI/CD
- [ ] **WORKFLOW-002:** Create Gateway CI/CD
- [ ] **WORKFLOW-003:** Create PR validation workflow
- [ ] **DEVOPS-001:** Configure branch protection
- [ ] **DEVOPS-002:** Audit and add missing secrets
- [ ] **DEVOPS-003:** Set up monitoring

---

## 9. Maintenance Schedule

### Daily
- [ ] Check CI/CD pipeline status
- [ ] Review any failed deployments
- [ ] Monitor error logs (if available)

### Weekly
- [ ] Review and merge PRs
- [ ] Check for security updates (npm audit, mvn dependency:check)
- [ ] Sync with other team members on integration issues

### Monthly
- [ ] Update dependencies (minor versions)
- [ ] Review and update documentation
- [ ] Performance review of gateway metrics
- [ ] Backup verification

### Quarterly
- [ ] Major dependency updates
- [ ] Security audit
- [ ] Architecture review
- [ ] Clean up unused code/features

---

## Quick Reference

### My Commands

```bash
# Frontend
cd frontend && npm run dev          # Start dev server (port 5005)
cd frontend && npm run build        # Production build
cd frontend && npm run lint         # Lint check

# Auth Service
cd services/auth-service && mvn spring-boot:run    # Start (port 8081)
cd services/auth-service && mvn clean test         # Run tests

# Gateway
cd gateway && mvn spring-boot:run   # Start (port 8080)
cd gateway && mvn clean test        # Run tests

# All Infrastructure
cd infra && docker-compose up -d    # Start MySQL, Redis, Kafka, etc.
```

### Important Files

| Purpose | File |
|---------|------|
| Gateway Routes | `gateway/src/main/resources/application.yaml` |
| Gateway JWT Secret | `gateway/src/main/resources/application.yaml` → jwt.secret |
| Auth JWT Secret | `services/auth-service/src/main/resources/application.properties` |
| Frontend Env | `frontend/.env.development` |
| Frontend API Config | `frontend/src/config/api.config.ts` |
| Docker Services | `infra/docker-compose.yml` |
| GitHub Workflows | `.github/workflows/` |

---

*Last Updated: February 14, 2026*  
*Owner: Ishanka Senadeera*
