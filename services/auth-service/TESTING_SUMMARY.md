# Auth Service API Testing - Summary

## 📋 Files Created

### 1. **CURL_TESTS_GATEWAY.md**
Complete PowerShell reference for testing Auth Service API through the Gateway.
- All 8 endpoints with PowerShell `Invoke-RestMethod` examples
- Expected request/response formats
- Complete test flow with token management
- PowerShell-specific tips and error handling
- Admin endpoint testing examples

### 2. **test-auth-service.ps1**
Automated PowerShell test script that tests all Auth Service endpoints.
- ✅ Automatically generates unique test emails
- ✅ Tests all public endpoints (register, login, refresh)
- ✅ Tests all protected endpoints (profile get/update, logout)
- ✅ Tests admin endpoints (create staff, get all users)
- ✅ Colored console output for easy reading
- ✅ Error handling with detailed messages
- ✅ Compatible with PowerShell 5.1

### 3. **API_QUICK_REFERENCE.md**
Quick reference guide with concise examples for each endpoint.
- Copy-paste ready PowerShell commands
- Actual request/response structures
- Role and provider value mappings
- Default admin credentials
- Common error responses
- Useful PowerShell tips

---

## 🎯 Endpoints Covered

### Public Endpoints (No Authentication Required)
1. ✅ `POST /api/auth/register` - Register new user
2. ✅ `POST /api/auth/login` - Login and get JWT tokens
3. ✅ `POST /api/auth/refresh` - Refresh access token

### Protected Endpoints (Requires JWT Token)
4. ✅ `GET /api/profile/me` - Get current user profile
5. ✅ `PUT /api/profile/me` - Update current user profile
6. ✅ `POST /api/auth/logout` - Logout and invalidate token

### Admin Endpoints (Requires ADMIN Role)
7. ✅ `GET /api/admin/users` - Get all users
8. ✅ `POST /api/admin/staff` - Create staff user

---

## 🔧 Correct DTO Structures

### RegisterRequestDto
```json
{
  "email": "user@example.com",
  "password": "password123",
  "fullName": "John Doe",
  "phone": "+1234567890",
  "address": "123 Main St",
  "role": 1,
  "provider": 1
}
```

### LoginRequestDto
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

### ProfileDto (for update)
```json
{
  "fullName": "John Doe",
  "phone": "+1234567890",
  "address": "123 Main St, New York, NY 10001",
  "additionalInfo": "{\"preferences\":\"Vegetarian\"}"
}
```

### CreateStaffRequestDto
```json
{
  "email": "staff@restaurant.com",
  "password": "password123",
  "fullName": "Staff Member",
  "phone": "+1555123456",
  "address": "Restaurant Address",
  "role": 3
}
```

---

## 📊 Token Structure

### Login Response
```json
{
  "accessToken": "eyJhbGciOiJIUzUxMiJ9...",
  "refreshToken": "eyJhbGciOiJIUzUxMiJ9...",
  "tokenType": "Bearer",
  "accessTokenExpiresIn": 900000,      // 15 minutes
  "refreshTokenExpiresIn": 604800000,  // 7 days
  "user": { ... }
}
```

### Refresh Response
```json
{
  "accessToken": "eyJhbGciOiJIUzUxMiJ9...",
  "tokenType": "Bearer",
  "expiresIn": 900000
}
```

---

## 🎨 Role & Provider Mappings

### Roles (Integer)
- `1` = CUSTOMER (default for registration)
- `2` = ADMIN
- `3` = KITCHEN/STAFF
- `4` = WAITER (if applicable)

### Providers (Integer)
- `1` = LOCAL (email/password authentication)
- `2` = GOOGLE (OAuth authentication)

---

## ✅ Fixes Applied

### PowerShell Script Fixes
1. ✅ Fixed null-coalescing operator (`??`) incompatible with PowerShell 5.1
2. ✅ Updated registration fields: `firstName`, `lastName`, `phoneNumber` → `fullName`, `phone`, `address`
3. ✅ Fixed login response field: `expiresIn` → `accessTokenExpiresIn`
4. ✅ Removed non-existent `userId` field from profile display
5. ✅ Updated staff creation to use correct DTO fields
6. ✅ Changed role from string `"WAITER"` to numeric `3`

### Documentation Fixes
1. ✅ Updated all expected responses to match actual API structure
2. ✅ Changed JWT algorithm display from HS256 to HS512
3. ✅ Updated profile structure to show actual ProfileDto fields
4. ✅ Added role and provider value explanations

---

## 🚀 How to Use

### Quick Test
```powershell
# Navigate to auth-service directory
cd C:\Users\ishanka.senadeera\Desktop\merge\No_18_Restaurant_MS\services\auth-service

# Run the automated test script
.\test-auth-service.ps1
```

### Individual Endpoint Test
```powershell
# Register a user
$body = @{
    email = "test@example.com"
    password = "test123"
    fullName = "Test User"
    phone = "+1234567890"
    address = "Test Address"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:8080/api/auth/register" -Method Post -Body $body -ContentType "application/json"
```

### Admin Testing
```powershell
# Login as admin (default credentials)
$adminBody = @{
    email = "admin@restaurant.com"
    password = "admin123"
} | ConvertTo-Json

$adminResponse = Invoke-RestMethod -Uri "http://localhost:8080/api/auth/login" -Method Post -Body $adminBody -ContentType "application/json"
$adminToken = $adminResponse.accessToken

# Use admin token for admin endpoints
$headers = @{ Authorization = "Bearer $adminToken" }
Invoke-RestMethod -Uri "http://localhost:8080/api/admin/users" -Method Get -Headers $headers
```

---

## 📝 Known Issues (From Testing)

### Issues Encountered
1. ⚠️ Profile update returned 500 error (during manual test)
2. ⚠️ Logout returned 500 error (during manual test)
3. ⚠️ Admin login returned 500 error (during manual test)

### Possible Causes
- Database connection issues
- Missing Redis configuration for token blacklist
- Admin user not seeded in database
- JWT validation errors in backend

### Recommendations
1. Check auth-service logs for detailed error messages
2. Verify MySQL database is accessible
3. Verify Redis is running (if used for token blacklist)
4. Check if AdminSeeder ran successfully on startup
5. Verify gateway is properly routing requests

---

## 📚 Documentation Files

| File | Purpose |
|------|---------|
| `CURL_TESTS_GATEWAY.md` | Comprehensive PowerShell examples with full test flow |
| `test-auth-service.ps1` | Automated test script for all endpoints |
| `API_QUICK_REFERENCE.md` | Quick copy-paste reference for common operations |
| `GATEWAY_DECISION.md` | Gateway integration architecture guide |

---

## 🎯 Next Steps

1. ✅ Run `test-auth-service.ps1` to verify all endpoints
2. ✅ Check backend logs if any 500 errors occur
3. ✅ Verify database schema matches entity definitions
4. ✅ Confirm Redis is configured if using token blacklist
5. ✅ Test with Postman or other API clients if needed

---

**Created:** February 16, 2026  
**PowerShell Version:** Compatible with PowerShell 5.1+  
**Gateway URL:** http://localhost:8080  
**Auth Service URL:** http://localhost:8081

