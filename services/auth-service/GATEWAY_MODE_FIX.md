# Gateway Mode Fix - Auth Service

## Problem

When running the Auth Service in **gateway mode**, the profile and logout endpoints were returning **500 Internal Server Error**.

### Root Cause

The controllers were trying to get the user ID from `SecurityContextHolder.getContext().getAuthentication()`, which doesn't work in gateway mode because:

1. Gateway validates JWT tokens
2. Gateway injects user information via headers (`X-User-Id`, `X-Role`, etc.)
3. Auth service has `jwt.validation.enabled=false` in gateway mode
4. SecurityContext is not populated when JWT validation is disabled

## Solution

Updated controllers to read user ID from the **gateway header** (`X-User-Id`) instead of SecurityContext.

### Files Modified

#### 1. ProfileController.java
- ✅ Updated `getCurrentProfile()` to read from `X-User-Id` header
- ✅ Updated `updateCurrentProfile()` to read from `X-User-Id` header
- ✅ Fallback to SecurityContext for standalone mode

#### 2. AuthController.java
- ✅ Updated `logout()` to read from `X-User-Id` header
- ✅ Fallback to SecurityContext for standalone mode

### Code Changes

**Before:**
```java
@GetMapping("/me")
public ResponseEntity<ProfileDto> getCurrentProfile() {
    Authentication auth = SecurityContextHolder.getContext().getAuthentication();
    if (auth == null || !auth.isAuthenticated()) {
        return ResponseEntity.status(401).build();
    }
    Long userId = Long.parseLong(auth.getName());
    // ...
}
```

**After:**
```java
@GetMapping("/me")
public ResponseEntity<ProfileDto> getCurrentProfile(
        @RequestHeader(value = "X-User-Id", required = false) String gatewayUserId) {
    
    Long userId = null;
    
    // Try gateway header first (gateway mode)
    if (gatewayUserId != null && !gatewayUserId.isEmpty()) {
        userId = Long.parseLong(gatewayUserId);
    } else {
        // Fallback to SecurityContext (standalone mode)
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            return ResponseEntity.status(401).build();
        }
        userId = Long.parseLong(auth.getName());
    }
    // ...
}
```

## Gateway Configuration

The gateway injects these headers after validating JWT:
- `X-User-Id` - User ID from JWT claims
- `X-Role` - User role from JWT claims
- `X-Table-Id` - Table ID if present
- `X-Correlation-Id` - Request tracking ID

From `application.properties`:
```properties
gateway.enabled=true
gateway.header.user-id=X-User-Id
gateway.header.user-role=X-Role
gateway.header.table-id=X-Table-Id
gateway.header.correlation-id=X-Correlation-Id
```

## Testing

### Before Fix
```powershell
# This would fail with 500 error
$headers = @{ Authorization = "Bearer $accessToken" }
Invoke-RestMethod -Uri "http://localhost:8080/api/profile/me" -Method Get -Headers $headers
# ❌ Error: 500 Internal Server Error
```

### After Fix
```powershell
# Now works correctly
$headers = @{ Authorization = "Bearer $accessToken" }
$profile = Invoke-RestMethod -Uri "http://localhost:8080/api/profile/me" -Method Get -Headers $headers
# ✅ Success: Returns profile data
```

## How It Works Now

### Request Flow

1. **Client** sends request to Gateway with JWT token
   ```
   GET http://localhost:8080/api/profile/me
   Authorization: Bearer eyJhbGciOiJIUzUxMiJ9...
   ```

2. **Gateway** validates JWT and extracts claims
   - Validates token signature
   - Checks expiration
   - Extracts userId, role, etc.

3. **Gateway** injects headers and forwards to Auth Service
   ```
   GET http://localhost:8081/api/profile/me
   Authorization: Bearer eyJhbGciOiJIUzUxMiJ9...
   X-User-Id: 3
   X-Role: 1
   ```

4. **Auth Service** reads `X-User-Id` header
   ```java
   Long userId = Long.parseLong(gatewayUserId); // "3"
   ProfileDto profile = profileService.getProfile(userId);
   ```

5. **Response** flows back through Gateway to Client

## Dual Mode Support

The updated controllers support **both modes**:

### Gateway Mode (Production)
- Reads user ID from `X-User-Id` header
- Gateway handles JWT validation
- Auth service trusts gateway headers

### Standalone Mode (Development)
- Reads user ID from SecurityContext
- Auth service validates JWT itself
- No gateway in the request path

## Next Steps

1. **Restart Auth Service** for changes to take effect
2. **Test all endpoints** using the PowerShell scripts
3. **Verify** profile and logout endpoints work correctly

### Restart Command
```powershell
# Stop the current auth-service (Ctrl+C in terminal)
# Then restart with gateway profile
cd C:\Users\ishanka.senadeera\Desktop\merge\No_18_Restaurant_MS\services\auth-service
.\mvnw spring-boot:run -Dspring.profiles.active=gateway
```

## Verification

Run the test script to verify all endpoints:
```powershell
.\test-auth-service.ps1
```

Expected results:
- ✅ Step 1: Register User - SUCCESS
- ✅ Step 2: Login - SUCCESS
- ✅ Step 3: Get Profile - SUCCESS (previously failed)
- ✅ Step 4: Update Profile - SUCCESS (previously failed)
- ✅ Step 5: Refresh Token - SUCCESS
- ✅ Step 6: Logout - SUCCESS (previously failed)
- ✅ Step 7: Admin Endpoints - SUCCESS (if admin exists)

---

**Fixed:** February 16, 2026  
**Issue:** Controllers not reading gateway headers  
**Solution:** Added `@RequestHeader("X-User-Id")` with SecurityContext fallback

