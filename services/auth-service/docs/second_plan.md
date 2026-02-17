# Auth Service - Second Analysis Plan
## Gateway & Frontend Integration Issues

**Last Updated:** February 15, 2026  
**Service:** Authentication & Authorization Service with Gateway & Frontend  
**Version:** 0.0.1-SNAPSHOT  
**Scope:** New errors discovered when integrating with API Gateway and Frontend Service

---

## Table of Contents

1. [Gateway Integration Issues](#gateway-integration-issues)
2. [Frontend Communication Issues](#frontend-communication-issues)
3. [CORS and Headers](#cors-and-headers)
4. [Token Management Issues](#token-management-issues)
5. [API Response Format Issues](#api-response-format-issues)
6. [Service-to-Service Communication](#service-to-service-communication)
7. [Removed Issues from First Plan](#removed-issues-from-first-plan)
8. [Additional Security Issues](#additional-security-issues)
9. [Configuration Issues for Distributed Architecture](#configuration-issues-for-distributed-architecture)
10. [Health & Monitoring for Gateway Routing](#health--monitoring-for-gateway-routing)

---

## Gateway Integration Issues

### ❌ G1: No X-Forwarded Headers Support

**Issue:** Service doesn't read X-Forwarded-* headers from gateway, causing incorrect IP/scheme detection.

**Location:** SecurityConfig.java - No ForwardedHeaderFilter configured

**Current Code:**
```java
// No configuration to handle X-Forwarded-For, X-Forwarded-Proto, etc.
@Configuration
@EnableWebSecurity
public class SecurityConfig {
    // ... no forwarded headers config
}
```

**When Gateway is Present:**
- Gateway passes: `X-Forwarded-For: <client-ip>`
- Gateway passes: `X-Forwarded-Proto: https`
- Gateway passes: `X-Forwarded-Host: api.restaurant.com`
- Service ignores these, uses container IP instead

**Impact:**
- Rate limiting by IP will fail (all requests appear from gateway IP)
- Audit logs show gateway IP, not actual client IP
- HTTPS enforcement might fail (service thinks it's HTTP)
- API Gateway routing headers stripped/ignored

**Resolution:**

1. **Add ForwardedHeaderFilter configuration** in SecurityConfig.java:

```java
@Bean
public ForwardedHeaderFilter forwardedHeaderFilter() {
    return new ForwardedHeaderFilter();
}
```

2. **Add to application.properties**:
```properties
# Trust proxy headers from API Gateway
server.tomcat.remoteip.remote-ip-header=X-Forwarded-For
server.tomcat.remoteip.protocol-header=X-Forwarded-Proto
server.tomcat.remoteip.trusted-proxies=10.0.0.0/8,172.16.0.0/12,192.168.0.0/16
```

3. **Update RateLimitingInterceptor** to handle gateway IPs correctly:
```java
private String getClientIP(HttpServletRequest request) {
    String xForwardedFor = request.getHeader("X-Forwarded-For");
    if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
        return xForwardedFor.split(",")[0].trim();  // Get first IP in chain
    }
    
    String xRealIp = request.getHeader("X-Real-IP");
    if (xRealIp != null && !xRealIp.isEmpty()) {
        return xRealIp;
    }
    
    return request.getRemoteAddr();
}
```

---

### ❌ G2: Missing X-User-Id Header Propagation from Gateway

**Issue:** When gateway extracts user ID from JWT and passes it via custom header, service doesn't read it.

**Location:** AuthController.java, SecurityConfig.java

**Gateway Behavior (Expected):**
```
Client Request: /api/profile
├─ Header: Authorization: Bearer <jwt>
└─ Gateway validates JWT
   └─ Gateway adds: X-User-Id: 123
   └─ Gateway removes: Authorization header
   └─ Passes to auth-service
```

**Current Service Behavior:**
```java
// AuthController.java - Logout endpoint tries to read from SecurityContext
Authentication auth = SecurityContextHolder.getContext().getAuthentication();
Long userId = Long.parseLong(auth.getName());  // ❌ Might be null if gateway removed auth header
```

**Impact:**
- If gateway removes Authorization header after validation, service authentication is null
- Service can't retrieve user ID from SecurityContext
- ProfileController queries for user ID but can't get it
- Service-to-service calls can't propagate user context

**Resolution:**

1. **Create custom filter to read gateway headers**:

Create file: `src/main/java/com/example/auth_service/Security/GatewayHeaderFilter.java`

```java
package com.example.auth_service.Security;

import jakarta.servlet.Filter;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.ServletRequest;
import jakarta.servlet.ServletResponse;
import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Collection;

@Slf4j
@Component
public class GatewayHeaderFilter implements Filter {

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {

        HttpServletRequest httpRequest = (HttpServletRequest) request;

        // Read user context from gateway headers
        String userId = httpRequest.getHeader("X-User-Id");
        String userRole = httpRequest.getHeader("X-User-Role");
        String userEmail = httpRequest.getHeader("X-User-Email");

        // If gateway provided user context, create authentication
        if (userId != null && !userId.isEmpty()) {
            log.debug("Received user context from gateway - userId: {}, role: {}", userId, userRole);

            Collection<GrantedAuthority> authorities = new ArrayList<>();
            if (userRole != null && !userRole.isEmpty()) {
                // Gateway provides role as "ROLE_ADMIN", "ROLE_USER", etc.
                authorities.add(new SimpleGrantedAuthority(userRole));
            }

            // Create authentication token from gateway headers
            Authentication auth = new UsernamePasswordAuthenticationToken(
                    userId,
                    null,  // No password when coming from gateway
                    authorities
            );

            SecurityContextHolder.getContext().setAuthentication(auth);
            log.debug("Set authentication from gateway headers for user: {}", userId);
        }

        chain.doFilter(request, response);
    }
}
```

2. **Register filter in SecurityConfig**:

```java
@Configuration
@EnableWebSecurity
public class SecurityConfig {
    
    private final GatewayHeaderFilter gatewayHeaderFilter;
    
    public SecurityConfig(GatewayHeaderFilter gatewayHeaderFilter) {
        this.gatewayHeaderFilter = gatewayHeaderFilter;
    }
    
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .addFilterBefore(gatewayHeaderFilter, UsernamePasswordAuthenticationFilter.class)
                .csrf(csrf -> csrf.disable())
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                // ... rest of config
        
        return http.build();
    }
}
```

3. **Update ProfileController** to support both direct JWT and gateway headers:

```java
@GetMapping("/me")
public ResponseEntity<ProfileDto> getProfile() {
    // Get user ID from security context (set by GatewayHeaderFilter or JWT filter)
    Authentication auth = SecurityContextHolder.getContext().getAuthentication();
    
    if (auth == null || !auth.isAuthenticated()) {
        throw new IllegalArgumentException("User not authenticated");
    }
    
    Long userId = Long.parseLong(auth.getName());
    ProfileDto profile = profileService.getProfile(userId);
    
    return ResponseEntity.ok(profile);
}
```

---

### ❌ G3: No Request/Response Logging for Gateway Debugging

**Issue:** No logging of full request/response cycle, making it hard to debug gateway issues.

**Location:** Missing RequestResponseLoggingFilter

**Impact:**
- When requests fail, can't see what gateway sent vs what service received
- No audit trail of API calls
- Hard to debug header stripping/modification by gateway
- No performance monitoring (request size, response time)

**Resolution:**

Create file: `src/main/java/com/example/auth_service/Security/RequestResponseLoggingFilter.java`

```java
package com.example.auth_service.Security;

import jakarta.servlet.Filter;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.ServletRequest;
import jakarta.servlet.ServletResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.util.ContentCachingRequestWrapper;
import org.springframework.web.util.ContentCachingResponseWrapper;

import java.io.IOException;
import java.util.Enumeration;
import java.util.UUID;

@Slf4j
@Component
public class RequestResponseLoggingFilter implements Filter {

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {

        if (request instanceof HttpServletRequest httpRequest
                && response instanceof HttpServletResponse httpResponse) {

            String requestId = UUID.randomUUID().toString();
            long startTime = System.currentTimeMillis();

            ContentCachingRequestWrapper requestWrapper = new ContentCachingRequestWrapper(httpRequest);
            ContentCachingResponseWrapper responseWrapper = new ContentCachingResponseWrapper(httpResponse);

            // Log incoming request
            logRequest(requestId, requestWrapper);

            try {
                chain.doFilter(requestWrapper, responseWrapper);
            } finally {
                // Log outgoing response
                long duration = System.currentTimeMillis() - startTime;
                logResponse(requestId, responseWrapper, duration);
                responseWrapper.copyBodyToResponse();
            }
        } else {
            chain.doFilter(request, response);
        }
    }

    private void logRequest(String requestId, ContentCachingRequestWrapper request) {
        if (log.isDebugEnabled()) {
            StringBuilder sb = new StringBuilder();
            sb.append("\n========== REQUEST [").append(requestId).append("] ==========\n");
            sb.append("Method: ").append(request.getMethod()).append("\n");
            sb.append("URI: ").append(request.getRequestURI()).append("\n");
            sb.append("Query String: ").append(request.getQueryString()).append("\n");

            // Log important headers
            sb.append("Headers:\n");
            Enumeration<String> headerNames = request.getHeaderNames();
            while (headerNames.hasMoreElements()) {
                String headerName = headerNames.nextElement();
                if (shouldLogHeader(headerName)) {
                    String headerValue = request.getHeader(headerName);
                    if ("Authorization".equalsIgnoreCase(headerName)) {
                        headerValue = "Bearer " + (headerValue.length() > 20 ? "***" : "***");
                    }
                    sb.append("  ").append(headerName).append(": ").append(headerValue).append("\n");
                }
            }

            log.debug(sb.toString());
        }
    }

    private void logResponse(String requestId, ContentCachingResponseWrapper response, long duration) {
        if (log.isDebugEnabled()) {
            StringBuilder sb = new StringBuilder();
            sb.append("\n========== RESPONSE [").append(requestId).append("] ==========\n");
            sb.append("Status: ").append(response.getStatus()).append("\n");
            sb.append("Duration: ").append(duration).append("ms\n");
            sb.append("Content-Type: ").append(response.getContentType()).append("\n");

            log.debug(sb.toString());
        }
    }

    private boolean shouldLogHeader(String headerName) {
        // Log important headers, skip others
        return headerName.toLowerCase().startsWith("x-")
                || "authorization".equalsIgnoreCase(headerName)
                || "content-type".equalsIgnoreCase(headerName)
                || "accept".equalsIgnoreCase(headerName);
    }
}
```

2. **Register filter** in SecurityConfig:

```java
@Bean
public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
    http.addFilterBefore(new RequestResponseLoggingFilter(), UsernamePasswordAuthenticationFilter.class);
    // ... rest of config
}
```

---

## Frontend Communication Issues

### ❌ F1: No Credentials Mode Configuration for Frontend

**Issue:** Frontend AJAX/Fetch requests won't include cookies, gateway might not forward auth properly.

**Location:** SecurityConfig.java - CORS configuration missing

**Frontend Code (Expected):**
```javascript
// Frontend makes request with credentials
fetch('https://api.restaurant.com/api/profile', {
    method: 'GET',
    credentials: 'include',  // Include cookies
    headers: {
        'Authorization': 'Bearer ' + token
    }
});
```

**Service Configuration (Current):**
```java
.cors(cors -> cors.disable())  // ❌ No CORS config!
```

**Impact:**
- Browser blocks cross-origin requests
- Frontend can't call service directly
- If gateway URL differs from service URL, CORS fails
- Cookie-based authentication fails (if used)

**Resolution:**

Update SecurityConfig.java:

```java
@Bean
public CorsConfigurationSource corsConfigurationSource() {
    CorsConfiguration configuration = new CorsConfiguration();
    
    // Allow frontend origins (from environment variables)
    String allowedOrigins = System.getenv("CORS_ALLOWED_ORIGINS");
    if (allowedOrigins != null) {
        configuration.setAllowedOrigins(Arrays.asList(allowedOrigins.split(",")));
    } else {
        configuration.setAllowedOrigins(Arrays.asList(
                "http://localhost:3000",
                "http://localhost:3001",
                "https://restaurant.com"
        ));
    }
    
    configuration.setAllowedMethods(Arrays.asList(
            "GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"
    ));
    
    configuration.setAllowedHeaders(Arrays.asList(
            "*"
    ));
    
    // Allow credentials (cookies, authorization headers)
    configuration.setAllowCredentials(true);
    
    // Max age for preflight cache
    configuration.setMaxAge(3600L);
    
    UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
    source.registerCorsConfiguration("/**", configuration);
    return source;
}

// In securityFilterChain:
.cors(cors -> cors.configurationSource(corsConfigurationSource()))
```

3. **Add to application.properties**:
```properties
# CORS Configuration (can be overridden by environment variable)
cors.allowed-origins=${CORS_ALLOWED_ORIGINS:http://localhost:3000,http://localhost:3001}
```

---

### ❌ F2: Missing OPTIONS Method Support for Preflight Requests

**Issue:** Frontend sends OPTIONS (preflight) requests but they're rejected.

**When Browser Sends:**
```
OPTIONS /api/auth/login HTTP/1.1
Host: api.restaurant.com
Origin: http://localhost:3000
Access-Control-Request-Method: POST
Access-Control-Request-Headers: content-type
```

**Current Behavior:**
```
❌ 401 Unauthorized or ❌ 403 Forbidden
```

**Expected Behavior:**
```
✅ 200 OK
Access-Control-Allow-Methods: POST
Access-Control-Allow-Headers: *
```

**Impact:**
- Preflight requests fail
- Browser blocks actual request (cors policy)
- Frontend can't make cross-origin POST/PUT/DELETE requests
- Only GET and simple requests work

**Resolution:**

CORS configuration above handles this, but explicitly allow OPTIONS:

```java
.csrf(csrf -> csrf.ignoringRequestMatchers(request -> 
    request.getMethod().equals("OPTIONS")  // Allow OPTIONS for CORS preflight
))
```

---

### ❌ F3: Token Refresh Endpoint Returns String Instead of JSON

**Issue:** Frontend expects JSON response but gets plain text.

**Current Code (AuthController):**
```java
@PostMapping("/refresh")
public ResponseEntity<String> generateNewAccessToken(@RequestBody Map<String, String> request) {
    String token = request.get("refreshToken");
    return ResponseEntity.ok(jwtService.generateNewAccessToken(token));  // ❌ Returns plain string
}
```

**Frontend Code (Expected):**
```javascript
const response = await fetch('/api/auth/refresh', {
    method: 'POST',
    body: JSON.stringify({ refreshToken: token })
});

const data = await response.json();  // ❌ Fails! Not JSON
console.log(data.accessToken);  // Expected, but won't work
```

**Impact:**
- Frontend can't parse response as JSON
- `response.json()` fails with parse error
- Token refresh workflow breaks
- Frontend has to manually handle string response (hacky)

**Resolution:**

Create TokenRefreshResponseDto:

```java
package com.example.auth_service.DTO;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TokenRefreshResponseDto {
    private String accessToken;
    private String refreshToken;
    private String expiresIn;  // milliseconds
}
```

Update AuthController:

```java
@PostMapping("/refresh")
public ResponseEntity<TokenRefreshResponseDto> generateNewAccessToken(@RequestBody Map<String, String> request) {
    String token = request.get("refreshToken");
    String newAccessToken = jwtService.generateNewAccessToken(token);
    
    return ResponseEntity.ok(new TokenRefreshResponseDto(
            newAccessToken,
            token,  // Refresh token stays the same unless rotated
            String.valueOf(jwtService.getAccessTokenExpirationMs())  // Frontend needs to know expiration
    ));
}
```

---

### ❌ F4: No Standard Error Response Format from All Endpoints

**Issue:** Different error responses from different endpoints, frontend can't parse consistently.

**Example Mismatch:**

Endpoint A:
```json
{
    "message": "User not found"
}
```

Endpoint B:
```json
{
    "error": "Invalid credentials"
}
```

Endpoint C:
```
400 Bad Request - plain text error
```

**Impact:**
- Frontend can't build generic error handler
- Frontend needs to parse each error differently
- Inconsistent UX for error messages
- Error codes not standardized (no way to distinguish error types)

**Resolution:**

Create unified ErrorResponseDto:

```java
package com.example.auth_service.DTO;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ErrorResponseDto {
    
    private String code;              // e.g., "USER_NOT_FOUND", "INVALID_CREDENTIALS"
    private String message;           // User-friendly message
    private int status;               // HTTP status code
    private String details;           // Additional details (nullable)
    private String path;              // Request path that caused error
    private LocalDateTime timestamp;  // When error occurred
    
    // Builder helper
    public static ErrorResponseDto notFound(String message) {
        return ErrorResponseDto.builder()
                .code("NOT_FOUND")
                .message(message)
                .status(404)
                .timestamp(LocalDateTime.now())
                .build();
    }
    
    public static ErrorResponseDto unauthorized(String message) {
        return ErrorResponseDto.builder()
                .code("UNAUTHORIZED")
                .message(message)
                .status(401)
                .timestamp(LocalDateTime.now())
                .build();
    }
    
    public static ErrorResponseDto badRequest(String message) {
        return ErrorResponseDto.builder()
                .code("BAD_REQUEST")
                .message(message)
                .status(400)
                .timestamp(LocalDateTime.now())
                .build();
    }
    
    public static ErrorResponseDto conflict(String message) {
        return ErrorResponseDto.builder()
                .code("CONFLICT")
                .message(message)
                .status(409)
                .timestamp(LocalDateTime.now())
                .build();
    }
    
    public static ErrorResponseDto internalServerError(String message) {
        return ErrorResponseDto.builder()
                .code("INTERNAL_ERROR")
                .message(message)
                .status(500)
                .timestamp(LocalDateTime.now())
                .build();
    }
}
```

Update GlobalExceptionHandler to use this:

```java
@Slf4j
@ControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(UserNotFoundException.class)
    @ResponseStatus(HttpStatus.NOT_FOUND)
    public ResponseEntity<ErrorResponseDto> handleUserNotFound(UserNotFoundException ex) {
        log.warn("User not found: {}", ex.getMessage());
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(ErrorResponseDto.notFound(ex.getMessage()));
    }

    @ExceptionHandler(InvalidCredentialsException.class)
    @ResponseStatus(HttpStatus.UNAUTHORIZED)
    public ResponseEntity<ErrorResponseDto> handleInvalidCredentials(InvalidCredentialsException ex) {
        log.warn("Invalid credentials attempt");
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(ErrorResponseDto.unauthorized("Invalid email or password"));
    }

    // ... other handlers using ErrorResponseDto
}
```

---

## CORS and Headers

### ❌ CH1: Custom Headers Stripped by Gateway

**Issue:** Custom headers (X-User-Id, X-Correlation-Id, etc.) might be stripped by gateway.

**Request Path:**
```
Client
  └─ Header: X-Correlation-Id: abc123
  └─ Header: X-Device-Id: device-123
  └─ Request to Gateway
       └─ Gateway validation
       └─ Passes to auth-service
            ❌ Headers might be missing!
```

**Impact:**
- Service can't access correlation IDs for tracing
- Device tracking doesn't work
- Request tracing across microservices fails
- Audit logging incomplete

**Resolution:**

1. **Configure gateway to preserve headers** (Gateway configuration, not auth-service):
```yaml
# In Gateway config
routes:
  - id: auth-service
    uri: http://auth-service:8081
    predicates:
      - Path=/api/auth/**
    filters:
      - name: PreserveHostHeader
      - name: PrefixPath
        args:
          prefix: /api/auth
```

2. **Add MDC (Mapped Diagnostic Context) to auth-service** for request tracing:

Create file: `src/main/java/com/example/auth_service/Security/CorrelationIdFilter.java`

```java
package com.example.auth_service.Security;

import jakarta.servlet.Filter;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.ServletRequest;
import jakarta.servlet.ServletResponse;
import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.slf4j.MDC;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.util.UUID;

@Slf4j
@Component
public class CorrelationIdFilter implements Filter {

    private static final String CORRELATION_ID_HEADER = "X-Correlation-Id";
    private static final String CORRELATION_ID_MDC = "correlationId";

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {

        HttpServletRequest httpRequest = (HttpServletRequest) request;

        // Get correlation ID from header or generate new one
        String correlationId = httpRequest.getHeader(CORRELATION_ID_HEADER);
        if (correlationId == null || correlationId.isEmpty()) {
            correlationId = UUID.randomUUID().toString();
        }

        // Add to MDC for logging
        MDC.put(CORRELATION_ID_MDC, correlationId);
        MDC.put("requestPath", httpRequest.getRequestURI());

        try {
            chain.doFilter(request, response);
        } finally {
            MDC.clear();
        }
    }
}
```

3. **Update logback configuration** to include correlation ID:

Create/Update file: `src/main/resources/logback-spring.xml`

```xml
<?xml version="1.0" encoding="UTF-8"?>
<configuration>
    <springProperty name="LOG_FILE" source="logging.file.name" defaultValue="./logs/auth-service.log"/>

    <appender name="CONSOLE" class="ch.qos.logback.core.ConsoleAppender">
        <encoder>
            <pattern>%d{yyyy-MM-dd HH:mm:ss.SSS} [%X{correlationId}] %-5level %logger{36} - %msg%n</pattern>
        </encoder>
    </appender>

    <appender name="FILE" class="ch.qos.logback.core.rolling.RollingFileAppender">
        <file>${LOG_FILE}</file>
        <encoder>
            <pattern>%d{yyyy-MM-dd HH:mm:ss.SSS} [%X{correlationId}] %-5level %logger{36} - %msg%n</pattern>
        </encoder>
        <rollingPolicy class="ch.qos.logback.core.rolling.SizeAndTimeBasedRollingPolicy">
            <fileNamePattern>${LOG_FILE}.%d{yyyy-MM-dd}.%i.gz</fileNamePattern>
            <maxFileSize>10MB</maxFileSize>
            <maxHistory>30</maxHistory>
            <totalSizeCap>1GB</totalSizeCap>
        </rollingPolicy>
    </appender>

    <root level="INFO">
        <appender-ref ref="CONSOLE"/>
        <appender-ref ref="FILE"/>
    </root>

    <logger name="com.example.auth_service" level="DEBUG"/>
</configuration>
```

---

### ❌ CH2: No Content-Type Validation

**Issue:** Service doesn't validate Content-Type header, accepts wrong formats.

**Attack Scenario:**
```
POST /api/auth/login
Content-Type: text/plain

{"email": "test@test.com", "password": "123"}  // ❌ Sent as plain text, not JSON
```

**Current Behavior:**
```
Spring accepts it if Jackson can parse it anyway
```

**Impact:**
- API abuse (bypassing content type checks)
- Potential parsing errors if malformed
- Security issues with file uploads mixed in

**Resolution:**

Add content type validation in GlobalExceptionHandler:

```java
@ExceptionHandler(HttpMediaTypeNotSupportedException.class)
@ResponseStatus(HttpStatus.UNSUPPORTED_MEDIA_TYPE)
public ResponseEntity<ErrorResponseDto> handleUnsupportedMediaType(HttpMediaTypeNotSupportedException ex) {
    log.warn("Unsupported media type: {}", ex.getContentType());
    return ResponseEntity.status(HttpStatus.UNSUPPORTED_MEDIA_TYPE)
            .body(ErrorResponseDto.builder()
                    .code("UNSUPPORTED_MEDIA_TYPE")
                    .message("Content-Type must be application/json")
                    .status(415)
                    .timestamp(LocalDateTime.now())
                    .build());
}
```

Add to SecurityConfig:

```java
.addFilterAfter((request, response, chain) -> {
    if (request instanceof HttpServletRequest httpRequest) {
        String method = httpRequest.getMethod();
        if ("POST".equals(method) || "PUT".equals(method) || "PATCH".equals(method)) {
            String contentType = httpRequest.getHeader("Content-Type");
            if (contentType == null || !contentType.contains("application/json")) {
                // Allow empty body for some endpoints
                if (httpRequest.getContentLength() > 0 && 
                    !contentType.startsWith("application/json")) {
                    throw new IllegalArgumentException("Content-Type must be application/json");
                }
            }
        }
    }
    chain.doFilter(request, response);
}, UsernamePasswordAuthenticationFilter.class)
```

---

## Token Management Issues

### ❌ T1: No Token Rotation on Refresh

**Issue:** Refresh token stays the same after refresh, if one is compromised all tokens are.

**Current Code:**
```java
@PostMapping("/refresh")
public ResponseEntity<String> generateNewAccessToken(@RequestBody Map<String, String> request) {
    String token = request.get("refreshToken");
    return ResponseEntity.ok(jwtService.generateNewAccessToken(token));
    // ❌ Returns only access token, refresh token unchanged!
}
```

**Best Practice:**
```
Client has: { accessToken: "old", refreshToken: "old" }
       ↓
Client calls /refresh with old refreshToken
       ↓
Server returns: { accessToken: "new", refreshToken: "new" }
       ↓
Client now has: { accessToken: "new", refreshToken: "new" }
```

**Impact:**
- If refresh token leaks, attacker can refresh indefinitely
- Tokens in circulation too long
- No token rotation mechanism
- Reduced security compared to OAuth2 standard

**Resolution:**

Update JwtService.java:

```java
public TokenRefreshResponseDto refreshAccessToken(String oldRefreshToken) {
    if (!validateRefreshToken(oldRefreshToken)) {
        log.warn("Refresh token validation failed");
        throw new InvalidCredentialsException("Invalid or expired refresh token");
    }

    // Parse old refresh token to get user info
    Claims claims = Jwts.parser()
            .setSigningKey(jwtSecret)
            .parseClaimsJws(oldRefreshToken)
            .getBody();

    Long userId = Long.parseLong(claims.getSubject());
    Integer tableId = (Integer) claims.get("tableId");

    User user = userRepository.findById(userId)
            .orElseThrow(() -> new UserNotFoundException("User not found"));

    // Blacklist old refresh token (optional but recommended)
    tokenBlacklistService.blacklistToken(oldRefreshToken);

    // Generate NEW refresh token (rotation)
    String newAccessToken = generateAccessToken(user, tableId);
    String newRefreshToken = generateRefreshToken(user, tableId);  // NEW!

    log.info("Generated new tokens for user: {}", userId);

    return new TokenRefreshResponseDto(
            newAccessToken,
            newRefreshToken,  // ✅ New refresh token
            String.valueOf(accessTokenExpirationMs)
    );
}
```

Update AuthController:

```java
@PostMapping("/refresh")
public ResponseEntity<TokenRefreshResponseDto> refresh(@RequestBody Map<String, String> request) {
    String token = request.get("refreshToken");
    return ResponseEntity.ok(jwtService.refreshAccessToken(token));
}
```

---

### ❌ T2: Logout Doesn't Invalidate Refresh Token

**Issue:** When user logs out, only access token is blacklisted, refresh token remains valid.

**Current Code:**
```java
@PostMapping("/logout")
public ResponseEntity<String> logout(@RequestHeader("Authorization") String authHeader) {
    // ...
    authService.logoutUser(userId, token);  // Only blacklists access token
    return ResponseEntity.ok("Logged out successfully");
}
```

**Attack Scenario:**
```
User logs out
  ↓
Access token blacklisted ✅
  ↓
Attacker still has refresh token ❌
  ↓
Attacker calls /api/auth/refresh
  ↓
Gets new access token ❌
  ↓
Attacker can make API calls
```

**Impact:**
- Logout is not truly complete
- Attacker with refresh token can still act as user
- Session management broken
- Compliance issues (PCI DSS, GDPR)

**Resolution:**

Update AuthService interface:

```java
public interface AuthService {
    // ...
    void logoutUser(Long userId, String accessToken, String refreshToken);  // ✅ Add refresh token param
    // ...
}
```

Update AuthServiceImpl:

```java
@Transactional
@Override
public void logoutUser(Long userId, String accessToken, String refreshToken) {
    log.info("Logging out user: {}", userId);
    
    // Blacklist both tokens
    if (accessToken != null && !accessToken.isEmpty()) {
        tokenBlacklistService.blacklistToken(accessToken);
    }
    
    if (refreshToken != null && !refreshToken.isEmpty()) {
        tokenBlacklistService.blacklistToken(refreshToken);
        log.info("Blacklisted refresh token for user: {}", userId);
    }
    
    // Optional: Mark user session as logged out in database
    User user = userRepository.findById(userId)
            .orElseThrow(() -> new UserNotFoundException("User not found"));
    
    // ... additional logout logic
    
    log.info("User logged out successfully: {}", userId);
}
```

Update AuthController:

```java
@PostMapping("/logout")
public ResponseEntity<ErrorResponseDto> logout(
        @RequestHeader("Authorization") String authHeader,
        @RequestBody(required = false) Map<String, String> body) {
    
    Authentication auth = SecurityContextHolder.getContext().getAuthentication();
    
    if (auth == null || !auth.isAuthenticated()) {
        return ResponseEntity.status(401)
                .body(ErrorResponseDto.unauthorized("User not authenticated"));
    }

    String accessToken = null;
    if (authHeader != null && authHeader.startsWith("Bearer ")) {
        accessToken = authHeader.substring(7);
        
        if (!jwtService.validateToken(accessToken)) {
            throw new IllegalArgumentException("Invalid or expired access token");
        }
    }

    String refreshToken = null;
    if (body != null && body.containsKey("refreshToken")) {
        refreshToken = body.get("refreshToken");
    }

    Long userId = Long.parseLong(auth.getName());
    authService.logoutUser(userId, accessToken, refreshToken);  // ✅ Pass both tokens

    return ResponseEntity.ok(ErrorResponseDto.builder()
            .code("SUCCESS")
            .message("Logged out successfully")
            .status(200)
            .timestamp(LocalDateTime.now())
            .build());
}
```

---

### ❌ T3: No Token Expiration Time Returned to Frontend

**Issue:** Frontend doesn't know when token expires, can't proactively refresh.

**Current Response:**
```json
{
    "accessToken": "eyJhbGciOiJIUzUxMiJ9...",
    "refreshToken": "eyJhbGciOiJIUzUxMiJ9...",
    "user": { ... }
}
// ❌ No expiration info
```

**Frontend Problem:**
```javascript
// Frontend has no idea when token expires
// Has to either:
// 1. Decode JWT to get exp claim (security risk)
// 2. Wait for 401 error (bad UX)
// 3. Guess expiration time (fragile)
```

**Impact:**
- Frontend can't implement proactive token refresh
- Frontend has to decode JWT (security risk - JWT not meant for encoding secrets)
- Bad UX (waits for error instead of preventing it)
- Race conditions (multiple requests before 401)

**Resolution:**

Update TokenResponseDto:

```java
package com.example.auth_service.DTO;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TokenResponseDto {
    
    private String accessToken;
    private String refreshToken;
    private long expiresIn;              // ✅ Access token expiration in ms
    private long refreshExpiresIn;       // ✅ Refresh token expiration in ms
    private String tokenType;            // e.g., "Bearer"
    private UserResponseDto user;
    
    public TokenResponseDto(String accessToken, String refreshToken, UserResponseDto user) {
        this.accessToken = accessToken;
        this.refreshToken = refreshToken;
        this.user = user;
        this.tokenType = "Bearer";
    }
}
```

Update JwtService to expose expiration times:

```java
public long getAccessTokenExpirationMs() {
    return accessTokenExpirationMs;
}

public long getRefreshTokenExpirationMs() {
    return refreshTokenExpirationMs;
}
```

Update AuthServiceImpl:

```java
@Override
public TokenResponseDto login(LoginRequestDto dto) {
    // ... validation and authentication ...
    
    String accessToken = jwtService.generateAccessToken(user, dto.getTableId());
    String refreshToken = jwtService.generateRefreshToken(user, dto.getTableId());
    
    TokenResponseDto response = new TokenResponseDto();
    response.setAccessToken(accessToken);
    response.setRefreshToken(refreshToken);
    response.setExpiresIn(jwtService.getAccessTokenExpirationMs());  // ✅ Add this
    response.setRefreshExpiresIn(jwtService.getRefreshTokenExpirationMs());  // ✅ Add this
    response.setTokenType("Bearer");
    response.setUser(new UserResponseDto(user));
    
    return response;
}
```

---

## API Response Format Issues

### ❌ R1: Inconsistent Success Response Format

**Issue:** Success responses don't have consistent format (some return object, some return string).

**Current Examples:**

Endpoint 1:
```json
{
    "accessToken": "...",
    "refreshToken": "...",
    "user": { ... }
}
```

Endpoint 2:
```json
{
    "email": "user@test.com",
    "fullName": "John Doe"
}
```

Endpoint 3:
```
"Logged out successfully"
```

**Impact:**
- Frontend has to handle each response differently
- Can't build generic response interceptor
- No way to know if response succeeded or failed
- No metadata (status code, timestamp)

**Resolution:**

Create ApiResponseDto wrapper:

```java
package com.example.auth_service.DTO;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ApiResponseDto<T> {
    
    private boolean success;           // true/false
    private T data;                    // Actual response data
    private String message;            // Success/info message
    private int status;                // HTTP status code
    private LocalDateTime timestamp;   // When response was generated
    private String path;               // Request path
    
    // Static factory methods
    public static <T> ApiResponseDto<T> success(T data, String message) {
        return ApiResponseDto.<T>builder()
                .success(true)
                .data(data)
                .message(message)
                .status(200)
                .timestamp(LocalDateTime.now())
                .build();
    }
    
    public static <T> ApiResponseDto<T> created(T data) {
        return ApiResponseDto.<T>builder()
                .success(true)
                .data(data)
                .message("Resource created successfully")
                .status(201)
                .timestamp(LocalDateTime.now())
                .build();
    }
    
    public static <T> ApiResponseDto<T> notFound(String message) {
        return ApiResponseDto.<T>builder()
                .success(false)
                .message(message)
                .status(404)
                .timestamp(LocalDateTime.now())
                .build();
    }
}
```

Update controllers to use this:

```java
@PostMapping("/login")
public ResponseEntity<ApiResponseDto<TokenResponseDto>> login(@RequestBody LoginRequestDto dto) {
    TokenResponseDto token = authService.login(dto);
    return ResponseEntity.ok(ApiResponseDto.success(token, "Login successful"));
}

@PostMapping("/logout")
public ResponseEntity<ApiResponseDto<?>> logout(...) {
    authService.logoutUser(userId, accessToken, refreshToken);
    return ResponseEntity.ok(ApiResponseDto.success(null, "Logged out successfully"));
}
```

---

### ❌ R2: No Pagination Support for List Endpoints

**Issue:** List endpoints return all records, no pagination.

**Current Code:**
```java
@GetMapping("/users")
@PreAuthorize("hasRole('ADMIN')")
public ResponseEntity<List<UserResponseDto>> getAllUsers() {
    return ResponseEntity.ok(authService.getAllUsers());  // ❌ Returns ALL users!
}
```

**Problem:**
```
GET /api/admin/users
  ↓
Returns 50,000 users
  ↓
JSON response is 10MB
  ↓
Browser/network timeout
  ↓
Frontend crashes
```

**Impact:**
- Performance issues (network bandwidth)
- Memory issues (large JSON parsing)
- Database performance (full table scan)
- Bad UX (slow response)

**Resolution:**

Create PageableDto:

```java
package com.example.auth_service.DTO;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PageableDto<T> {
    
    private List<T> content;           // Actual data
    private int pageNumber;            // Current page (0-indexed)
    private int pageSize;              // Items per page
    private long totalElements;        // Total items
    private int totalPages;            // Total pages
    private boolean hasNext;           // Has next page
    private boolean hasPrevious;       // Has previous page
}
```

Update AdminController:

```java
@GetMapping("/users")
@PreAuthorize("hasRole('ADMIN')")
public ResponseEntity<ApiResponseDto<PageableDto<UserResponseDto>>> getAllUsers(
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "20") int pageSize) {
    
    if (pageSize > 100) {
        pageSize = 100;  // Max 100 per page
    }
    
    // Use JpaRepository.findAll(Pageable)
    Pageable pageable = PageRequest.of(page, pageSize);
    Page<User> users = userRepository.findAll(pageable);
    
    List<UserResponseDto> content = users.getContent()
            .stream()
            .map(UserResponseDto::new)
            .toList();
    
    PageableDto<UserResponseDto> response = PageableDto.<UserResponseDto>builder()
            .content(content)
            .pageNumber(page)
            .pageSize(pageSize)
            .totalElements(users.getTotalElements())
            .totalPages(users.getTotalPages())
            .hasNext(users.hasNext())
            .hasPrevious(users.hasPrevious())
            .build();
    
    return ResponseEntity.ok(ApiResponseDto.success(response, "Users retrieved"));
}
```

Update interface:

```java
@Query("SELECT u FROM User u")
Page<User> findAll(Pageable pageable);
```

---

## Service-to-Service Communication

### ❌ S1: No Service-to-Service Authentication

**Issue:** If gateway is bypassed, any service can call auth-service without authentication.

**Scenario:**
```
Frontend → Gateway (validates JWT) → Auth-Service
                                        ↓
                                    ✅ Protected

But:

Payment Service → Auth-Service (directly)
                     ↓
                ❌ No auth! Anyone can call!
```

**Current SecurityConfig:**
```java
.authorizeHttpRequests(auth -> auth
    .requestMatchers("/api/auth/**").permitAll()  // ❌ Anyone can call!
    .anyRequest().authenticated()
)
```

**Impact:**
- Service-to-service calls not protected
- Any internal service can impersonate users
- Can bypass permission checks
- Data breach possible

**Resolution:**

1. **Add service-to-service authentication (Service API Key)**:

Create file: `src/main/java/com/example/auth_service/Security/ServiceApiKeyFilter.java`

```java
package com.example.auth_service.Security;

import jakarta.servlet.Filter;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.ServletRequest;
import jakarta.servlet.ServletResponse;
import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.io.IOException;

@Slf4j
@Component
public class ServiceApiKeyFilter implements Filter {

    @Value("${service.api-key:}")
    private String expectedApiKey;

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {

        if (request instanceof HttpServletRequest httpRequest) {
            String path = httpRequest.getRequestURI();
            
            // Check if it's an internal service endpoint
            if (path.startsWith("/api/internal/")) {
                String apiKey = httpRequest.getHeader("X-API-Key");
                
                if (apiKey == null || !apiKey.equals(expectedApiKey)) {
                    log.warn("Unauthorized service-to-service call to: {}", path);
                    // Don't set authentication, will be rejected by SecurityConfig
                }
            }
        }

        chain.doFilter(request, response);
    }
}
```

2. **Create internal service endpoints**:

Create file: `src/main/java/com/example/auth_service/Controller/InternalController.java`

```java
package com.example.auth_service.Controller;

import com.example.auth_service.DTO.UserResponseDto;
import com.example.auth_service.Entity.User;
import com.example.auth_service.Repository.UserRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Slf4j
@RestController
@RequestMapping("/api/internal")
public class InternalController {

    private final UserRepository userRepository;

    public InternalController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    /**
     * Get user by ID - for internal service-to-service calls only
     * Protected by X-API-Key header validation
     */
    @GetMapping("/users/{userId}")
    public ResponseEntity<UserResponseDto> getUserById(@PathVariable Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        return ResponseEntity.ok(new UserResponseDto(user));
    }

    /**
     * Verify user role - for internal authorization checks
     */
    @GetMapping("/users/{userId}/role")
    public ResponseEntity<Integer> getUserRole(@PathVariable Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        return ResponseEntity.ok(user.getRole());
    }
}
```

3. **Update SecurityConfig** to require API key for internal endpoints:

```java
.authorizeHttpRequests(auth -> auth
    .requestMatchers("/api/internal/**").authenticated()  // ✅ Requires X-API-Key
    .requestMatchers("/api/auth/**").permitAll()
    .requestMatchers("/api/profile/**").authenticated()
    .anyRequest().authenticated()
)
```

4. **Add to application.properties**:

```properties
# Service-to-Service API Key
service.api-key=${SERVICE_API_KEY:generate-strong-key-in-production}
```

---

### ❌ S2: No Request Tracing Between Services

**Issue:** When service calls another service, correlation ID is lost.

**Request Flow:**
```
Frontend
  └─ X-Correlation-Id: abc123
  └─ API Gateway
       └─ Passes to Auth-Service
            └─ Auth-Service calls Payment-Service
                 ❌ Doesn't pass correlation ID!
                 └─ Payment-Service logs have no correlation ID
```

**Impact:**
- Can't trace request across services
- Debugging distributed issues is hard
- No audit trail connecting service calls

**Resolution:**

Create RestTemplateBuilder with correlation ID:

```java
package com.example.auth_service.Config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.BufferingClientHttpRequestFactory;
import org.springframework.http.client.ClientHttpRequestFactory;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.client.RestTemplate;
import org.slf4j.MDC;

@Slf4j
@Configuration
public class RestClientConfig {

    @Bean
    public RestTemplate restTemplate(RestTemplateBuilder builder) {
        return builder
                .requestFactory(this::clientHttpRequestFactory)
                .interceptors((request, body, execution) -> {
                    // Propagate correlation ID to downstream services
                    String correlationId = MDC.get("correlationId");
                    if (correlationId != null) {
                        request.getHeaders().add("X-Correlation-Id", correlationId);
                    }
                    
                    // Also propagate other context
                    String userId = MDC.get("userId");
                    if (userId != null) {
                        request.getHeaders().add("X-User-Id", userId);
                    }
                    
                    return execution.execute(request, body);
                })
                .build();
    }

    private ClientHttpRequestFactory clientHttpRequestFactory() {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(5000);
        factory.setReadTimeout(10000);
        return new BufferingClientHttpRequestFactory(factory);
    }
}
```

---

## Removed Issues from First Plan

### Issues that are RESOLVED when using Gateway:

**❌ E6: No HTTPS Requirement** 
- **Status:** RESOLVED ✅ if Gateway enforces HTTPS
- **Reason:** Gateway handles HTTPS termination, internal service-to-service can use HTTP
- **Note:** Still verify gateway config enforces HTTPS

**❌ E7: No Authorization Check in Admin Endpoints**
- **Status:** MITIGATED ✅ if Gateway validates roles
- **Reason:** Gateway validates role before routing to /api/admin/**
- **Note:** Should still add @PreAuthorize for defense-in-depth

**❌ SEC4: No CORS Configuration**
- **Status:** RESOLVED ✅ if Gateway handles CORS
- **Reason:** Gateway handles CORS between frontend and gateway
- **Note:** Service should still have CORS config for direct calls

**E5: Weak JWT Secret**
- **Status:** VERIFIED ✅
- **Current:** Good 64-character secret in docker-compose.yml
- **Note:** Ensure environment variable is set in production

---

## Additional Security Issues

### ❌ SEC5: No JWT Key Rotation Strategy

**Issue:** JWT signing key never changes, if leaked all tokens are compromised.

**Impact:**
- Token compromise is permanent (no expiration of key)
- Can't revoke all tokens at once (need key rotation)
- Compliance: PCI DSS requires periodic key rotation

**Resolution:**

Implement key rotation (future-proofing):

Create file: `src/main/java/com/example/auth_service/Config/JwtKeyRotationConfig.java`

```java
package com.example.auth_service.Config;

import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;

import javax.crypto.SecretKey;
import java.util.*;

@Slf4j
@Configuration
@EnableScheduling
public class JwtKeyRotationConfig {

    @Value("${jwt.secret}")
    private String primarySecret;

    @Value("${jwt.legacy-secret:}")
    private String legacySecret;

    private final List<SecretKey> validationKeys = new ArrayList<>();

    @Bean
    public JwtKeyProvider jwtKeyProvider() {
        return new JwtKeyProvider(primarySecret, legacySecret);
    }

    /**
     * Service to manage JWT key rotation
     */
    @Slf4j
    public static class JwtKeyProvider {

        private final SecretKey primaryKey;
        private SecretKey legacyKey;  // For validating tokens signed with old key

        public JwtKeyProvider(String primarySecret, String legacySecret) {
            this.primaryKey = Keys.hmacShaKeyFor(
                    primarySecret.getBytes()
            );

            if (legacySecret != null && !legacySecret.isEmpty()) {
                this.legacyKey = Keys.hmacShaKeyFor(
                        legacySecret.getBytes()
                );
            }

            log.info("JWT keys initialized - primary key loaded");
        }

        public SecretKey getPrimaryKey() {
            return primaryKey;
        }

        public SecretKey getLegacyKey() {
            return legacyKey;
        }

        public List<SecretKey> getAllValidationKeys() {
            List<SecretKey> keys = new ArrayList<>();
            keys.add(primaryKey);
            if (legacyKey != null) {
                keys.add(legacyKey);
            }
            return keys;
        }
    }

    /**
     * Scheduled task to check for key rotation need (optional)
     */
    @Scheduled(fixedDelay = 86400000)  // Daily check
    public void checkKeyRotationNeeded() {
        // In production: Check if key needs rotation
        // Could store rotation schedule in database
        log.info("JWT key rotation check completed");
    }
}
```

Update JwtService to use JwtKeyProvider:

```java
private final JwtKeyProvider keyProvider;

public JwtService(UserRepository userRepository, 
                  TokenBlacklistService tokenBlacklistService,
                  JwtKeyProvider keyProvider) {
    this.userRepository = userRepository;
    this.tokenBlacklistService = tokenBlacklistService;
    this.keyProvider = keyProvider;
}

public String generateAccessToken(User user, Integer tableId) {
    return Jwts.builder()
            .subject(user.getId().toString())
            .claim("role", user.getRole())
            .issuedAt(new Date())
            .expiration(new Date(System.currentTimeMillis() + accessTokenExpirationMs))
            .signWith(keyProvider.getPrimaryKey())  // ✅ Use provider
            .compact();
}

public boolean validateToken(String token) {
    try {
        if (tokenBlacklistService.isBlacklisted(token)) {
            return false;
        }

        // Try primary key first
        Jwts.parser()
                .verifyWith(keyProvider.getPrimaryKey())
                .build()
                .parseSignedClaims(token);
        return true;

    } catch (Exception e) {
        // Try legacy key for tokens signed with old key
        if (keyProvider.getLegacyKey() != null) {
            try {
                Jwts.parser()
                        .verifyWith(keyProvider.getLegacyKey())
                        .build()
                        .parseSignedClaims(token);
                return true;  // Valid with legacy key
            } catch (Exception ignored) {
            }
        }
        return false;
    }
}
```

---

### ❌ SEC6: No Rate Limiting on Auth Endpoints

**Issue:** Brute force attacks possible on login endpoint.

**Current:** No rate limiting implemented

**Impact:**
- Attacker can try millions of password combinations
- Email enumeration possible (register endpoint)
- Resource exhaustion (DDoS)

**Resolution:** See E10 from first_plan.md - implement rate limiting

---

### ❌ SEC7: Sensitive Data in Logs

**Issue:** Passwords, tokens, or PII might be logged.

**Example:**
```java
log.info("User login: email={}, password={}", email, password);  // ❌ Don't log!
```

**Impact:**
- Passwords/tokens exposed in log files
- Log aggregation systems contain sensitive data
- Compliance violation (GDPR, PCI DSS)

**Resolution:**

Create LoggingUtil:

```java
package com.example.auth_service.Utils;

public class LoggingUtil {
    
    public static String maskEmail(String email) {
        if (email == null || email.length() < 3) {
            return "***";
        }
        String[] parts = email.split("@");
        if (parts.length < 2) return "***";
        
        String localPart = parts[0];
        String domain = parts[1];
        return localPart.charAt(0) + "***@" + domain;
    }
    
    public static String maskToken(String token) {
        if (token == null || token.length() < 20) {
            return "***";
        }
        return token.substring(0, 10) + "***" + token.substring(token.length() - 5);
    }
    
    public static String maskPassword(String password) {
        return password == null ? "***" : "***";
    }
}
```

Update controllers:

```java
log.info("Login attempt for email: {}", LoggingUtil.maskEmail(dto.getEmail()));

log.debug("Token generated: {}", LoggingUtil.maskToken(accessToken));
```

---

## Configuration Issues for Distributed Architecture

### ❌ CONF4: No Database Connection Pool Configuration

**Issue:** Default connection pool might not be optimal for multi-service setup.

**Impact:**
- Connection exhaustion under load
- Service hangs waiting for connections
- Multiple services compete for connections

**Resolution:** Add to application.properties:

```properties
# HikariCP Connection Pool
spring.datasource.hikari.maximum-pool-size=20
spring.datasource.hikari.minimum-idle=5
spring.datasource.hikari.connection-timeout=30000
spring.datasource.hikari.idle-timeout=600000
spring.datasource.hikari.max-lifetime=1800000
spring.datasource.hikari.auto-commit=true
spring.datasource.hikari.leak-detection-threshold=60000
```

---

### ❌ CONF5: No Graceful Shutdown Configuration

**Issue:** Service doesn't wait for requests to complete before shutting down.

**Impact:**
- In-flight requests fail during deployment
- Data corruption (incomplete transactions)
- Bad UX (user sees timeout/error)
- Unclean shutdown

**Resolution:**

Add to application.properties:

```properties
# Graceful shutdown
server.shutdown=graceful
spring.lifecycle.timeout-per-shutdown-phase=30s
```

Update Docker/K8s deployment to give service time to shutdown:

```yaml
terminationGracePeriodSeconds: 60  # K8s
```

---

### ❌ CONF6: Missing Redis Sentinel for High Availability

**Issue:** Single Redis instance is single point of failure for token blacklist.

**Impact:**
- If Redis down, token blacklist doesn't work
- Logged-out users can still use old tokens
- Service might crash if Redis unavailable

**Resolution:**

Update application.properties for Redis HA:

```properties
# Redis Sentinel Configuration
spring.data.redis.sentinel.master=redis-master
spring.data.redis.sentinel.nodes=${REDIS_SENTINEL_NODES:localhost:26379}
spring.data.redis.password=${REDIS_PASSWORD}
spring.data.redis.timeout=2000
```

Add fallback strategy if Redis unavailable:

```java
@Slf4j
@Service
public class TokenBlacklistService {

    private final RedisTemplate<String, Object> redisTemplate;
    private final LocalTokenBlacklistCache localCache;  // Fallback

    public TokenBlacklistService(RedisTemplate<String, Object> redisTemplate) {
        this.redisTemplate = redisTemplate;
        this.localCache = new LocalTokenBlacklistCache();
    }

    public void blacklistToken(String token) {
        try {
            redisTemplate.opsForValue().set(
                    "blacklist:" + token,
                    "true",
                    Duration.ofHours(24)
            );
        } catch (Exception e) {
            log.warn("Failed to blacklist token in Redis, using local cache: {}", e.getMessage());
            localCache.blacklist(token);  // Fallback
        }
    }

    public boolean isBlacklisted(String token) {
        try {
            Boolean exists = redisTemplate.hasKey("blacklist:" + token);
            return Boolean.TRUE.equals(exists);
        } catch (Exception e) {
            log.warn("Failed to check blacklist in Redis, using local cache: {}", e.getMessage());
            return localCache.isBlacklisted(token);
        }
    }
}
```

---

## Health & Monitoring for Gateway Routing

### ❌ MON1: No Health Check Endpoint for Gateway Routing

**Issue:** API Gateway doesn't know if service is healthy, might route to dead service.

**Location:** Missing /actuator/health endpoint

**Impact:**
- Gateway continues routing to unhealthy service
- Users see timeout/error
- No graceful degradation
- Cascading failures

**Resolution:**

1. **Add Spring Actuator** to pom.xml:

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-actuator</artifactId>
</dependency>
```

2. **Add to application.properties**:

```properties
# Actuator Configuration
management.endpoints.web.exposure.include=health,info,metrics,prometheus
management.endpoint.health.show-details=when-authorized
management.health.livenessState.enabled=true
management.health.readinessState.enabled=true
management.health.db.enabled=true
management.health.redis.enabled=true

# Metrics Configuration
management.metrics.export.prometheus.enabled=true
management.endpoints.web.base-path=/actuator

# Application info
info.app.name=Auth Service
info.app.version=0.0.1-SNAPSHOT
info.app.description=Authentication and Authorization Service
```

3. **Update SecurityConfig** to allow health endpoints:

```java
.authorizeHttpRequests(auth -> auth
    .requestMatchers("/actuator/health/**").permitAll()  // ✅ Allow health checks
    .requestMatchers("/actuator/info").permitAll()
    .requestMatchers("/api/auth/**").permitAll()
    // ... rest of configuration
)
```

4. **Create custom HealthIndicator** for dependencies:

```java
package com.example.auth_service.Health;

import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.actuate.health.Health;
import org.springframework.boot.actuate.health.HealthIndicator;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Component;

@Slf4j
@Component
public class RedisHealthIndicator implements HealthIndicator {

    private final RedisTemplate<String, Object> redisTemplate;

    public RedisHealthIndicator(RedisTemplate<String, Object> redisTemplate) {
        this.redisTemplate = redisTemplate;
    }

    @Override
    public Health health() {
        try {
            redisTemplate.opsForValue().set("health-check", "ok", 
                    java.time.Duration.ofSeconds(10));
            
            Object value = redisTemplate.opsForValue().get("health-check");
            
            if (value != null && value.equals("ok")) {
                redisTemplate.delete("health-check");
                return Health.up()
                        .withDetail("redis", "connected")
                        .build();
            }
        } catch (Exception e) {
            log.warn("Redis health check failed: {}", e.getMessage());
            return Health.down()
                    .withDetail("redis", "disconnected")
                    .withDetail("error", e.getMessage())
                    .build();
        }
        
        return Health.unknown().build();
    }
}
```

5. **Docker Compose health check**:

```yaml
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:8081/actuator/health/liveness"]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 30s
```

---

### ❌ MON2: No Metrics for Business Logic

**Issue:** No metrics on authentication attempts, token generation, etc.

**Impact:**
- Can't monitor service performance
- Can't detect attacks (multiple failed logins)
- Can't optimize (don't know what's slow)
- No alerting (system down without knowing)

**Resolution:**

Add Micrometer metrics:

```java
package com.example.auth_service.Service;

import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Timer;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
public class AuthService {

    private final MeterRegistry meterRegistry;
    
    private final Counter loginAttempts;
    private final Counter loginSuccess;
    private final Counter loginFailure;
    private final Counter registrationAttempts;
    private final Timer loginTimer;

    public AuthService(MeterRegistry meterRegistry, ...) {
        this.meterRegistry = meterRegistry;
        
        this.loginAttempts = Counter.builder("auth.login.attempts")
                .description("Total login attempts")
                .register(meterRegistry);
        
        this.loginSuccess = Counter.builder("auth.login.success")
                .description("Successful logins")
                .register(meterRegistry);
        
        this.loginFailure = Counter.builder("auth.login.failure")
                .description("Failed logins")
                .register(meterRegistry);
        
        this.registrationAttempts = Counter.builder("auth.registration.attempts")
                .description("Total registration attempts")
                .register(meterRegistry);
        
        this.loginTimer = Timer.builder("auth.login.duration")
                .description("Login request duration")
                .publishPercentiles(0.5, 0.95, 0.99)
                .register(meterRegistry);
    }

    public TokenResponseDto login(LoginRequestDto dto) {
        loginAttempts.increment();
        
        return loginTimer.record(() -> {
            try {
                TokenResponseDto token = performLogin(dto);
                loginSuccess.increment();
                return token;
            } catch (Exception e) {
                loginFailure.increment();
                throw e;
            }
        });
    }
}
```

---

## Summary Table

| Error ID | Severity | Type | Status | Gateway Impact |
|----------|----------|------|--------|-----------------|
| G1 | HIGH | X-Forwarded Headers | ❌ Not Implemented | Critical for routing |
| G2 | HIGH | X-User-Id Propagation | ❌ Not Implemented | Critical for user context |
| G3 | MEDIUM | Request/Response Logging | ❌ Not Implemented | Useful for debugging |
| F1 | HIGH | CORS for Frontend | ✅ Mitigated by Gateway | Should still add |
| F2 | HIGH | OPTIONS Preflight | ✅ Mitigated by Gateway | Should still add |
| F3 | HIGH | Token Refresh Response | ❌ Not Implemented | Breaks frontend |
| F4 | HIGH | Error Response Format | ❌ Not Implemented | Frontend integration |
| CH1 | MEDIUM | Custom Headers | ❌ Partial (Gateway) | Gateway should preserve |
| CH2 | LOW | Content-Type Validation | ❌ Not Implemented | Nice to have |
| T1 | MEDIUM | Token Rotation | ❌ Not Implemented | Security best practice |
| T2 | HIGH | Logout Invalidates Token | ❌ Not Implemented | Security issue |
| T3 | MEDIUM | Token Expiration to Frontend | ❌ Not Implemented | UX improvement |
| R1 | HIGH | Consistent Response Format | ❌ Not Implemented | Frontend integration |
| R2 | MEDIUM | Pagination Support | ❌ Not Implemented | Performance issue |
| S1 | HIGH | Service-to-Service Auth | ❌ Not Implemented | Security for microservices |
| S2 | MEDIUM | Request Tracing | ❌ Not Implemented | Observability |
| SEC5 | MEDIUM | JWT Key Rotation | ❌ Not Implemented | Future-proofing |
| SEC6 | HIGH | Rate Limiting | ❌ Not Implemented | Security |
| SEC7 | MEDIUM | Sensitive Data Logging | ❌ Not Implemented | Compliance |
| CONF4 | MEDIUM | Connection Pool | ❌ Not Implemented | Performance |
| CONF5 | MEDIUM | Graceful Shutdown | ❌ Not Implemented | Deployment |
| CONF6 | HIGH | Redis HA | ❌ Not Implemented | Reliability |
| MON1 | HIGH | Health Check Endpoint | ❌ Not Implemented | Gateway routing |
| MON2 | MEDIUM | Business Metrics | ❌ Not Implemented | Monitoring |

---

## Implementation Priority with Gateway

### Phase 1 (CRITICAL - Gateway Dependent)
1. **G2** - X-User-Id propagation from gateway
2. **F3** - Token refresh response format
3. **F4** - Standard error response format
4. **MON1** - Health check endpoint for gateway routing
5. **G1** - X-Forwarded headers support

### Phase 2 (HIGH - Frontend Blocking)
6. **F1** - CORS configuration for frontend
7. **T2** - Logout invalidates refresh token
8. **R1** - Consistent API response format
9. **S1** - Service-to-service authentication

### Phase 3 (MEDIUM - Operational)
10. **T1** - Token rotation on refresh
11. **G3** - Request/Response logging
12. **S2** - Request tracing correlation ID
13. **MON2** - Business metrics

### Phase 4 (LOW - Nice to Have)
14. **CH2** - Content-Type validation
15. **R2** - Pagination support
16. **T3** - Token expiration to frontend

---

## Next Steps

1. **Verify Gateway Configuration** - Ensure gateway passes required headers (X-User-Id, X-Correlation-Id)
2. **Implement Gateway Integration Features** (G1, G2, F1, F3, F4)
3. **Add Health & Monitoring** for proper routing
4. **Implement Service-to-Service Auth** for internal APIs
5. **Add Request Tracing** for distributed debugging
6. **Test Frontend Integration** thoroughly

---

**Document Version:** 1.0  
**Last Updated:** February 15, 2026  
**Scope:** Auth Service with API Gateway & Frontend  
**Status:** Ready for Implementation

