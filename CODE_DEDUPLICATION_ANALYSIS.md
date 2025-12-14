# Code Deduplication & Refactoring Analysis
**Auth Service & Frontend**

---

## 1. CRITICAL DUPLICATIONS FOUND

### 1.1 PasswordServiceImpl - Token Creation Duplication ⚠️ HIGH PRIORITY

**File:** `services/auth-service/src/main/java/com/example/auth_service/Service/Impl/PasswordServiceImpl.java`

**Problem:** Two methods contain nearly identical token creation and save logic with different expiry times.

**Duplication Location:**
- **Method 1:** `createPasswordResetToken()` (lines 37-59)
  - Creates UUID token
  - Builds PasswordReset entity with 30-minute expiry
  - Saves to database
  - Logs operation
  
- **Method 2:** `sendResetEmail()` (lines 66-85)
  - Creates UUID token (DUPLICATE)
  - Builds PasswordReset entity with 15-minute expiry
  - Saves to database (DUPLICATE)
  - Logs operation (DUPLICATE)

**Code Comparison:**
```java
// DUPLICATE PATTERN 1: createPasswordResetToken()
String token = UUID.randomUUID().toString();
PasswordReset reset = PasswordReset.builder()
    .user(user)
    .resetToken(token)
    .expiry(LocalDateTime.now().plusMinutes(30))
    .build();
resetRepository.save(reset);

// DUPLICATE PATTERN 2: sendResetEmail()
String token = UUID.randomUUID().toString();
PasswordReset reset = new PasswordReset();
reset.setUser(user);
reset.setResetToken(token);
reset.setExpiry(LocalDateTime.now().plusMinutes(15));  // Different expiry
resetRepository.save(reset);  // SAME SAVE OPERATION
```

**Impact:** Code duplication, maintenance burden, inconsistent patterns

**Refactoring Solution:**
```java
// Extract to private helper method
private PasswordReset createResetTokenInternal(User user, int expiryMinutes) {
    String token = UUID.randomUUID().toString();
    logger.debug("Generated reset token for user: {}", user.getEmail());
    
    return PasswordReset.builder()
        .user(user)
        .resetToken(token)
        .expiry(LocalDateTime.now().plusMinutes(expiryMinutes))
        .build();
}

// Refactored methods
@Transactional
public void createPasswordResetToken(String email) {
    logger.info("Creating password reset token for email: {}", email);
    
    User user = userRepository.findByEmail(email)
        .orElseThrow(() -> {
            logger.warn("Password reset failed: User not found - {}", email);
            return new UserNotFoundException("User not found");
        });

    PasswordReset reset = createResetTokenInternal(user, 30);  // 30 min
    resetRepository.save(reset);
    logger.info("Password reset token saved for email: {}", email);
}

@Transactional
@Override
public void sendResetEmail(String email) {
    logger.info("Sending reset email to: {}", email);
    
    User user = userRepository.findByEmail(email)
        .orElseThrow(() -> {
            logger.warn("Send reset email failed: User not found - {}", email);
            return new UserNotFoundException("User not found");
        });

    PasswordReset reset = createResetTokenInternal(user, 15);  // 15 min
    resetRepository.save(reset);
    logger.debug("Reset email token saved for user: {}", email);
}
```

**Benefit:** 
- DRY principle (Don't Repeat Yourself)
- Centralized token creation logic
- Easier to modify token generation strategy
- Reduced maintenance burden

---

### 1.2 User Lookup Pattern Duplication - MODERATE PRIORITY

**Problem:** Both `PasswordServiceImpl` and `AuthServiceImpl` contain identical user lookup and exception handling patterns.

**Pattern Duplication Location:**

**PasswordServiceImpl (lines 43-47, 73-77):**
```java
User user = userRepository.findByEmail(email)
    .orElseThrow(() -> {
        logger.warn("Password reset failed: User not found - {}", email);
        return new UserNotFoundException("User not found");
    });
```

**AuthServiceImpl (lines 105-109):**
```java
User user = userRepository.findByEmail(dto.getEmail())
    .orElseThrow(() -> {
        logger.warn("Login failed: User not found - {}", dto.getEmail());
        return new UserNotFoundException("User not found");
    });
```

**Impact:** 
- Duplicate error handling logic
- Inconsistent error messages
- Hard to apply consistent changes across services

**Refactoring Solution - Create UserLookupService:**
```java
// New file: UserLookupService.java
package com.example.auth_service.Service;

public interface UserLookupService {
    User findUserByEmailOrThrow(String email, String errorContext);
}

// Implementation: UserLookupServiceImpl.java
package com.example.auth_service.Service.Impl;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import com.example.auth_service.Entity.User;
import com.example.auth_service.Repository.UserRepository;
import com.example.auth_service.exception.UserNotFoundException;

@Service
public class UserLookupServiceImpl implements UserLookupService {
    private static final Logger logger = LoggerFactory.getLogger(UserLookupServiceImpl.class);
    
    private final UserRepository userRepository;
    
    public UserLookupServiceImpl(UserRepository userRepository) {
        this.userRepository = userRepository;
    }
    
    @Override
    public User findUserByEmailOrThrow(String email, String errorContext) {
        return userRepository.findByEmail(email)
            .orElseThrow(() -> {
                logger.warn("{}: User not found - {}", errorContext, email);
                return new UserNotFoundException("User not found");
            });
    }
}
```

**Updated Usage:**
```java
// In PasswordServiceImpl
@Autowired
private UserLookupService userLookupService;

public void createPasswordResetToken(String email) {
    logger.info("Creating password reset token for email: {}", email);
    User user = userLookupService.findUserByEmailOrThrow(email, "Password reset");
    // ... rest of method
}

// In AuthServiceImpl
public TokenResponseDto login(LoginRequestDto dto) {
    logger.info("Login attempt for email: {}", dto.getEmail());
    User user = userLookupService.findUserByEmailOrThrow(dto.getEmail(), "Login");
    // ... rest of method
}
```

**Benefit:**
- Single source of truth for user lookup logic
- Consistent error handling
- Easy to add audit logging or rate limiting
- Reduced code duplication

---

## 2. SERVICE DESIGN ANALYSIS

### 2.1 Token Handling - Consolidation Opportunity

**Current State:**
- `AuthServiceImpl` has inline token saving logic in `login()` method (lines 127-130)
- `TokenService` interface exists but has only `refreshToken()` method
- Token creation happens in `JwtService`
- Token saving happens in `AuthServiceImpl`

**Pattern:**
```java
// In AuthServiceImpl.login()
saveToken(user, accessToken, 1); // 1 = ACCESS
saveToken(user, refreshToken, 2); // 2 = REFRESH

// Inline method definition
Token token = new Token();
token.setUser(user);
token.setToken(tokenString);
token.setType(type);
token.setExpiry(type == 1 
    ? LocalDateTime.now().plusMinutes(15) 
    : LocalDateTime.now().plusDays(7));
token.setRevoked(0);
tokenRepository.save(token);
```

**Recommendation - Extend TokenService:**
```java
// Updated TokenService interface
public interface TokenService {
    void saveAccessToken(User user, String token);
    void saveRefreshToken(User user, String token);
    TokenResponseDto refreshToken(String refreshToken);
}

// Implementation
@Service
public class TokenServiceImpl implements TokenService {
    private static final Logger logger = LoggerFactory.getLogger(TokenServiceImpl.class);
    private final TokenRepository tokenRepository;
    
    public TokenServiceImpl(TokenRepository tokenRepository) {
        this.tokenRepository = tokenRepository;
    }
    
    @Override
    @Transactional
    public void saveAccessToken(User user, String token) {
        Token accessToken = Token.builder()
            .user(user)
            .token(token)
            .type(1) // ACCESS
            .expiry(LocalDateTime.now().plusMinutes(15))
            .revoked(0)
            .build();
        tokenRepository.save(accessToken);
        logger.debug("Access token saved for user: {}", user.getEmail());
    }
    
    @Override
    @Transactional
    public void saveRefreshToken(User user, String token) {
        Token refreshToken = Token.builder()
            .user(user)
            .token(token)
            .type(2) // REFRESH
            .expiry(LocalDateTime.now().plusDays(7))
            .revoked(0)
            .build();
        tokenRepository.save(refreshToken);
        logger.debug("Refresh token saved for user: {}", user.getEmail());
    }
}
```

**Updated AuthServiceImpl:**
```java
@Service
public class AuthServiceImpl implements AuthService {
    private final TokenService tokenService;
    
    public TokenResponseDto login(LoginRequestDto dto) {
        // ... validation ...
        
        String accessToken = jwtService.generateAccessToken(user);
        String refreshToken = jwtService.generateRefreshToken(user);
        
        // Use TokenService instead of inline saveToken()
        tokenService.saveAccessToken(user, accessToken);
        tokenService.saveRefreshToken(user, refreshToken);
        
        logger.info("Login successful for email: {}", dto.getEmail());
        return new TokenResponseDto(accessToken, refreshToken);
    }
}
```

---

## 3. REMOVABLE/REDUNDANT CODE

### 3.1 System.out.println in Production Code

**File:** `PasswordServiceImpl.java` (line 60)
```java
System.out.println("Password reset token for " + email + ": " + token);
```

**Issue:** 
- Production code should NOT use `System.out.println()`
- This is a debug statement that should be removed
- Already have `logger` for proper logging

**Action:** Remove this line completely

---

## 4. ARCHITECTURE IMPROVEMENTS SUMMARY

| Issue | Type | Priority | Solution | Effort |
|-------|------|----------|----------|--------|
| Token creation duplication in PasswordServiceImpl | Code Duplication | HIGH | Extract helper method | 30 min |
| User lookup pattern duplication | Code Duplication | MEDIUM | Create UserLookupService | 45 min |
| Inline token saving in AuthServiceImpl | Design | MEDIUM | Move to TokenServiceImpl | 30 min |
| System.out.println in PasswordServiceImpl | Code Smell | LOW | Remove debug statement | 5 min |
| Password reset expiry inconsistency | Design | LOW | Document or standardize | 15 min |

---

## 5. REFACTORING ROADMAP

### Phase 1: Low-Hanging Fruit (15 min)
1. Remove `System.out.println` from PasswordServiceImpl.java line 60

### Phase 2: Core Deduplication (1 hour 15 min)
2. Extract `createResetTokenInternal()` helper method in PasswordServiceImpl
3. Create UserLookupService interface and implementation
4. Update PasswordServiceImpl to use UserLookupService

### Phase 3: Service Consolidation (45 min)
5. Extend TokenService interface with saveAccessToken() and saveRefreshToken()
6. Create TokenServiceImpl
7. Update AuthServiceImpl to use TokenService instead of inline saveToken()

### Phase 4: Validation & Testing (30 min)
8. Run frontend tests to ensure no regressions
9. Run auth-service tests
10. Manual smoke testing of login/password reset flows

**Total Estimated Time:** 2.5 hours

---

## 6. FILES TO MODIFY

### Critical Changes:
1. **PasswordServiceImpl.java** - Extract helper, remove println, use UserLookupService
2. **New: UserLookupService.java** - Create interface
3. **New: UserLookupServiceImpl.java** - Create implementation
4. **New: TokenServiceImpl.java** - Create implementation
5. **TokenService.java** - Extend interface
6. **AuthServiceImpl.java** - Use TokenService, use UserLookupService

---

## 7. NO REMOVABLE CLASSES FOUND

All existing classes serve a purpose:
- **Entity classes** (User, Token, PasswordReset, Profile) - Required for data model
- **Repository classes** - Required for data access
- **Controller classes** - Required for HTTP endpoints
- **DTO classes** - Required for request/response validation
- **Service interfaces & implementations** - Required for business logic
- **Exception classes** - Required for error handling
- **Security classes** (JwtService, SecurityConfig) - Required for auth

---

## 8. CODE QUALITY RECOMMENDATIONS

### Current State: GOOD ✅
- ErrorBoundary component in React
- Global API client with token injection
- Input validation on frontend and backend
- Comprehensive logging
- Custom exception handling
- Environment-based configuration

### After Deduplication: EXCELLENT ⭐
- Zero duplicate code patterns
- Consistent error handling
- Centralized token management
- Improved testability
- Clear service responsibilities

---

## Implementation Priority

**Must Do (This Sprint):**
1. ✅ Remove System.out.println from PasswordServiceImpl
2. ✅ Create UserLookupService for consistent user lookup
3. ✅ Extract token creation helper in PasswordServiceImpl

**Should Do (Next Sprint):**
4. Extend TokenService and implement TokenServiceImpl
5. Refactor AuthServiceImpl to use TokenService
6. Add unit tests for new services

**Nice To Have:**
7. API Documentation
8. Postman Collection
9. CI/CD Pipeline (GitHub Actions)
10. Rate Limiting Implementation

