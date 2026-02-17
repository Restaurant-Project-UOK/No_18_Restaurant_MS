# Auth Service API Documentation

## Base URL
```
http://localhost:8081/api
```

## Authentication
- **JWT Token Type**: Bearer
- Protected endpoints require `Authorization: Bearer <token>` header
- When running behind API Gateway, `X-User-Id` header is used for user identification

---

## API Endpoints

### 1. User Registration
**Endpoint**: `POST /auth/register`  
**JWT Required**: ❌ OFF  
**Description**: Register a new user (Customer, Admin, or Kitchen Staff)

**Request JSON**:
```json
{
  "fullName": "John Doe",
  "email": "john.doe@example.com",
  "password": "SecurePass123",
  "role": 1,
  "provider": 1,
  "phone": "+94771234567",
  "address": "123 Main Street, Colombo"
}
```

**Request Fields**:
- `fullName` (string): User's full name
- `email` (string): User's email address
- `password` (string): User's password
- `role` (integer): User role - 1=CUSTOMER, 2=ADMIN, 3=KITCHEN
- `provider` (integer): Authentication provider - 1=LOCAL, 2=GOOGLE
- `phone` (string): Phone number
- `address` (string): Physical address

**Response JSON** (200 OK):
```json
{
  "id": 1,
  "email": "john.doe@example.com",
  "role": 1,
  "provider": 1,
  "profile": {
    "fullName": "John Doe",
    "phone": "+94771234567",
    "address": "123 Main Street, Colombo"
  }
}
```

---

### 2. User Login
**Endpoint**: `POST /auth/login`  
**JWT Required**: ❌ OFF  
**Description**: Authenticate user and receive JWT tokens

**Request JSON**:
```json
{
  "email": "john.doe@example.com",
  "password": "SecurePass123",
  "tableId": 5
}
```

**Request Fields**:
- `email` (string): User's email address
- `password` (string): User's password
- `tableId` (integer): Table number for restaurant context

**Response JSON** (200 OK):
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "john.doe@example.com",
    "role": 1,
    "provider": 1,
    "profile": {
      "fullName": "John Doe",
      "phone": "+94771234567",
      "address": "123 Main Street, Colombo"
    }
  },
  "tokenType": "Bearer",
  "accessTokenExpiresIn": 3600000,
  "refreshTokenExpiresIn": 604800000
}
```

**Response Fields**:
- `accessToken` (string): JWT access token for API requests
- `refreshToken` (string): JWT refresh token for obtaining new access tokens
- `tokenType` (string): Token type (always "Bearer")
- `accessTokenExpiresIn` (long): Access token expiration in milliseconds
- `refreshTokenExpiresIn` (long): Refresh token expiration in milliseconds

---

### 3. Refresh Access Token
**Endpoint**: `POST /auth/refresh`  
**JWT Required**: ❌ OFF (uses refresh token)  
**Description**: Generate new access token using refresh token

**Request JSON**:
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Request Fields**:
- `refreshToken` (string): Valid refresh token obtained from login

**Response JSON** (200 OK):
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "tokenType": "Bearer",
  "expiresIn": 3600000
}
```

**Response Fields**:
- `accessToken` (string): New JWT access token
- `tokenType` (string): Token type (always "Bearer")
- `expiresIn` (long): Token expiration time in milliseconds

---

### 4. User Logout
**Endpoint**: `POST /auth/logout`  
**JWT Required**: ✅ ON  
**Description**: Logout user and invalidate tokens

**Request Headers**:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
X-User-Id: 1 (optional, for gateway mode)
```

**Request JSON**: None (empty body)

**Response** (200 OK):
```
Logged out successfully
```

**Error Response** (401 Unauthorized):
```
User not authenticated
```

---

### 5. Get Current User Profile
**Endpoint**: `GET /profile/me`  
**JWT Required**: ✅ ON  
**Description**: Retrieve current user's profile information

**Request Headers**:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
X-User-Id: 1 (optional, for gateway mode)
```

**Request JSON**: None (GET request)

**Response JSON** (200 OK):
```json
{
  "id": 1,
  "email": "john.doe@example.com",
  "fullName": "John Doe",
  "phone": "+94771234567",
  "address": "123 Main Street, Colombo",
  "additionalInfo": null,
  "createdAt": "2026-02-14T10:30:00",
  "updatedAt": "2026-02-14T10:30:00"
}
```

**Response Fields**:
- `id` (long): User ID
- `email` (string): User's email
- `fullName` (string): Full name
- `phone` (string): Phone number
- `address` (string): Physical address
- `additionalInfo` (string): JSON string for additional data
- `createdAt` (datetime): Profile creation timestamp
- `updatedAt` (datetime): Last update timestamp

---

### 6. Update Current User Profile
**Endpoint**: `PUT /profile/me`  
**JWT Required**: ✅ ON  
**Description**: Update current user's profile information

**Request Headers**:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
X-User-Id: 1 (optional, for gateway mode)
```

**Request JSON**:
```json
{
  "fullName": "John Smith",
  "phone": "+94779876543",
  "address": "456 New Street, Colombo",
  "additionalInfo": "{\"preferences\": \"vegetarian\"}"
}
```

**Request Fields**:
- `fullName` (string, optional): Updated full name
- `phone` (string, optional): Updated phone number
- `address` (string, optional): Updated address
- `additionalInfo` (string, optional): JSON string for custom data

**Response JSON** (200 OK):
```json
{
  "id": 1,
  "email": "john.doe@example.com",
  "fullName": "John Smith",
  "phone": "+94779876543",
  "address": "456 New Street, Colombo",
  "additionalInfo": "{\"preferences\": \"vegetarian\"}",
  "createdAt": "2026-02-14T10:30:00",
  "updatedAt": "2026-02-17T15:45:00"
}
```

---

### 7. Create Staff User (Admin Only)
**Endpoint**: `POST /admin/staff`  
**JWT Required**: ✅ ON (Admin role required)  
**Description**: Create new staff member (Kitchen or Waiter)

**Request Headers**:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Request JSON**:
```json
{
  "fullName": "Jane Kitchen",
  "email": "jane.kitchen@restaurant.com",
  "password": "StaffPass123",
  "role": 3,
  "phone": "+94771112222",
  "address": "789 Staff Quarter, Colombo"
}
```

**Request Fields**:
- `fullName` (string): Staff member's full name
- `email` (string): Staff member's email
- `password` (string): Initial password
- `role` (integer): Staff role - 3=KITCHEN, 4=WAITER
- `phone` (string): Phone number
- `address` (string): Physical address

**Response JSON** (200 OK):
```json
{
  "id": 10,
  "email": "jane.kitchen@restaurant.com",
  "role": 3,
  "provider": 1,
  "profile": {
    "fullName": "Jane Kitchen",
    "phone": "+94771112222",
    "address": "789 Staff Quarter, Colombo"
  }
}
```

---

### 8. Get All Users (Admin Only)
**Endpoint**: `GET /admin/users`  
**JWT Required**: ✅ ON (Admin role required)  
**Description**: Retrieve list of all registered users

**Request Headers**:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Request JSON**: None (GET request)

**Response JSON** (200 OK):
```json
[
  {
    "id": 1,
    "email": "john.doe@example.com",
    "role": 1,
    "provider": 1,
    "profile": {
      "fullName": "John Doe",
      "phone": "+94771234567",
      "address": "123 Main Street, Colombo"
    }
  },
  {
    "id": 2,
    "email": "admin@restaurant.com",
    "role": 2,
    "provider": 1,
    "profile": {
      "fullName": "Admin User",
      "phone": "+94771111111",
      "address": "Restaurant HQ"
    }
  }
]
```

---

## Error Responses

### 400 Bad Request
```json
{
  "error": "Bad Request",
  "message": "Invalid input data",
  "timestamp": "2026-02-17T10:15:30"
}
```

### 401 Unauthorized
```json
{
  "error": "Unauthorized",
  "message": "Invalid credentials or authentication required",
  "timestamp": "2026-02-17T10:15:30"
}
```

### 404 Not Found
```json
{
  "error": "Not Found",
  "message": "User not found",
  "timestamp": "2026-02-17T10:15:30"
}
```

### 409 Conflict
```json
{
  "error": "Conflict",
  "message": "User already exists with this email",
  "timestamp": "2026-02-17T10:15:30"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal Server Error",
  "message": "An unexpected error occurred",
  "timestamp": "2026-02-17T10:15:30"
}
```

---

## Data Models

### User Roles
| Role ID | Role Name | Description |
|---------|-----------|-------------|
| 1 | CUSTOMER | Regular customer |
| 2 | ADMIN | Administrator with full access |
| 3 | KITCHEN | Kitchen staff |
| 4 | WAITER | Waiter/waitress staff |

### Authentication Providers
| Provider ID | Provider Name | Description |
|-------------|---------------|-------------|
| 1 | LOCAL | Email/Password authentication |
| 2 | GOOGLE | Google OAuth authentication |

---

## Operating Modes

### Standalone Mode (Default)
- CORS enabled
- All endpoints publicly accessible at security level
- JWT validation in controllers via SecurityContext
- Direct authentication using JWT tokens

**Configuration** (`application.properties`):
```properties
cors.enabled=true
gateway.enabled=false
```

### Gateway Mode
- CORS disabled (handled by API Gateway)
- User identity extracted from `X-User-Id` header
- JWT validation handled by API Gateway
- Auth-service only generates JWT tokens

**Configuration** (`application-gateway.properties`):
```properties
cors.enabled=false
gateway.enabled=true
```

---

## JWT Token Details

### Access Token
- **Lifetime**: 1 hour (3600000 milliseconds)
- **Usage**: API authentication
- **Header**: `Authorization: Bearer <access_token>`

### Refresh Token
- **Lifetime**: 7 days (604800000 milliseconds)
- **Usage**: Obtain new access tokens
- **Endpoint**: `POST /auth/refresh`

### Token Payload
```json
{
  "sub": "1",
  "email": "john.doe@example.com",
  "role": "1",
  "iat": 1708163430,
  "exp": 1708167030
}
```

---

## Quick Reference Table

| Endpoint | Method | JWT Required | Role Required | Description |
|----------|--------|--------------|---------------|-------------|
| `/auth/register` | POST | ❌ | None | Register new user |
| `/auth/login` | POST | ❌ | None | User login |
| `/auth/refresh` | POST | ❌ | None | Refresh access token |
| `/auth/logout` | POST | ✅ | Any | Logout user |
| `/profile/me` | GET | ✅ | Any | Get current profile |
| `/profile/me` | PUT | ✅ | Any | Update current profile |
| `/admin/staff` | POST | ✅ | Admin (2) | Create staff user |
| `/admin/users` | GET | ✅ | Admin (2) | List all users |

---

## Testing Examples

### Using cURL

**Register User**:
```bash
curl -X POST http://localhost:8081/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Test User",
    "email": "test@example.com",
    "password": "password123",
    "role": 1,
    "provider": 1,
    "phone": "+94771234567",
    "address": "Test Address"
  }'
```

**Login**:
```bash
curl -X POST http://localhost:8081/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "tableId": 1
  }'
```

**Get Profile** (with JWT):
```bash
curl -X GET http://localhost:8081/api/profile/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE"
```

---

## Notes

1. **Security**: In production, ensure HTTPS is enabled for all API calls
2. **Gateway Mode**: When using API Gateway, ensure proper configuration of header forwarding
3. **Token Storage**: Store tokens securely in client applications (httpOnly cookies recommended)
4. **Role Validation**: Admin endpoints should validate user roles (currently relies on gateway routing)
5. **Password Policy**: Implement strong password requirements in production
6. **Rate Limiting**: Consider implementing rate limiting for authentication endpoints

---

**Last Updated**: February 17, 2026  
**Version**: 1.0  
**Author**: Ishanka Senadeera
