# Auth Service API - Quick Reference

## Base URL
```
Gateway: http://localhost:8080
```

## Role Values
- `1` = CUSTOMER
- `2` = ADMIN  
- `3` = KITCHEN/STAFF
- `4` = WAITER (if applicable)

## Provider Values
- `1` = LOCAL (email/password)
- `2` = GOOGLE (OAuth)

---

## 1. Register User (Public)

**Endpoint:** `POST /api/auth/register`

```powershell
$body = @{
    email = "user@example.com"
    password = "password123"
    fullName = "John Doe"
    phone = "+1234567890"
    address = "123 Main St"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:8080/api/auth/register" -Method Post -Body $body -ContentType "application/json"
```

**Response:**
```json
{
  "id": 1,
  "email": "user@example.com",
  "role": 1,
  "provider": 1,
  "profile": {
    "fullName": "John Doe",
    "phone": "+1234567890",
    "address": "123 Main St"
  }
}
```

---

## 2. Login (Public)

**Endpoint:** `POST /api/auth/login`

```powershell
$body = @{
    email = "user@example.com"
    password = "password123"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://localhost:8080/api/auth/login" -Method Post -Body $body -ContentType "application/json"
$accessToken = $response.accessToken
$refreshToken = $response.refreshToken
```

**Response:**
```json
{
  "accessToken": "eyJhbGciOiJIUzUxMiJ9...",
  "refreshToken": "eyJhbGciOiJIUzUxMiJ9...",
  "tokenType": "Bearer",
  "accessTokenExpiresIn": 900000,
  "refreshTokenExpiresIn": 604800000,
  "user": {
    "id": 1,
    "email": "user@example.com",
    "role": 1,
    "provider": 1,
    "profile": {...}
  }
}
```

---

## 3. Refresh Token (Public)

**Endpoint:** `POST /api/auth/refresh`

```powershell
$body = @{
    refreshToken = $refreshToken
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://localhost:8080/api/auth/refresh" -Method Post -Body $body -ContentType "application/json"
$newAccessToken = $response.accessToken
```

**Response:**
```json
{
  "accessToken": "eyJhbGciOiJIUzUxMiJ9...",
  "tokenType": "Bearer",
  "expiresIn": 900000
}
```

---

## 4. Get Profile (Protected)

**Endpoint:** `GET /api/profile/me`

```powershell
$headers = @{ Authorization = "Bearer $accessToken" }
Invoke-RestMethod -Uri "http://localhost:8080/api/profile/me" -Method Get -Headers $headers
```

**Response:**
```json
{
  "id": 1,
  "email": "user@example.com",
  "fullName": "John Doe",
  "phone": "+1234567890",
  "address": "123 Main St",
  "additionalInfo": null,
  "createdAt": "2026-02-16T10:00:00",
  "updatedAt": "2026-02-16T10:00:00"
}
```

---

## 5. Update Profile (Protected)

**Endpoint:** `PUT /api/profile/me`

```powershell
$headers = @{ Authorization = "Bearer $accessToken" }

$body = @{
    fullName = "John Doe Updated"
    phone = "+1987654321"
    address = "456 Oak Ave, Boston, MA"
    additionalInfo = '{"preferences":"Vegetarian","allergies":"Peanuts"}'
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:8080/api/profile/me" -Method Put -Headers $headers -Body $body -ContentType "application/json"
```

**Response:**
```json
{
  "id": 1,
  "email": "user@example.com",
  "fullName": "John Doe Updated",
  "phone": "+1987654321",
  "address": "456 Oak Ave, Boston, MA",
  "additionalInfo": "{\"preferences\":\"Vegetarian\",\"allergies\":\"Peanuts\"}",
  "createdAt": "2026-02-16T10:00:00",
  "updatedAt": "2026-02-16T11:00:00"
}
```

---

## 6. Logout (Protected)

**Endpoint:** `POST /api/auth/logout`

```powershell
$headers = @{ Authorization = "Bearer $accessToken" }
Invoke-RestMethod -Uri "http://localhost:8080/api/auth/logout" -Method Post -Headers $headers
```

**Response:**
```
"Logged out successfully"
```

---

## 7. Get All Users (Admin Only)

**Endpoint:** `GET /api/admin/users`

```powershell
$headers = @{ Authorization = "Bearer $adminAccessToken" }
Invoke-RestMethod -Uri "http://localhost:8080/api/admin/users" -Method Get -Headers $headers
```

**Response:**
```json
[
  {
    "id": 1,
    "email": "user@example.com",
    "role": 1,
    "provider": 1,
    "profile": {...}
  },
  {
    "id": 2,
    "email": "staff@restaurant.com",
    "role": 3,
    "provider": 1,
    "profile": {...}
  }
]
```

---

## 8. Create Staff User (Admin Only)

**Endpoint:** `POST /api/admin/staff`

```powershell
$headers = @{ Authorization = "Bearer $adminAccessToken" }

$body = @{
    email = "staff@restaurant.com"
    password = "password123"
    fullName = "Staff Member"
    phone = "+1555123456"
    address = "Restaurant Address"
    role = 3
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:8080/api/admin/staff" -Method Post -Headers $headers -Body $body -ContentType "application/json"
```

**Response:**
```json
{
  "id": 2,
  "email": "staff@restaurant.com",
  "role": 3,
  "provider": 1,
  "profile": {
    "fullName": "Staff Member",
    "phone": "+1555123456",
    "address": "Restaurant Address"
  }
}
```

---

## Default Admin Credentials

```powershell
# Login as admin
$body = @{
    email = "admin@restaurant.com"
    password = "admin123"
} | ConvertTo-Json

$adminResponse = Invoke-RestMethod -Uri "http://localhost:8080/api/auth/login" -Method Post -Body $body -ContentType "application/json"
$adminAccessToken = $adminResponse.accessToken
```

---

## Common Error Responses

### 400 Bad Request
```json
{
  "status": 400,
  "message": "Validation failed",
  "timestamp": "2026-02-16T10:00:00"
}
```

### 401 Unauthorized
```json
{
  "status": 401,
  "message": "Invalid email or password",
  "timestamp": "2026-02-16T10:00:00"
}
```

### 409 Conflict
```json
{
  "status": 409,
  "message": "Email already in use",
  "timestamp": "2026-02-16T10:00:00"
}
```

### 500 Internal Server Error
```json
{
  "status": 500,
  "error": "Internal Server Error",
  "message": "An unexpected error occurred",
  "path": "/api/profile/me",
  "timestamp": "2026-02-16T10:00:00"
}
```

---

## Tips

### Store Tokens
```powershell
# After login, store tokens
$loginResponse = Invoke-RestMethod -Uri "http://localhost:8080/api/auth/login" -Method Post -Body $loginBody -ContentType "application/json"
$accessToken = $loginResponse.accessToken
$refreshToken = $loginResponse.refreshToken

# Use in subsequent requests
$headers = @{ Authorization = "Bearer $accessToken" }
```

### Error Handling
```powershell
try {
    $response = Invoke-RestMethod -Uri "http://localhost:8080/api/auth/login" -Method Post -Body $body -ContentType "application/json"
    Write-Host "Success!" -ForegroundColor Green
} catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.ErrorDetails.Message) {
        Write-Host "Details: $($_.ErrorDetails.Message)" -ForegroundColor Yellow
    }
}
```

### Pretty Print JSON
```powershell
$response | ConvertTo-Json -Depth 10
```

---

**Last Updated:** February 16, 2026

