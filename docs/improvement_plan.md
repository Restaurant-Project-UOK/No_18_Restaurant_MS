# Improvement Plan
## Restaurant Management System - Ishanka's Workload

**Owner:** Ishanka Senadeera  
**Created:** February 14, 2026  
**Last Updated:** February 14, 2026  
**Focus:** Auth Service, Gateway, Frontend, CI/CD  
**Status:** All Sprints Complete ✅

---

## Table of Contents

1. [Files to Remove](#1-files-to-remove)
2. [Unused Imports & Code to Clean](#2-unused-imports--code-to-clean)
3. [Critical Compile Errors to Fix](#3-critical-compile-errors-to-fix)
4. [Gateway Fixes](#4-gateway-fixes)
5. [Implementation Tasks](#5-implementation-tasks)
6. [Execution Order](#6-execution-order)

---

## 1. Files to Remove

### 1.1 Placeholder Files ✅ DELETED

These files have been deleted:

| File | Status |
|------|--------|
| `infra/clickhouse/delete_this.txt` | ✅ Deleted |
| `infra/redis/delete_this.txt` | ✅ Deleted |
| `infra/kafka/delete_this.txt` | ✅ Deleted |
| `infra/mysql/delete_this.txt` | ✅ Deleted |
| `infra/mongodb/delete_this.txt` | ✅ Deleted |
| `services/kds-service/delete_this.txt` | ✅ Deleted |
| `services/analytics-service/delete_this.txt` | ✅ Deleted |

**Command to delete all:**
```powershell
Get-ChildItem -Path . -Recurse -Filter "delete_this.txt" | Remove-Item -Force
```

---

### 1.2 Temporary/Generated Files ✅ DELETED

| File | Status |
|------|--------|
| `frontend/tmpclaude-23a4-cwd` | ✅ Deleted |

**Command:**
```powershell
Remove-Item "frontend/tmpclaude-23a4-cwd" -Force
```

---

### 1.3 Markdown Files to Review/Consolidate

**My Services - Keep:**
| File | Status | Notes |
|------|--------|-------|
| `CLAUDE.md` | ✅ KEEP | Project documentation for AI assistants |
| `docs/my_prd.md` | ✅ KEEP | My personal development plan |
| `docs/stories.md` | ✅ KEEP | User stories documentation |
| `docs/prd.md` | ✅ KEEP | Main PRD |

**Gateway - Review:**
| File | Status | Notes |
|------|--------|-------|
| `gateway/QUICK_START.md` | ⚠️ OUTDATED | Contains old paths (`D:\MYW\...`), needs update or delete |

**Other Services (Not My Responsibility):**
| File | Team |
|------|------|
| `services/menu-service/PRESENTATION_*.md` | Menu Team |
| `services/menu-service/ARCHITECTURE.md` | Menu Team |
| `services/menu-service/MENU_SERVICE_README.md` | Menu Team |
| `services/order-service/PRESENTATION_*.md` | Order Team |
| `services/order-service/ORDER_SERVICE_README.md` | Order Team |
| `frontend/FLOW_PATHS.md` | ✅ KEEP (my responsibility) |

---

## 2. Unused Imports & Code to Clean ✅ COMPLETED

### 2.1 Auth Service - Unused Imports ✅ REMOVED

| File | Line | Import Removed | Status |
|------|------|----------------|--------|
| `Repository/ProfileRepository.java` | 7 | `java.util.Optional` | ✅ |
| `Service/Impl/ProfileServiceImpl.java` | 4 | `java.util.Optional` | ✅ |
| `DTO/TokenResponseDto.java` | 8 | `lombok.Value` | ✅ |
| `DTO/TokenResponseDto.java` | 10 | `java.util.Date` | ✅ |
| `Controller/ProfileController.java` | 7 | `Entity.User` | ✅ |
| `Security/JwtService.java` | 14 | `java.util.Objects` | ✅ |
| `Security/JwtService.java` | 15 | `java.util.Optional` | ✅ |

### 2.2 Auth Service - Unused Fields ✅ REMOVED

| File | Line | Issue | Status |
|------|------|-------|--------|
| `Security/JwtAuthenticationFilter.java` | 22 | `userRepository` field | ✅ Removed |

### 2.3 Code Style Issues

| File | Line | Issue | Fix |
|------|------|-------|-----|
| `Controller/ProfileController.java` | 28, 41 | Unnecessary `Integer` boxing | Use `Integer.parseInt()` result directly |
| `Security/JwtService.java` | 89, 107 | Unnecessary `Integer` boxing | Use `Integer.parseInt()` result directly |

---

## 3. Critical Compile Errors to Fix ✅ ALL RESOLVED

### 3.1 Auth Service - Interface Mismatch ✅ FIXED

**Status:** Resolved by updating AuthService interface to match AuthServiceImpl

**Problem:** AuthServiceImpl does not implement all abstract methods from AuthService interface

**Errors:**
1. `AuthServiceImpl` must implement `logoutUser(Integer)`
2. `register()` returns `UserResponseDto` but interface expects `ProfileDto`
3. `login()` returns `TokenResponseDto` but interface expects `ResponseDto`
4. `getAddress()` method undefined in `RegisterRequestDto`
5. `generateAccessToken()` and `generateRefreshToken()` method signatures don't match
6. `TokenResponseDto` constructor doesn't match

**Fix Options:**

**Option A: Update Interface to Match Implementation**
```java
// AuthService.java
ProfileDto register(RegisterRequestDto dto);  // Change to UserResponseDto
ResponseDto login(LoginRequestDto dto);       // Change to TokenResponseDto
void logoutUser(Integer userId);              // Add implementation
```

**Option B: Update Implementation to Match Interface**
```java
// AuthServiceImpl.java
@Override
public ProfileDto register(RegisterRequestDto dto) { ... }

@Override
public ResponseDto login(LoginRequestDto dto) { ... }

@Override
public void logoutUser(Integer userId) {
    // Implement logout logic (invalidate refresh token)
}
```

---

### 3.2 Auth Service - ProfileDto Constructor

**File:** `Service/Impl/ProfileServiceImpl.java`

**Problem:** `ProfileDto(User, Profile)` constructor does not exist

**Current constructors:**
- `ProfileDto()`
- `ProfileDto(String, String, String)`
- `ProfileDto(Integer, String, String, String, String, String, LocalDateTime, LocalDateTime)`

**Fix:** Add constructor to ProfileDto:
```java
public ProfileDto(User user, Profile profile) {
    this.userId = user.getId();
    this.email = user.getEmail();
    this.fullName = profile.getFullName();
    this.phone = profile.getPhone();
    this.address = profile.getAddress();
    // ... set other fields
}
```

---

### 3.3 Auth Service - JwtService Method Signatures

**Problem:** `generateAccessToken(User)` and `generateRefreshToken(User)` called but methods expect `(User, int)` parameters

**Fix:** Either:
1. Update JwtService to have overloaded methods
2. Update AuthServiceImpl to pass the role parameter

```java
// Option 1: Add overloaded methods in JwtService
public String generateAccessToken(User user) {
    return generateAccessToken(user, user.getRole());
}

public String generateRefreshToken(User user) {
    return generateRefreshToken(user, user.getRole());
}
```

---

### 3.4 Auth Service - RegisterRequestDto Missing Method

**Problem:** `dto.getAddress()` called but method doesn't exist

**Fix:** Add address field to RegisterRequestDto:
```java
@Data
public class RegisterRequestDto {
    private String username;
    private String email;
    private String password;
    private String fullName;
    private String phone;
    private String address;  // ADD THIS
    private Integer role;
    private Integer provider;
}
```

---

## 4. Gateway Fixes ✅ NO CHANGES NEEDED

### 4.1 @Slf4j Annotations ✅ ALREADY PRESENT

All Gateway filters already have `@Slf4j` annotations - no changes needed.

### 4.2 ErrorResponse.builder() ✅ ALREADY PRESENT

ErrorResponse already has `@Builder` annotation - no changes needed.

**Problem:** `ErrorResponse.builder()` method not found

**Fix:** Add `@Builder` annotation to ErrorResponse class:
```java
import lombok.Builder;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ErrorResponse {
    private String message;
    private String path;
    private String correlationId;
    private int status;
}
```

---

## 5. Implementation Tasks

### 5.1 Auth Service Tasks

| Priority | Task | Estimate | Status |
|----------|------|----------|--------|
| P0 | Fix AuthServiceImpl interface implementation | 2h | ✅ |
| P0 | Fix ProfileDto constructor | 30m | ✅ |
| P0 | Fix JwtService method signatures | 30m | ✅ |
| P0 | Add address field to RegisterRequestDto | 15m | ✅ |
| P1 | Remove unused imports | 15m | ✅ |
| P1 | Remove unused userRepository field | 5m | ✅ |
| P2 | Create AdminSeeder.java | 1h | ⏳ |

### 5.2 Gateway Tasks

| Priority | Task | Estimate | Status |
|----------|------|----------|--------|
| P0 | Add @Slf4j to all filters | 30m | ✅ (already present) |
| P0 | Add @Builder to ErrorResponse | 10m | ✅ (already present) |
| P1 | Update or delete QUICK_START.md | 15m | ⏳ |

### 5.3 Frontend Tasks

| Priority | Task | Estimate | Status |
|----------|------|----------|--------|
| P0 | Add ErrorBoundary component | 1h | ✅ |
| P0 | Add form validation (zod + react-hook-form) | 2h | ✅ |
| P1 | Add ErrorAlert component | 30m | ⏳ |
| P1 | Add API error handler utility | 30m | ⏳ |
| P2 | Lazy load routes | 30m | ⏳ |
| P2 | Add input sanitization | 30m | ⏳ |

### 5.4 CI/CD Tasks

| Priority | Task | Estimate | Status |
|----------|------|----------|--------|
| P1 | Create auth-service workflow | 1h | ✅ |
| P1 | Create gateway workflow | 1h | ✅ |
| P1 | Create frontend CI workflow | 30m | ✅ |
| P2 | Add branch protection rules | 30m | ⏳ |

---

## 6. Execution Order

### Sprint 1: Fix Compile Errors (Day 1-2) ✅ COMPLETED

```
1. [x] Add @Slf4j to Gateway filters (already present)
2. [x] Add @Builder to ErrorResponse (already present)
3. [x] Fix AuthService interface + implementation
4. [x] Fix ProfileDto constructor
5. [x] Fix JwtService method signatures (tableId param)
6. [x] Add address to RegisterRequestDto
7. [x] Fix AuthController return types
8. [x] Run mvn clean compile - verified no errors
```

### Sprint 2: Code Cleanup (Day 2-3) ✅ COMPLETED

```
8. [x] Delete all delete_this.txt files (7 files)
9. [x] Delete frontend/tmpclaude-23a4-cwd
10. [x] Remove unused imports (7 imports from 5 files)
11. [x] Remove unused userRepository field
12. [x] Update gateway/QUICK_START.md (fixed outdated paths)
```

### Sprint 3: New Features (Day 3-5) ✅ COMPLETED

```
13. [x] Create AdminSeeder.java
14. [x] Add ErrorBoundary to Frontend
15. [x] Add form validation to Frontend (zod + react-hook-form)
16. [x] Create GitHub Actions workflows (auth-service, gateway, frontend CI)
```

---

## Quick Delete Commands

```powershell
# Delete placeholder files
Get-ChildItem -Path . -Recurse -Filter "delete_this.txt" | Remove-Item -Force

# Delete temp file
Remove-Item "frontend/tmpclaude-23a4-cwd" -Force -ErrorAction SilentlyContinue

# Optional: Delete outdated gateway docs
Remove-Item "gateway/QUICK_START.md" -Force
```

---

## Verification Checklist

After all fixes:

```powershell
# Auth Service
cd services/auth-service
mvn clean compile
# Should: BUILD SUCCESS

# Gateway
cd ../../gateway
mvn clean compile
# Should: BUILD SUCCESS

# Frontend
cd ../frontend
npm run lint
npm run build
# Should: No errors
```

---

**Next Steps:** Start with Sprint 1 - Fix Compile Errors
