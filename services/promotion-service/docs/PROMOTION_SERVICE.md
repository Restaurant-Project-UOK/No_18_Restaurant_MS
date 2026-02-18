# Promotion Service — API Documentation

> **Mango Field Fullstack Project** · Microservice API Reference  
> **Version**: 1.0 · **Last Updated**: 2026-02-18

---

## Overview

The **Promotion Service** manages restaurant promotions and discount campaigns. It provides two API surfaces:

| Surface | Base Path | Purpose |
|---|---|---|
| **Customer API** | `/api/promotion` | Browse active promotions (filtered by date) |
| **Admin API** | `/api/admin/promotion` | Full CRUD management of all promotions |

### Gateway Base URL

```
https://gateway-app.mangofield-91faac5e.southeastasia.azurecontainerapps.io
```

All requests below are documented relative to this Gateway URL.

### Identity & Security Headers

| Header | Required | Description |
|---|---|---|
| `Authorization` | Yes | `Bearer <JWT>` — validated by the Gateway |
| `X-User-Id` | Propagated | User ID injected by Gateway after JWT validation |
| `X-Role` | Propagated | User role (`CUSTOMER`, `ADMIN`) injected by Gateway |
| `X-Table-Id` | Propagated | Table identifier injected by Gateway (if applicable) |
| `Content-Type` | For POST/PUT | `application/json` |

---

## Schemas & DTOs

### PromotionResponse

Returned by all successful read/write operations.

```json
{
  "id": 1,
  "name": "Summer Special 20% Off",
  "discountType": "PERCENTAGE",
  "discountValue": 20.00,
  "startAt": "2026-02-18T00:00:00",
  "endAt": "2026-03-18T23:59:59"
}
```

| Field | Type | Description |
|---|---|---|
| `id` | `Long` | Auto-generated promotion ID |
| `name` | `String` | Promotion display name (max 100 chars) |
| `discountType` | `String` | `PERCENTAGE` or `FIXED` |
| `discountValue` | `BigDecimal` | Discount amount (positive, precision 10, scale 2) |
| `startAt` | `ISO 8601 DateTime` | When the promotion becomes active |
| `endAt` | `ISO 8601 DateTime` | When the promotion expires |

---

### CreatePromotionRequest

Used when creating a new promotion.

```json
{
  "name": "Summer Special 20% Off",
  "discountType": "PERCENTAGE",
  "discountValue": 20.00,
  "startAt": "2026-02-18T00:00:00",
  "endAt": "2026-03-18T23:59:59"
}
```

| Field | Type | Validation | Required |
|---|---|---|---|
| `name` | `String` | `@NotBlank`, max 100 chars | ✅ |
| `discountType` | `String` | `@NotBlank` — `"PERCENTAGE"` or `"FIXED"` | ✅ |
| `discountValue` | `BigDecimal` | `@NotNull`, `@Positive` | ✅ |
| `startAt` | `LocalDateTime` | `@NotNull`, ISO 8601 format | ✅ |
| `endAt` | `LocalDateTime` | `@NotNull`, ISO 8601 format | ✅ |

---

### UpdatePromotionRequest

Used when updating an existing promotion. Same fields and validations as `CreatePromotionRequest`. All fields are required per validation annotations, however the service applies partial updates (only non-null fields are updated).

---

### ErrorResponse

Standard error object returned by all error scenarios.

```json
{
  "timestamp": "2026-02-18T18:30:00",
  "status": 404,
  "error": "Not Found",
  "message": "Promotion not found with id: 99",
  "validationErrors": null
}
```

| Field | Type | Description |
|---|---|---|
| `timestamp` | `ISO 8601 DateTime` | When the error occurred |
| `status` | `int` | HTTP status code |
| `error` | `String` | Error category label |
| `message` | `String` | Human-readable description |
| `validationErrors` | `Map<String, String>` | Field-level errors (only for 400 validation failures) |

---

## Customer Endpoints

### 1. Get Available Promotions

> **Functional Role**: Returns only promotions that are currently active (i.e., `startAt <= now <= endAt`). This is the primary endpoint for the customer-facing UI to display ongoing deals.

- **Method**: `GET`
- **Path**: `/api/promotion`

#### cURL

```bash
curl -X GET \
  "https://gateway-app.mangofield-91faac5e.southeastasia.azurecontainerapps.io/api/promotion" \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -H "X-User-Id: 42" \
  -H "X-Role: CUSTOMER"
```

#### Success Response — `200 OK`

```json
[
  {
    "id": 1,
    "name": "Summer Special 20% Off",
    "discountType": "PERCENTAGE",
    "discountValue": 20.00,
    "startAt": "2026-02-18T00:00:00",
    "endAt": "2026-03-18T23:59:59"
  },
  {
    "id": 3,
    "name": "Happy Hour Fixed Discount",
    "discountType": "FIXED",
    "discountValue": 500.00,
    "startAt": "2026-02-01T17:00:00",
    "endAt": "2026-04-01T20:00:00"
  }
]
```

> Returns an empty array `[]` if no promotions are currently active.

#### Error Responses

| Status | Scenario | Message |
|---|---|---|
| `500` | Database or unexpected server error | `"An unexpected error occurred"` |

---

### 2. Get Single Promotion by ID

> **Functional Role**: Retrieves a specific promotion by its ID. Useful for the frontend to display promotion details on a dedicated page or modal.

- **Method**: `GET`
- **Path**: `/api/promotion/{promotionId}`

#### cURL

```bash
curl -X GET \
  "https://gateway-app.mangofield-91faac5e.southeastasia.azurecontainerapps.io/api/promotion/1" \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -H "X-User-Id: 42" \
  -H "X-Role: CUSTOMER"
```

#### Success Response — `200 OK`

```json
{
  "id": 1,
  "name": "Summer Special 20% Off",
  "discountType": "PERCENTAGE",
  "discountValue": 20.00,
  "startAt": "2026-02-18T00:00:00",
  "endAt": "2026-03-18T23:59:59"
}
```

#### Error Responses

| Status | Scenario | Message |
|---|---|---|
| `404` | Promotion ID does not exist | `"Promotion not found with id: {promotionId}"` |
| `500` | Unexpected server error | `"An unexpected error occurred"` |

##### Example — `404 Not Found`

```json
{
  "timestamp": "2026-02-18T18:30:00",
  "status": 404,
  "error": "Not Found",
  "message": "Promotion not found with id: 99",
  "validationErrors": null
}
```

---

## Admin Endpoints

### 3. Get All Promotions (Including Inactive)

> **Functional Role**: Admin dashboard endpoint that returns every promotion in the database regardless of date range. Includes past, current, and future promotions.

- **Method**: `GET`
- **Path**: `/api/admin/promotion`

#### cURL

```bash
curl -X GET \
  "https://gateway-app.mangofield-91faac5e.southeastasia.azurecontainerapps.io/api/admin/promotion" \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -H "X-User-Id: 1" \
  -H "X-Role: ADMIN"
```

#### Success Response — `200 OK`

```json
[
  {
    "id": 1,
    "name": "Summer Special 20% Off",
    "discountType": "PERCENTAGE",
    "discountValue": 20.00,
    "startAt": "2026-02-18T00:00:00",
    "endAt": "2026-03-18T23:59:59"
  },
  {
    "id": 2,
    "name": "Expired Winter Deal",
    "discountType": "FIXED",
    "discountValue": 300.00,
    "startAt": "2025-12-01T00:00:00",
    "endAt": "2025-12-31T23:59:59"
  }
]
```

#### Error Responses

| Status | Scenario | Message |
|---|---|---|
| `500` | Unexpected server error | `"An unexpected error occurred"` |

---

### 4. Create a New Promotion

> **Functional Role**: Admin creates a new promotion campaign. The promotion is immediately persisted and becomes available to customers once `startAt` is reached.

- **Method**: `POST`
- **Path**: `/api/admin/promotion/promotion`

#### cURL

```bash
curl -X POST \
  "https://gateway-app.mangofield-91faac5e.southeastasia.azurecontainerapps.io/api/admin/promotion/promotion" \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -H "X-User-Id: 1" \
  -H "X-Role: ADMIN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Summer Special 20% Off",
    "discountType": "PERCENTAGE",
    "discountValue": 20.00,
    "startAt": "2026-02-18T00:00:00",
    "endAt": "2026-03-18T23:59:59"
  }'
```

#### Success Response — `201 Created`

```json
{
  "id": 1,
  "name": "Summer Special 20% Off",
  "discountType": "PERCENTAGE",
  "discountValue": 20.00,
  "startAt": "2026-02-18T00:00:00",
  "endAt": "2026-03-18T23:59:59"
}
```

#### Error Responses

| Status | Scenario | Message |
|---|---|---|
| `400` | Missing/invalid fields | `"Invalid input parameters"` |
| `500` | Unexpected server error | `"An unexpected error occurred"` |

##### Example — `400 Validation Failed`

```json
{
  "timestamp": "2026-02-18T18:30:00",
  "status": 400,
  "error": "Validation Failed",
  "message": "Invalid input parameters",
  "validationErrors": {
    "name": "Promotion name is required",
    "discountType": "Discount type is required",
    "discountValue": "Discount value must be positive",
    "startAt": "Start date and time is required",
    "endAt": "End date and time is required"
  }
}
```

---

### 5. Update an Existing Promotion

> **Functional Role**: Admin updates any field of a promotion. The service applies partial updates — only non-null fields in the request body are overwritten.

- **Method**: `PUT`
- **Path**: `/api/admin/promotion/promotion/{promotionId}`

#### cURL

```bash
curl -X PUT \
  "https://gateway-app.mangofield-91faac5e.southeastasia.azurecontainerapps.io/api/admin/promotion/promotion/1" \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -H "X-User-Id: 1" \
  -H "X-Role: ADMIN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Summer Special 25% Off",
    "discountType": "PERCENTAGE",
    "discountValue": 25.00,
    "startAt": "2026-02-18T00:00:00",
    "endAt": "2026-04-18T23:59:59"
  }'
```

#### Success Response — `200 OK`

```json
{
  "id": 1,
  "name": "Summer Special 25% Off",
  "discountType": "PERCENTAGE",
  "discountValue": 25.00,
  "startAt": "2026-02-18T00:00:00",
  "endAt": "2026-04-18T23:59:59"
}
```

#### Error Responses

| Status | Scenario | Message |
|---|---|---|
| `400` | Missing/invalid fields | `"Invalid input parameters"` (with `validationErrors` map) |
| `404` | Promotion ID not found | `"Promotion not found with id: {promotionId}"` |
| `500` | Unexpected server error | `"An unexpected error occurred"` |

---

### 6. Delete a Promotion

> **Functional Role**: Admin permanently deletes a promotion from the database. Despite the controller comment saying "soft delete," the service performs a **hard delete** (`promotionRepository.delete()`).

- **Method**: `DELETE`
- **Path**: `/api/admin/promotion/{promotionId}`

#### cURL

```bash
curl -X DELETE \
  "https://gateway-app.mangofield-91faac5e.southeastasia.azurecontainerapps.io/api/admin/promotion/1" \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -H "X-User-Id: 1" \
  -H "X-Role: ADMIN"
```

#### Success Response — `204 No Content`

*(Empty response body)*

#### Error Responses

| Status | Scenario | Message |
|---|---|---|
| `404` | Promotion ID not found | `"Promotion not found with id: {promotionId}"` |
| `500` | Unexpected server error | `"An unexpected error occurred"` |

---

## Health & Actuator

### Health Check

- **Method**: `GET`
- **Path**: `/actuator/health`

#### cURL

```bash
curl -X GET \
  "https://gateway-app.mangofield-91faac5e.southeastasia.azurecontainerapps.io/actuator/health"
```

#### Success Response — `200 OK`

```json
{
  "status": "UP",
  "components": {
    "db": {
      "status": "UP",
      "details": {
        "database": "MySQL",
        "validationQuery": "isValid()"
      }
    },
    "diskSpace": {
      "status": "UP"
    },
    "ping": {
      "status": "UP"
    }
  }
}
```

---

## Endpoint Summary Table

| # | Method | Path | Role | Description |
|---|---|---|---|---|
| 1 | `GET` | `/api/promotion` | Customer | List active promotions |
| 2 | `GET` | `/api/promotion/{id}` | Customer | Get single promotion |
| 3 | `GET` | `/api/admin/promotion` | Admin | List all promotions |
| 4 | `POST` | `/api/admin/promotion/promotion` | Admin | Create promotion |
| 5 | `PUT` | `/api/admin/promotion/promotion/{id}` | Admin | Update promotion |
| 6 | `DELETE` | `/api/admin/promotion/{id}` | Admin | Delete promotion |
| 7 | `GET` | `/actuator/health` | Public | Health check |

---

## CORS Configuration

The service accepts requests from **all origins** (`*`) with methods `GET`, `POST`, `PUT`, `DELETE`, `OPTIONS` and all headers. This is handled at the service level via `CorsConfig`, but in production the Spring Cloud Gateway should manage CORS centrally.

---

## Database Schema

**Table**: `promotions`

| Column | Type | Constraints |
|---|---|---|
| `id` | `BIGINT` | Primary Key, Auto Increment |
| `name` | `VARCHAR(100)` | NOT NULL |
| `discount_type` | `VARCHAR(20)` | NOT NULL — `PERCENTAGE` or `FIXED` |
| `discount_value` | `DECIMAL(10,2)` | NOT NULL |
| `start_at` | `DATETIME` | NOT NULL |
| `end_at` | `DATETIME` | NOT NULL |

> Schema is auto-managed via Hibernate `ddl-auto=update`.

---

## Notes for Frontend Developers

1. **Date Format**: All datetime fields use ISO 8601 format without timezone (`yyyy-MM-ddTHH:mm:ss`). Parse with `new Date()` or a library like `dayjs`.
2. **Active Filtering**: The customer endpoint (`/api/promotion`) only returns promotions where `startAt <= now <= endAt`. The admin endpoint returns all.
3. **Delete is Permanent**: The delete endpoint performs a hard delete. Confirm with the user before calling.
4. **Validation Errors**: On `400` responses, check the `validationErrors` map for field-specific messages to display inline form errors.
5. **Empty Lists**: Endpoints returning lists will return `[]` (empty array), never `null`.
