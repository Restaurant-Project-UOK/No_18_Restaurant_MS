# Auth Service API Testing Guide

Complete PowerShell-based testing documentation for the Auth Service API through the API Gateway.

## 📁 Files Overview

| File | Description | Use Case |
|------|-------------|----------|
| **test-auth-service.ps1** | Automated test script | Run complete test suite automatically |
| **simple-examples.ps1** | Individual endpoint examples | Copy-paste for quick manual testing |
| **API_QUICK_REFERENCE.md** | Concise API reference | Quick lookup for endpoint details |
| **CURL_TESTS_GATEWAY.md** | Comprehensive guide | Full documentation with examples |
| **TESTING_SUMMARY.md** | Summary of all changes | Overview of what was created |

---

## 🚀 Quick Start

### Option 1: Run Automated Test Suite
```powershell
# Navigate to the auth-service directory
cd C:\Users\ishanka.senadeera\Desktop\merge\No_18_Restaurant_MS\services\auth-service

# Run the complete test script
.\test-auth-service.ps1
```

This will automatically:
- ✅ Register a new test user
- ✅ Login and obtain tokens
- ✅ Test profile operations
- ✅ Test token refresh
- ✅ Test logout
- ✅ Test admin endpoints (if admin exists)

### Option 2: Run Individual Examples
```powershell
# Open simple-examples.ps1 and copy-paste individual sections
# Each section is clearly labeled and self-contained
```

### Option 3: Manual Testing
Refer to `API_QUICK_REFERENCE.md` for copy-paste ready commands.

---

## 📋 Prerequisites

Before running tests, ensure:

1. ✅ **Gateway is running** on port 8080
2. ✅ **Auth Service is running** on port 8081 with gateway profile
3. ✅ **MySQL database** is accessible and configured
4. ✅ **Redis** is running (if using token blacklist feature)

### Start Services

```powershell
# Terminal 1: Start Gateway
cd C:\Users\ishanka.senadeera\Desktop\merge\No_18_Restaurant_MS\gateway
.\mvnw spring-boot:run

# Terminal 2: Start Auth Service (gateway mode)
cd C:\Users\ishanka.senadeera\Desktop\merge\No_18_Restaurant_MS\services\auth-service
.\mvnw spring-boot:run -Dspring.profiles.active=gateway
```

---

## 🎯 API Endpoints

### Public Endpoints (No Auth Required)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login and get JWT tokens |
| POST | `/api/auth/refresh` | Refresh access token |

### Protected Endpoints (Requires JWT)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/profile/me` | Get current user profile |
| PUT | `/api/profile/me` | Update current user profile |
| POST | `/api/auth/logout` | Logout and invalidate token |

### Admin Endpoints (Requires ADMIN Role)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/users` | Get all registered users |
| POST | `/api/admin/staff` | Create staff user |

---

## 🔑 Default Admin Credentials

```powershell
Email: admin@restaurant.com
Password: admin123
```

**Note:** Admin user is auto-created by AdminSeeder on application startup.

---

## 💡 Usage Examples

### Basic Flow

```powershell
# 1. Register
$registerBody = @{
    email = "user@example.com"
    password = "password123"
    fullName = "John Doe"
    phone = "+1234567890"
    address = "123 Main St"
} | ConvertTo-Json

$user = Invoke-RestMethod -Uri "http://localhost:8080/api/auth/register" -Method Post -Body $registerBody -ContentType "application/json"

# 2. Login
$loginBody = @{
    email = "user@example.com"
    password = "password123"
} | ConvertTo-Json

$loginResponse = Invoke-RestMethod -Uri "http://localhost:8080/api/auth/login" -Method Post -Body $loginBody -ContentType "application/json"
$accessToken = $loginResponse.accessToken

# 3. Get Profile
$headers = @{ Authorization = "Bearer $accessToken" }
$profile = Invoke-RestMethod -Uri "http://localhost:8080/api/profile/me" -Method Get -Headers $headers
```

---

## 🎨 Response Formats

### User Object
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

### Login Response
```json
{
  "accessToken": "eyJhbGciOiJIUzUxMiJ9...",
  "refreshToken": "eyJhbGciOiJIUzUxMiJ9...",
  "tokenType": "Bearer",
  "accessTokenExpiresIn": 900000,
  "refreshTokenExpiresIn": 604800000,
  "user": { ... }
}
```

---

## 📊 Role & Provider Values

### Roles (Integer)
- `1` = CUSTOMER (default)
- `2` = ADMIN
- `3` = KITCHEN/STAFF

### Providers (Integer)
- `1` = LOCAL (email/password)
- `2` = GOOGLE (OAuth)

---

## 🔧 Troubleshooting

### Common Issues

#### Gateway Connection Refused
```
Error: Unable to connect to the remote server
```
**Solution:** Ensure Gateway is running on port 8080

#### Auth Service Not Responding
```
Error: The remote server returned an error: (502) Bad Gateway
```
**Solution:** Ensure Auth Service is running on port 8081

#### 500 Internal Server Error
**Possible Causes:**
- Database connection issues
- Redis not running (for token blacklist)
- Missing admin user in database

**Solution:** Check application logs for detailed error messages

#### Token Expired
```
Error: (401) Unauthorized
```
**Solution:** Use refresh token to get a new access token

---

## 📖 Additional Documentation

- **CURL_TESTS_GATEWAY.md** - Full PowerShell examples with detailed explanations
- **API_QUICK_REFERENCE.md** - Quick reference for all endpoints
- **GATEWAY_DECISION.md** - Architecture and gateway integration guide
- **TESTING_SUMMARY.md** - Summary of all testing files and fixes

---

## 🎓 PowerShell Tips

### Store Tokens for Reuse
```powershell
# After login
$global:accessToken = $loginResponse.accessToken
$global:refreshToken = $loginResponse.refreshToken

# Use in subsequent requests
$headers = @{ Authorization = "Bearer $global:accessToken" }
```

### Error Handling
```powershell
try {
    $response = Invoke-RestMethod -Uri "..." -Method Post -Body $body -ContentType "application/json"
} catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.ErrorDetails.Message) {
        $_.ErrorDetails.Message | ConvertFrom-Json | ConvertTo-Json -Depth 5
    }
}
```

### Pretty Print Responses
```powershell
$response | ConvertTo-Json -Depth 10
```

---

## 📝 Notes

- All commands use PowerShell 5.1+ compatible syntax
- Gateway must be running before testing
- Auth Service must be in gateway mode for proper integration
- Token expiration: Access Token = 15 min, Refresh Token = 7 days
- Admin endpoints require role = 2 (ADMIN)

---

## 🎯 Testing Checklist

- [ ] Gateway running on port 8080
- [ ] Auth Service running on port 8081
- [ ] MySQL database accessible
- [ ] Redis running (if applicable)
- [ ] Can register new user
- [ ] Can login and receive tokens
- [ ] Can refresh access token
- [ ] Can get profile with valid token
- [ ] Can update profile
- [ ] Can logout
- [ ] Admin can login
- [ ] Admin can create staff
- [ ] Admin can view all users

---

**Last Updated:** February 16, 2026  
**PowerShell Version:** 5.1+  
**Base URL:** http://localhost:8080

