# API Gateway Documentation

The Gateway serves as the single entry point and security layer for the Mango Field ecosystem. It handles cross-cutting concerns such as Authentication, CORS, and Request Routing.

**Base URL**: `https://gateway-app.mangofield-91faac5e.southeastasia.azurecontainerapps.io`

---

## 🔐 Security & Authentication

The Gateway performs **JWT Validation** on all protected routes. If a request reaches a protected internal service, you can assume the JWT was valid and the user is authenticated.

### public vs Protected Paths
- **Public**: `/api/auth/login`, `/api/auth/register`, `/api/menu/**`, `/api/categories/**`, `/api/media/**`, `/api/orders/active`.
- **Protected**: `/api/admin/**`, `/api/cart/**`, `/api/orders/**` (except `/active`).

### Identity Injection (Header Propagation)
The Gateway extracts information from the JWT and injects it into headers for downstream services. **Frontend developers don't need to send these headers manually** (except `Authorization`); they are for internal service consumption:
- `X-User-Id`: The internal database ID of the user.
- `X-Role`: The user's role (CUSTOMER, STAFF, ADMIN).

---

## 🌐 Global CORS Policy
The Gateway is configured to allow requests from specific origins:
- `http://localhost:3000` (Typical React/Next.js dev)
- `https://*.vercel.app` (Production preview)

**Allowed Methods**: `GET, POST, PUT, DELETE, PATCH, OPTIONS`
**Allowed Headers**: `*` (Includes `Authorization`, `Content-Type`, `X-Table-Id`)

---

## 🛣 Routing Rules

| Path Pattern | Destination Service | Port | Rewrite Logic |
| :--- | :--- | :--- | :--- |
| `/api/auth/**` | `auth-service` | 8081 | Strips `/api/auth` prefix |
| `/api/menu/**` | `menu-service` | 8082 | Preserves full path |
| `/api/cart/**` | `cart-service` | 8083 | Preserves full path |
| `/api/orders/**` | `order-service` | 8084 | Preserves full path |
| `/api/admin/analytics/**` | `analytics-service` | 8000 | Preserves full path |

---

## 🛠 Local Development Note
If testing the services locally without the Gateway, you must send the `X-User-Id` and `X-Role` headers manually to simulate the Gateway's behavior.
- Example: `X-User-Id: 1`, `X-Role: ADMIN`.
