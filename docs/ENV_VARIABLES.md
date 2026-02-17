# Environment Variables Reference

**Owner:** Ishanka Senadeera  
**Last Updated:** February 14, 2026  
**Version:** 1.0.0

This document defines all environment variables used across the Restaurant Management System, with a focus on services owned by Ishanka (auth-service, gateway, frontend).

---

## Table of Contents

1. [Naming Conventions](#naming-conventions)
2. [Auth Service Variables](#auth-service-variables)
3. [Gateway Variables](#gateway-variables)
4. [Frontend Variables](#frontend-variables)
5. [Service URLs (Used by Gateway & Auth)](#service-urls)
6. [Environment-Specific Values](#environment-specific-values)

---

## Naming Conventions

### Standard Patterns

| Pattern | Usage | Example |
|---------|-------|---------|
| `{SERVICE}_SERVICE_URL` | Upstream service URLs | `MENU_SERVICE_URL` |
| `{SERVICE}_BASE_URL` | Base URLs for external services | `AUTH_SERVICE_BASE_URL` |
| `SPRING_DATASOURCE_*` | Spring Boot datasource config | `SPRING_DATASOURCE_URL` |
| `JWT_*` | JWT/Auth configuration | `JWT_SECRET`, `JWT_ACCESS_EXPIRATION` |
| `VITE_*` | Frontend env vars (Vite) | `VITE_GATEWAY_BASE_URL` |
| `CORS_*` | CORS configuration | `CORS_ALLOWED_ORIGIN_1` |
| `LOG_LEVEL_*` | Logging levels | `LOG_LEVEL_GATEWAY` |

### Rules

1. **All uppercase** with underscores (e.g., `AUTH_SERVICE_URL`)
2. **Service name first** for service-specific vars (e.g., `MENU_SERVICE_URL`)
3. **Use `_URL` suffix** for full URLs (e.g., `http://localhost:8081`)
4. **Use `_HOST` and `_PORT` separately** if needed (not recommended, use `_URL` instead)
5. **Never commit** actual `.env` files with secrets; only commit `.env.example`

---

## Auth Service Variables

### Server Configuration

| Variable | Description | Default | Required | Example |
|----------|-------------|---------|----------|---------|
| `SERVER_PORT` | Port for auth-service | `8081` | No | `8081` |

### Database Configuration

| Variable | Description | Default | Required | Example |
|----------|-------------|---------|----------|---------|
| `SPRING_DATASOURCE_URL` | MySQL connection URL | `jdbc:mysql://localhost:3306/Restaurant_Proj?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC` | Yes | `jdbc:mysql://db:3306/restaurant_prod` |
| `SPRING_DATASOURCE_USERNAME` | Database username | `root` | Yes | `auth_user` |
| `SPRING_DATASOURCE_PASSWORD` | Database password | (empty) | Yes | `secure_password_123` |

### JPA/Hibernate Configuration

| Variable | Description | Default | Required | Example |
|----------|-------------|---------|----------|---------|
| `JPA_DDL_AUTO` | Hibernate DDL mode | `update` | No | `validate` (prod), `update` (dev) |
| `JPA_SHOW_SQL` | Show SQL in logs | `true` | No | `false` (prod) |

### JWT Configuration

| Variable | Description | Default | Required | Example |
|----------|-------------|---------|----------|---------|
| `JWT_SECRET` | Secret key for JWT signing | `ue8yLJTAALbJ...` (default) | Yes | `your-256-bit-secret-key` |
| `JWT_ACCESS_EXPIRATION` | Access token TTL (ms) | `900000` (15 min) | No | `1800000` (30 min) |
| `JWT_REFRESH_EXPIRATION` | Refresh token TTL (ms) | `604800000` (7 days) | No | `2592000000` (30 days) |

### Example `.env` for Auth Service

```env
# Server
SERVER_PORT=8081

# Database
SPRING_DATASOURCE_URL=jdbc:mysql://localhost:3306/Restaurant_Proj?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC
SPRING_DATASOURCE_USERNAME=root
SPRING_DATASOURCE_PASSWORD=

# JPA
JPA_DDL_AUTO=update
JPA_SHOW_SQL=true

# JWT
JWT_SECRET=ue8yLJTAALbJn67rrh4lEGPLgl634dLEEIvRjVbemRFmgei9LggUKZjs/aSh9rvWGRBrze0Af5At6ywPsdO9+g==
JWT_ACCESS_EXPIRATION=900000
JWT_REFRESH_EXPIRATION=604800000
```

---

## Gateway Variables

### Server Configuration

| Variable | Description | Default | Required | Example |
|----------|-------------|---------|----------|---------|
| `SERVER_PORT` | Port for gateway | `8080` | No | `8080` |

### JWT Configuration (for validation)

| Variable | Description | Default | Required | Example |
|----------|-------------|---------|----------|---------|
| `JWT_SECRET` | **Must match auth-service** | `ue8yLJTAALbJ...` | Yes | Same as auth-service |

### CORS Configuration

| Variable | Description | Default | Required | Example |
|----------|-------------|---------|----------|---------|
| `CORS_ALLOWED_ORIGIN_1` | Allowed origin #1 | `http://localhost:5005` | No | `http://localhost:5005` |
| `CORS_ALLOWED_ORIGIN_2` | Allowed origin #2 | `http://localhost:3000` | No | `http://localhost:3000` |
| `CORS_ALLOWED_ORIGIN_3` | Allowed origin #3 | `http://localhost:3001` | No | `https://myapp.vercel.app` |

### Logging Configuration

| Variable | Description | Default | Required | Example |
|----------|-------------|---------|----------|---------|
| `LOG_LEVEL_GATEWAY` | Gateway logging level | `DEBUG` | No | `INFO` (prod) |
| `LOG_LEVEL_APP` | Application logging level | `DEBUG` | No | `INFO` (prod) |

### Service URLs (Upstream Routes)

See [Service URLs](#service-urls) section below.

### Example `.env` for Gateway

```env
# Server
SERVER_PORT=8080

# JWT (must match auth-service)
JWT_SECRET=ue8yLJTAALbJn67rrh4lEGPLgl634dLEEIvRjVbemRFmgei9LggUKZjs/aSh9rvWGRBrze0Af5At6ywPsdO9+g==

# CORS
CORS_ALLOWED_ORIGIN_1=http://localhost:5005
CORS_ALLOWED_ORIGIN_2=http://localhost:3000
CORS_ALLOWED_ORIGIN_3=http://localhost:3001

# Upstream Services
AUTH_SERVICE_URL=http://localhost:8081
MENU_SERVICE_URL=http://localhost:8082
ORDER_SERVICE_URL=http://localhost:8083
ANALYTICS_SERVICE_URL=http://localhost:8084
KDS_SERVICE_URL=http://localhost:8085
CART_SERVICE_URL=http://localhost:8086
PAYMENT_SERVICE_URL=http://localhost:8087
AI_SERVICE_URL=http://localhost:8000

# Logging
LOG_LEVEL_GATEWAY=DEBUG
LOG_LEVEL_APP=DEBUG
```

---

## Frontend Variables

**Note:** Vite requires all frontend env vars to be prefixed with `VITE_`.

| Variable | Description | Default | Required | Example |
|----------|-------------|---------|----------|---------|
| `VITE_GATEWAY_BASE_URL` | Gateway URL for API calls | `http://localhost:8080` | Yes | `https://api.restaurant.com` |
| `VITE_API_TIMEOUT` | API request timeout (ms) | `30000` | No | `30000` |

### Example `.env` for Frontend

```env
# Gateway/API
VITE_GATEWAY_BASE_URL=http://localhost:8080
VITE_API_TIMEOUT=30000
```

### Frontend `.env` File Strategy

| File | Purpose | Committed? |
|------|---------|------------|
| `.env.example` | Template with no secrets | ✅ Yes |
| `.env.development` | Local dev overrides | ✅ Yes (if no secrets) |
| `.env.production` | Production template | ✅ Yes (if no secrets) |
| `.env` | Local developer overrides | ❌ No (gitignored) |
| `.env.local` | Local secrets | ❌ No (gitignored) |

---

## Service URLs

Used by **gateway** and **auth-service** to route to other microservices.

| Variable | Service | Default Port | Default URL | Owner |
|----------|---------|--------------|-------------|-------|
| `AUTH_SERVICE_URL` | Auth Service | 8081 | `http://localhost:8081` | Ishanka |
| `MENU_SERVICE_URL` | Menu Service | 8082 | `http://localhost:8082` | Menu Team |
| `ORDER_SERVICE_URL` | Order Service | 8083 | `http://localhost:8083` | Order Team |
| `ANALYTICS_SERVICE_URL` | Analytics Service | 8084 | `http://localhost:8084` | Analytics Team |
| `KDS_SERVICE_URL` | KDS Service | 8085 | `http://localhost:8085` | KDS Team |
| `CART_SERVICE_URL` | Cart Service | 8086 | `http://localhost:8086` | Cart Team |
| `PAYMENT_SERVICE_URL` | Payment Service | 8087 | `http://localhost:8087` | Payment Team |
| `AI_SERVICE_URL` | AI/ChatBot Service | 8000 | `http://localhost:8000` | AI Team |

### Notes

- All service owners must expose their base URL as an environment variable.
- Default to `http://localhost:{PORT}` for local development.
- In production/staging, use fully qualified domain names or container network names.
- Ishanka can only update these URLs via env vars in other services, not code changes.

---

## Environment-Specific Values

### Development (Local)

```env
# Gateway
SERVER_PORT=8080
AUTH_SERVICE_URL=http://localhost:8081
MENU_SERVICE_URL=http://localhost:8082
ORDER_SERVICE_URL=http://localhost:8083
CORS_ALLOWED_ORIGIN_1=http://localhost:5005
LOG_LEVEL_GATEWAY=DEBUG

# Auth Service
SERVER_PORT=8081
SPRING_DATASOURCE_URL=jdbc:mysql://localhost:3306/Restaurant_Proj
JPA_DDL_AUTO=update
JPA_SHOW_SQL=true

# Frontend
VITE_GATEWAY_BASE_URL=http://localhost:8080
```

### Staging (Docker Compose / Container Network)

```env
# Gateway
SERVER_PORT=8080
AUTH_SERVICE_URL=http://auth-service:8081
MENU_SERVICE_URL=http://menu-service:8082
ORDER_SERVICE_URL=http://order-service:8083
CORS_ALLOWED_ORIGIN_1=https://staging.restaurant.com
LOG_LEVEL_GATEWAY=INFO

# Auth Service
SERVER_PORT=8081
SPRING_DATASOURCE_URL=jdbc:mysql://mysql:3306/restaurant_staging
JPA_DDL_AUTO=validate
JPA_SHOW_SQL=false

# Frontend
VITE_GATEWAY_BASE_URL=https://api-staging.restaurant.com
```

### Production

```env
# Gateway
SERVER_PORT=8080
AUTH_SERVICE_URL=http://auth-service:8081
MENU_SERVICE_URL=http://menu-service:8082
ORDER_SERVICE_URL=http://order-service:8083
CORS_ALLOWED_ORIGIN_1=https://restaurant.com
CORS_ALLOWED_ORIGIN_2=https://www.restaurant.com
LOG_LEVEL_GATEWAY=WARN

# Auth Service
SERVER_PORT=8081
SPRING_DATASOURCE_URL=jdbc:mysql://prod-db.internal:3306/restaurant_prod?useSSL=true
JPA_DDL_AUTO=validate
JPA_SHOW_SQL=false
JWT_ACCESS_EXPIRATION=900000
JWT_REFRESH_EXPIRATION=604800000

# Frontend
VITE_GATEWAY_BASE_URL=https://api.restaurant.com
```

---

## Security Best Practices

### ✅ DO

1. **Always use `.env.example`** files with placeholder values (no real secrets).
2. **Use strong, unique JWT secrets** in production (256-bit minimum).
3. **Rotate secrets regularly** (at least quarterly for JWT secrets).
4. **Use CI/CD secret management** (GitHub Secrets, Azure Key Vault, etc.) for production.
5. **Validate required env vars** at application startup (fail fast if missing).

### ❌ DON'T

1. **Never commit `.env`** files with real secrets.
2. **Don't use default secrets in production** (change `JWT_SECRET`, database passwords, etc.).
3. **Don't hardcode URLs/secrets** in code; always use env vars.
4. **Don't share the same database** across dev/staging/prod.
5. **Don't log sensitive env vars** (JWT secrets, passwords, etc.).

---

## Validation Checklist

Before deploying to any environment:

- [ ] All required env vars are set (no missing values)
- [ ] JWT_SECRET is unique and 256-bit (production)
- [ ] Database credentials are correct for the environment
- [ ] Service URLs point to correct hosts (localhost vs container names vs FQDNs)
- [ ] CORS origins match frontend deployment URLs
- [ ] Logging levels are appropriate (DEBUG for dev, INFO/WARN for prod)
- [ ] No secrets are committed to git
- [ ] `.env.example` files are up to date

---

## Questions or Issues?

Contact Ishanka Senadeera for:
- Changes to auth-service or gateway env vars
- Questions about JWT configuration
- Issues with service URL routing
- Adding new environment variables

For other services (menu, order, payment, etc.), contact the respective service owners.

