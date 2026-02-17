# Auth Service API Testing - Gateway Mode (curl requests)

This document provides curl commands to test the Auth Service API through the API Gateway (port 8080).

## Prerequisites

1. Gateway must be running on port 8080
2. Auth Service must be running on port 8081 with gateway profile
3. MySQL database must be configured and accessible

## Base URL

```
Gateway: http://localhost:8080
Auth Service Direct: http://localhost:8081 (not used in gateway mode)
```

---

## 1. User Registration (Public)

Register a new customer account.

```bash
curl -X POST http://localhost:8080/api/auth/register ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"customer@example.com\",\"password\":\"password123\",\"firstName\":\"John\",\"lastName\":\"Doe\",\"phoneNumber\":\"+1234567890\"}"
```

**Expected Response:**
```json
{
  "id": 1,
  "email": "customer@example.com",
  "role": 1,
  "provider": 1,
  "profile": {
    "fullName": "John Doe",
    "phone": "+1234567890",
    "address": null
  }
}
```

**Note:** Role values: 1=CUSTOMER, 2=ADMIN, 3=KITCHEN/STAFF. Provider values: 1=LOCAL, 2=GOOGLE.

---

## 2. User Login (Public)

Login with registered credentials to get access and refresh tokens.

```bash
curl -X POST http://localhost:8080/api/auth/login ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"customer@example.com\",\"password\":\"password123\"}"
```

**Expected Response:**
```json
{
  "accessToken": "eyJhbGciOiJIUzUxMiJ9...",
  "refreshToken": "eyJhbGciOiJIUzUxMiJ9...",
  "tokenType": "Bearer",
  "accessTokenExpiresIn": 900000,
  "refreshTokenExpiresIn": 604800000,
  "user": {
    "id": 1,
    "email": "customer@example.com",
    "role": 1,
    "provider": 1,
    "profile": {
      "fullName": null,
      "phone": null,
      "address": null
    }
  }
}
```

**Save the tokens for next requests!**

---

## 3. Refresh Access Token (Public)

Generate a new access token using a valid refresh token.

```bash
curl -X POST http://localhost:8080/api/auth/refresh ^
  -H "Content-Type: application/json" ^
  -d "{\"refreshToken\":\"YOUR_REFRESH_TOKEN_HERE\"}"
```

**Expected Response:**
```json
{
  "accessToken": "eyJhbGciOiJIUzUxMiJ9...",
  "tokenType": "Bearer",
  "expiresIn": 900000
}
```

---

## 4. Get Current User Profile (Protected)

Retrieve the profile of the currently authenticated user.

```powershell
$headers = @{
    Authorization = "Bearer YOUR_ACCESS_TOKEN_HERE"
}

Invoke-RestMethod -Uri "http://localhost:8080/api/profile/me" -Method Get -Headers $headers
```

**Expected Response:**
```json
{
  "id": 1,
  "email": "customer@example.com",
  "fullName": null,
  "phone": null,
  "address": null,
  "additionalInfo": null,
  "createdAt": null,
  "updatedAt": null
}
```

---

## 5. Update Current User Profile (Protected)

Update the profile information of the authenticated user.

```bash
curl -X PUT http://localhost:8080/api/profile/me ^
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE" ^
  -H "Content-Type: application/json" ^
  -d "{\"address\":\"123 Main St\",\"city\":\"New York\",\"country\":\"USA\",\"postalCode\":\"10001\",\"dateOfBirth\":\"1990-01-15\",\"preferences\":\"No peanuts\"}"
```

**Expected Response:**
```json
{
  "id": 1,
  "userId": 1,
  "address": "123 Main St",
  "city": "New York",
  "country": "USA",
  "postalCode": "10001",
  "dateOfBirth": "1990-01-15",
  "preferences": "No peanuts"
}
```

---

## 6. Logout (Protected)

Logout the current user and invalidate the token.

```bash
curl -X POST http://localhost:8080/api/auth/logout ^
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE"
```

**Expected Response:**
```
Logged out successfully
```

---

## 7. Create Staff User (Admin Only)

Create a new staff member (requires ADMIN role).

```bash
curl -X POST http://localhost:8080/api/admin/staff ^
  -H "Authorization: Bearer ADMIN_ACCESS_TOKEN_HERE" ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"waiter@restaurant.com\",\"password\":\"password123\",\"firstName\":\"Jane\",\"lastName\":\"Smith\",\"phoneNumber\":\"+1234567891\",\"role\":\"WAITER\"}"
```

**Note:** Role can be: WAITER, CHEF, MANAGER, or ADMIN

**Expected Response:**
```json
{
  "id": 2,
  "email": "waiter@restaurant.com",
  "firstName": "Jane",
  "lastName": "Smith",
  "phoneNumber": "+1234567891",
  "role": "WAITER",
  "createdAt": "2026-02-16T10:35:00"
}
```

---

## 8. Get All Users (Admin Only)

Retrieve a list of all registered users.

```bash
curl -X GET http://localhost:8080/api/admin/users ^
  -H "Authorization: Bearer ADMIN_ACCESS_TOKEN_HERE"
```

**Expected Response:**
```json
[
  {
    "id": 1,
    "email": "customer@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "CUSTOMER",
    "createdAt": "2026-02-16T10:30:00"
  },
  {
    "id": 2,
    "email": "waiter@restaurant.com",
    "firstName": "Jane",
    "lastName": "Smith",
    "role": "WAITER",
    "createdAt": "2026-02-16T10:35:00"
  }
]
```

---

## Complete Test Flow

Here's a complete test sequence:

### Step 1: Register a new user
```bash
curl -X POST http://localhost:8080/api/auth/register ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"test@example.com\",\"password\":\"test123\",\"firstName\":\"Test\",\"lastName\":\"User\",\"phoneNumber\":\"+1234567890\"}"
```

### Step 2: Login and get tokens
```bash
curl -X POST http://localhost:8080/api/auth/login ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"test@example.com\",\"password\":\"test123\"}"
```

### Step 3: Get profile (use token from step 2)
```bash
curl -X GET http://localhost:8080/api/profile/me ^
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Step 4: Update profile
```bash
curl -X PUT http://localhost:8080/api/profile/me ^
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." ^
  -H "Content-Type: application/json" ^
  -d "{\"address\":\"456 Oak Ave\",\"city\":\"Boston\",\"country\":\"USA\",\"postalCode\":\"02101\"}"
```

### Step 5: Refresh token (when access token expires)
```bash
curl -X POST http://localhost:8080/api/auth/refresh ^
  -H "Content-Type: application/json" ^
  -d "{\"refreshToken\":\"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...\"}"
```

### Step 6: Logout
```bash
curl -X POST http://localhost:8080/api/auth/logout ^
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

## Admin User Testing

The auth service includes an admin seeder that creates a default admin user on startup.

### Login as Admin (default credentials)
```bash
curl -X POST http://localhost:8080/api/auth/login ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"admin@restaurant.com\",\"password\":\"admin123\"}"
```

### Create a staff member
```bash
curl -X POST http://localhost:8080/api/admin/staff ^
  -H "Authorization: Bearer ADMIN_TOKEN_HERE" ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"chef@restaurant.com\",\"password\":\"chef123\",\"firstName\":\"Gordon\",\"lastName\":\"Ramsay\",\"phoneNumber\":\"+1555123456\",\"role\":\"CHEF\"}"
```

### Get all users
```bash
curl -X GET http://localhost:8080/api/admin/users ^
  -H "Authorization: Bearer ADMIN_TOKEN_HERE"
```

---

## Error Responses

### 400 Bad Request (Validation Error)
```json
{
  "status": 400,
  "message": "Validation failed",
  "timestamp": "2026-02-16T10:30:00",
  "errors": [
    {
      "field": "email",
      "message": "must be a well-formed email address"
    }
  ]
}
```

### 401 Unauthorized (Invalid Credentials)
```json
{
  "status": 401,
  "message": "Invalid email or password",
  "timestamp": "2026-02-16T10:30:00"
}
```

### 409 Conflict (User Already Exists)
```json
{
  "status": 409,
  "message": "User with this email already exists",
  "timestamp": "2026-02-16T10:30:00"
}
```

---

## Notes for Windows PowerShell

If you're using PowerShell instead of CMD, use backticks (`) for line continuation instead of caret (^):

```powershell
curl -X POST http://localhost:8080/api/auth/login `
  -H "Content-Type: application/json" `
  -d "{\"email\":\"test@example.com\",\"password\":\"test123\"}"
```

Alternatively, you can use `Invoke-RestMethod`:

```powershell
$body = @{
    email = "test@example.com"
    password = "test123"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:8080/api/auth/login" -Method Post -Body $body -ContentType "application/json"
```

---

## Troubleshooting

### Gateway not routing requests
- Ensure gateway is running on port 8080
- Check gateway logs for routing configuration
- Verify auth-service is registered with gateway

### Token validation fails
- Ensure you're using the latest access token
- Check token hasn't expired (15 minutes default)
- Use refresh token to get a new access token

### CORS errors
- Should NOT occur when using gateway (gateway handles CORS)
- If you see CORS errors, ensure you're calling gateway (port 8080) not auth-service directly (port 8081)

### 401 on protected endpoints
- Ensure Authorization header is present
- Ensure Bearer token format: `Authorization: Bearer <token>`
- Check token is valid and not expired
- For admin endpoints, ensure logged-in user has ADMIN role

---

## Gateway Headers (Injected by Gateway)

When the gateway validates a JWT token, it injects these headers to downstream services:

- `X-User-Id`: The authenticated user's ID
- `X-Role`: The user's role (CUSTOMER, WAITER, CHEF, MANAGER, ADMIN)
- `X-Table-Id`: Table ID if present in JWT claims
- `X-Correlation-Id`: Request tracking ID

**Note:** You don't need to manually add these headers in curl requests. The gateway adds them automatically after validating your JWT token.

---

## Complete PowerShell Script Example

Here's a complete script that tests the entire flow:

```powershell
# Complete Auth Service Test Script

# 1. Register a new user
Write-Host "`n=== STEP 1: Register User ===" -ForegroundColor Cyan
$registerBody = @{
    email = "testuser@example.com"
    password = "test123"
    firstName = "Test"
    lastName = "User"
    phoneNumber = "+1234567890"
} | ConvertTo-Json

try {
    $registerResponse = Invoke-RestMethod -Uri "http://localhost:8080/api/auth/register" -Method Post -Body $registerBody -ContentType "application/json"
    Write-Host "User registered successfully!" -ForegroundColor Green
    $registerResponse | ConvertTo-Json
} catch {
    Write-Host "Registration failed: $($_.Exception.Message)" -ForegroundColor Yellow
}

# 2. Login
Write-Host "`n=== STEP 2: Login ===" -ForegroundColor Cyan
$loginBody = @{
    email = "testuser@example.com"
    password = "test123"
} | ConvertTo-Json

$loginResponse = Invoke-RestMethod -Uri "http://localhost:8080/api/auth/login" -Method Post -Body $loginBody -ContentType "application/json"
$accessToken = $loginResponse.accessToken
$refreshToken = $loginResponse.refreshToken

Write-Host "Login successful!" -ForegroundColor Green
Write-Host "Access Token: $accessToken"

# 3. Get Profile
Write-Host "`n=== STEP 3: Get Profile ===" -ForegroundColor Cyan
$headers = @{ Authorization = "Bearer $accessToken" }
$profile = Invoke-RestMethod -Uri "http://localhost:8080/api/profile/me" -Method Get -Headers $headers
Write-Host "Profile retrieved!" -ForegroundColor Green
$profile | ConvertTo-Json

# 4. Update Profile
Write-Host "`n=== STEP 4: Update Profile ===" -ForegroundColor Cyan
$updateBody = @{
    address = "123 Main St"
    city = "New York"
    country = "USA"
    postalCode = "10001"
} | ConvertTo-Json

$updatedProfile = Invoke-RestMethod -Uri "http://localhost:8080/api/profile/me" -Method Put -Headers $headers -Body $updateBody -ContentType "application/json"
Write-Host "Profile updated!" -ForegroundColor Green
$updatedProfile | ConvertTo-Json

# 5. Logout
Write-Host "`n=== STEP 5: Logout ===" -ForegroundColor Cyan
$logoutResponse = Invoke-RestMethod -Uri "http://localhost:8080/api/auth/logout" -Method Post -Headers $headers
Write-Host $logoutResponse -ForegroundColor Green

Write-Host "`n=== Test Complete! ===" -ForegroundColor Cyan
```

Save this as `test-auth-service.ps1` and run it with:
```powershell
.\test-auth-service.ps1
```

---

**Happy Testing! 🚀**

