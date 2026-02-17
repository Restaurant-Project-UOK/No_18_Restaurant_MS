# Auth Service

**Owner:** Ishanka Senadeera  
**Version:** 0.0.1-SNAPSHOT  
**Spring Boot:** 3.5.7  
**Java:** 17

Authentication and authorization service for the Restaurant Management System.

---

## Table of Contents

1. [Overview](#overview)
2. [Features](#features)
3. [Tech Stack](#tech-stack)
4. [Getting Started](#getting-started)
5. [API Endpoints](#api-endpoints)
6. [Configuration](#configuration)
7. [Development](#development)
8. [Testing](#testing)
9. [Deployment](#deployment)

---

## Overview

The Auth Service handles:
- User registration and login
- JWT token generation and validation
- Role-based access control (RBAC)
- User profile management
- Session management

---

## Features

- ✅ JWT-based authentication
- ✅ Role-based authorization (Admin, Waiter, Kitchen, etc.)
- ✅ Secure password hashing (BCrypt)
- ✅ Refresh token support
- ✅ User profile management
- ✅ OpenAPI/Swagger documentation
- ✅ MySQL persistence

---

## Tech Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| Spring Boot | 3.5.7 | Application framework |
| Spring Security | - | Authentication & authorization |
| Spring Data JPA | - | Database access |
| MySQL | 8.x | Database |
| JWT (jjwt) | 0.11.5 | Token generation/validation |
| Lombok | - | Reduce boilerplate |
| MapStruct | 1.6.3 | DTO mapping |
| Springdoc OpenAPI | 2.8.14 | API documentation |

---

## Getting Started

### Prerequisites

- **Java 17** (JDK 17)
- **Maven 3.9+**
- **MySQL 8.x**
- **IDE:** IntelliJ IDEA (recommended) or Eclipse

### 1. Clone the Repository

```bash
git clone https://github.com/Restaurant-Project-UOK/No_18_restaurant-MS.git
cd No_18_restaurant-MS/services/auth-service
```

### 2. Configure Environment

Copy `.env.example` to `.env.development` and update values:

```bash
cp .env.example .env.development
```

Edit `.env.development`:

```env
# Server
SERVER_PORT=8081

# Database
SPRING_DATASOURCE_URL=jdbc:mysql://localhost:3306/Restaurant_Proj?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC
SPRING_DATASOURCE_USERNAME=root
SPRING_DATASOURCE_PASSWORD=yourpassword

# JWT
JWT_SECRET=your-256-bit-secret-key
JWT_ACCESS_EXPIRATION=900000
JWT_REFRESH_EXPIRATION=604800000
```

### 3. Create Database

```sql
CREATE DATABASE Restaurant_Proj;
```

### 4. Run the Application

**Using Maven:**

```bash
./mvnw spring-boot:run
```

**Using IDE:**

Run `AuthServiceApplication.java` as a Java application.

**The service will start on:** `http://localhost:8081`

### 5. Verify It's Running

- **Health Check:** `http://localhost:8081/actuator/health`
- **Swagger UI:** `http://localhost:8081/swagger-ui.html`

---

## API Endpoints

### Authentication

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/auth/register` | Register new user | No |
| POST | `/api/auth/login` | Login and get tokens | No |
| POST | `/api/auth/refresh` | Refresh access token | Yes (Refresh Token) |
| POST | `/api/auth/logout` | Logout user | Yes |

### User Profile

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/auth/profile` | Get current user profile | Yes |
| PUT | `/api/auth/profile` | Update user profile | Yes |

### Example Requests

**Register:**

```bash
curl -X POST http://localhost:8081/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123!",
    "fullName": "John Doe",
    "phone": "+1234567890",
    "role": 2
  }'
```

**Login:**

```bash
curl -X POST http://localhost:8081/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123!"
  }'
```

**Response:**

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "tokenType": "Bearer",
  "expiresIn": 900000
}
```

---

## Configuration

### Environment Variables

See [`docs/ENV_VARIABLES.md`](../../docs/ENV_VARIABLES.md) for complete reference.

**Key Variables:**

| Variable | Description | Default |
|----------|-------------|---------|
| `SERVER_PORT` | Server port | `8081` |
| `SPRING_DATASOURCE_URL` | MySQL connection URL | `jdbc:mysql://localhost:3306/Restaurant_Proj` |
| `SPRING_DATASOURCE_USERNAME` | Database username | `root` |
| `SPRING_DATASOURCE_PASSWORD` | Database password | (empty) |
| `JWT_SECRET` | JWT signing key | (default, **change in prod!**) |
| `JWT_ACCESS_EXPIRATION` | Access token TTL (ms) | `900000` (15 min) |
| `JWT_REFRESH_EXPIRATION` | Refresh token TTL (ms) | `604800000` (7 days) |

### Application Profiles

- **Development:** Uses `application.properties` with env var overrides
- **Production:** Use environment-specific `.env` files or CI/CD secrets

---

## Development

### Project Structure

```
src/main/java/com/example/auth_service/
├── AuthServiceApplication.java       # Main entry point
├── config/                            # Configuration classes
├── Controller/                        # REST controllers
├── DTO/                               # Data Transfer Objects
├── Entity/                            # JPA entities
├── Exception/                         # Custom exceptions
├── Repository/                        # Data access layer
├── Security/                          # Security config, JWT, filters
└── Service/                           # Business logic
    ├── Impl/                          # Service implementations
    └── [Service interfaces]
```

### Running Tests

```bash
./mvnw test
```

### Code Style

- Use **Lombok** annotations (`@Data`, `@Builder`, etc.) to reduce boilerplate
- Follow **Spring Boot best practices**
- Use **DTOs** for API contracts (never expose entities directly)

### Database Migrations

Currently using `spring.jpa.hibernate.ddl-auto=update` for development.

**TODO (Sprint 2):** Migrate to Flyway or Liquibase for production-safe schema management.

---

## Testing

### Unit Tests

Test service layer logic:

```bash
./mvnw test -Dtest=AuthServiceImplTest
```

### Integration Tests

Test full API flows with test database:

```bash
./mvnw verify
```

**TODO:** Add Testcontainers for isolated integration tests.

---

## Deployment

### Docker Build

```bash
docker build -t restaurant-auth-service:latest .
```

### Docker Run

```bash
docker run -p 8081:8081 \
  -e SPRING_DATASOURCE_URL=jdbc:mysql://host.docker.internal:3306/Restaurant_Proj \
  -e SPRING_DATASOURCE_USERNAME=root \
  -e SPRING_DATASOURCE_PASSWORD=password \
  -e JWT_SECRET=your-production-secret \
  restaurant-auth-service:latest
```

### Docker Compose

See `docker-compose.yml` in auth-service directory or use the main infra compose.

### CI/CD

GitHub Actions workflow: `.github/workflows/auth-service-ci.yml`

- **On PR:** Build + test
- **On main:** Build + test + Docker image push

---

## Security Considerations

### ✅ Implemented

- BCrypt password hashing
- JWT with configurable expiration
- HTTPS enforcement (via gateway in production)
- Environment-based secrets

### 🔄 TODO (Sprint 3)

- Refresh token rotation
- Token revocation list (Redis)
- Rate limiting for login attempts
- Multi-factor authentication (MFA)

---

## Troubleshooting

### Database Connection Issues

**Error:** `Communications link failure`

**Fix:** Ensure MySQL is running and connection URL is correct.

```bash
# Check MySQL is running
mysql -u root -p -e "SELECT 1"

# Verify database exists
mysql -u root -p -e "SHOW DATABASES LIKE 'Restaurant_Proj'"
```

### JWT Token Issues

**Error:** `Invalid JWT signature`

**Fix:** Ensure `JWT_SECRET` matches between auth-service and gateway.

### Port Already in Use

**Error:** `Port 8081 already in use`

**Fix:**

```bash
# Windows
netstat -ano | findstr :8081
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:8081 | xargs kill -9
```

---

## API Documentation

**Swagger UI:** `http://localhost:8081/swagger-ui.html`

**OpenAPI JSON:** `http://localhost:8081/v3/api-docs`

---

## Contributing

This service is owned by **Ishanka Senadeera**.

For changes:
1. Create a feature branch: `git checkout -b feature/your-feature`
2. Make changes and test locally
3. Run tests: `./mvnw verify`
4. Create PR to `development` branch

---

## Support

- **Owner:** Ishanka Senadeera
- **Project:** No_18_Restaurant_MS
- **Documentation:** See `docs/` folder in project root
- **Environment Variables:** See `docs/ENV_VARIABLES.md`

---

## Changelog

### v0.0.1-SNAPSHOT (Current)

- ✅ Basic JWT authentication
- ✅ User registration and login
- ✅ Role-based authorization
- ✅ Profile management
- ✅ MySQL persistence
- ✅ OpenAPI documentation

### Planned (Sprint 1-3)

- 🔄 Refresh token flow
- 🔄 Clean architecture refactoring
- 🔄 Comprehensive test coverage
- 🔄 Observability (metrics, structured logging)
- 🔄 CI/CD enhancements

