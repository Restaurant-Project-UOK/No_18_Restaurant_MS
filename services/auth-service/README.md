# 🔐 Auth Service & Frontend Documentation

A microservices-based authentication service built with **Spring Boot 3.5.7** and **JWT**, with a modern **React** frontend.

---

## 📑 Table of Contents

- [Architecture Overview](#architecture-overview)
- [Key Features](#key-features)
- [Authentication Flow](#authentication-flow)
- [Database Schema](#database-schema)
- [API Endpoints](#api-endpoints)
- [Security Measures](#security-measures)
- [Frontend Components](#frontend-components)
- [Configuration](#configuration)
- [Installation & Setup](#installation--setup)

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND (React + Vite)               │
│  ┌──────────────┬──────────────┬──────────────┐              │
│  │    Login     │   Register   │   Profile    │              │
│  └──────────────┴──────────────┴──────────────┘              │
│         ↓           ↓               ↓                         │
│  ┌─────────────────────────────────────────┐                │
│  │  API Layer (auth.js, api.js)           │                │
│  │  • JWT Token Management                │                │
│  │  • Automatic Token Refresh              │                │
│  └─────────────────────────────────────────┘                │
└──────────────────────↓──────────────────────────────────────┘
                       │ HTTP
┌──────────────────────↓──────────────────────────────────────┐
│         AUTH SERVICE (Spring Boot 3.5.7 + Java 21)          │
│  ┌─────────────────────────────────────────┐                │
│  │      REST API Endpoints                 │                │
│  │  • POST /auth/register                  │                │
│  │  • POST /auth/login                     │                │
│  │  • POST /auth/refresh                   │                │
│  │  • POST /auth/logout                    │                │
│  └─────────────────────────────────────────┘                │
│  ┌─────────────────────────────────────────┐                │
│  │      Security Layer                     │                │
│  │  • JWT (Access + Refresh Tokens)        │                │
│  │  • Spring Security + Password Encoding  │                │
│  │  • JwtAuthenticationFilter               │                │
│  └─────────────────────────────────────────┘                │
│  ┌─────────────────────────────────────────┐                │
│  │      Service Layer                      │                │
│  │  • AuthService (Login/Register/Logout)  │                │
│  │  • ProfileService (User Info)           │                │
│  └─────────────────────────────────────────┘                │
└──────────────────────↓──────────────────────────────────────┘
                       │ JDBC
┌──────────────────────↓──────────────────────────────────────┐
│              MySQL Database                                 │
│  ┌──────────────┬──────────────┬──────────────┐             │
│  │    users     │   profiles   │  activities  │             │
│  └──────────────┴──────────────┴──────────────┘             │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔐 Key Features

### Backend (Auth Service)

| Feature | Details |
|---------|---------|
| **Framework** | Spring Boot 3.5.7 |
| **Java Version** | 21 |
| **Authentication** | JWT-based (Access + Refresh tokens) |
| **Token Expiration** | Access: 10 seconds (dev), Refresh: 7 days |
| **Database** | MySQL |
| **Security Algorithm** | HS512 (HMAC SHA-512) |
| **Password Encoding** | BCrypt (Spring Security) |
| **Key Dependencies** | Spring Security, JPA, JJWT, Lombok, MapStruct |

### Frontend (React)

| Feature | Details |
|---------|---------|
| **Framework** | React + Vite |
| **State Management** | Context API (TableContext) |
| **Token Storage** | localStorage (accessToken, refreshToken, tableId) |
| **Auto Token Refresh** | Intercepts 403 responses and refreshes automatically |
| **Error Handling** | Redirects to login on token expiration |

---

## 🔄 Authentication Flow

### 1. Registration Flow

```
User fills form 
    ↓
Register API Call 
    ↓
Create User (with hashed password) 
    ↓
Create Profile 
    ↓
Response with User & Profile Data 
    ↓
Redirect to Login Page
```

**Request:**
```json
{
  "fullName": "John Doe",
  "email": "john@example.com",
  "password": "securePassword123",
  "role": 1
}
```

**Response:**
```json
{
  "id": 1,
  "user": { "id": 1, "email": "john@example.com", "role": 1 },
  "profile": { "fullName": "John Doe", "phone": null, "address": null }
}
```

---

### 2. Login Flow

```
Email & Password Input 
    ↓
Validate Credentials (email exists & password matches) 
    ↓
Generate Access Token (15 min) + Refresh Token (7 days) 
    ↓
Log User Activity (table assignment) 
    ↓
Store tokens in localStorage 
    ↓
Redirect to Profile Page
```

**Request:**
```json
{
  "email": "john@example.com",
  "password": "securePassword123",
  "tableId": 5
}
```

**Response:**
```json
{
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc...",
  "tableId": 5
}
```

---

### 3. Token Refresh Flow

```
Request with Expired Access Token 
    ↓
Receive 403 Unauthorized 
    ↓
Extract Refresh Token from localStorage 
    ↓
POST to /auth/refresh 
    ↓
Receive New Access Token 
    ↓
Update localStorage 
    ↓
Retry Original Request
```

---

### 4. Protected Request Flow

```
All requests include Authorization header: Bearer {accessToken} 
    ↓
JwtAuthenticationFilter validates token signature & expiration 
    ↓
If valid → Extract user info and proceed 
    ↓
If expired/invalid → Trigger token refresh 
    ↓
If refresh fails → Redirect to login page
```

---

## 📋 Database Schema

### Users Table

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | INT | PRIMARY KEY, AUTO_INCREMENT | User identifier |
| email | VARCHAR | UNIQUE, NOT NULL | Unique email identifier |
| password | VARCHAR | NOT NULL | BCrypt hashed password |
| provider | INT | DEFAULT 1 | 1=LOCAL, 2=GOOGLE |
| role | INT | DEFAULT 1 | 1=CUSTOMER, 2=ADMIN, 3=KITCHEN |

**Sample Record:**
```
id: 1
email: john@restaurant.com
password: $2a$10$... (hashed)
provider: 1
role: 1
```

---

### Profiles Table

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | INT | PRIMARY KEY, FK | Same as user.id (shared PK) |
| fullName | VARCHAR | NOT NULL | User's full name |
| phone | VARCHAR | NULLABLE | Contact phone number |
| address | VARCHAR | NULLABLE | User's address |
| createdAt | DATETIME | DEFAULT CURRENT_TIMESTAMP | Profile creation time |
| updatedAt | DATETIME | DEFAULT CURRENT_TIMESTAMP | Last update time |
| user_id | INT | FOREIGN KEY | References users.id |

**Sample Record:**
```
id: 1
fullName: John Doe
phone: +1234567890
address: 123 Main St
createdAt: 2024-12-14 10:30:00
updatedAt: 2024-12-14 10:30:00
```

---

### User Activities Table

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | INT | PRIMARY KEY, AUTO_INCREMENT | Activity identifier |
| user_id | INT | FOREIGN KEY | References users.id |
| tableNo | INT | NOT NULL | Restaurant table number |
| loginAt | DATETIME | NOT NULL | Login timestamp |

**Sample Record:**
```
id: 1
user_id: 1
tableNo: 5
loginAt: 2024-12-14 11:00:00
```

---

## 🎯 API Endpoints

### Authentication Endpoints

#### 1. **Register User**
```http
POST /api/auth/register
Content-Type: application/json

{
  "fullName": "John Doe",
  "email": "john@restaurant.com",
  "password": "securePassword123",
  "role": 1
}
```

**Response (200 OK):**
```json
{
  "id": 1,
  "user": {
    "id": 1,
    "email": "john@restaurant.com",
    "provider": 1,
    "role": 1
  },
  "profile": {
    "fullName": "John Doe",
    "phone": null,
    "address": null,
    "createdAt": "2024-12-14T10:30:00",
    "updatedAt": "2024-12-14T10:30:00"
  }
}
```

---

#### 2. **Login**
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@restaurant.com",
  "password": "securePassword123",
  "tableId": 5
}
```

**Response (200 OK):**
```json
{
  "accessToken": "eyJhbGciOiJIUzUxMiJ9...",
  "refreshToken": "eyJhbGciOiJIUzUxMiJ9...",
  "tableId": 5
}
```

**Error (401 Unauthorized):**
```json
{
  "message": "Invalid email or password"
}
```

---

#### 3. **Refresh Access Token**
```http
POST /api/auth/refresh
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJIUzUxMiJ9..."
}
```

**Response (200 OK):**
```
New access token string (plain text)
```

---

#### 4. **Logout**
```http
POST /api/auth/logout
Authorization: Bearer {accessToken}
```

**Response (200 OK):**
```json
{
  "message": "Logged out successfully"
}
```

---

### Profile Endpoints

#### 5. **Get User Profile**
```http
GET /api/profile/me
Authorization: Bearer {accessToken}
```

**Response (200 OK):**
```json
{
  "id": 1,
  "fullName": "John Doe",
  "email": "john@restaurant.com",
  "role": 1,
  "phone": "+1234567890",
  "address": "123 Main St"
}
```

**Error (403 Forbidden):**
```json
{
  "message": "Unauthorized - Token expired or invalid"
}
```

---

## 🛡️ Security Measures

✅ **Password Encryption**
- BCrypt hashing with salt rounds
- Spring Security password encoder

✅ **JWT Signing**
- HMAC SHA-512 algorithm
- Secure secret key storage (environment variables)

✅ **Token Validation**
- JwtService validates signature and expiration
- Every protected endpoint checks token validity

✅ **Automatic Token Refresh**
- Frontend intercepts 403 responses
- Transparent refresh without user interaction
- Fallback to login on refresh failure

✅ **Role-Based Access Control**
- Role field supports CUSTOMER/ADMIN/KITCHEN roles
- Foundation for endpoint authorization

✅ **Activity Logging**
- Tracks login events with timestamp
- Records table assignment per user

✅ **CORS & Validation**
- Spring Security configuration
- Request validation with DTOs
- Input sanitization

---

## 📱 Frontend Components

### Login.jsx
**Location:** `frontend/src/pages/auth/Login.jsx`

**Functionality:**
- Email & password form inputs
- Credential validation
- Token storage (accessToken, refreshToken, tableId)
- Redirect to Profile page on success
- Error messaging for failed login

**Key Features:**
- Reads tableId from context or location state
- Stores tokens in localStorage for persistence
- Handles login errors gracefully

---

### Register.jsx
**Location:** `frontend/src/pages/auth/Register.jsx`

**Functionality:**
- User registration form (Full Name, Email, Password)
- Form validation
- Account creation via API
- Auto-redirect to login with tableId in state
- Error messaging

**Key Features:**
- Role defaulted to 1 (CUSTOMER)
- Passes tableId to login page via React Router state
- Basic error handling

---

### Profile.jsx
**Location:** `frontend/src/pages/auth/Profile.jsx`

**Functionality:**
- Displays authenticated user's profile information
- Fetches profile data from backend
- Auto-refresh on token expiration
- Redirect to login on authentication failure

**Displayed Information:**
- Full Name
- Email
- Role
- Phone
- Address

---

### auth.js
**Location:** `frontend/src/api/auth.js`

**Exported Functions:**

```javascript
// Fetch user profile
getProfile() → Promise

// User login
login({ email, password }) → Promise<{ accessToken, refreshToken, tableId }>

// User registration
register({ fullName, email, password, role }) → Promise
```

---

### api.js
**Location:** `frontend/src/utils/api.js`

**Key Functions:**

```javascript
// Automatic token refresh logic
refreshAccessToken() → Promise<boolean>

// Fetch wrapper with JWT injection and auto-refresh
fetchWithAuth(endpoint, options = {}) → Promise
```

**Features:**
- Injects Authorization header automatically
- Intercepts 403 responses for token refresh
- Updates tokens in localStorage
- Redirects to login on persistent failures
- Handles JSON parsing and errors

---

## ⚙️ Configuration

### Backend Configuration (application.properties)

```properties
# Server
server.address=0.0.0.0
server.port=8081
spring.application.name=auth_service

# Database
spring.datasource.url=jdbc:mysql://localhost:3306/restaurant_proj?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC
spring.datasource.username=root
spring.datasource.password=root
spring.datasource.driver-class-name=com.mysql.cj.jdbc.Driver

# JPA/Hibernate
spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=false
spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.MySQL8Dialect
spring.jpa.properties.hibernate.format_sql=true

# JWT
jwt.secret=${JWT_SECRET:ue8yLJTAALbJn67rrh4lEGPLgl634dLEEIvRjVbemRFmgei9LggUKZjs/aSh9rvWGRBrze0Af5At6ywPsdO9+g==}
jwt.access-token-expiration-ms=${JWT_ACCESS_EXPIRATION:10000}
jwt.refresh-token-expiration-ms=${JWT_REFRESH_EXPIRATION:604800000}
```

### Environment Variables (Recommended for Production)

```bash
JWT_SECRET=your-super-secret-key-here
JWT_ACCESS_EXPIRATION=900000      # 15 minutes in ms
JWT_REFRESH_EXPIRATION=604800000  # 7 days in ms
```

### Frontend Configuration (Vite)

**.env.local:**
```
VITE_BASE_URL=http://localhost:8081/api/
```

---

## 🚀 Installation & Setup

### Backend (Auth Service)

#### Prerequisites
- Java 21
- Maven 3.8+
- MySQL 8.0+

#### Steps

1. **Navigate to auth-service directory**
   ```bash
   cd services/auth-service
   ```

2. **Configure database**
   - Create MySQL database: `restaurant_proj`
   - Update `application.properties` with credentials

3. **Build the project**
   ```bash
   mvn clean install
   ```

4. **Run the service**
   ```bash
   mvn spring-boot:run
   ```

5. **Verify**
   - Service runs on `http://localhost:8081`
   - Swagger API docs: `http://localhost:8081/swagger-ui.html`

---

### Frontend (React)

#### Prerequisites
- Node.js 18+
- npm or yarn

#### Steps

1. **Navigate to frontend directory**
   ```bash
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Create .env.local file**
   ```bash
   echo "VITE_BASE_URL=http://localhost:8081/api/" > .env.local
   ```

4. **Run development server**
   ```bash
   npm run dev
   ```

5. **Access the application**
   - Open `http://localhost:5173` (or shown in terminal)

---

## 📊 Token Structure

### Access Token (JWT)
```json
Header: {
  "alg": "HS512"
}
Payload: {
  "sub": "1",
  "email": "john@restaurant.com",
  "role": 1,
  "iat": 1702558800,
  "exp": 1702559700
}
Signature: HMAC-SHA512(secret)
```

**Lifespan:** 15 minutes (configurable)

---

### Refresh Token (JWT)
```json
Header: {
  "alg": "HS512"
}
Payload: {
  "sub": "1",
  "iat": 1702558800,
  "exp": 1703163600
}
Signature: HMAC-SHA512(secret)
```

**Lifespan:** 7 days (configurable)

---

## 🔗 Integration Points

### With Other Services

The Auth Service provides authentication for:
- **Menu Service** - User role validation
- **Order Service** - User identification
- **AI Service** - User context for chatbot
- **Analytics Service** - User tracking

All services receive JWT tokens in the `Authorization` header and can validate them independently.

---

## 📝 Error Codes

| Code | Message | Cause |
|------|---------|-------|
| 200 | Success | Request completed successfully |
| 400 | Bad Request | Invalid input data |
| 401 | Unauthorized | Invalid credentials |
| 403 | Forbidden | Token expired or invalid |
| 409 | Conflict | Email already exists |
| 500 | Internal Server Error | Server-side error |

---

## 🎯 Best Practices

1. **Always use HTTPS in production** - Protect JWT tokens in transit
2. **Store secrets in environment variables** - Never hardcode JWT secret
3. **Implement token rotation** - Regularly refresh tokens
4. **Log authentication events** - Track logins and logouts
5. **Validate input** - Check email format and password strength
6. **Handle errors gracefully** - Provide clear error messages
7. **Implement rate limiting** - Prevent brute force attacks
8. **Use secure HTTP headers** - Add CORS, CSP, etc.

---

## 📞 Support & Questions

For issues or questions about the Auth Service:
1. Check the error messages and logs
2. Review the API endpoint documentation above
3. Verify database configuration
4. Ensure JWT secret is properly set

---

**Last Updated:** December 14, 2025  
**Version:** 1.0.0  
**Status:** Production Ready ✅
