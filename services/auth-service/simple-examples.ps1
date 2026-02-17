# Simple Auth Service Test Examples
# Copy and paste these into PowerShell to test individual endpoints

# ============================================
# 1. REGISTER A NEW USER
# ============================================
$registerBody = @{
    email = "newuser@example.com"
    password = "password123"
    fullName = "New User"
    phone = "+1234567890"
    address = "123 Test St"
} | ConvertTo-Json

$registerResponse = Invoke-RestMethod -Uri "http://localhost:8080/api/auth/register" -Method Post -Body $registerBody -ContentType "application/json"
$registerResponse | ConvertTo-Json

# ============================================
# 2. LOGIN
# ============================================
$loginBody = @{
    email = "newuser@example.com"
    password = "password123"
} | ConvertTo-Json

$loginResponse = Invoke-RestMethod -Uri "http://localhost:8080/api/auth/login" -Method Post -Body $loginBody -ContentType "application/json"
$accessToken = $loginResponse.accessToken
$refreshToken = $loginResponse.refreshToken

Write-Host "Access Token: $accessToken" -ForegroundColor Green
Write-Host "Refresh Token: $refreshToken" -ForegroundColor Cyan

# ============================================
# 3. GET PROFILE
# ============================================
$headers = @{ Authorization = "Bearer $accessToken" }
$profile = Invoke-RestMethod -Uri "http://localhost:8080/api/profile/me" -Method Get -Headers $headers
$profile | ConvertTo-Json

# ============================================
# 4. UPDATE PROFILE
# ============================================
$updateBody = @{
    fullName = "Updated Name"
    phone = "+1987654321"
    address = "456 New Address"
    additionalInfo = '{"preferences":"Vegetarian"}'
} | ConvertTo-Json

$updatedProfile = Invoke-RestMethod -Uri "http://localhost:8080/api/profile/me" -Method Put -Headers $headers -Body $updateBody -ContentType "application/json"
$updatedProfile | ConvertTo-Json

# ============================================
# 5. REFRESH TOKEN
# ============================================
$refreshBody = @{
    refreshToken = $refreshToken
} | ConvertTo-Json

$refreshResponse = Invoke-RestMethod -Uri "http://localhost:8080/api/auth/refresh" -Method Post -Body $refreshBody -ContentType "application/json"
$newAccessToken = $refreshResponse.accessToken
Write-Host "New Access Token: $newAccessToken" -ForegroundColor Green

# ============================================
# 6. LOGOUT
# ============================================
$headers = @{ Authorization = "Bearer $accessToken" }
$logoutResponse = Invoke-RestMethod -Uri "http://localhost:8080/api/auth/logout" -Method Post -Headers $headers
Write-Host $logoutResponse -ForegroundColor Yellow

# ============================================
# 7. ADMIN LOGIN (Default Credentials)
# ============================================
$adminLoginBody = @{
    email = "admin@restaurant.com"
    password = "admin123"
} | ConvertTo-Json

$adminResponse = Invoke-RestMethod -Uri "http://localhost:8080/api/auth/login" -Method Post -Body $adminLoginBody -ContentType "application/json"
$adminToken = $adminResponse.accessToken
Write-Host "Admin Token: $adminToken" -ForegroundColor Magenta

# ============================================
# 8. GET ALL USERS (Admin Only)
# ============================================
$adminHeaders = @{ Authorization = "Bearer $adminToken" }
$allUsers = Invoke-RestMethod -Uri "http://localhost:8080/api/admin/users" -Method Get -Headers $adminHeaders
$allUsers | ConvertTo-Json -Depth 5

# ============================================
# 9. CREATE STAFF USER (Admin Only)
# ============================================
$staffBody = @{
    email = "newstaff@restaurant.com"
    password = "staff123"
    fullName = "New Staff Member"
    phone = "+1555999888"
    address = "Restaurant HQ"
    role = 3
} | ConvertTo-Json

$staffResponse = Invoke-RestMethod -Uri "http://localhost:8080/api/admin/staff" -Method Post -Headers $adminHeaders -Body $staffBody -ContentType "application/json"
$staffResponse | ConvertTo-Json

