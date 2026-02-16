# API Gateway - Error Plan & Resolution Guide

## Table of Contents
1. [Authentication & Authorization Errors](#authentication--authorization-errors)
2. [JWT Token Errors](#jwt-token-errors)
3. [Configuration Errors](#configuration-errors)
4. [Routing Errors](#routing-errors)
5. [CORS Errors](#cors-errors)
6. [Network & Connectivity Errors](#network--connectivity-errors)
7. [Runtime Errors](#runtime-errors)
8. [Performance & Timeout Errors](#performance--timeout-errors)
9. [Data Validation Errors](#data-validation-errors)
10. [Downstream Service Errors](#downstream-service-errors)

---

## Authentication & Authorization Errors

### 1. Missing Authorization Header (401 Unauthorized)
**Error Code**: `401`  
**Error Message**: `"Missing or invalid Authorization header"`

**Cause**:
- Client didn't include the `Authorization` header in the request
- Authorization header doesn't start with "Bearer "

**Resolution**:
```bash
# Client should include header:
Authorization: Bearer <JWT_TOKEN>
```

**Prevention**:
- Ensure all protected endpoints include the Authorization header
- Implement client-side token management
- Check if the path is meant to be public (add to `gateway.public-paths` if needed)

---

### 2. Invalid JWT Token (401 Unauthorized)
**Error Code**: `401`  
**Error Message**: `"Invalid token"`

**Cause**:
- JWT signature verification failed
- Token was tampered with
- Wrong JWT secret being used

**Resolution**:
```yaml
# Verify JWT secret in application.yaml or environment
jwt:
  secret: ${JWT_SECRET}  # Must match auth service secret
```

**Prevention**:
- Ensure consistent JWT secret across auth service and gateway
- Use environment variables for secrets
- Never commit secrets to version control

---

### 3. Expired JWT Token (401 Unauthorized)
**Error Code**: `401`  
**Error Message**: `"Token has expired"`

**Cause**:
- JWT token's expiration time (`exp` claim) has passed
- Client is using an old cached token

**Resolution**:
```javascript
// Client should implement token refresh logic
if (response.status === 401 && response.error === "Token has expired") {
    // Request new token from /api/auth/refresh or re-login
}
```

**Prevention**:
- Implement token refresh mechanism
- Set appropriate token expiration times (e.g., 1 hour for access tokens)
- Implement automatic token renewal before expiration

---

### 4. Missing JWT Claims (400 Bad Request)
**Error Code**: `400`  
**Error Message**: `"JWT subject (userId) is missing"` or `"JWT role claim is missing"`

**Cause**:
- Auth service issued a JWT without required claims (userId, role)
- Malformed JWT structure

**Resolution**:
```java
// Auth service must include these claims when generating JWT:
Claims claims = Jwts.claims().setSubject(userId.toString());
claims.put("role", user.getRole());
claims.put("tableId", user.getTableId()); // Optional
```

**Prevention**:
- Validate JWT structure in auth service before issuing
- Add integration tests for JWT generation
- Document required JWT claims

---

### 5. Missing Table ID (400 Bad Request)
**Error Code**: `400`  
**Error Message**: `"TableId must be present in JWT claims or X-Table-Id header/query parameter"`

**Cause**:
- Protected endpoint requires tableId but it's not in JWT claims, headers, or query params
- Customer user without assigned table trying to access protected resources

**Resolution**:
```bash
# Option 1: Include in JWT claims (preferred)
# Auth service should add tableId when user logs in from a table

# Option 2: Send as header
X-Table-Id: 5

# Option 3: Send as query parameter
GET /api/orders?tableId=5
```

**Prevention**:
- Assign tableId during customer login/QR code scan
- Validate tableId presence at auth service before issuing JWT
- For admin/kitchen users, modify filter logic to skip tableId validation

---

### 6. Insufficient Permissions (403 Forbidden)
**Error Code**: `403`  
**Error Message**: `"Role {ROLE} is not authorized to access this resource"`

**Cause**:
- User's role doesn't have permission to access the requested path
- Example: CUSTOMER role trying to access `/api/admin/**`

**Resolution**:
```java
// Review role-based access rules in RoleAuthorizationFilter.java
private static final Map<String, List<String>> ROLE_ACCESS_RULES = Map.of(
    "/api/admin/**", List.of("ADMIN"),
    "/api/kds/**", List.of("ADMIN", "KITCHEN"),
    "/api/analytics/**", List.of("ADMIN")
);
```

**Prevention**:
- Implement role checks on client side (hide unauthorized UI elements)
- Document API authorization requirements
- Use appropriate role when testing endpoints

---

### 7. Invalid Table ID Format (400 Bad Request)
**Error Code**: `400`  
**Error Message**: Logged warning: `"Invalid X-Table-Id header format"` or `"Invalid tableId query parameter format"`

**Cause**:
- Table ID sent as non-numeric value
- Table ID cannot be parsed as Long

**Resolution**:
```bash
# Correct format:
X-Table-Id: 5          # Valid
tableId=10             # Valid

# Wrong format:
X-Table-Id: "five"     # Invalid
tableId=abc            # Invalid
```

**Prevention**:
- Validate table ID on client side before sending
- Use numeric input fields for table ID
- Add input validation in frontend

---

## JWT Token Errors

### 8. Invalid User ID Format in JWT (401 Unauthorized)
**Error Code**: `401`  
**Error Message**: `"Invalid userId format in token"`

**Cause**:
- JWT subject claim is not a valid Long number
- Subject contains non-numeric characters

**Resolution**:
```java
// Auth service must set subject as numeric string:
String userId = "12345";  // Valid
claims.setSubject(userId);

// Not:
String userId = "user_12345";  // Invalid
```

**Prevention**:
- Use numeric user IDs consistently
- Validate user ID format in auth service
- Add tests for JWT claim validation

---

### 9. Invalid Role Format in JWT (400 Bad Request)
**Error Code**: `400`  
**Error Message**: `"Role claim has invalid format"`

**Cause**:
- Role claim is not an Integer
- Role claim is missing from JWT

**Resolution**:
```java
// Auth service should set role as Integer:
claims.put("role", 1);  // CUSTOMER
claims.put("role", 2);  // ADMIN
claims.put("role", 3);  // KITCHEN

// Valid role values:
// 1 = CUSTOMER
// 2 = ADMIN
// 3 = KITCHEN
```

**Prevention**:
- Use integer role values consistently
- Document role enum values
- Add role validation in auth service

---

### 10. Invalid Table ID Type in JWT (Warning)
**Error Code**: N/A (Warning logged)  
**Error Message**: `"Unexpected tableId type in JWT"` or `"Invalid tableId format in JWT"`

**Cause**:
- Table ID in JWT is not Integer, Long, or String
- Table ID string cannot be parsed as number

**Resolution**:
```java
// Auth service should set tableId as Integer or Long:
claims.put("tableId", 5);      // Preferred
claims.put("tableId", 5L);     // Also valid
claims.put("tableId", "5");    // Valid (will be parsed)
```

**Prevention**:
- Use consistent numeric types for tableId
- Validate tableId type in auth service
- Consider making tableId optional for admin/kitchen roles

---

## Configuration Errors

### 11. Missing JWT Secret (500 Internal Server Error)
**Error Code**: `500`  
**Error Message**: Application fails to start or `"Token validation failed"`

**Cause**:
- `JWT_SECRET` environment variable is not set
- JWT secret is empty or null

**Resolution**:
```bash
# Set environment variable (Windows PowerShell):
$env:JWT_SECRET="your-secret-key-here-minimum-256-bits"

# Or in application.yaml:
jwt:
  secret: "your-secret-key-here-minimum-256-bits"

# Production (Docker/K8s):
# Use secrets management (Kubernetes Secrets, AWS Secrets Manager, etc.)
```

**Prevention**:
- Document required environment variables
- Add validation at startup to check for required config
- Use `.env.example` file with placeholders
- Never commit secrets to version control

---

### 12. Weak JWT Secret (Security Risk)
**Error Code**: Application startup failure  
**Error Message**: `"The specified key byte array is X bits which is not secure enough"`

**Cause**:
- JWT secret is shorter than 256 bits (32 characters)
- HS256 algorithm requires minimum 256-bit key

**Resolution**:
```bash
# Generate secure secret (minimum 32 characters):
# Option 1: Use online generator
# Option 2: Use command line
# PowerShell:
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | % {[char]$_})

# Minimum length: 32 characters for HS256
```

**Prevention**:
- Use cryptographically secure random secret generation
- Store secrets in secure vault (HashiCorp Vault, AWS Secrets Manager)
- Rotate secrets periodically

---

### 13. Missing Service URLs (500 Internal Server Error)
**Error Code**: `500`  
**Error Message**: `"Connection refused"` or route not found

**Cause**:
- Downstream service URL environment variables not set
- Services not running

**Resolution**:
```yaml
# Verify all service URLs in application.yaml:
AUTH_SERVICE_URL: http://localhost:8081
MENU_SERVICE_URL: http://localhost:8082
ORDER_SERVICE_URL: http://localhost:8083
ANALYTICS_SERVICE_URL: http://localhost:8084
KDS_SERVICE_URL: http://localhost:8085
CART_SERVICE_URL: http://localhost:8086
PAYMENT_SERVICE_URL: http://localhost:8087
AI_SERVICE_URL: http://localhost:8000
```

**Prevention**:
- Use service discovery (Eureka, Consul) in production
- Implement health checks for downstream services
- Add retry logic for transient failures
- Document all required service URLs

---

### 14. Invalid Public Paths Configuration (401 Unauthorized)
**Error Code**: `401`  
**Error Message**: Users get unauthorized errors on public endpoints

**Cause**:
- Public paths not correctly configured in `gateway.public-paths`
- Ant pattern matching incorrect

**Resolution**:
```yaml
# Verify public paths configuration:
gateway:
  public-paths: /api/auth/**,/api/categories/**,/api/menu/**,/api/media/**

# Ant pattern matching:
# /** - matches all paths at any depth
# /* - matches only one level
# /api/auth/** - matches /api/auth/login, /api/auth/register, etc.
```

**Prevention**:
- Test public endpoints without authentication
- Document which endpoints are public
- Use consistent path patterns

---

## Routing Errors

### 15. Route Not Found (404 Not Found)
**Error Code**: `404`  
**Error Message**: `"404 NOT_FOUND"`

**Cause**:
- No route matches the requested path
- Typo in URL
- Service not configured in gateway routes

**Resolution**:
```yaml
# Add route in application.yaml:
spring:
  cloud:
    gateway:
      routes:
        - id: new-service
          uri: ${NEW_SERVICE_URL:http://localhost:8088}
          predicates:
            - Path=/api/new-service/**
          filters:
            - RewritePath=/api/new-service/(?<segment>.*), /${segment}
```

**Prevention**:
- Document all available routes
- Use consistent URL patterns
- Add logging for unmatched routes
- Implement API documentation (Swagger/OpenAPI)

---

### 16. Path Rewrite Issues (404 or Incorrect Routing)
**Error Code**: `404` or unexpected behavior  
**Error Message**: Downstream service returns 404

**Cause**:
- RewritePath filter incorrectly configured
- Regex pattern doesn't match request path
- Downstream service expects different path format

**Resolution**:
```yaml
# Verify RewritePath filter:
filters:
  # Pattern: /api/menu/items -> /api/menu/items
  - RewritePath=/api/menu/(?<segment>.*), /api/menu/${segment}
  
  # To strip prefix: /api/menu/items -> /items
  - RewritePath=/api/menu/(?<segment>.*), /${segment}

# Test regex patterns using logging
```

**Prevention**:
- Test routing with different path patterns
- Log incoming and outgoing paths
- Document expected downstream service paths
- Use StripPrefix filter when appropriate

---

## CORS Errors

### 17. CORS Preflight Failure (403 Forbidden)
**Error Code**: `403` on OPTIONS request  
**Error Message**: Browser console shows CORS error

**Cause**:
- Origin not in allowed origins list
- CORS headers not properly configured
- OPTIONS request blocked

**Resolution**:
```yaml
# Add origin to allowed origins:
spring:
  cloud:
    gateway:
      globalcors:
        corsConfigurations:
          '[/**]':
            allowedOrigins:
              - http://localhost:3000
              - https://your-frontend-domain.com
            allowedOriginPatterns:
              - "https://*.vercel.app"
            allowedMethods:
              - GET
              - POST
              - PUT
              - DELETE
              - PATCH
              - OPTIONS
```

**Prevention**:
- Configure CORS before deployment
- Test with actual frontend domain
- Use environment variables for allowed origins
- Don't use "*" in production for security

---

### 18. Missing CORS Headers (CORS Error)
**Error Code**: Browser CORS error  
**Error Message**: `"No 'Access-Control-Allow-Origin' header"`

**Cause**:
- CORS not enabled
- Response doesn't include required headers
- Credentials flag mismatch

**Resolution**:
```yaml
# Ensure CORS configuration includes:
globalcors:
  corsConfigurations:
    '[/**]':
      allowedHeaders: ["*"]
      exposedHeaders:
        - X-Correlation-Id
        - Authorization
      allowCredentials: true
```

**Prevention**:
- Test CORS in development
- Match credentials settings between frontend and backend
- Document CORS requirements

---

## Network & Connectivity Errors

### 19. Connection Refused (503 Service Unavailable)
**Error Code**: `503`  
**Error Message**: `"Connection refused"` or `"No available servers"`

**Cause**:
- Downstream service is not running
- Wrong service URL/port
- Network connectivity issues
- Service crashed

**Resolution**:
```bash
# Check if service is running:
# Windows:
netstat -ano | findstr :8081

# Start the service if not running:
cd ../auth-service
mvn spring-boot:run

# Verify service URL in gateway configuration
```

**Prevention**:
- Implement health checks for all services
- Use service discovery (Eureka)
- Add circuit breaker pattern (Resilience4j)
- Monitor service availability

---

### 20. Connection Timeout (504 Gateway Timeout)
**Error Code**: `504`  
**Error Message**: `"Gateway Timeout"`

**Cause**:
- Downstream service taking too long to respond
- Network latency
- Service under heavy load
- Database query timeout

**Resolution**:
```yaml
# Configure timeout settings:
spring:
  cloud:
    gateway:
      httpclient:
        connect-timeout: 5000      # 5 seconds
        response-timeout: 30s      # 30 seconds
```

**Prevention**:
- Optimize downstream service performance
- Add connection pooling
- Implement caching for frequently accessed data
- Add timeout monitoring and alerts
- Consider async processing for long-running operations

---

### 21. DNS Resolution Failure (503 Service Unavailable)
**Error Code**: `503`  
**Error Message**: `"Unknown host"` or DNS error

**Cause**:
- Service hostname cannot be resolved
- DNS server issues
- Incorrect service URL

**Resolution**:
```yaml
# Use IP addresses temporarily:
AUTH_SERVICE_URL: http://127.0.0.1:8081

# Or verify hostname resolution:
# Windows:
nslookup auth-service
ping auth-service

# Check hosts file if using local DNS
```

**Prevention**:
- Use service discovery in production
- Configure proper DNS in deployment environment
- Test hostname resolution
- Have fallback IPs configured

---

## Runtime Errors

### 22. JSON Processing Error (500 Internal Server Error)
**Error Code**: `500`  
**Error Message**: Logged: `"Error serializing error response"`

**Cause**:
- ObjectMapper failed to serialize error response
- Circular reference in error object
- Invalid JSON structure

**Resolution**:
```java
// Check GlobalErrorHandler - ensure ErrorResponse is serializable
// Verify no circular references in exception classes

// Test error serialization:
ObjectMapper mapper = new ObjectMapper();
String json = mapper.writeValueAsString(errorResponse);
```

**Prevention**:
- Use @JsonIgnoreProperties on exception classes
- Test error response serialization
- Add Jackson configuration for error handling
- Avoid complex object graphs in error responses

---

### 23. Memory Leak / OutOfMemoryError (500 Internal Server Error)
**Error Code**: `500`  
**Error Message**: `"OutOfMemoryError: Java heap space"`

**Cause**:
- Memory leak in filter chain
- Too many concurrent requests
- Large request/response bodies
- Insufficient heap size

**Resolution**:
```bash
# Increase heap size:
# In Dockerfile or run command:
java -Xms512m -Xmx2048m -jar gateway.jar

# Monitor memory usage:
jconsole
# or
java -XX:+PrintGCDetails
```

**Prevention**:
- Implement request size limits
- Use streaming for large payloads
- Monitor memory usage
- Implement circuit breaker to prevent overload
- Profile application for memory leaks
- Add health checks with memory metrics

---

### 24. Thread Starvation / Reactor Issues
**Error Code**: Slow response or timeouts  
**Error Message**: `"reactor.core.scheduler.Schedulers"`

**Cause**:
- Blocking operations in reactive chain
- Thread pool exhausted
- Incorrect use of reactive APIs

**Resolution**:
```java
// Avoid blocking operations:
// BAD:
Mono.fromCallable(() -> {
    Thread.sleep(1000); // Blocking!
    return "result";
});

// GOOD:
Mono.delay(Duration.ofSeconds(1))
    .map(tick -> "result");

// Use proper schedulers for blocking I/O:
Mono.fromCallable(() -> blockingOperation())
    .subscribeOn(Schedulers.boundedElastic());
```

**Prevention**:
- Never block in reactive filters
- Use reactive libraries (WebClient, R2DBC)
- Monitor thread pool usage
- Profile reactive chains
- Add logging to identify blocking code

---

### 25. Correlation ID Missing (Warning)
**Error Code**: N/A (Functional issue)  
**Error Message**: Logged warnings with null correlation ID

**Cause**:
- CorrelationIdFilter not executing
- Filter order incorrect
- Exception thrown before filter execution

**Resolution**:
```java
// Verify filter order:
CorrelationIdFilter: Order = 1  (first)
LoggingFilter: Order = 2
JwtAuthenticationFilter: Order = 3
HeaderInjectionFilter: Order = 4
RoleAuthorizationFilter: Order = 5

// Check if filter is registered as @Component
```

**Prevention**:
- Test filter execution order
- Add null checks for correlation ID
- Log filter execution
- Use integration tests for filter chain

---

## Performance & Timeout Errors

### 26. Slow Response Times
**Error Code**: N/A (Performance issue)  
**Error Message**: Logged duration > threshold

**Cause**:
- Downstream service slow
- Network latency
- Heavy JWT validation
- Inefficient logging

**Resolution**:
```yaml
# Add caching for JWT validation results:
# Use Spring Cache with in-memory cache

# Enable connection pooling:
spring:
  cloud:
    gateway:
      httpclient:
        pool:
          type: ELASTIC
          max-connections: 100
          acquire-timeout: 45000

# Optimize logging:
logging:
  level:
    com.example.api_gateway: INFO  # Reduce from DEBUG in production
```

**Prevention**:
- Monitor response times
- Set SLA thresholds and alerts
- Use caching strategically
- Profile gateway performance
- Implement CDN for static content

---

### 27. Circuit Breaker Not Configured (Service Failures)
**Error Code**: `503` or `500`  
**Error Message**: Cascading failures when service is down

**Cause**:
- No circuit breaker implementation
- Repeated calls to failing service
- No fallback mechanism

**Resolution**:
```xml
<!-- Add Resilience4j dependency to pom.xml: -->
<dependency>
    <groupId>org.springframework.cloud</groupId>
    <artifactId>spring-cloud-starter-circuitbreaker-reactor-resilience4j</artifactId>
</dependency>
```

```yaml
# Configure circuit breaker:
spring:
  cloud:
    gateway:
      routes:
        - id: order-service
          uri: ${ORDER_SERVICE_URL}
          predicates:
            - Path=/api/orders/**
          filters:
            - name: CircuitBreaker
              args:
                name: orderServiceCircuitBreaker
                fallbackUri: forward:/fallback/orders
```

**Prevention**:
- Implement circuit breaker pattern
- Add fallback responses
- Monitor circuit breaker status
- Configure appropriate thresholds

---

## Data Validation Errors

### 28. Invalid Header Values
**Error Code**: `400` or validation error  
**Error Message**: Various depending on validation

**Cause**:
- Headers contain invalid characters
- Header values too long
- Required headers missing

**Resolution**:
```java
// Add validation in filters:
if (userId != null && userId <= 0) {
    throw new IllegalArgumentException("Invalid user ID");
}

// Sanitize header values:
String sanitized = headerValue.replaceAll("[^a-zA-Z0-9-_]", "");
```

**Prevention**:
- Validate all header values
- Set maximum header sizes
- Document header requirements
- Add input sanitization

---

### 29. Request Size Too Large (413 Payload Too Large)
**Error Code**: `413`  
**Error Message**: `"Payload too large"`

**Cause**:
- Request body exceeds maximum size
- Large file upload without proper configuration
- No size limits configured

**Resolution**:
```yaml
# Configure max request size:
spring:
  codec:
    max-in-memory-size: 10MB
```

**Prevention**:
- Set appropriate size limits
- Document upload size limits
- Use streaming for large files
- Implement chunked upload for very large files

---

## Downstream Service Errors

### 30. Service Returns Error Response (Various)
**Error Code**: Depends on service (400, 500, etc.)  
**Error Message**: Propagated from downstream service

**Cause**:
- Downstream service encountered error
- Invalid request sent to service
- Service business logic error

**Resolution**:
```bash
# Check downstream service logs
# Verify request headers being sent:
# X-User-Id, X-Table-Id, X-Role, X-Correlation-Id

# Test downstream service directly:
curl -H "X-User-Id: 1" \
     -H "X-Table-Id: 5" \
     -H "X-Role: CUSTOMER" \
     http://localhost:8083/api/orders
```

**Prevention**:
- Implement proper error propagation
- Add correlation ID for tracing
- Log downstream requests/responses
- Monitor downstream service health
- Add integration tests

---

### 31. Header Injection Failure (Missing Context)
**Error Code**: Downstream service error (often 400 or 403)  
**Error Message**: `"Missing required header"` from downstream service

**Cause**:
- HeaderInjectionFilter not executing
- Required attributes not set by JwtAuthenticationFilter
- Filter order incorrect

**Resolution**:
```java
// Verify filter chain execution:
// 1. CorrelationIdFilter (Order 1)
// 2. LoggingFilter (Order 2)
// 3. JwtAuthenticationFilter (Order 3) - Sets attributes
// 4. HeaderInjectionFilter (Order 4) - Reads attributes
// 5. RoleAuthorizationFilter (Order 5)

// Check logs for attribute values:
log.debug("Attributes: userId={}, tableId={}, role={}", 
    userId, tableId, roleName);
```

**Prevention**:
- Test filter chain integration
- Verify attribute propagation
- Add null checks in filters
- Test with different user roles

---

## Best Practices & Prevention

### General Error Prevention Strategies:

1. **Environment Configuration**
   - Use environment-specific configuration files
   - Validate all required environment variables at startup
   - Use configuration validation annotations

2. **Monitoring & Alerting**
   - Implement centralized logging (ELK, Splunk)
   - Set up metrics collection (Prometheus)
   - Configure alerts for error thresholds
   - Monitor correlation IDs across services

3. **Testing**
   - Unit tests for filters and validators
   - Integration tests for filter chain
   - End-to-end tests for complete flows
   - Load testing for performance validation

4. **Documentation**
   - Document all error codes and messages
   - Maintain API documentation
   - Document configuration requirements
   - Keep troubleshooting guides updated

5. **Security**
   - Rotate JWT secrets regularly
   - Use secrets management tools
   - Implement rate limiting
   - Add request size limits
   - Sanitize all inputs

6. **Resilience**
   - Implement circuit breaker pattern
   - Add retry logic with exponential backoff
   - Use timeouts appropriately
   - Implement graceful degradation

7. **Observability**
   - Use correlation IDs consistently
   - Implement distributed tracing (Zipkin, Jaeger)
   - Log all errors with context
   - Monitor key metrics (latency, error rate, throughput)

---

## Error Response Format

All errors from the gateway follow this standard format:

```json
{
  "status": 401,
  "error": "Unauthorized",
  "message": "Missing or invalid Authorization header",
  "path": "/api/orders",
  "timestamp": "2026-02-15T11:30:45",
  "correlationId": "550e8400-e29b-41d4-a716-446655440000"
}
```

### Response Headers:
- `X-Correlation-Id`: Unique request identifier for tracing
- `Content-Type`: `application/json`

---

## Quick Troubleshooting Checklist

When encountering an error, check:

- [ ] Is the JWT secret configured correctly?
- [ ] Are all downstream services running?
- [ ] Is the Authorization header present and formatted correctly?
- [ ] Does the user have the correct role for the endpoint?
- [ ] Is the correlation ID present in logs?
- [ ] Are service URLs configured correctly?
- [ ] Is CORS properly configured for the origin?
- [ ] Check the specific error code in this document
- [ ] Review logs with correlation ID
- [ ] Test the downstream service directly
- [ ] Verify environment variables

---

## Contact & Support

For additional support:
1. Check application logs with correlation ID
2. Review downstream service logs
3. Verify configuration files
4. Test individual components
5. Check network connectivity
6. Review recent changes to codebase

---

**Document Version**: 1.0  
**Last Updated**: February 15, 2026  
**Maintained By**: API Gateway Team

