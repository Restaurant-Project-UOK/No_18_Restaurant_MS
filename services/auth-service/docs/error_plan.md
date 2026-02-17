# Auth Service - Error Analysis & Resolution Plan

**Last Updated:** February 15, 2026  
**Service:** Authentication & Authorization Service  
**Version:** 0.0.1-SNAPSHOT

---

## Table of Contents

1. [Critical Errors](#critical-errors)
2. [High Priority Errors](#high-priority-errors)
3. [Medium Priority Errors](#medium-priority-errors)
4. [Low Priority Errors & Warnings](#low-priority-errors--warnings)
5. [Security Issues](#security-issues)
6. [Configuration Issues](#configuration-issues)

---

## Critical Errors

### ❌ E1: Missing Global Exception Handler

**Issue:** No `@ControllerAdvice` or global exception handler is implemented.

**Location:** N/A (Missing component)

**Impact:** 
- Generic `RuntimeException` thrown from services returns HTTP 500 with stack traces
- Inconsistent error response format across endpoints
- Sensitive stack trace information exposed to clients
- Client cannot distinguish between different error types (validation, not found, duplicate email, etc.)

**Current Behavior:**
```java
// AuthServiceImpl.java - Line 45
throw new RuntimeException("Email already in use");

// AuthServiceImpl.java - Line 68
throw new RuntimeException("User not found");

// AuthServiceImpl.java - Line 71
throw new RuntimeException("Invalid password");
```

**Resolution Steps:**

1. **Create GlobalExceptionHandler.java**

Create file: `src/main/java/com/example/auth_service/Exception/GlobalExceptionHandler.java`

```java
package com.example.auth_service.Exception;

import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@Slf4j
@ControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(UserAlreadyExistsException.class)
    @ResponseStatus(HttpStatus.CONFLICT)
    public ResponseEntity<Map<String, Object>> handleUserAlreadyExists(UserAlreadyExistsException ex) {
        log.warn("User already exists: {}", ex.getMessage());
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(buildErrorResponse("USER_ALREADY_EXISTS", ex.getMessage(), HttpStatus.CONFLICT.value()));
    }

    @ExceptionHandler(UserNotFoundException.class)
    @ResponseStatus(HttpStatus.NOT_FOUND)
    public ResponseEntity<Map<String, Object>> handleUserNotFound(UserNotFoundException ex) {
        log.warn("User not found: {}", ex.getMessage());
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(buildErrorResponse("USER_NOT_FOUND", ex.getMessage(), HttpStatus.NOT_FOUND.value()));
    }

    @ExceptionHandler(InvalidCredentialsException.class)
    @ResponseStatus(HttpStatus.UNAUTHORIZED)
    public ResponseEntity<Map<String, Object>> handleInvalidCredentials(InvalidCredentialsException ex) {
        log.warn("Invalid credentials attempt");
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(buildErrorResponse("INVALID_CREDENTIALS", "Invalid email or password", HttpStatus.UNAUTHORIZED.value()));
    }

    @ExceptionHandler(IllegalArgumentException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ResponseEntity<Map<String, Object>> handleIllegalArgument(IllegalArgumentException ex) {
        log.warn("Invalid argument: {}", ex.getMessage());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(buildErrorResponse("INVALID_REQUEST", ex.getMessage(), HttpStatus.BAD_REQUEST.value()));
    }

    @ExceptionHandler(Exception.class)
    @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
    public ResponseEntity<Map<String, Object>> handleGenericException(Exception ex) {
        log.error("Unexpected error occurred", ex);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(buildErrorResponse("INTERNAL_ERROR", "An unexpected error occurred", HttpStatus.INTERNAL_SERVER_ERROR.value()));
    }

    private Map<String, Object> buildErrorResponse(String code, String message, int status) {
        Map<String, Object> response = new HashMap<>();
        response.put("code", code);
        response.put("message", message);
        response.put("status", status);
        response.put("timestamp", LocalDateTime.now());
        return response;
    }
}
```

2. **Update AuthServiceImpl.java** to use custom exceptions instead of `RuntimeException`

Replace all generic `RuntimeException` with specific exceptions.

---

### ❌ E2: Null Pointer Exception in Token Generation

**Issue:** `tableId` parameter can be null or zero causing issues downstream.

**Location:** `JwtService.java` - Lines 40, 53

**Current Code:**
```java
public String generateAccessToken(User user, int tableId) {
    return Jwts.builder()
            .setSubject(user.getId().toString())
            .claim("role", user.getRole())
            .claim("tableId", tableId)  // Can be 0 for non-table users
            // ...
}
```

**Impact:**
- When `tableId = 0`, it's unclear if user has table access
- Downstream services may fail or behave unexpectedly with tableId = 0
- Controller passes hardcoded `0` for all login scenarios

**Resolution:**

Replace in `JwtService.java`:
```java
public String generateAccessToken(User user, Integer tableId) {
    Map<String, Object> claims = new HashMap<>();
    claims.put("role", user.getRole());
    if (tableId != null && tableId > 0) {
        claims.put("tableId", tableId);
    }
    
    return Jwts.builder()
            .setSubject(user.getId().toString())
            .addClaims(claims)
            .setIssuedAt(new Date())
            .setExpiration(new Date(System.currentTimeMillis() + accessTokenExpirationMs))
            .signWith(SignatureAlgorithm.HS512, jwtSecret)
            .compact();
}

public String generateRefreshToken(User user, Integer tableId) {
    Map<String, Object> claims = new HashMap<>();
    if (tableId != null && tableId > 0) {
        claims.put("tableId", tableId);
    }
    
    return Jwts.builder()
            .setSubject(user.getId().toString())
            .addClaims(claims)
            .setIssuedAt(new Date())
            .setExpiration(new Date(System.currentTimeMillis() + refreshTokenExpirationMs))
            .signWith(SignatureAlgorithm.HS512, jwtSecret)
            .compact();
}

public Integer getTableIdFromToken(String token) {
    Object tableId = getClaimsFromToken(token).get("tableId");
    return tableId instanceof Integer ? (Integer) tableId : null;
}
```

---

### ❌ E3: No Input Validation on DTOs

**Issue:** No validation annotations on request DTOs.

**Location:** All DTO classes (`LoginRequestDto.java`, `RegisterRequestDto.java`, etc.)

**Impact:**
- Null/empty emails can be submitted
- Password less than 6 characters accepted
- Invalid data persisted to database
- No standardized error messages for validation failures

**Resolution:**

Update all DTOs with validation annotations. Example for `LoginRequestDto.java`:

```java
package com.example.auth_service.DTO;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class LoginRequestDto {
    
    @NotBlank(message = "Email is required")
    @Email(message = "Email must be valid")
    private String email;
    
    @NotBlank(message = "Password is required")
    private String password;
}
```

Apply similar validation to:
- `RegisterRequestDto.java` - add @Email, @NotBlank, @Size for password
- `CreateStaffRequestDto.java` - same as RegisterRequestDto
- `ProfileDto.java` - add @Size constraints for phone, address

Add `@Valid` annotation to all controller methods:
```java
@PostMapping("/login")
public ResponseEntity<TokenResponseDto> login(@Valid @RequestBody LoginRequestDto dto) {
    return ResponseEntity.ok(authService.login(dto));
}
```

---

### ❌ E4: Missing Token Validation in AuthController Logout

**Issue:** Token is extracted but not validated before being added to blacklist.

**Location:** `AuthController.java` - Lines 52-64

**Current Code:**
```java
@PostMapping("/logout")
public ResponseEntity<String> logout(@RequestHeader("Authorization") String authHeader) {
    // ...
    String token = null;
    if (authHeader != null && authHeader.startsWith("Bearer ")) {
        token = authHeader.substring(7);  // No validation here
    }
    
    Long userId = Long.parseLong(auth.getName());
    authService.logoutUser(userId, token);  // Can be null!
}
```

**Impact:**
- Null token passed to `logoutUser()` can cause NPE
- Token not verified before blacklisting
- Invalid tokens can be "logged out"

**Resolution:**

Update `AuthController.java`:
```java
@PostMapping("/logout")
public ResponseEntity<String> logout(@RequestHeader("Authorization") String authHeader) {
    Authentication auth = SecurityContextHolder.getContext().getAuthentication();

    if (auth == null || !auth.isAuthenticated()) {
        return ResponseEntity.status(401).body("User not authenticated");
    }

    if (authHeader == null || !authHeader.startsWith("Bearer ")) {
        throw new IllegalArgumentException("Invalid authorization header format");
    }

    String token = authHeader.substring(7);
    
    if (!jwtService.validateToken(token)) {
        throw new IllegalArgumentException("Invalid or expired token");
    }

    Long userId = Long.parseLong(auth.getName());
    authService.logoutUser(userId, token);

    return ResponseEntity.ok("Logged out successfully");
}
```

---

## High Priority Errors

### ⚠️ E5: Weak JWT Secret in Development

**Issue:** Hardcoded fallback JWT secret is weak.

**Location:** `JwtService.java` - Line 26

**Status:** ⚠️ **PARTIALLY FIXED** - Fallback exists but no validation

```java
@Value("${jwt.secret:SecretKey123}")  // Weak fallback still here!
private String jwtSecret;
```

**application.properties shows:**
```properties
jwt.secret=${JWT_SECRET}  # No fallback - good!
```

**But:** If `JWT_SECRET` env var not set in production, fallback kicks in!

**Impact:**
- `SecretKey123` is a 12-character weak secret
- If environment variable not set, service falls back to weak secret
- Development secret can leak into production if env var forgotten
- JWT tokens can be forged with brute force
- Gateway and Service might use different secrets causing validation failures

**Resolution:**

1. **Remove fallback secret** - Force explicit configuration:
```java
@Value("${jwt.secret}")  // Remove default
private String jwtSecret;
```

2. **Update application.properties**:
```properties
# Add explicit secret (minimum 32 characters)
jwt.secret=${JWT_SECRET:ChangeMe@ProductionSecret123456789}
```

3. **Add validation** in a Configuration class:
```java
@Configuration
public class JwtConfiguration {
    
    @Value("${jwt.secret}")
    private String jwtSecret;
    
    @PostConstruct
    public void validateJwtSecret() {
        if (jwtSecret == null || jwtSecret.length() < 32) {
            throw new IllegalArgumentException("JWT secret must be at least 32 characters");
        }
    }
}
```

---

### ⚠️ E6: No HTTPS Requirement (Gateway Responsibility)

**Issue:** No enforcement of HTTPS in SecurityConfig.

**Location:** `SecurityConfig.java` - No requiresSecure() call

**Status:** ⚠️ **DESIGN DECISION** - Gateway should handle HTTPS, but needs verification

**Current SecurityConfig:**
```java
.csrf(csrf -> csrf.disable())
.cors(cors -> cors.disable())  // CORS handled by Gateway
.sessionManagement(session ->
        session.sessionCreationPolicy(SessionCreationPolicy.STATELESS)
)
```

**Impact (if Gateway bypassed):**
- Tokens transmitted in plain HTTP can be intercepted
- Man-in-the-middle attacks possible
- Service assumes Gateway enforces HTTPS
- No internal HTTPS enforcement as safety net

**Consideration:**
- In microservices with Gateway, internal service-to-service might use HTTP (common pattern)
- But if service is directly accessible, HTTPS should be enforced
- **NEED TO VERIFY:** Does Gateway properly enforce HTTPS to clients?

**Resolution:**

Update `SecurityConfig.java`:
```java
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .requiresChannel(channel -> channel
                        .anyRequest()
                        .requiresSecure()  // Enforce HTTPS
                )
                .csrf(csrf -> csrf.disable())
                .cors(cors -> cors.disable())
                .sessionManagement(session ->
                        session.sessionCreationPolicy(SessionCreationPolicy.STATELESS)
                )
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(
                                "/",
                                "/api/auth/**",
                                "/api/profile/**",
                                "/swagger-ui.html",
                                "/swagger-ui/**",
                                "/v3/api-docs/**"
                        ).permitAll()
                        .anyRequest().authenticated()
                );

        return http.build();
    }
    
    // ... rest of config
}
```

Add to `application.properties`:
```properties
server.ssl.enabled=true
server.ssl.key-store=${KEYSTORE_PATH:classpath:keystore.p12}
server.ssl.key-store-password=${KEYSTORE_PASSWORD}
```

---

### ⚠️ E7: No Authorization Check in Admin Endpoints

**Issue:** Admin endpoints trust gateway routing without verifying role.

**Location:** `AdminController.java` - exists but needs verification

**Status:** ⚠️ **DESIGN DECISION** - Gateway should validate, but no service-level enforcement

**Known Risk:** If gateway is bypassed, any user can create staff

**SecurityConfig.java current state:**
```java
.authorizeHttpRequests(auth -> auth
        .requestMatchers(
                "/api/auth/**",
                "/api/profile/**",
                "/swagger-ui.html",
                "/swagger-ui/**",
                "/v3/api-docs/**"
        ).permitAll()
        .anyRequest().authenticated()  // NO role check!
)
```

**Impact:**
- If gateway is bypassed, any authenticated user can access /api/admin/**
- No role validation at service layer
- Relies entirely on gateway for authorization
- Service has no defense-in-depth

**Consideration:**
- Gateway should enforce role-based access to /api/admin/**
- Service should add role checks as defense-in-depth
- **NEED TO VERIFY:** Does Gateway enforce @PreAuthorize("ROLE_ADMIN")?

**Resolution:**

1. **Update SecurityConfig.java** to enforce role:
```java
.authorizeHttpRequests(auth -> auth
        .requestMatchers("/api/admin/**").hasRole("ADMIN")  // Add role check
        .requestMatchers("/api/auth/**").permitAll()
        .requestMatchers("/api/profile/**").authenticated()
        .anyRequest().authenticated()
)
```

2. **Add method-level security** in AdminController:
```java
@PostMapping("/staff")
@PreAuthorize("hasRole('ADMIN')")  // Add role enforcement
public ResponseEntity<UserResponseDto> createStaff(@RequestBody CreateStaffRequestDto dto) {
    log.info("Creating staff user: {}", dto.getEmail());
    return ResponseEntity.ok(authService.createStaff(dto));
}

@GetMapping("/users")
@PreAuthorize("hasRole('ADMIN')")
public ResponseEntity<List<UserResponseDto>> getAllUsers() {
    return ResponseEntity.ok(authService.getAllUsers());
}
```

3. **Enable method security** in SecurityConfig:
```java
@Configuration
@EnableMethodSecurity  // Add this
@EnableWebSecurity
public class SecurityConfig {
    // ...
}
```

---

### ⚠️ E8: JWT Uses Deprecated SignatureAlgorithm

**Issue:** Using `SignatureAlgorithm.HS512` with deprecated jjwt API.

**Location:** `JwtService.java` - Lines 42, 56, etc.

**Current Code:**
```java
.signWith(SignatureAlgorithm.HS512, jwtSecret)  // Deprecated API
```

**Impact:**
- Using deprecated jjwt 0.11.5 API
- Future version incompatibility
- Security algorithm concerns (HS512 is acceptable but API is outdated)

**Resolution:**

Update `pom.xml` to newer jjwt version:
```xml
<properties>
    <java.version>17</java.version>
    <jjwt.version>0.12.6</jjwt.version>  <!-- Updated from 0.11.5 -->
</properties>
```

Update `JwtService.java` to use new API:
```java
import io.jsonwebtoken.security.Keys;
import javax.crypto.SecretKey;

@Service
public class JwtService {
    
    @Value("${jwt.secret}")
    private String jwtSecretString;
    
    private SecretKey jwtSecret;
    
    @PostConstruct
    public void init() {
        // Ensure minimum key size for HS512
        this.jwtSecret = Keys.hmacShaKeyFor(
            Base64.getDecoder().decode(
                Base64.getEncoder().encodeToString(jwtSecretString.getBytes())
            )
        );
    }
    
    public String generateAccessToken(User user, Integer tableId) {
        return Jwts.builder()
                .subject(user.getId().toString())
                .claim("role", user.getRole())
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + accessTokenExpirationMs))
                .signWith(jwtSecret)  // New API
                .compact();
    }
}
```

---

## Medium Priority Errors

### ⚠️ E9: Password Field Nullable in User Entity

**Issue:** User password is nullable but not all authentication methods handle this.

**Location:** `User.java` - Line 35

```java
@Column
private String password;  // Nullable, intended for OAuth users
```

**Impact:**
- Login endpoint doesn't check for null password before encoding
- OAuth users with null password might login with wrong password
- Inconsistent password validation

**Resolution:**

Update `AuthServiceImpl.java` login method:
```java
@Override
public TokenResponseDto login(LoginRequestDto dto) {
    User user = userRepository.findByEmail(dto.getEmail())
            .orElseThrow(() -> new UserNotFoundException("User not found"));

    // Check if user has password (null for OAuth-only users)
    if (user.getPassword() == null) {
        throw new InvalidCredentialsException("This account uses OAuth. Please login with your OAuth provider.");
    }

    if (!passwordEncoder.matches(dto.getPassword(), user.getPassword())) {
        throw new InvalidCredentialsException("Invalid credentials");
    }

    String accessToken = jwtService.generateAccessToken(user, null);
    String refreshToken = jwtService.generateRefreshToken(user, null);

    return new TokenResponseDto(accessToken, refreshToken, user);
}
```

---

### ⚠️ E10: No Rate Limiting on Authentication Endpoints

**Issue:** No rate limiting on login/register endpoints.

**Location:** `AuthController.java` - Lines 35-47

**Impact:**
- Brute force attacks possible on login endpoint
- Bots can spam register endpoint
- Resource exhaustion attacks

**Resolution:**

1. **Add Spring Rate Limiting dependency** to `pom.xml`:
```xml
<dependency>
    <groupId>io.github.bucket4j</groupId>
    <artifactId>bucket4j-core</artifactId>
    <version>7.6.0</version>
</dependency>
```

2. **Create RateLimitingInterceptor.java**:
```java
package com.example.auth_service.Security;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.Bucket4j;
import io.github.bucket4j.Refill;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class RateLimitingInterceptor implements HandlerInterceptor {
    
    private final Map<String, Bucket> cache = new ConcurrentHashMap<>();
    
    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        String path = request.getRequestURI();
        
        // Apply rate limiting to auth endpoints
        if (path.contains("/api/auth/login") || path.contains("/api/auth/register")) {
            String ip = getClientIP(request);
            Bucket bucket = cache.computeIfAbsent(ip, k -> createNewBucket());
            
            if (bucket.tryConsume(1)) {
                return true;
            } else {
                response.setStatus(429);  // Too Many Requests
                response.getWriter().write("Rate limit exceeded. Try again later.");
                return false;
            }
        }
        
        return true;
    }
    
    private Bucket createNewBucket() {
        Bandwidth limit = Bandwidth.classic(10, Refill.intervally(10, Duration.ofMinutes(1)));
        return Bucket4j.builder()
                .addLimit(limit)
                .build();
    }
    
    private String getClientIP(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            return xForwardedFor.split(",")[0];
        }
        return request.getRemoteAddr();
    }
}
```

3. **Register interceptor** in a Configuration class:
```java
@Configuration
public class WebConfig implements WebMvcConfigurer {
    
    private final RateLimitingInterceptor rateLimitingInterceptor;
    
    public WebConfig(RateLimitingInterceptor rateLimitingInterceptor) {
        this.rateLimitingInterceptor = rateLimitingInterceptor;
    }
    
    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(rateLimitingInterceptor);
    }
}
```

---

### ⚠️ E11: Profile Creation Failure Not Handled

**Issue:** Profile creation can fail silently if User save succeeds but Profile save fails.

**Location:** `AuthServiceImpl.java` - Lines 56-65

```java
User user = new User();
// ... set user properties ...
user.setProfile(profile);
userRepository.save(user);  // Saves User but profile might not be in DB
```

**Impact:**
- Incomplete user records in database
- Profile is created but cascading might not work
- Orphaned user records

**Resolution:**

Ensure bidirectional relationship and cascade is properly configured in `User.java`:
```java
@OneToOne(mappedBy = "user", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
private Profile profile;
```

And in `Profile.java`:
```java
@OneToOne(cascade = CascadeType.ALL)
@JoinColumn(name = "user_id")
private User user;
```

Update registration with explicit error handling:
```java
@Transactional
@Override
public UserResponseDto register(RegisterRequestDto dto) {
    if (userRepository.existsByEmail(dto.getEmail())) {
        throw new UserAlreadyExistsException("Email already in use");
    }

    User user = new User();
    user.setEmail(dto.getEmail());
    user.setPassword(passwordEncoder.encode(dto.getPassword()));
    user.setRole(dto.getRole() != null ? dto.getRole() : 1);
    user.setProvider(dto.getProvider() != null ? dto.getProvider() : 1);

    Profile profile = new Profile();
    profile.setUser(user);
    profile.setFullName(dto.getFullName());
    profile.setPhone(dto.getPhone());
    profile.setAddress(dto.getAddress());
    user.setProfile(profile);

    try {
        userRepository.save(user);
        log.info("User registered successfully with email: {}", user.getEmail());
    } catch (Exception e) {
        log.error("Failed to register user: {}", e.getMessage(), e);
        throw new RuntimeException("Failed to create user account", e);
    }
    
    return new UserResponseDto(user);
}
```

---

### ⚠️ E12: Profile Update Creates Duplicate Profile Records

**Issue:** Profile update can create new profile if none exists, but doesn't verify user actually owns it.

**Location:** `ProfileServiceImpl.java` - Lines 39-50

```java
Profile profile = profileRepository.findById(userId).orElseGet(() -> {
    Profile newProfile = new Profile();
    newProfile.setUser(user);
    newProfile.setId(userId);  // Setting ID manually - dangerous!
    newProfile.setCreatedAt(LocalDateTime.now());
    return newProfile;
});
```

**Impact:**
- Setting ID manually can cause database constraint violations
- Profile can be created with wrong user relationship
- Security: No verification that profile belongs to authenticated user

**Resolution:**

Update `ProfileServiceImpl.java`:
```java
@Transactional
@Override
public ProfileDto updateProfile(Long userId, ProfileDto dto) {
    User user = userRepository.findById(userId)
            .orElseThrow(() -> new UserNotFoundException("User not found"));

    Profile profile = profileRepository.findByUserId(userId)
            .orElseThrow(() -> new RuntimeException(
                    "Profile not found. Please contact administrator."
            ));

    profile.setFullName(dto.getFullName());
    profile.setPhone(dto.getPhone());
    profile.setAddress(dto.getAddress());
    profile.setUpdatedAt(LocalDateTime.now());

    profileRepository.save(profile);
    return new ProfileDto(user, profile);
}
```

Add method to `ProfileRepository`:
```java
Optional<Profile> findByUserId(Long userId);
```

---

## Low Priority Errors & Warnings

### ⚠️ E13: Deprecated JwtAuthenticationFilter Not Removed

**Issue:** Filter is marked `@Deprecated` but still in codebase.

**Location:** `JwtAuthenticationFilter.java`

**Impact:**
- Code confusion - which authentication method is actually used?
- Maintenance burden
- Dead code

**Resolution:**

Remove or comment out the registration of `JwtAuthenticationFilter`. It's not being used in `SecurityConfig`, so it can be safely deleted after verification.

---

### ⚠️ E14: Logging Doesn't Use SLF4J Parameters

**Issue:** Some logs use string concatenation instead of parameterized logging.

**Location:** Various - Example in `AuthController.java`:
```java
log.info("User registered successfully: email={}", userResponse.getEmail());  // OK
```

But inconsistency throughout. Should use parameterized logging everywhere.

**Resolution:**

Update all logging to use parameterized format:
```java
// Good:
log.info("User registered successfully: email={}", userResponse.getEmail());

// Bad:
log.info("User registered successfully: email=" + userResponse.getEmail());
```

---

### ⚠️ E15: No Logging for Refresh Token Generation Failure

**Issue:** Refresh token failures don't log details.

**Location:** `JwtService.java` - Lines 113-127

**Impact:**
- Difficult to debug token refresh issues
- No audit trail for failed refresh attempts

**Resolution:**

Update `generateNewAccessToken()` method:
```java
public String generateNewAccessToken(String refreshToken) {
    log.debug("Attempting to generate new access token from refresh token");

    if (!validateRefreshToken(refreshToken)) {
        log.warn("Failed to generate new access token: Invalid or expired refresh token");
        throw new IllegalArgumentException("Invalid or expired refresh token");
    }

    try {
        Claims claims = Jwts.parser()
                .setSigningKey(jwtSecret)
                .parseClaimsJws(refreshToken)
                .getBody();

        Long userId = Long.parseLong(claims.getSubject());
        Integer tableId = (Integer) claims.get("tableId");

        User user = userRepository.findById(userId)
                .orElseThrow(() -> {
                    log.error("User not found for ID: {} from refresh token", userId);
                    return new UserNotFoundException("User not found");
                });

        log.info("Successfully generated new access token for user ID: {}", userId);
        return generateAccessToken(user, tableId);

    } catch (JwtException e) {
        log.error("Error parsing refresh token: {}", e.getMessage(), e);
        throw new IllegalArgumentException("Invalid refresh token format", e);
    }
}
```

---

## Security Issues

### 🔒 SEC1: JWT Secret Exposure Risk

**Severity:** CRITICAL

**Issue:** Weak default JWT secret and no validation.

**Current:** `SecretKey123` (hardcoded fallback)

**Resolution:** See **E5** above.

---

### 🔒 SEC2: No Token Expiration Validation

**Severity:** HIGH

**Issue:** While JWT parser validates expiration, there's no explicit check.

**Current Code:**
```java
public boolean validateRefreshToken(String token) {
    try {
        Claims claims = Jwts.parser()
                .setSigningKey(jwtSecret)
                .parseClaimsJws(token)
                .getBody();
        // Optional: check expiration manually (not strictly needed, parser already does this)
        return claims.getExpiration().after(new Date());
    } catch (JwtException | IllegalArgumentException e) {
        return false;
    }
}
```

**Resolution:** Keep the explicit check - it's good practice:
```java
public boolean validateRefreshToken(String token) {
    try {
        Claims claims = Jwts.parser()
                .setSigningKey(jwtSecret)
                .parseClaimsJws(token)
                .getBody();
        
        Date expiration = claims.getExpiration();
        boolean isValid = expiration != null && expiration.after(new Date());
        
        if (!isValid) {
            log.debug("Refresh token is expired");
        }
        
        return isValid;
    } catch (JwtException | IllegalArgumentException e) {
        log.debug("Refresh token validation failed: {}", e.getMessage());
        return false;
    }
}
```

---

### 🔒 SEC3: Redis Token Blacklist Not Authenticated

**Severity:** MEDIUM

**Issue:** No authentication on Redis connection.

**Location:** `application.properties` - Lines 20-22

```properties
spring.data.redis.host=${REDIS_HOST:localhost}
spring.data.redis.port=${REDIS_PORT:6379}
spring.data.redis.password=${REDIS_PASSWORD:}  # Empty by default!
```

**Impact:**
- Anyone with access to Redis port can read/modify blacklist
- Token blacklist can be manipulated

**Resolution:**

1. **Update application.properties**:
```properties
spring.data.redis.host=${REDIS_HOST:localhost}
spring.data.redis.port=${REDIS_PORT:6379}
spring.data.redis.password=${REDIS_PASSWORD:required}
spring.data.redis.ssl=${REDIS_SSL:true}
spring.data.redis.timeout=60000
spring.data.redis.connect-timeout=10000
```

2. **Update docker-compose.yml** (if using Docker):
```yaml
redis:
  image: redis:7-alpine
  command: redis-server --requirepass ${REDIS_PASSWORD}
  ports:
    - "6379:6379"
  environment:
    REDIS_PASSWORD: ${REDIS_PASSWORD}
```

---

### 🔒 SEC4: No CORS Configuration

**Severity:** MEDIUM

**Issue:** CORS is disabled but no alternative provided.

**Location:** `SecurityConfig.java` - Line 28

```java
.cors(cors -> cors.disable())  // CORS handled by Gateway
```

**Impact:**
- If gateway is bypassed, CORS attacks possible
- No explicit CORS policy in service

**Resolution:**

Add CORS configuration in `SecurityConfig.java`:
```java
@Bean
public CorsConfigurationSource corsConfigurationSource() {
    CorsConfiguration configuration = new CorsConfiguration();
    configuration.setAllowedOrigins(Arrays.asList(
            "${cors.allowed-origins:http://localhost:3000}".split(",")
    ));
    configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS"));
    configuration.setAllowedHeaders(Arrays.asList("*"));
    configuration.setAllowCredentials(true);
    
    UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
    source.registerCorsConfiguration("/**", configuration);
    return source;
}

// In securityFilterChain:
.cors(cors -> cors.configurationSource(corsConfigurationSource()))
```

---

## Configuration Issues

### ⚙️ CONF1: Missing Environment Variable Documentation

**Issue:** No documentation of required environment variables.

**Location:** `application.properties` has many `${VAR:default}` placeholders

**Required Variables:**
- `JWT_SECRET` - ❌ No default, **MUST** be set in production
- `SERVER_PORT` - Default: 8081
- `SPRING_DATASOURCE_URL` - Default: localhost MySQL
- `SPRING_DATASOURCE_USERNAME` - Default: root
- `SPRING_DATASOURCE_PASSWORD` - Default: empty
- `REDIS_HOST` - Default: localhost
- `REDIS_PORT` - Default: 6379
- `REDIS_PASSWORD` - ⚠️ No default, should be set

**Resolution:** Create `.env.example` file:

```properties
# Server Configuration
SERVER_PORT=8081

# Database Configuration
SPRING_DATASOURCE_URL=jdbc:mysql://localhost:3306/Restaurant_Proj?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC
SPRING_DATASOURCE_USERNAME=root
SPRING_DATASOURCE_PASSWORD=

# JWT Configuration (CRITICAL - CHANGE IN PRODUCTION)
JWT_SECRET=ChangeMe@ProductionSecret123456789MinimumLength32
JWT_ACCESS_EXPIRATION=900000
JWT_REFRESH_EXPIRATION=604800000

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=SecureRedisPassword123

# Admin Seeder
admin.email=admin@restaurant.com
admin.password=Admin@123
admin.seed.enabled=true

# CORS Configuration
cors.allowed-origins=http://localhost:3000,http://localhost:3001

# JPA Configuration
JPA_DDL_AUTO=update
JPA_SHOW_SQL=true
```

---

### ⚙️ CONF2: No Connection Pool Configuration

**Issue:** No datasource connection pooling configuration.

**Location:** Missing from `application.properties`

**Impact:**
- Default HikariCP might not be optimal
- Resource leaks possible
- Connection exhaustion under load

**Resolution:**

Add to `application.properties`:
```properties
# Connection Pool Configuration
spring.datasource.hikari.maximum-pool-size=10
spring.datasource.hikari.minimum-idle=5
spring.datasource.hikari.connection-timeout=30000
spring.datasource.hikari.idle-timeout=600000
spring.datasource.hikari.max-lifetime=1800000
spring.datasource.hikari.auto-commit=true
```

---

### ⚙️ CONF3: No Actuator Endpoint Configuration

**Issue:** No health check or monitoring endpoints configured.

**Location:** N/A (Missing)

**Impact:**
- Docker health checks will fail
- Kubernetes liveness probes won't work
- No way to monitor service status

**Resolution:**

1. **Add Spring Boot Actuator** to `pom.xml`:
```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-actuator</artifactId>
</dependency>
```

2. **Add to application.properties**:
```properties
# Actuator Configuration
management.endpoints.web.exposure.include=health,info,metrics
management.endpoint.health.show-details=when-authorized
management.health.livenessState.enabled=true
management.health.readinessState.enabled=true
```

3. **Update SecurityConfig.java**:
```java
.authorizeHttpRequests(auth -> auth
        .requestMatchers("/actuator/**").permitAll()  // Health checks
        .requestMatchers("/api/auth/**").permitAll()
        // ... rest of configuration
)
```

---

## Summary Table

| Error ID | Severity | Type | Status |
|----------|----------|------|--------|
| E1 | CRITICAL | Missing Exception Handler | ❌ Not Implemented |
| E2 | CRITICAL | Null tableId Handling | ❌ Not Implemented |
| E3 | CRITICAL | No Input Validation | ❌ Not Implemented |
| E4 | CRITICAL | Token Not Validated on Logout | ❌ Not Implemented |
| E5 | HIGH | Weak JWT Secret | ❌ Not Implemented |
| E6 | HIGH | No HTTPS Enforcement | ❌ Not Implemented |
| E7 | HIGH | No Authorization Check | ❌ Not Implemented |
| E8 | HIGH | Deprecated JWT API | ❌ Not Implemented |
| E9 | MEDIUM | Nullable Password | ❌ Not Implemented |
| E10 | MEDIUM | No Rate Limiting | ❌ Not Implemented |
| E11 | MEDIUM | Profile Creation Failure | ⚠️ Needs Verification |
| E12 | MEDIUM | Profile Duplicate Records | ❌ Not Implemented |
| E13 | LOW | Deprecated Filter | ⚠️ Can Delete |
| E14 | LOW | Inconsistent Logging | ⚠️ Minor |
| E15 | LOW | Missing Refresh Log | ❌ Not Implemented |
| SEC1 | CRITICAL | JWT Secret Exposure | ❌ Not Implemented |
| SEC2 | HIGH | Token Expiration | ⚠️ Partially Implemented |
| SEC3 | MEDIUM | Redis Auth | ❌ Not Implemented |
| SEC4 | MEDIUM | CORS | ❌ Not Implemented |
| CONF1 | HIGH | Missing Env Docs | ❌ Not Implemented |
| CONF2 | MEDIUM | No Connection Pool | ❌ Not Implemented |
| CONF3 | MEDIUM | No Health Checks | ❌ Not Implemented |

---

## Implementation Priority

### Phase 1 (CRITICAL - Do First)
1. E1: Global Exception Handler
2. E3: Input Validation
3. E4: Token Validation on Logout
4. E5: JWT Secret Validation
5. SEC1: JWT Secret Security

### Phase 2 (HIGH - Do Next)
6. E6: HTTPS Enforcement
7. E7: Authorization Checks
8. E8: Update JWT API
9. SEC3: Redis Authentication

### Phase 3 (MEDIUM - Schedule)
10. E9: Password Null Handling
11. E10: Rate Limiting
12. E12: Profile Update Fix
13. CONF1: Environment Documentation
14. CONF2: Connection Pooling
15. CONF3: Health Checks

### Phase 4 (LOW - Nice to Have)
16. E13: Remove Deprecated Filter
17. E14: Consistent Logging
18. E15: Enhanced Logging

---

## Testing Recommendations

### Unit Tests to Add
- GlobalExceptionHandler tests
- Input validation tests
- JWT token generation/validation tests
- Rate limiting tests

### Integration Tests to Add
- Register with duplicate email
- Login with invalid credentials
- Logout token blacklist verification
- Profile CRUD operations
- Token refresh workflow

### Security Tests to Add
- JWT secret validation
- HTTPS enforcement verification
- CORS policy verification
- Rate limiting effectiveness
- Authorization check on admin endpoints

---

## References

- [OWASP JWT Best Practices](https://cheatsheetseries.owasp.org/cheatsheets/JSON_Web_Token_for_Java_Cheat_Sheet.html)
- [Spring Security Documentation](https://spring.io/projects/spring-security)
- [JJWT Library GitHub](https://github.com/jwtk/jjwt)
- [Redis Security Guide](https://redis.io/topics/security)

---

**Document Version:** 1.0  
**Last Updated:** February 15, 2026  
**Prepared By:** Auth Service Analysis Team

