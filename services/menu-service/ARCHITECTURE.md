# Menu Service - Architecture Overview

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                             │
├─────────────────────────────────────────────────────────────────┤
│  Customer Portal          Admin Portal          AI Service       │
│  (Browse Menu)           (Manage Menu)         (Menu Data)       │
└─────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                      MENU SERVICE (Port 8080)                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    CONTROLLER LAYER                       │  │
│  ├──────────────────────────────────────────────────────────┤  │
│  │  MenuController        AdminMenuController    Media       │  │
│  │  • GET /api/menu       • POST /api/admin/menu Controller  │  │
│  │  • GET /api/menu/:id   • PUT /api/admin/menu/:id          │  │
│  │                        • PATCH availability               │  │
│  │                        • DELETE                           │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                  │                               │
│                                  ▼                               │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                     SERVICE LAYER                         │  │
│  ├──────────────────────────────────────────────────────────┤  │
│  │  MenuService                  MediaService                │  │
│  │  • Business Logic             • Image Upload              │  │
│  │  • Validation                 • Image Retrieval           │  │
│  │  • Transactions               • Image Deletion            │  │
│  │  • DTO Mapping                • File Validation           │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                  │                               │
│                    ┌─────────────┴─────────────┐                │
│                    ▼                           ▼                │
│  ┌────────────────────────────┐  ┌──────────────────────────┐  │
│  │   REPOSITORY LAYER         │  │   GridFS Template        │  │
│  ├────────────────────────────┤  ├──────────────────────────┤  │
│  │  MenuItemRepository        │  │  MongoDB GridFS          │  │
│  │  CategoryRepository        │  │  Operations              │  │
│  └────────────────────────────┘  └──────────────────────────┘  │
│                    │                           │                │
└────────────────────┼───────────────────────────┼────────────────┘
                     │                           │
                     ▼                           ▼
      ┌───────────────────────┐    ┌───────────────────────┐
      │       MySQL           │    │      MongoDB          │
      │   (restaurant_db)     │    │  (restaurant_media)   │
      ├───────────────────────┤    ├───────────────────────┤
      │  • items              │    │  • fs.files           │
      │  • categories         │    │  • fs.chunks          │
      │  • item_categories    │    │  (GridFS)             │
      │  • restaurants        │    │                       │
      └───────────────────────┘    └───────────────────────┘
```

---

## Package Structure

```
com.restaurant.menu_service/
│
├── MenuServiceApplication.java
│   └── @SpringBootApplication
│
├── controller/
│   ├── MenuController.java
│   │   ├── GET /api/menu
│   │   └── GET /api/menu/{id}
│   │
│   ├── AdminMenuController.java
│   │   ├── GET /api/admin/menu
│   │   ├── POST /api/admin/menu
│   │   ├── PUT /api/admin/menu/{id}
│   │   ├── PATCH /api/admin/menu/{id}/availability
│   │   └── DELETE /api/admin/menu/{id}
│   │
│   └── MediaController.java
│       ├── GET /api/media/{imageId}
│       └── DELETE /api/media/{imageId}
│
├── service/
│   ├── MenuService.java
│   │   ├── getAvailableMenuItems()
│   │   ├── getAllMenuItems()
│   │   ├── getMenuItem()
│   │   ├── createMenuItem()
│   │   ├── updateMenuItem()
│   │   ├── updateAvailability()
│   │   └── deleteMenuItem()
│   │
│   └── MediaService.java
│       ├── uploadImage()
│       ├── getImage()
│       ├── deleteImage()
│       └── getContentType()
│
├── repository/
│   ├── MenuItemRepository.java
│   │   └── extends JpaRepository<MenuItem, Long>
│   │
│   └── CategoryRepository.java
│       └── extends JpaRepository<Category, Long>
│
├── entity/
│   ├── MenuItem.java
│   │   ├── @Entity @Table(name = "items")
│   │   └── @ManyToMany(categories)
│   │
│   └── Category.java
│       ├── @Entity @Table(name = "categories")
│       └── @ManyToMany(menuItems)
│
├── dto/
│   ├── CreateMenuItemRequest.java
│   │   └── Bean Validation
│   │
│   ├── UpdateMenuItemRequest.java
│   │   └── Optional fields
│   │
│   └── MenuItemResponse.java
│       └── CategoryInfo (nested DTO)
│
└── exception/
    ├── GlobalExceptionHandler.java
    │   └── @RestControllerAdvice
    │
    ├── ResourceNotFoundException.java
    │   └── HTTP 404
    │
    └── BadRequestException.java
        └── HTTP 400
```

---

## Data Flow Diagrams

### 1. Create Menu Item with Image

```
Admin Client
     │
     │ POST /api/admin/menu
     │ (multipart: menuItem JSON + image file)
     ▼
AdminMenuController
     │
     │ Validate request
     ▼
MenuService.createMenuItem()
     │
     ├──► MediaService.uploadImage()
     │        │
     │        ├─► Validate file type (JPEG/PNG/WEBP)
     │        ├─► Validate file size (< 5MB)
     │        │
     │        ▼
     │    GridFsTemplate.store()
     │        │
     │        ▼
     │    MongoDB (GridFS)
     │        │
     │    ◄───┘ Return imageId (ObjectId)
     │
     ├──► CategoryRepository.findById() (for each category)
     │        │
     │        ▼
     │    MySQL (categories table)
     │
     ├──► Create MenuItem entity
     │    Set imageId, categories, etc.
     │
     ▼
MenuItemRepository.save()
     │
     ▼
MySQL (items table)
     │
     ▼
Convert to MenuItemResponse
     │
     ▼
Return to Admin Client (HTTP 201)
```

### 2. Get Available Menu Items (Customer)

```
Customer Client
     │
     │ GET /api/menu?restaurantId=1
     ▼
MenuController
     │
     ▼
MenuService.getAvailableMenuItems()
     │
     ▼
MenuItemRepository.findByRestaurantIdAndIsActive(1, true)
     │
     ▼
MySQL (items + item_categories + categories)
     │ (EAGER fetch with JOIN)
     │
     ▼
List<MenuItem> entities
     │
     ├──► For each MenuItem:
     │    │
     │    ├─► Build imageUrl: http://localhost:8080/api/media/{imageId}
     │    ├─► Map categories to CategoryInfo DTOs
     │    └─► Create MenuItemResponse
     │
     ▼
List<MenuItemResponse>
     │
     ▼
Return to Customer Client (HTTP 200)
```

### 3. Stream Image

```
Client
     │
     │ GET /api/media/507f1f77bcf86cd799439011
     ▼
MediaController
     │
     ▼
MediaService.getImage(imageId)
     │
     ├──► Convert String to ObjectId
     │
     ▼
GridFsTemplate.findOne(query)
     │
     ▼
MongoDB (fs.files)
     │ Find metadata
     │
     ▼
GridFsTemplate.getResource(file)
     │
     ▼
MongoDB (fs.chunks)
     │ Stream binary chunks
     │
     ▼
GridFsResource (with InputStream)
     │
     ▼
MediaController wraps in InputStreamResource
     │
     ├─► Set Content-Type (image/jpeg, etc.)
     ├─► Set Content-Disposition (inline)
     │
     ▼
Stream to Client (HTTP 200)
```

---

## Database Schema

### MySQL Schema

```sql
┌──────────────────────────────────────┐
│          restaurants                 │
├──────────────────────────────────────┤
│ PK  id              BIGINT           │
│     name            VARCHAR(100)     │
└──────────────────────────────────────┘
                │
                │ 1:N
                ▼
┌──────────────────────────────────────┐
│          items (MenuItem)            │
├──────────────────────────────────────┤
│ PK  id              BIGINT           │
│ FK  restaurant_id   BIGINT           │
│     name            VARCHAR(100)     │
│     description     TEXT             │
│     price           DECIMAL(10,2)    │
│     image_id        VARCHAR(255)     │ ───► MongoDB ObjectId
│     is_active       BOOLEAN          │
│     created_at      TIMESTAMP        │
│     updated_at      TIMESTAMP        │
└──────────────────────────────────────┘
                │
                │ M:N
                ▼
┌──────────────────────────────────────┐
│       item_categories                │
├──────────────────────────────────────┤
│ PK,FK  item_id      BIGINT           │
│ PK,FK  category_id  BIGINT           │
└──────────────────────────────────────┘
                │
                │ M:N
                ▼
┌──────────────────────────────────────┐
│          categories                  │
├──────────────────────────────────────┤
│ PK  id              BIGINT           │
│ FK  restaurant_id   BIGINT           │
│     name            VARCHAR(100)     │
│     sort_order      INT              │
└──────────────────────────────────────┘
```

### MongoDB GridFS Schema

```
┌─────────────────────────────────────────┐
│          fs.files (Metadata)            │
├─────────────────────────────────────────┤
│ _id         ObjectId (PK)               │
│ filename    String                      │
│ length      Long                        │
│ chunkSize   Int                         │
│ uploadDate  Date                        │
│ metadata    Document                    │
│   ├─ _contentType: "image/jpeg"        │
└─────────────────────────────────────────┘
                  │
                  │ 1:N
                  ▼
┌─────────────────────────────────────────┐
│          fs.chunks (Binary Data)        │
├─────────────────────────────────────────┤
│ _id         ObjectId (PK)               │
│ files_id    ObjectId (FK → fs.files)    │
│ n           Int (chunk sequence)        │
│ data        BinData (binary chunk)      │
└─────────────────────────────────────────┘
```

---

## Error Handling Flow

```
Request
   │
   ▼
Controller
   │
   ├──► Bean Validation Failed
   │     └──► MethodArgumentNotValidException
   │           └──► GlobalExceptionHandler
   │                 └──► HTTP 400 + field errors
   │
   ▼
Service
   │
   ├──► Resource Not Found
   │     └──► ResourceNotFoundException
   │           └──► GlobalExceptionHandler
   │                 └──► HTTP 404
   │
   ├──► Business Logic Error
   │     └──► BadRequestException
   │           └──► GlobalExceptionHandler
   │                 └──► HTTP 400
   │
   ├──► Unexpected Exception
   │     └──► Exception
   │           └──► GlobalExceptionHandler
   │                 └──► HTTP 500
   │
   ▼
Success Response
```

### Error Response Format

```json
{
  "timestamp": "2025-12-14T10:30:45",
  "status": 400,
  "error": "Bad Request",
  "message": "Invalid input parameters",
  "validationErrors": {
    "name": "Name is required",
    "price": "Price must be greater than 0"
  }
}
```

---

## Configuration Layers

```
┌─────────────────────────────────────────────┐
│         application.yml                     │
├─────────────────────────────────────────────┤
│  • Server (port: 8080)                      │
│  • MySQL datasource                         │
│  • JPA/Hibernate                            │
│  • MongoDB connection                       │
│  • File upload limits                       │
│  • Logging levels                           │
└─────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────┐
│     Spring Boot Auto-Configuration          │
├─────────────────────────────────────────────┤
│  • DataSource (HikariCP)                    │
│  • EntityManagerFactory                     │
│  • MongoTemplate                            │
│  • GridFsTemplate                           │
│  • JpaRepositories                          │
│  • TransactionManager                       │
│  • Jackson (JSON)                           │
│  • Hibernate                                │
└─────────────────────────────────────────────┘
```

---

## Transaction Boundaries

```
┌─────────────────────────────────────────────┐
│         @Transactional Methods              │
├─────────────────────────────────────────────┤
│                                             │
│  MenuService.createMenuItem()               │
│  ┌─────────────────────────────────────┐   │
│  │ BEGIN TRANSACTION                   │   │
│  │ 1. Upload image to MongoDB          │   │
│  │ 2. Fetch categories from MySQL      │   │
│  │ 3. Create MenuItem                  │   │
│  │ 4. Save to MySQL                    │   │
│  │ COMMIT                              │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  MenuService.updateMenuItem()               │
│  ┌─────────────────────────────────────┐   │
│  │ BEGIN TRANSACTION                   │   │
│  │ 1. Fetch existing MenuItem          │   │
│  │ 2. Delete old image (if replacing)  │   │
│  │ 3. Upload new image                 │   │
│  │ 4. Update categories                │   │
│  │ 5. Save changes                     │   │
│  │ COMMIT                              │   │
│  └─────────────────────────────────────┘   │
│                                             │
└─────────────────────────────────────────────┘

Note: MongoDB operations are NOT part of JPA
transactions (different connection).
```

---

## Key Design Patterns Used

1. **Repository Pattern** - Data access abstraction
2. **DTO Pattern** - Decouple API from domain model
3. **Service Layer Pattern** - Business logic encapsulation
4. **Exception Handler Pattern** - Centralized error handling
5. **Builder Pattern** - Entity/DTO construction (Lombok)
6. **Dependency Injection** - Constructor injection with Spring
7. **REST Pattern** - Resource-based API design

---

This completes the architectural overview of the menu-service!

