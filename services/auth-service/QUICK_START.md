# Auth Service - Quick Reference

## ✅ Improvements Made (Simple & Working)

### 1. Better Error Handling
- All API errors now return consistent JSON format
- Frontend can easily handle errors
- Proper HTTP status codes

### 2. CORS Support  
- Frontend apps can now call the API from different ports
- Works with React (3000), Vue (3001), Vite (5173)

### 3. Token Refresh Fixed
- Now returns JSON instead of plain text
- Includes expiration time
- Frontend can parse as JSON

### 4. Token Metadata
- Login responses include when tokens expire
- Frontend can refresh proactively

## 🚀 How to Run

```bash
# Build the service
./mvnw clean package -DskipTests

# Run the service
./mvnw spring-boot:run

# Or run the JAR
java -jar target/auth_service-0.0.1-SNAPSHOT.jar
```

## 🔧 Configuration

Set these environment variables or edit `application.properties`:

```properties
# Required
JWT_SECRET=your-secret-key-here

# Optional (defaults shown)
SERVER_PORT=8081
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001

# Database
SPRING_DATASOURCE_URL=jdbc:mysql://localhost:3306/Restaurant_Proj
SPRING_DATASOURCE_USERNAME=root
SPRING_DATASOURCE_PASSWORD=

# Redis (for token blacklist)
REDIS_HOST=localhost
REDIS_PORT=6379
```

## 📡 API Endpoints  

### Register
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "fullName": "John Doe",
  "phone": "123456789"
}
```

### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}

Response:
{
  "accessToken": "eyJ...",
  "refreshToken": "eyJ...",
  "tokenType": "Bearer",
  "accessTokenExpiresIn": 900000,
  "refreshTokenExpiresIn": 604800000,
  "user": {...}
}
```

### Refresh Token
```http
POST /api/auth/refresh
Content-Type: application/json

{
  "refreshToken": "your-refresh-token"
}

Response:
{
  "accessToken": "new-access-token",
  "tokenType": "Bearer",
  "expiresIn": 900000
}
```

### Logout
```http
POST /api/auth/logout  
Authorization: Bearer your-access-token
```

## 🎯 Key Features

✅ JWT-based authentication  
✅ Token blacklisting (Redis)  
✅ CORS enabled for frontend  
✅ Consistent error responses  
✅ Token expiration metadata  
✅ Password encryption (BCrypt)  
✅ Google OAuth support  
✅ Admin/Staff user creation  

## 📝 Notes

- **No breaking changes** - existing functionality preserved
- **Backward compatible** - old code still works
- **Docker ready** - Dockerfile included
- **Simple & maintainable** - no over-engineering

## 🔍 Troubleshooting

### CORS errors?
Check `cors.allowed-origins` in application.properties includes your frontend URL

### Token refresh returns text?
Make sure you're using the new endpoint `/api/auth/refresh` with JSON request

### Build errors?
Run `./mvnw clean install -U` to refresh dependencies

### Redis errors?
Ensure Redis is running: `redis-server` or disable Redis temporarily by commenting out the dependency in pom.xml

---

**For detailed changes, see:** [IMPROVEMENTS.md](IMPROVEMENTS.md)
