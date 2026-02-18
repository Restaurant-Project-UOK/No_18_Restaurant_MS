# Auth Service API Documentation

This document describes the API endpoints provided by the Auth Service.

## Overview
The Auth Service handles user authentication, registration, profile management, and staff creation. 

**Note on Security:** In this microservices architecture, **JWT validation is handled by the API Gateway**. The Auth Service expects the gateway to pass user identity information via headers (e.g., `X-User-Id`) for protected endpoints.

---

## Authentication Endpoints (`/api/auth`)

### 1. Register User
Registers a new customer in the system.

- **Method**: `POST`
- **Endpoint**: `/api/auth/register`
- **JWT Auth**: OFF
- **Request Body**:
  ```json
  {
    "fullName": "John Doe",
    "email": "john@example.com",
    "password": "securepassword",
    "role": 1,
    "provider": 1,
    "phone": "0771234567",
    "address": "123 Main St, Colombo"
  }
  ```
  *Note: Role `1` = CUSTOMER. Provider `1` = LOCAL.*
- **Response**: `200 OK`
  ```json
  "Customer created successfully"
  ```

### 2. Login
Authenticates a user and returns JWT tokens.

- **Method**: `POST`
- **Endpoint**: `/api/auth/login`
- **JWT Auth**: OFF
- **Request Body**:
  ```json
  {
    "email": "john@example.com",
    "password": "securepassword",
    "tableId": 0
  }
  ```
- **Response**: `200 OK`
  ```json
  {
    "accessToken": "eyJhbG...",
    "refreshToken": "eyJhbG...",
    "user": {
      "id": 1,
      "email": "john@example.com",
      "role": 1,
      "provider": 1,
      "profile": {
        "fullName": "John Doe",
        "phone": "0771234567",
        "address": "123 Main St, Colombo"
      }
    },
    "tokenType": "Bearer",
    "accessTokenExpiresIn": 3600000,
    "refreshTokenExpiresIn": 604800000
  }
  ```

### 3. Token Refresh
Generates a new access token using a valid refresh token.

- **Method**: `POST`
- **Endpoint**: `/api/auth/refresh`
- **JWT Auth**: OFF (Requires `refreshToken` in body)
- **Request Body**:
  ```json
  {
    "refreshToken": "eyJhbG..."
  }
  ```
- **Response**: `200 OK`
  ```json
  {
    "accessToken": "eyJhbG...",
    "tokenType": "Bearer",
    "expiresIn": 3600000
  }
  ```

### 4. Logout
Invalidates the current session for the user.

- **Method**: `POST`
- **Endpoint**: `/api/auth/logout`
- **JWT Auth**: ON
- **Required Headers**:
  - `Authorization: Bearer <accessToken>`
  - `X-User-Id: <userId>`
- **Response**: `200 OK`
  ```json
  "Logged out successfully"
  ```

---

## Profile Endpoints (`/api/profile`)

### 1. Get Current Profile
Fetches the profile details of the logged-in user.

- **Method**: `GET`
- **Endpoint**: `/api/profile/me`
- **JWT Auth**: ON
- **Required Headers**:
  - `X-User-Id: <userId>`
- **Response**: `200 OK`
  ```json
  {
    "id": 1,
    "email": "john@example.com",
    "fullName": "John Doe",
    "phone": "0771234567",
    "address": "123 Main St, Colombo",
    "additionalInfo": null,
    "createdAt": "2026-02-18T10:00:00",
    "updatedAt": "2026-02-18T10:00:00"
  }
  ```

### 2. Update Current Profile
Updates the profile details of the logged-in user.

- **Method**: `PUT`
- **Endpoint**: `/api/profile/me`
- **JWT Auth**: ON
- **Required Headers**:
  - `X-User-Id: <userId>`
- **Request Body**:
  ```json
  {
    "fullName": "John Updated",
    "phone": "0777654321",
    "address": "456 Updated St, Kandy"
  }
  ```
- **Response**: `200 OK`
  ```json
  {
    "id": 1,
    "email": "john@example.com",
    "fullName": "John Updated",
    "phone": "0777654321",
    "address": "456 Updated St, Kandy",
    "additionalInfo": null,
    "createdAt": "2026-02-18T10:00:00",
    "updatedAt": "2026-02-18T11:00:00"
  }
  ```

---

## Admin Endpoints (`/api/admin`)

### 1. Create Staff User
Allows an admin to create staff accounts (Kitchen, Waiter).

- **Method**: `POST`
- **Endpoint**: `/api/admin/staff`
- **JWT Auth**: ON (Admin privileges required)
- **Request Body**:
  ```json
  {
    "fullName": "Chef One",
    "email": "chef@restaurant.com",
    "password": "staffpassword",
    "role": 3,
    "phone": "0112345678",
    "address": "Kitchen Annex"
  }
  ```
  *Note: Role `3` = KITCHEN, `4` = WAITER.*
- **Response**: `200 OK`
  ```json
  "Staff created successfully"
  ```

### 2. List All Users
Fetches a list of all registered users.

- **Method**: `GET`
- **Endpoint**: `/api/admin/users`
- **JWT Auth**: ON (Admin privileges required)
- **Response**: `200 OK`
  ```json
  [
    {
      "id": 1,
      "email": "john@example.com",
      "role": 1,
      "provider": 1,
      "profile": { ... }
    },
    {
      "id": 2,
      "email": "admin@restaurant.com",
      "role": 2,
      "provider": 1,
      "profile": { ... }
    }
  ]
  ```
