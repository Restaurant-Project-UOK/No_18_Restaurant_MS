# Menu Service - Implementation Documentation

## Project Overview
This is a Spring Boot microservice responsible for managing restaurant menu items and images.

## Technology Stack
- **Java 17**
- **Spring Boot 3.5.7**
- **MySQL** - Menu metadata storage
- **MongoDB GridFS** - Image storage
- **Maven** - Build tool
- **Lombok** - Boilerplate reduction
- **Flyway** - Database migrations (optional)

## Project Structure
```
com.restaurant.menu_service/
├── MenuServiceApplication.java        # Main Spring Boot application
├── controller/
│   ├── MenuController.java           # Customer-facing endpoints
│   ├── AdminMenuController.java      # Admin management endpoints
│   └── MediaController.java          # Image streaming endpoints
├── service/
│   ├── MenuService.java              # Business logic for menu operations
│   └── MediaService.java             # MongoDB GridFS operations
├── repository/
│   ├── MenuItemRepository.java       # JPA repository for menu items
│   └── CategoryRepository.java       # JPA repository for categories
├── entity/
│   ├── MenuItem.java                 # Menu item entity (maps to 'items' table)
│   └── Category.java                 # Category entity
├── dto/
│   ├── CreateMenuItemRequest.java    # DTO for creating menu items
│   ├── UpdateMenuItemRequest.java    # DTO for updating menu items
│   └── MenuItemResponse.java         # DTO for API responses
└── exception/
    ├── GlobalExceptionHandler.java   # Centralized error handling
    ├── ResourceNotFoundException.java
    └── BadRequestException.java
```

## Database Design

### MySQL Tables (restaurant_db)

**items**
- `id` - Primary key (auto-increment)
- `restaurant_id` - Foreign key to restaurant
- `name` - Item name (max 100 chars)
- `description` - Text description
- `price` - Decimal(10,2)
- `image_id` - MongoDB ObjectId (nullable)
- `is_active` - Boolean (availability flag)
- `created_at` - Timestamp
- `updated_at` - Timestamp

**categories**
- `id` - Primary key
- `restaurant_id` - Foreign key
- `name` - Category name
- `sort_order` - Display order

**item_categories** (Many-to-Many)
- `item_id` - FK to items
- `category_id` - FK to categories

### MongoDB (restaurant_media)
Uses **GridFS** for storing image binaries with metadata.

## API Endpoints

### Customer Endpoints

#### Get Available Menu Items
```
GET /api/menu?restaurantId={id}
Response: List<MenuItemResponse>
```

#### Get Single Menu Item
```
GET /api/menu/{itemId}
Response: MenuItemResponse
```

### Admin Endpoints

#### Get All Menu Items (including inactive)
```
GET /api/admin/menu?restaurantId={id}
Response: List<MenuItemResponse>
```

#### Create Menu Item
```
POST /api/admin/menu
Content-Type: multipart/form-data

Parts:
- menuItem: CreateMenuItemRequest (JSON)
- image: MultipartFile (optional)

Response: MenuItemResponse (201 Created)
```

#### Update Menu Item
```
PUT /api/admin/menu/{itemId}
Content-Type: multipart/form-data

Parts:
- menuItem: UpdateMenuItemRequest (JSON)
- image: MultipartFile (optional)

Response: MenuItemResponse
```

#### Update Availability
```
PATCH /api/admin/menu/{itemId}/availability?isActive={true|false}
Response: MenuItemResponse
```

#### Delete Menu Item (Soft Delete)
```
DELETE /api/admin/menu/{itemId}
Response: 204 No Content
```

### Media Endpoints

#### Get Image
```
GET /api/media/{imageId}
Response: Image stream with correct Content-Type
```

#### Delete Image
```
DELETE /api/media/{imageId}
Response: 204 No Content
```

## Configuration

### application.yml
Located at `src/main/resources/application.yml`

Key configurations:
- **Server Port**: 8080
- **MySQL**: localhost:3306/restaurant_db
- **MongoDB**: localhost:27017/restaurant_media
- **File Upload**: Max 5MB per file, 10MB per request
- **JPA**: ddl-auto=update, show-sql=true
- **Flyway**: Currently disabled

## Design Decisions

### 1. Entity Naming
- Used `items` table name to match existing Flyway schema
- Used `is_active` field instead of `is_available` (schema alignment)

### 2. Separation of Concerns
- **Thin Controllers**: Only handle HTTP concerns
- **Thick Services**: All business logic in service layer
- **DTOs**: Never expose entities directly to clients

### 3. Image Management
- MongoDB GridFS for scalability
- Automatic cleanup on item deletion
- 5MB size limit, supports JPEG/PNG/WEBP
- Content-Type validation

### 4. Error Handling
- Global exception handler with `@RestControllerAdvice`
- Consistent error response format
- Validation errors with field-level details
- Comprehensive logging

### 5. Transaction Management
- `@Transactional` on write operations
- Read-only transactions for queries
- Proper rollback on failures

### 6. Image URL Generation
- Dynamic URL generation based on server port
- Format: `http://localhost:8080/api/media/{imageId}`

## Running the Application

### Prerequisites
1. MySQL server running on localhost:3306
2. MongoDB server running on localhost:27017
3. Java 17 installed
4. Maven installed (or use mvnw)

### Build
```bash
mvn clean install
```

### Run
```bash
mvn spring-boot:run
```

Or run the JAR:
```bash
java -jar target/menu-service-0.0.1-SNAPSHOT.jar
```

### Database Setup
The application will auto-create the database schema using JPA (ddl-auto=update).

To use Flyway migrations instead:
1. Set `spring.flyway.enabled=true` in application.yml
2. Ensure migration files are in `src/main/resources/db/migration`

## Testing with cURL

### Create a Menu Item
```bash
curl -X POST http://localhost:8080/api/admin/menu \
  -F 'menuItem={"restaurantId":1,"name":"Burger","description":"Delicious burger","price":12.99};type=application/json' \
  -F 'image=@path/to/image.jpg'
```

### Get Menu Items
```bash
curl http://localhost:8080/api/menu?restaurantId=1
```

### Update Availability
```bash
curl -X PATCH http://localhost:8080/api/admin/menu/1/availability?isActive=false
```

## Logging
Logs include:
- Menu item CRUD operations
- Image upload/delete events
- Validation errors
- SQL queries (for debugging)
- MongoDB operations

Log level: INFO (configurable in application.yml)

## Future Enhancements
- Add pagination for menu listings
- Implement caching (Redis)
- Add search and filtering capabilities
- Support multiple images per item
- Add image optimization/resizing
- Implement soft delete with restoration
- Add audit trail
- API versioning
- Rate limiting
- API documentation (Swagger/OpenAPI)

## Notes
- Flyway is currently disabled; JPA handles schema creation
- No security implemented yet (add Spring Security later)
- Image URLs are absolute (consider relative URLs for production)
- Consider adding a Restaurant entity for proper referential integrity

