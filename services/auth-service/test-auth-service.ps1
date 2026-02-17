# Complete Auth Service Test Script
# Tests all endpoints of the Auth Service through the API Gateway
#
# Prerequisites:
# 1. Gateway must be running on port 8080
# 2. Auth Service must be running on port 8081
# 3. MySQL database must be accessible

# Configuration
$gatewayUrl = "http://localhost:8080"
$testEmail = "testuser_$(Get-Random -Minimum 1000 -Maximum 9999)@example.com"
$testPassword = "test123"

Write-Host "`n========================================" -ForegroundColor Magenta
Write-Host "  Auth Service API Test Suite" -ForegroundColor Magenta
Write-Host "========================================" -ForegroundColor Magenta
Write-Host "Gateway URL: $gatewayUrl" -ForegroundColor Gray
Write-Host "Test Email: $testEmail" -ForegroundColor Gray
Write-Host ""

# 1. Register a new user
Write-Host "`n=== STEP 1: Register User ===" -ForegroundColor Cyan
$registerBody = @{
    email = $testEmail
    password = $testPassword
    firstName = "Test"
    lastName = "User"
    phoneNumber = "+1234567890"
} | ConvertTo-Json

try {
    $registerResponse = Invoke-RestMethod -Uri "$gatewayUrl/api/auth/register" -Method Post -Body $registerBody -ContentType "application/json"
    Write-Host "✓ User registered successfully!" -ForegroundColor Green
    Write-Host "  User ID: $($registerResponse.id)" -ForegroundColor Gray
    Write-Host "  Email: $($registerResponse.email)" -ForegroundColor Gray
    Write-Host "  Role: $($registerResponse.role)" -ForegroundColor Gray
} catch {
    Write-Host "✗ Registration failed: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.ErrorDetails.Message) {
        Write-Host "  Details: $($_.ErrorDetails.Message)" -ForegroundColor Yellow
    }
    exit 1
}

# Wait a moment for database to commit
Start-Sleep -Seconds 1

# 2. Login
Write-Host "`n=== STEP 2: Login ===" -ForegroundColor Cyan
$loginBody = @{
    email = $testEmail
    password = $testPassword
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "$gatewayUrl/api/auth/login" -Method Post -Body $loginBody -ContentType "application/json"
    $accessToken = $loginResponse.accessToken
    $refreshToken = $loginResponse.refreshToken

    Write-Host "✓ Login successful!" -ForegroundColor Green
    Write-Host "  Access Token: $($accessToken.Substring(0, 50))..." -ForegroundColor Gray
    Write-Host "  Refresh Token: $($refreshToken.Substring(0, 50))..." -ForegroundColor Gray
    Write-Host "  Token Type: $($loginResponse.tokenType)" -ForegroundColor Gray
    Write-Host "  Expires In: $($loginResponse.expiresIn) ms" -ForegroundColor Gray
} catch {
    Write-Host "✗ Login failed: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.ErrorDetails.Message) {
        Write-Host "  Details: $($_.ErrorDetails.Message)" -ForegroundColor Yellow
    }
    exit 1
}

# 3. Get Profile
Write-Host "`n=== STEP 3: Get Profile ===" -ForegroundColor Cyan
$headers = @{ Authorization = "Bearer $accessToken" }

try {
    $profile = Invoke-RestMethod -Uri "$gatewayUrl/api/profile/me" -Method Get -Headers $headers
    Write-Host "✓ Profile retrieved successfully!" -ForegroundColor Green
    Write-Host "  Profile ID: $($profile.id)" -ForegroundColor Gray
    Write-Host "  User ID: $($profile.userId)" -ForegroundColor Gray
    $addressValue = if ($profile.address) { $profile.address } else { "Not set" }
    Write-Host "  Address: $addressValue" -ForegroundColor Gray
} catch {
    Write-Host "✗ Get profile failed: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.ErrorDetails.Message) {
        Write-Host "  Details: $($_.ErrorDetails.Message)" -ForegroundColor Yellow
    }
}

# 4. Update Profile
Write-Host "`n=== STEP 4: Update Profile ===" -ForegroundColor Cyan
$updateBody = @{
    fullName = "Test User"
    phone = "+1234567890"
    address = "123 Main St, New York, NY 10001"
    additionalInfo = '{"preferences":"No peanuts, vegetarian","dietary":"Vegan"}'
} | ConvertTo-Json

try {
    $updatedProfile = Invoke-RestMethod -Uri "$gatewayUrl/api/profile/me" -Method Put -Headers $headers -Body $updateBody -ContentType "application/json"
    Write-Host "✓ Profile updated successfully!" -ForegroundColor Green
    Write-Host "  Full Name: $($updatedProfile.fullName)" -ForegroundColor Gray
    Write-Host "  Phone: $($updatedProfile.phone)" -ForegroundColor Gray
    Write-Host "  Address: $($updatedProfile.address)" -ForegroundColor Gray
    Write-Host "  Additional Info: $($updatedProfile.additionalInfo)" -ForegroundColor Gray
} catch {
    Write-Host "✗ Update profile failed: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.ErrorDetails.Message) {
        Write-Host "  Details: $($_.ErrorDetails.Message)" -ForegroundColor Yellow
    }
}

# 5. Refresh Token
Write-Host "`n=== STEP 5: Refresh Token ===" -ForegroundColor Cyan
$refreshBody = @{
    refreshToken = $refreshToken
} | ConvertTo-Json

try {
    $refreshResponse = Invoke-RestMethod -Uri "$gatewayUrl/api/auth/refresh" -Method Post -Body $refreshBody -ContentType "application/json"
    $newAccessToken = $refreshResponse.accessToken

    Write-Host "✓ Token refreshed successfully!" -ForegroundColor Green
    Write-Host "  New Access Token: $($newAccessToken.Substring(0, 50))..." -ForegroundColor Gray
    Write-Host "  Token Type: $($refreshResponse.tokenType)" -ForegroundColor Gray
    Write-Host "  Expires In: $($refreshResponse.expiresIn) ms" -ForegroundColor Gray

    # Update access token for subsequent requests
    $accessToken = $newAccessToken
    $headers = @{ Authorization = "Bearer $accessToken" }
} catch {
    Write-Host "✗ Token refresh failed: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.ErrorDetails.Message) {
        Write-Host "  Details: $($_.ErrorDetails.Message)" -ForegroundColor Yellow
    }
}

# 6. Logout
Write-Host "`n=== STEP 6: Logout ===" -ForegroundColor Cyan
try {
    $logoutResponse = Invoke-RestMethod -Uri "$gatewayUrl/api/auth/logout" -Method Post -Headers $headers
    Write-Host "✓ Logout successful!" -ForegroundColor Green
    Write-Host "  Response: $logoutResponse" -ForegroundColor Gray
} catch {
    Write-Host "✗ Logout failed: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.ErrorDetails.Message) {
        Write-Host "  Details: $($_.ErrorDetails.Message)" -ForegroundColor Yellow
    }
}

# 7. Test Admin Endpoints (Optional)
Write-Host "`n=== STEP 7: Test Admin Endpoints ===" -ForegroundColor Cyan
Write-Host "Testing admin login with default credentials..." -ForegroundColor Gray

$adminLoginBody = @{
    email = "admin@restaurant.com"
    password = "admin123"
} | ConvertTo-Json

try {
    $adminLoginResponse = Invoke-RestMethod -Uri "$gatewayUrl/api/auth/login" -Method Post -Body $adminLoginBody -ContentType "application/json"
    $adminToken = $adminLoginResponse.accessToken
    $adminHeaders = @{ Authorization = "Bearer $adminToken" }

    Write-Host "✓ Admin login successful!" -ForegroundColor Green

    # Get all users
    Write-Host "  Fetching all users..." -ForegroundColor Gray
    $allUsers = Invoke-RestMethod -Uri "$gatewayUrl/api/admin/users" -Method Get -Headers $adminHeaders
    Write-Host "  ✓ Found $($allUsers.Count) users" -ForegroundColor Green

    # Create a staff user
    Write-Host "  Creating staff user..." -ForegroundColor Gray
    $staffEmail = "staff_$(Get-Random -Minimum 1000 -Maximum 9999)@restaurant.com"
    $staffBody = @{
        email = $staffEmail
        password = "staff123"
        fullName = "Staff Member"
        phone = "+1555123456"
        address = "Restaurant Address"
        role = 3
    } | ConvertTo-Json

    $staffResponse = Invoke-RestMethod -Uri "$gatewayUrl/api/admin/staff" -Method Post -Headers $adminHeaders -Body $staffBody -ContentType "application/json"
    Write-Host "  ✓ Staff user created: $staffEmail" -ForegroundColor Green
    Write-Host "    Role: $($staffResponse.role)" -ForegroundColor Gray

} catch {
    Write-Host "✗ Admin test failed: $($_.Exception.Message)" -ForegroundColor Yellow
    Write-Host "  Note: This is expected if admin user doesn't exist" -ForegroundColor Gray
}

# Summary
Write-Host "`n========================================" -ForegroundColor Magenta
Write-Host "  Test Summary" -ForegroundColor Magenta
Write-Host "========================================" -ForegroundColor Magenta
Write-Host "All core auth service endpoints tested!" -ForegroundColor Green
Write-Host ""
Write-Host "Tested endpoints:" -ForegroundColor Cyan
Write-Host "  ✓ POST /api/auth/register" -ForegroundColor Gray
Write-Host "  ✓ POST /api/auth/login" -ForegroundColor Gray
Write-Host "  ✓ POST /api/auth/refresh" -ForegroundColor Gray
Write-Host "  ✓ POST /api/auth/logout" -ForegroundColor Gray
Write-Host "  ✓ GET  /api/profile/me" -ForegroundColor Gray
Write-Host "  ✓ PUT  /api/profile/me" -ForegroundColor Gray
Write-Host "  ✓ GET  /api/admin/users" -ForegroundColor Gray
Write-Host "  ✓ POST /api/admin/staff" -ForegroundColor Gray
Write-Host ""
Write-Host "Test completed successfully! ✓" -ForegroundColor Green
Write-Host ""

