# Unnecessary Files and Classes - Auth Service

**Last Updated:** February 16, 2026  
**Purpose:** Track deprecated, unused, and unnecessary components that can be safely removed

---

## 📁 ~~Deprecated/Unused Entity Classes~~ - NOW IN USE

### ✅ UserActivity.java - NOW ACTIVE
**Location:** `src/main/java/com/example/auth_service/Entity/UserActivity.java`  
**Status:** ✅ **ACTIVE** - Implemented on 2026-02-16  
**Reason:** User activity tracking is now implemented  
**Can Remove:** ❌ No - **IN USE**  
**Dependencies:** Used by UserActivityRepository, AuthServiceImpl

**Description:**
```java
@Entity
@Table(name = "user_activity")
public class UserActivity {
    // Tracks login/logout sessions
    private Long id;
    private User user;
    private Integer tableNo;
    private LocalDateTime loginAt;
    private LocalDateTime logoutAt;
}
```

**Functionality:**
- ✅ Records login timestamp on user authentication
- ✅ Records logout timestamp when user logs out
- ✅ Tracks table number for customer sessions
- ✅ Enables session history and analytics

**Action:** ✅ **KEEP** - Active feature

---

## 📁 ~~Deprecated/Unused Repository Classes~~ - NOW IN USE

### ✅ UserActivityRepository.java - NOW ACTIVE
**Location:** `src/main/java/com/example/auth_service/Repository/UserActivityRepository.java`  
**Status:** ✅ **ACTIVE** - Implemented on 2026-02-16  
**Reason:** Repository for active UserActivity entity  
**Can Remove:** ❌ No - **IN USE**  
**Dependencies:** Injected in AuthServiceImpl

**Description:**
```java
public interface UserActivityRepository extends JpaRepository<UserActivity, Long> {
    UserActivity findTopByUserAndLogoutAtIsNullOrderByLoginAtDesc(User user);
    List<UserActivity> findByUserAndLogoutAtIsNull(User user);
}
```

**Methods:**
- `findTopByUserAndLogoutAtIsNullOrderByLoginAtDesc()` - Find active session
- `findByUserAndLogoutAtIsNull()` - Find all active sessions

**Action:** ✅ **KEEP** - Active repository

---

## 📁 Unused DTO Classes

### ❌ ResponseDto.java
**Location:** `src/main/java/com/example/auth_service/DTO/ResponseDto.java`  
**Status:** Not marked deprecated, but completely unused  
**Reason:** Replaced by `TokenResponseDto.java` which has better structure and metadata  
**Can Remove:** ✅ Yes  
**Dependencies:** None - not used anywhere in the codebase

**Description:**
```java
@Data
public class ResponseDto {
    private String accessToken;
    private String refreshToken;
    private int tableId;
}
```

**Why Replaced:**
- `TokenResponseDto` includes `tokenType`, `expiresIn`, and `UserResponseDto`
- Better follows REST API standards
- Provides more information to clients

**Action:** Delete file - superseded by TokenResponseDto

---

## 📁 Old Documentation Files

### ⚠️ error_plan.md
**Location:** `docs/error_plan.md`  
**Size:** 1303 lines  
**Status:** Planning document from initial development  
**Reason:** Most errors documented here have been fixed  
**Can Remove:** ⚠️ Partial - Archive or move to history folder  
**Current Relevance:** Low - kept for historical reference

**Description:**
- Documents initial errors during development
- Created: February 15, 2026
- Most issues resolved with GlobalExceptionHandler, ErrorResponseDto, etc.

**Recommendation:** 
- Move to `docs/archive/` or `docs/history/`
- Keep for reference but remove from active docs

---

### ⚠️ second_plan.md
**Location:** `docs/second_plan.md`  
**Size:** 2292 lines  
**Status:** Planning document for Gateway & Frontend integration  
**Reason:** Most integration issues have been addressed  
**Can Remove:** ⚠️ Partial - Archive or move to history folder  
**Current Relevance:** Medium - some gateway patterns still useful

**Description:**
- Documents gateway integration issues
- Created: February 15, 2026
- Topics: CORS, headers, token management, service-to-service communication

**Recommendation:** 
- Move to `docs/archive/` or `docs/history/`
- Extract useful patterns to GATEWAY_DECISION.md
- Keep for reference but remove from active docs

---

## 📁 IDE and Build Configuration Files (Keep but Document)

### ℹ️ .idea/ folder
**Location:** `.idea/`  
**Status:** IntelliJ IDEA configuration  
**Can Remove:** ❌ No - but add to .gitignore  
**Reason:** IDE-specific, should not be in version control

**Action:** Ensure `.idea/` is in `.gitignore`

---

### ℹ️ .vscode/ folder
**Location:** `.vscode/`  
**Status:** VS Code configuration  
**Can Remove:** ❌ No - useful for team consistency  
**Reason:** Contains shared workspace settings

**Action:** Keep - helps maintain consistent editor settings across team

---

### ℹ️ target/ folder
**Location:** `target/`  
**Status:** Maven build output  
**Can Remove:** ❌ No - but add to .gitignore  
**Reason:** Build artifact folder, regenerated on each build

**Action:** Ensure `target/` is in `.gitignore`

---

## 📁 Environment Files

### ⚠️ .env.development - SECURITY ISSUE
**Location:** `.env.development`  
**Status:** ⚠️ CONTAINS REAL CREDENTIALS - REMOVE FROM GIT  
**Can Remove:** ✅ Yes - should NOT be in version control  
**Security Risk:** **HIGH** - Contains real database credentials

**Current Contents:**
```dotenv
SPRING_DATASOURCE_URL=jdbc:mysql://mainline.proxy.rlwy.net:21965/railway
SPRING_DATASOURCE_USERNAME=root
SPRING_DATASOURCE_PASSWORD=TpAYbdfVzbdmcJInKxqWzkgAPktUmlnV  # EXPOSED!
JWT_SECRET=ue8yLJTAALbJn67rrh4lEGPLgl634dLEEIvRjVbemRFmgei9LggUKZjs/aSh9rvWGRBrze0Af5At6ywPsdO9+g==  # EXPOSED!
```

**Security Issues:**
- ❌ Real database password exposed in repository
- ❌ JWT secret exposed (should be rotated)
- ❌ Railway production database credentials
- ❌ Anyone with repo access can see credentials

**Action:** 
1. **DELETE from repository** - Should never be committed
2. **Add to .gitignore**
3. **Rotate exposed credentials** (DB password, JWT secret)
4. Each developer creates their own `.env` file locally

---

### ℹ️ .env.example
**Location:** `.env.example`  
**Status:** Template file (no real credentials)  
**Can Remove:** ❌ No  
**Reason:** Example for new developers

**Action:** Keep - essential for onboarding (no real credentials)

---

## 🗑️ Deletion Summary

### 🚨 CRITICAL - Delete Immediately (Security):

1. **⚠️ .env.development** - Contains real credentials, security risk

**Total Files:** 1

**Commands to delete:**
```bash
# From auth-service root directory
rm .env.development

# Also remove from git history if already committed
git rm --cached .env.development
git commit -m "security: remove .env.development with exposed credentials"

# Add to .gitignore
echo ".env.development" >> .gitignore
echo ".env" >> .gitignore
```

**After deletion:**
- Rotate DB password on Railway
- Generate new JWT secret
- Each developer creates their own `.env` file from `.env.example`

---

### Safe to Delete Immediately (Unused Code):

1. **ResponseDto.java** - Replaced by TokenResponseDto

**Total Files:** 1

**Commands to delete:**
```bash
# From auth-service root directory
rm src/main/java/com/example/auth_service/DTO/ResponseDto.java
```

**Note:** UserActivity and UserActivityRepository are now **ACTIVE** and should NOT be deleted.

---

### Consider Moving to Archive:

1. **docs/error_plan.md** → `docs/archive/error_plan.md`
2. **docs/second_plan.md** → `docs/archive/second_plan.md`

**Total Files:** 2

**Commands to archive:**
```bash
# From auth-service root directory
mkdir -p docs/archive
mv docs/error_plan.md docs/archive/
mv docs/second_plan.md docs/archive/
```

---

## ✅ Files to Keep

### Active Configuration:
- ✅ `application.properties` - Active config
- ✅ `application-gateway.properties` - Gateway mode config
- ✅ `pom.xml` - Maven dependencies
- ✅ `Dockerfile` - Container build
- ✅ `docker-compose.yml` - Local development

### Active Documentation:
- ✅ `README.md` - Main documentation
- ✅ `GATEWAY_DECISION.md` - Gateway integration guide
- ✅ `IMPROVEMENTS.md` - Recent improvements log
- ✅ `QUICK_START.md` - Quick reference

### All Other Source Files:
### 🚨 PHASE 0: SECURITY - Delete Exposed Credentials (URGENT)

```bash
# Remove from repository
git rm --cached .env.development
rm .env.development

# Add to .gitignore
echo "" >> .gitignore
echo "# Environment files with credentials" >> .gitignore
echo ".env" >> .gitignore
echo ".env.development" >> .gitignore
echo ".env.local" >> .gitignore
ec**Security Issues:** 1 file (.env.development with real credentials) - **CRITICAL**
- **Deprecated/unused classes:** 3 files
- **Old documentation:** 2 files (3595 lines)
- **Impact on build:** None (all unused)
- **Security risk:** HIGH (exposed credentials)

### After Cleanup:
- ✅ **No exposed credentials in repository**
- ✅ Cleaner codebase
- ✅ Reduced confusion for new developers
- ✅ No functional impact (all unused code)
- ✅ Better maintainability
- ✅ Improved security posturetaging environments with new credentials
# 4. Create personal .env file from .env.example for local development
```

---

### Phase 1: Delete Unused Code (Safe - no dependencies)

```bash
rm src/main/java/com/example/auth_service/DTO/ResponseDto.java
```

**Note:** UserActivity.java and UserActivityRepository.java are now **ACTIVE** - do NOT delete.

---

### Phase 2: Archive Old Documentation

```bash
mkdir -p docs/archive
mv docs/error_plan.md docs/archive/
mv docs/second_plan.md docs/archive/
```

---

### Phase 3: Verify Build

```bash
./mvnw clean compile -DskipTests
./mvnw test
```

---

### Phase 4: Commit Changes

```bash
git add .
git commit -m "chore: remove deprecated entities and archive old docs"

## 🚀 Recommended Action Plan

1. **Phase 1: Delete Unused Code** (Safe - no dependencies)
   ```bash
   rm src/main/java/com/example/auth_service/Entity/UserActivity.java
   rm src/main/java/com/example/auth_service/Repository/UserActivityRepository.java
   rm src/main/java/com/example/auth_service/DTO/ResponseDto.java
   ```

2. **Phase 2: Archive Old Documentation**
   ```bash
   mkdir -p docs/archive
   mv docs/error_plan.md docs/archive/
   mv docs/second_plan.md docs/archive/
   ```

3. **Phase 3: Verify Build**
   ```bash
   ./mvnw clean compile -DskipTests
   ./mvnw test
   ```

4. **Phase 4: Commit Changes**
   ```bash
   git add .
   git commit -m "chore: remove deprecated entities and archive old docs"
   ```

---

## ⚠️ Notes

- All deletions are **safe** - no active code depends on these files
- Archive old docs instead of deleting for historical reference
- UserActivity may be reimplemented in the future for session tracking
- Keep .gitignore updated to exclude IDE and build folders

---

**Created by:** Ishanka Senadeera  
**Review Status:** Ready for cleanup  
**Next Review:** After deletion and successful build verification
