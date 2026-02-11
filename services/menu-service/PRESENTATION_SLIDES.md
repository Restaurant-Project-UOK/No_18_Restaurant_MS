# Menu Service - Presentation Slides

---

## SLIDE 1: Title Slide

### **Menu Service**
**Restaurant Menu Management System**

*Microservice for managing menu items, categories, and images*

**Technology:** Spring Boot | MySQL | MongoDB GridFS  
**Port:** 8080  
**Team:** [Your Team Name]  
**Date:** December 2025

---

## SLIDE 2: What is Menu Service?

### **Purpose**
Central repository for restaurant menu data and images

### **Key Responsibilities**
- ✅ Manage menu items (CRUD operations)
- ✅ Store and serve menu images
- ✅ Organize items into categories
- ✅ Control item availability (active/inactive)

### **Why It Matters**
Single source of truth for menu data across all customer and staff applications

---

## SLIDE 3: System Architecture

```
┌──────────────────────────────────────────────┐
│        MENU SERVICE (8080)                   │
├──────────────────────────────────────────────┤
│                                              │
│  Customer Endpoints                          │
│  ├─ MenuController                           │
│  │  └─ GET /api/menu (browse items)          │
│                                              │
│  Admin Endpoints                             │
│  ├─ AdminMenuController                      │
│  │  └─ POST/PUT/PATCH/DELETE (manage)        │
│                                              │
│  Media Endpoints                             │
│  ├─ MediaController                          │
│  │  └─ GET /api/media/{id} (stream image)    │
│                                              │
│  Service Layer                               │
│  ├─ MenuService (business logic)             │
│  ├─ MediaService (image handling)            │
│                                              │
│  Dual Database Storage                       │
│  ├─ MySQL (menu metadata)                    │
│  └─ MongoDB GridFS (images)                  │
└──────────────────────────────────────────────┘
```

---

## SLIDE 4: Dual Database Design

### **Why Two Databases?**

**MySQL - Menu Metadata**
- Structured data (name, price, categories)
- Fast queries and joins
- Transaction support

**MongoDB GridFS - Images**
- Binary file storage
- Scalable for large files
- Metadata + chunked storage

### **Best of Both Worlds**
✅ Relational for structured data  
✅ NoSQL for unstructured data (images)

---

## SLIDE 5: Database Schema

### **MySQL Tables**

**items**
| Column | Type | Description |
|--------|------|-------------|
| id | BIGINT | Primary key |
| name | VARCHAR(100) | Item name |
| description | TEXT | Item details |
| price | DECIMAL(10,2) | Item price |
| image_id | VARCHAR(255) | MongoDB reference |
| is_active | BOOLEAN | Availability |
| created_at | TIMESTAMP | Creation time |
| updated_at | TIMESTAMP | Last update |

**categories**
| Column | Type | Description |
|--------|------|-------------|
| id | BIGINT | Primary key |
| name | VARCHAR(100) | Category name |
| sort_order | INT | Display order |

**item_categories** (Many-to-Many)
| Column | Type |
|--------|------|
| item_id | BIGINT FK |
| category_id | BIGINT FK |

---

## SLIDE 6: MongoDB GridFS Structure

### **How Images are Stored**

**fs.files Collection** (Metadata)
```json
{
  "_id": "675c1234567890abcdef1234",
  "filename": "pizza.jpg",
  "contentType": "image/jpeg",
  "length": 245678,
  "uploadDate": "2025-12-14T10:30:00Z"
}
```

**fs.chunks Collection** (Binary Data)
- Large files split into 255KB chunks
- Efficient streaming
- Supports files up to 16MB

### **Why GridFS?**
✅ Handles files > 16MB  
✅ Built-in metadata storage  
✅ Efficient chunked retrieval  
✅ Scalable

---

## SLIDE 7: API Endpoints (9 Total)

### **Customer Endpoints** (Read-Only)
```
GET  /api/menu              - Browse all available items
GET  /api/menu/{id}         - Get single item details
GET  /api/media/{imageId}   - Stream menu item image
```

### **Admin Endpoints** (Management)
```
GET    /api/admin/menu                    - All items (including inactive)
POST   /api/admin/menu                    - Create item + upload image
PUT    /api/admin/menu/{id}               - Update item + replace image
PATCH  /api/admin/menu/{id}/availability  - Toggle active/inactive
DELETE /api/admin/menu/{id}               - Delete item
DELETE /api/media/{imageId}               - Delete image
```

---

## SLIDE 8: Key Feature - Image Upload

### **The Challenge**
How to handle menu item data (JSON) AND image file together?

### **The Solution**
**Multipart Form Data!**

```http
POST /api/admin/menu
Content-Type: multipart/form-data

Parts:
  - menuItem: {
      "name": "Margherita Pizza",
      "price": 14.99,
      "description": "Classic Italian pizza"
    }
  - image: [pizza.jpg file]
```

### **Processing Flow**
1. Receive multipart request
2. Validate JSON data (name, price)
3. Validate image (type, size < 5MB)
4. Upload image to MongoDB GridFS
5. Save metadata to MySQL with imageId reference
6. Return response with image URL

---

## SLIDE 9: Sample Request/Response

### **Create Menu Item**
```http
POST http://localhost:8080/api/admin/menu
Content-Type: multipart/form-data

menuItem: {
  "name": "Margherita Pizza",
  "description": "Classic pizza",
  "price": 14.99,
  "isActive": true,
  "categoryIds": [1, 3]
}
image: [File: pizza.jpg]
```

### **Response**
```json
{
  "id": 10,
  "name": "Margherita Pizza",
  "description": "Classic pizza",
  "price": 14.99,
  "imageUrl": "http://localhost:8080/api/media/675c...",
  "isActive": true,
  "categories": [
    {"id": 1, "name": "Main Course"},
    {"id": 3, "name": "Popular Items"}
  ],
  "createdAt": "2025-12-14T10:30:00",
  "updatedAt": "2025-12-14T10:30:00"
}
```

---

## SLIDE 10: Category System

### **Purpose**
Organize menu items for better navigation

### **Many-to-Many Relationship**
- One item can be in multiple categories
- One category contains multiple items

### **Example**
```
"Caesar Salad" belongs to:
  ✅ Appetizers
  ✅ Healthy Options
  ✅ Vegetarian

"Main Course" category contains:
  ✅ Steak
  ✅ Pasta
  ✅ Burger
```

### **Benefits**
- Flexible organization
- Better user navigation
- Easy filtering

---

## SLIDE 11: Availability Management

### **Active vs Inactive Items**

**Active (is_active = true)**
- Visible to customers
- Can be added to cart
- Shows in menu browsing

**Inactive (is_active = false)**
- Hidden from customers
- Still in database (soft delete)
- Can be reactivated

### **Use Cases**
- 🕐 Seasonal items (summer specials)
- 📦 Out of stock (temporarily hide)
- 🔧 Under development (not ready yet)

### **Toggle Endpoint**
```http
PATCH /api/admin/menu/10/availability?isActive=false
```

---

## SLIDE 12: Image Workflow

### **Upload Process**

```
Admin → POST /api/admin/menu
  ↓
MenuService.createMenuItem()
  ↓
MediaService.uploadImage()
  ├─ Validate file type (JPEG/PNG/WEBP)
  ├─ Validate size (< 5MB)
  └─ Store in MongoDB GridFS
  ↓
Returns imageId (ObjectId)
  ↓
MenuItem.setImageId(imageId)
  ↓
Save to MySQL
  ↓
Generate imageUrl for response
```

### **Retrieval Process**

```
Customer → GET /api/menu
  ↓
Response includes imageUrl:
"http://localhost:8080/api/media/675c..."
  ↓
Browser → GET /api/media/675c...
  ↓
MediaController.getImage()
  ↓
Stream from MongoDB GridFS
  ↓
Set Content-Type: image/jpeg
  ↓
Browser displays image
```

---

## SLIDE 13: Technology Stack

### **Backend**
- **Framework:** Spring Boot 3.5.7
- **Language:** Java 17
- **Build:** Maven

### **Databases**
- **MySQL 8.0** - Menu metadata
- **MongoDB 4.4+** - GridFS for images
- **ORM:** Hibernate + JPA
- **MongoDB:** Spring Data MongoDB

### **Key Libraries**
- **Validation:** Jakarta Bean Validation
- **File Upload:** Spring MultipartFile
- **Image Processing:** GridFsTemplate
- **Logging:** SLF4J + Logback

---

## SLIDE 14: Design Patterns Used

### **1. Repository Pattern**
```java
MenuItemRepository extends JpaRepository
```
Abstracts database operations

### **2. Service Layer Pattern**
Business logic separated from controllers

### **3. DTO Pattern**
```java
MenuItemResponse (API) ≠ MenuItem (Entity)
```
Decouples API from database

### **4. Strategy Pattern**
Different handling for MySQL vs MongoDB

### **5. Builder Pattern**
```java
MenuItem.builder()
  .name("Pizza")
  .price(14.99)
  .build()
```

---

## SLIDE 15: Validation & Error Handling

### **Input Validation**

**Menu Item**
- ✅ Name: required, max 100 chars
- ✅ Price: required, must be > 0
- ✅ Description: max 2000 chars

**Image File**
- ✅ Type: JPEG, PNG, or WEBP only
- ✅ Size: maximum 5MB
- ✅ Not null when required

### **Error Responses**
```json
{
  "timestamp": "2025-12-14T10:30:00",
  "status": 400,
  "error": "Bad Request",
  "message": "Invalid file type. Allowed: JPEG, PNG, WEBP",
  "validationErrors": {
    "name": "Name is required",
    "price": "Price must be greater than 0"
  }
}
```

---

## SLIDE 16: Key Features Demonstrated

### **✅ Technical Skills**
- Dual database architecture
- File upload handling
- RESTful API design
- Many-to-many relationships
- Image streaming
- Bean validation

### **✅ Real-World Concepts**
- Content management system
- Binary file storage
- Category organization
- Soft delete pattern
- API security (admin vs customer)

---

## SLIDE 17: Security Considerations

### **Endpoint Separation**

**Public** (`/api/menu`)
- Read-only access
- No authentication needed
- Only shows active items

**Admin** (`/api/admin/menu`)
- Full CRUD operations
- Should require authentication (JWT)
- Sees all items (active + inactive)

### **File Upload Security**
- ✅ File type whitelist
- ✅ File size limits
- ✅ Virus scanning (future)
- ✅ Content-Type validation

---

## SLIDE 18: Demo Scenarios

### **Scenario 1: Add New Menu Item** 👨‍💼
1. Admin opens menu management
2. Fills form: Name, Price, Description
3. Uploads pizza image
4. Assigns categories: Main Course, Italian
5. Clicks "Create"
6. Item appears in customer menu

### **Scenario 2: Seasonal Item** 🌞
1. Summer ends, hide "Iced Coffee"
2. Admin: PATCH availability = false
3. Item disappears from customer menu
4. Data still in database
5. Winter ends: Set availability = true
6. Item reappears automatically

### **Scenario 3: Price Update** 💰
1. Cost increase, update "Steak" price
2. Admin: PUT with new price
3. Old orders still show old price (Order Service stores snapshot)
4. New orders use new price

---

## SLIDE 19: Integration with Other Services

### **Order Service Integration**
```
Order Service needs menu item details
  ↓
GET /api/menu/{itemId}
  ↓
Returns: name, price, image
  ↓
Order Service stores snapshot
(preserves data even if menu changes)
```

### **Cart Service Integration**
```
Cart needs to validate items exist
  ↓
GET /api/menu/{itemId}
  ↓
Validate price matches
Add to cart
```

### **AI Chatbot Integration**
```
Customer: "Show me desserts"
  ↓
AI → GET /api/menu
  ↓
Filter by category
  ↓
Present to customer
```

---

## SLIDE 20: Transaction Management

### **Menu Item Creation**

```java
@Transactional
public MenuItemResponse createMenuItem(request, image) {
    // 1. Upload image to MongoDB
    String imageId = mediaService.uploadImage(image);
    
    // 2. Create menu item entity
    MenuItem item = MenuItem.builder()
        .name(request.getName())
        .imageId(imageId)
        .build();
    
    // 3. Save to MySQL (transaction)
    menuItemRepository.save(item);
    // Commit happens here
    
    return response;
}
```

**If MySQL save fails:**
- Transaction rolls back
- But image already in MongoDB! 
- **Improvement needed:** Compensating transaction or 2-phase commit

---

## SLIDE 21: Logging & Monitoring

### **What We Log**

```
INFO  - POST /api/admin/menu - name: Margherita Pizza
INFO  - Image uploaded successfully with ID: 675c...
INFO  - Menu item created successfully with ID: 10
INFO  - GET /api/menu - Fetching available menu items
INFO  - Image retrieved successfully: 675c...
```

### **Error Logs**
```
ERROR - Failed to upload image: File size exceeds 5MB
ERROR - Menu item not found with id: 999
WARN  - Image not found for deletion: invalid_id
```

### **Benefits**
- Track usage patterns
- Debug issues quickly
- Monitor performance
- Audit trail

---

## SLIDE 22: Performance Optimizations

### **Database Optimizations**
```java
@ManyToMany(fetch = FetchType.EAGER)
```
- Eager loading for categories (single query)
- Avoids N+1 problem

### **Connection Pooling**
```yaml
hikari:
  maximum-pool-size: 10
  minimum-idle: 5
```

### **Image Streaming**
- Stream directly from GridFS
- No full file load into memory
- Supports large images efficiently

### **Caching** (Future)
- Redis for frequently accessed menu
- Cache invalidation on updates

---

## SLIDE 23: Challenges & Solutions

### **Challenge 1: Image Storage**
**Problem:** Where to store images? Filesystem vs Database?  
**Solution:** MongoDB GridFS - scalable, metadata support, clusterable

### **Challenge 2: Dual Database Consistency**
**Problem:** Image uploaded but MySQL save fails  
**Solution:** Log errors, manual cleanup (future: saga pattern)

### **Challenge 3: Category Management**
**Problem:** Many-to-many relationship complexity  
**Solution:** Junction table + JPA manages it automatically

### **Challenge 4: Image URLs**
**Problem:** How do clients access images?  
**Solution:** Return full URL in response: `imageUrl: "http://...api/media/..."`

---

## SLIDE 24: Code Quality

### **Best Practices Followed**
- ✅ Separation of concerns (Controller/Service/Repository)
- ✅ DTO pattern (no entity exposure)
- ✅ Constructor injection (Lombok @RequiredArgsConstructor)
- ✅ Proper exception handling
- ✅ Bean validation
- ✅ Comprehensive logging
- ✅ Meaningful names

### **Code Metrics**
- Classes: 16
- Endpoints: 9
- Build Time: ~3 seconds
- Compilation Errors: 0
- Warnings: 0 ✅

---

## SLIDE 25: Testing Strategy

### **Unit Tests**
- Service methods (business logic)
- Validation rules
- DTO mapping

### **Integration Tests**
- Database operations
- GridFS operations
- REST endpoints

### **Manual Testing**
- Postman for API testing
- Image upload scenarios
- Category assignments

### **Test Scenarios**
- ✅ Create item without image
- ✅ Create item with image
- ✅ Invalid file type rejection
- ✅ File size limit enforcement
- ✅ Category assignment

---

## SLIDE 26: Deployment

### **Local Development**
```bash
# Start MySQL
docker run -p 3306:3306 mysql:8.0

# Start MongoDB
docker run -p 27017:27017 mongo:4.4

# Run service
mvn spring-boot:run
# Runs on http://localhost:8080
```

### **Production Deployment**
```bash
mvn clean package
java -jar target/menu-service.jar
```

### **Docker**
```dockerfile
FROM openjdk:17-slim
COPY target/menu-service.jar app.jar
ENTRYPOINT ["java","-jar","/app.jar"]
```

### **Environment Variables**
- `DB_URL` - MySQL connection
- `MONGODB_URI` - MongoDB connection

---

## SLIDE 27: API Documentation Example

### **Get All Menu Items**
```
GET /api/menu
Response: 200 OK
[
  {
    "id": 10,
    "name": "Margherita Pizza",
    "price": 14.99,
    "imageUrl": "http://localhost:8080/api/media/675c...",
    "isActive": true,
    "categories": [
      {"id": 1, "name": "Main Course"}
    ]
  }
]
```

### **Toggle Availability**
```
PATCH /api/admin/menu/10/availability?isActive=false
Response: 200 OK
{
  "id": 10,
  "name": "Margherita Pizza",
  "isActive": false,
  ...
}
```

---

## SLIDE 28: Future Enhancements

### **Planned Features**
- 🔍 **Search & Filter** - Search by name, category, price range
- ⭐ **Ratings** - Customer ratings and reviews
- 🏷️ **Tags** - Dietary tags (vegan, gluten-free, spicy)
- 📊 **Analytics** - Popular items, trending dishes
- 🌍 **Multi-language** - Menu in multiple languages
- 💰 **Dynamic Pricing** - Time-based pricing (happy hour)
- 🎨 **Multiple Images** - Gallery per item
- 📝 **Nutrition Info** - Calories, allergens

### **Technical Improvements**
- 🔄 **Event-driven** - Kafka for menu updates
- 💾 **Caching** - Redis for faster reads
- 🔐 **OAuth2** - Enhanced security
- 📈 **Metrics** - Prometheus monitoring

---

## SLIDE 29: Business Value

### **For Restaurant Owners**
- ✅ Easy menu management
- ✅ Quick updates (price, availability)
- ✅ Image showcase
- ✅ Flexible categorization

### **For Customers**
- ✅ Visual menu with images
- ✅ Organized by categories
- ✅ Always up-to-date pricing
- ✅ Fast browsing

### **For Development Team**
- ✅ Clean API design
- ✅ Scalable architecture
- ✅ Easy to extend
- ✅ Well-documented

---

## SLIDE 30: Q&A - Common Questions

**Q: Why not store images in MySQL?**  
A: BLOB storage is inefficient. MongoDB GridFS is designed for large files.

**Q: What if MongoDB is down?**  
A: Menu data still accessible (MySQL). Only images unavailable.

**Q: Can items be in no categories?**  
A: Yes, categories are optional.

**Q: How do you prevent duplicate items?**  
A: No unique constraint on name (same dish at different prices is valid).

**Q: Image format conversion?**  
A: Not currently implemented. Accept JPEG/PNG/WEBP as-is.

---

## SLIDE 31: Lessons Learned

### **What Worked Well**
✅ Dual database approach (right tool for right job)  
✅ GridFS simplified image handling  
✅ DTO pattern kept API clean  
✅ Category system provides flexibility

### **What We'd Improve**
🔄 Add 2-phase commit for image+metadata  
🔄 Implement image compression  
🔄 Add API rate limiting  
🔄 Create admin dashboard UI  
🔄 Add comprehensive test coverage

---

## SLIDE 32: Architecture Benefits

### **Microservice Advantages**

**Independence**
- Can deploy/scale menu-service separately
- Technology choice per service

**Failure Isolation**
- Menu service down ≠ order service down

**Team Ownership**
- Clear responsibility boundaries

**Data Ownership**
- Menu service owns menu data
- Single source of truth

---

## SLIDE 33: Real-World Comparison

### **Similar Systems**

**Uber Eats** - Restaurant menu management  
**DoorDash** - Menu item catalog  
**Zomato** - Restaurant menu display  
**Swiggy** - Food item management  

### **Our Implementation**
✅ Dual database (MySQL + MongoDB)  
✅ Image upload with validation  
✅ Category organization  
✅ Availability toggle  
✅ RESTful APIs  
✅ Admin vs Customer separation  

**Industry Standard Practices Applied!**

---

## SLIDE 34: Summary

### **Menu Service in 3 Points**

1️⃣ **Manages menu catalog** with images and categories  
2️⃣ **Dual database design** - MySQL for data, MongoDB for images  
3️⃣ **Serves two audiences** - Customers (browse) & Admins (manage)  

### **Technologies Demonstrated**
Spring Boot • MySQL • MongoDB GridFS • REST APIs • File Upload • Multi-database

### **Key Achievement**
✅ Production-ready service managing structured data + binary files efficiently

---

## SLIDE 35: Thank You!

### **Menu Service**
*Powering restaurant menus with images* 🍕📸

**Service URL:** `http://localhost:8080/api/menu`  
**Admin URL:** `http://localhost:8080/api/admin/menu`  
**Media URL:** `http://localhost:8080/api/media/{imageId}`

**Documentation:**
- `MENU_SERVICE_README.md` - Setup guide
- `ARCHITECTURE.md` - Architecture details
- `IMPLEMENTATION_SUMMARY.md` - Implementation notes

**Questions?**

---

*End of Presentation*

