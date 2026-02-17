# User Stories & Role-Based Scenarios
## Restaurant Management System

**Document Version:** 1.0  
**Last Updated:** February 14, 2026  
**Purpose:** Define user stories, acceptance criteria, and scenario flows for all system roles

---

## Table of Contents

1. [Role Definitions](#1-role-definitions)
2. [Customer Stories (Role 1)](#2-customer-stories-role-1)
3. [Admin Stories (Role 2)](#3-admin-stories-role-2)
4. [Kitchen Staff Stories (Role 3)](#4-kitchen-staff-stories-role-3)
5. [Cross-Role Scenarios](#5-cross-role-scenarios)
6. [Edge Cases & Error Scenarios](#6-edge-cases--error-scenarios)
7. [Security Scenarios](#7-security-scenarios)

---

## 1. Role Definitions

| Role ID | Name | Primary Function | Access Level |
|---------|------|------------------|--------------|
| 1 | **CUSTOMER** | Browse menu, place orders, manage profile | Own orders, profile |
| 2 | **ADMIN** | Manage staff, menu, view analytics | Full system access |
| 3 | **KITCHEN_STAFF** | View/update order status, KDS operations | Orders, KDS |

### Role Capabilities Matrix

| Capability | Customer | Admin | Kitchen |
|------------|:--------:|:-----:|:-------:|
| Register/Login | ✅ | ✅ | ✅ |
| Browse Menu | ✅ | ✅ | ✅ |
| Add to Cart | ✅ | ✅ | ❌ |
| Place Orders | ✅ | ✅ | ❌ |
| View Own Orders | ✅ | ✅ | ✅ |
| View All Orders | ❌ | ✅ | ✅ |
| Update Order Status | ❌ | ✅ | ✅ |
| Manage Menu Items | ❌ | ✅ | ❌ |
| Manage Categories | ❌ | ✅ | ❌ |
| Manage Staff | ❌ | ✅ | ❌ |
| View Analytics | ❌ | ✅ | ❌ |
| Access KDS | ❌ | ✅ | ✅ |
| Edit Profile | ✅ | ✅ | ✅ |

---

## 2. Customer Stories (Role 1)

### 2.1 Authentication Stories

#### US-C001: Customer Registration
> **As a** new customer  
> **I want to** create an account  
> **So that** I can place orders and track my order history

**Acceptance Criteria:**
- [ ] Can access registration page from login screen
- [ ] Must provide: Full Name (min 3 chars), Email (valid format), Password (min 6 chars)
- [ ] Optional: Phone number (10+ digits)
- [ ] Password confirmation must match
- [ ] Table ID auto-populates from URL if present
- [ ] Shows validation errors for invalid inputs
- [ ] Redirects to login on successful registration
- [ ] Shows error message for duplicate email

**Scenario: Successful Registration**
```
GIVEN I am on the registration page
  AND I have scanned a QR code with tableId=5
WHEN I enter valid registration details
  AND I click "Register"
THEN my account is created with CUSTOMER role
  AND I am redirected to the login page
  AND I see a success message
```

**Scenario: Registration with Validation Errors**
```
GIVEN I am on the registration page
WHEN I enter an email that's already registered
  AND I click "Register"
THEN I see an error: "Email already registered"
  AND I remain on the registration page
```

---

#### US-C002: Customer Login
> **As a** registered customer  
> **I want to** log into my account  
> **So that** I can access my profile and place orders

**Acceptance Criteria:**
- [ ] Can enter email and password
- [ ] Table ID displays if present in URL
- [ ] Validates credentials against backend
- [ ] Stores JWT tokens on successful login
- [ ] Redirects to `/menu` page after login
- [ ] Shows error for invalid credentials
- [ ] "Remember me" persists session

**Scenario: Successful Login with Table Context**
```
GIVEN I navigate to /login?tableId=7
  AND I enter valid credentials
WHEN I click "Login"
THEN I am authenticated
  AND tableId=7 is stored in localStorage
  AND I am redirected to /menu
  AND I see menu items for the restaurant
```

**Scenario: Login with Invalid Credentials**
```
GIVEN I am on the login page
WHEN I enter an incorrect password
  AND I click "Login"
THEN I see an error: "Invalid email or password"
  AND I remain on the login page
  AND password field is cleared
```

---

#### US-C003: Session Persistence
> **As a** logged-in customer  
> **I want** my session to persist across page refreshes  
> **So that** I don't have to re-login frequently

**Acceptance Criteria:**
- [ ] Access token stored securely
- [ ] Refresh token handles expired access tokens
- [ ] Table context persists in localStorage
- [ ] User context restored from profile API on refresh

**Scenario: Token Refresh on Expiry**
```
GIVEN my access token has expired
  AND my refresh token is still valid
WHEN I make an API request
THEN the system automatically refreshes my access token
  AND my request succeeds without interruption
  AND I remain logged in
```

---

### 2.2 Menu Browsing Stories

#### US-C010: Browse Menu
> **As a** customer  
> **I want to** browse the restaurant menu  
> **So that** I can see available items and prices

**Acceptance Criteria:**
- [ ] Displays all available menu items
- [ ] Shows item name, price, description, image
- [ ] Groups items by category
- [ ] Indicates item availability
- [ ] Shows dietary icons/tags (vegetarian, vegan, etc.)
- [ ] Supports search/filter functionality

**Scenario: View Menu by Category**
```
GIVEN I am logged in as a customer
  AND I am on the /menu page
WHEN I click on "Appetizers" category
THEN I see only appetizer items
  AND each item shows name, price, and description
  AND unavailable items are grayed out
```

---

#### US-C011: View Menu Item Details
> **As a** customer  
> **I want to** see detailed information about a menu item  
> **So that** I can make informed ordering decisions

**Acceptance Criteria:**
- [ ] Shows full description
- [ ] Displays high-quality image
- [ ] Lists ingredients/allergens
- [ ] Shows nutritional information (if available)
- [ ] Displays preparation time estimate
- [ ] Shows customer ratings/reviews

**Scenario: View Item with Allergen Info**
```
GIVEN I am browsing the menu
WHEN I click on "Pad Thai"
THEN I see the full item details
  AND I see allergen warnings: "Contains: Peanuts, Soy"
  AND I can add it to cart from this view
```

---

### 2.3 Cart & Ordering Stories

#### US-C020: Add Item to Cart
> **As a** customer  
> **I want to** add menu items to my cart  
> **So that** I can build my order before checkout

**Acceptance Criteria:**
- [ ] Can select quantity (default: 1)
- [ ] Can add special notes/requests
- [ ] Cart icon shows item count
- [ ] Shows confirmation toast on add
- [ ] Can add same item multiple times
- [ ] Cannot add unavailable items

**Scenario: Add Item with Special Instructions**
```
GIVEN I am viewing "Grilled Salmon" on the menu
WHEN I set quantity to 2
  AND I add note: "No lemon, extra herbs"
  AND I click "Add to Cart"
THEN the cart shows 2x Grilled Salmon
  AND the special notes are attached
  AND I see confirmation: "Added to cart"
```

---

#### US-C021: Manage Cart
> **As a** customer  
> **I want to** view and modify my cart  
> **So that** I can adjust my order before placing it

**Acceptance Criteria:**
- [ ] View all cart items with quantities
- [ ] Update quantity for any item
- [ ] Remove items from cart
- [ ] Clear entire cart
- [ ] See subtotal per item
- [ ] See total order amount
- [ ] Edit special notes

**Scenario: Update Cart Quantity**
```
GIVEN I have 2x Burger in my cart
WHEN I change the quantity to 3
THEN the cart updates to show 3x Burger
  AND the subtotal recalculates
  AND the total order amount updates
```

**Scenario: Remove Item from Cart**
```
GIVEN I have 3 items in my cart
WHEN I click "Remove" on the second item
THEN that item is removed
  AND the cart shows 2 items
  AND the total recalculates
```

---

#### US-C022: Place Order
> **As a** customer  
> **I want to** submit my cart as an order  
> **So that** the kitchen can prepare my food

**Acceptance Criteria:**
- [ ] Shows order summary before submission
- [ ] Includes table ID if available
- [ ] Can add overall special requests
- [ ] Validates cart is not empty
- [ ] Shows order confirmation with order ID
- [ ] Clears cart after successful order
- [ ] Fails gracefully if items unavailable

**Scenario: Successful Order Placement**
```
GIVEN I have items in my cart
  AND I am at table 7
WHEN I click "Place Order"
THEN I see a confirmation page
  AND I see Order ID: #12345
  AND my cart is cleared
  AND the order appears in my order history
```

**Scenario: Order with Unavailable Item**
```
GIVEN I have "Daily Special" in my cart
  AND "Daily Special" becomes unavailable
WHEN I try to place the order
THEN I see an error: "Some items are no longer available"
  AND the unavailable items are highlighted
  AND I can remove them and retry
```

---

#### US-C023: View Order History
> **As a** customer  
> **I want to** see my past orders  
> **So that** I can track order status and reorder favorites

**Acceptance Criteria:**
- [ ] Lists all orders chronologically (newest first)
- [ ] Shows order ID, date/time, status
- [ ] Shows item count and total amount
- [ ] Can click to see full order details
- [ ] Status updates in real-time (if applicable)

**Scenario: Track Active Order**
```
GIVEN I placed an order 10 minutes ago
WHEN I view my order history
THEN I see my order with status: "Preparing"
  AND I can see estimated completion time
  AND status updates to "Ready" when kitchen marks it
```

---

### 2.4 Profile Management Stories

#### US-C030: View Profile
> **As a** customer  
> **I want to** view my profile information  
> **So that** I can verify my account details

**Acceptance Criteria:**
- [ ] Displays full name
- [ ] Displays email (read-only)
- [ ] Shows role as "Customer"
- [ ] Shows phone number
- [ ] Shows address (if provided)

---

#### US-C031: Edit Profile
> **As a** customer  
> **I want to** update my profile information  
> **So that** my details are accurate

**Acceptance Criteria:**
- [ ] Can edit full name
- [ ] Cannot edit email
- [ ] Can edit phone number
- [ ] Can edit address
- [ ] Shows validation errors
- [ ] Saves changes successfully
- [ ] Shows confirmation message

**Scenario: Update Phone Number**
```
GIVEN I am on my profile page
WHEN I click "Edit Profile"
  AND I change my phone to "1234567890"
  AND I click "Save"
THEN my profile updates
  AND I see: "Profile updated successfully"
```

---

#### US-C032: Logout
> **As a** customer  
> **I want to** log out of my account  
> **So that** I can secure my session

**Acceptance Criteria:**
- [ ] Clears all tokens from storage
- [ ] Clears user context
- [ ] Redirects to login page
- [ ] Cannot access protected pages after logout

**Scenario: Secure Logout**
```
GIVEN I am logged in
WHEN I click "Logout"
THEN my tokens are cleared
  AND I am redirected to /login
  AND navigating to /menu redirects to /login
```

---

## 3. Admin Stories (Role 2)

### 3.1 Dashboard & Overview

#### US-A001: Access Admin Dashboard
> **As an** admin  
> **I want to** access the admin dashboard  
> **So that** I can manage restaurant operations

**Acceptance Criteria:**
- [ ] Dashboard accessible only to role=2
- [ ] Shows key metrics (orders today, revenue, etc.)
- [ ] Quick navigation to all admin functions
- [ ] Real-time updates on order status

**Scenario: Admin Login Redirect**
```
GIVEN I log in with admin credentials
WHEN authentication succeeds
THEN I am redirected to /profile (admin home)
  AND I see admin navigation options
  AND I can access /admin/dashboard
```

---

### 3.2 Menu Management Stories

#### US-A010: View All Menu Items
> **As an** admin  
> **I want to** see all menu items  
> **So that** I can manage the restaurant's offerings

**Acceptance Criteria:**
- [ ] Lists all items (both available and unavailable)
- [ ] Shows item status (active/inactive)
- [ ] Can filter by category
- [ ] Can search by name
- [ ] Shows pricing information

---

#### US-A011: Create Menu Item
> **As an** admin  
> **I want to** add new menu items  
> **So that** customers can order them

**Acceptance Criteria:**
- [ ] Can enter name, description, price
- [ ] Can upload item image
- [ ] Can assign to category
- [ ] Can set availability
- [ ] Can add allergen/dietary tags
- [ ] Validates required fields
- [ ] Shows success confirmation

**Scenario: Add New Menu Item**
```
GIVEN I am on /admin/menu
WHEN I click "Add Item"
  AND I fill in: name="Truffle Pasta", price=24.99, category="Mains"
  AND I upload an image
  AND I click "Save"
THEN the item is created
  AND it appears in the menu list
  AND customers can see it on /menu
```

---

#### US-A012: Edit Menu Item
> **As an** admin  
> **I want to** modify existing menu items  
> **So that** I can update prices, descriptions, or availability

**Acceptance Criteria:**
- [ ] Can edit all item fields
- [ ] Can toggle availability
- [ ] Changes reflect immediately
- [ ] Maintains item history/audit

**Scenario: Mark Item Unavailable**
```
GIVEN "Daily Special" is available
WHEN I toggle its availability to "Unavailable"
THEN customers see it grayed out on /menu
  AND they cannot add it to cart
```

---

#### US-A013: Delete Menu Item
> **As an** admin  
> **I want to** remove menu items  
> **So that** discontinued items don't show

**Acceptance Criteria:**
- [ ] Requires confirmation before delete
- [ ] Soft-delete for audit trail
- [ ] Item no longer visible to customers
- [ ] Historical orders still reference item

---

### 3.3 Category Management Stories

#### US-A020: Manage Categories
> **As an** admin  
> **I want to** manage menu categories  
> **So that** items are organized logically

**Acceptance Criteria:**
- [ ] Can create new categories
- [ ] Can edit category names
- [ ] Can reorder categories
- [ ] Can delete empty categories
- [ ] Cannot delete categories with items

**Scenario: Create New Category**
```
GIVEN I am managing categories
WHEN I click "Add Category"
  AND I enter name="Desserts"
  AND I click "Save"
THEN "Desserts" appears in the category list
  AND I can assign menu items to it
```

---

### 3.4 Staff Management Stories

#### US-A030: View All Staff
> **As an** admin  
> **I want to** view all staff members  
> **So that** I can manage the team

**Acceptance Criteria:**
- [ ] Lists all users with role > 1
- [ ] Shows name, email, role
- [ ] Shows active/inactive status
- [ ] Can filter by role

---

#### US-A031: Create Staff Account
> **As an** admin  
> **I want to** create accounts for kitchen staff  
> **So that** they can access the KDS

**Acceptance Criteria:**
- [ ] Can create user with role=3 (Kitchen)
- [ ] Sets temporary password
- [ ] Sends invitation email (optional)
- [ ] Staff can log in immediately

**Scenario: Add Kitchen Staff**
```
GIVEN I am on /admin/staff
WHEN I click "Add Staff"
  AND I enter: name="John Chef", email="john@restaurant.com", role="Kitchen"
  AND I set temporary password
  AND I click "Create"
THEN John receives account
  AND he can log in and access /kitchen
```

---

#### US-A032: Modify Staff Role
> **As an** admin  
> **I want to** change staff roles  
> **So that** I can promote or adjust access

**Acceptance Criteria:**
- [ ] Can change role between 2 and 3
- [ ] Cannot demote self
- [ ] Changes take effect immediately
- [ ] Logs role change for audit

---

### 3.5 Analytics Stories

#### US-A040: View Order Analytics
> **As an** admin  
> **I want to** see order statistics  
> **So that** I can understand business performance

**Acceptance Criteria:**
- [ ] Shows orders per day/week/month
- [ ] Shows revenue totals
- [ ] Shows popular items
- [ ] Shows peak ordering times
- [ ] Can export data

---

## 4. Kitchen Staff Stories (Role 3)

### 4.1 Kitchen Display System (KDS)

#### US-K001: View Incoming Orders
> **As** kitchen staff  
> **I want to** see incoming orders on the KDS  
> **So that** I can prepare food

**Acceptance Criteria:**
- [ ] Shows all pending orders
- [ ] Orders sorted by time (oldest first)
- [ ] Shows table number prominently
- [ ] Lists all items in order
- [ ] Shows special instructions highlighted
- [ ] Auto-refreshes in real-time

**Scenario: New Order Appears**
```
GIVEN I am viewing the KDS
WHEN a customer at table 5 places an order
THEN the order appears on my screen
  AND I hear an audio notification
  AND I see: Table 5, items, and any special requests
```

---

#### US-K002: Update Order Status
> **As** kitchen staff  
> **I want to** update order status  
> **So that** customers and waiters know progress

**Acceptance Criteria:**
- [ ] Can mark order as "Preparing"
- [ ] Can mark order as "Ready"
- [ ] Can mark individual items as done
- [ ] Status updates in real-time
- [ ] Notifies waiter service when ready

**Scenario: Mark Order Ready**
```
GIVEN order #123 shows "Preparing"
WHEN I finish cooking and click "Ready"
THEN the order status changes to "Ready"
  AND the order moves to "Ready" column
  AND waiter is notified (via Kafka event)
```

---

#### US-K003: View Order Details
> **As** kitchen staff  
> **I want to** see full order details  
> **So that** I can prepare items correctly

**Acceptance Criteria:**
- [ ] Shows all items with quantities
- [ ] Highlights modifications/allergies
- [ ] Shows special instructions prominently
- [ ] Shows order time (for timing)

**Scenario: Order with Allergy Alert**
```
GIVEN order #456 has item with note: "NO PEANUTS - ALLERGY"
WHEN I view the order
THEN the allergy warning is prominently displayed
  AND it's visually distinct (red background, icon)
```

---

### 4.2 Kitchen Staff Profile

#### US-K010: View/Edit Profile
> **As** kitchen staff  
> **I want to** manage my profile  
> **So that** my contact information is current

**Acceptance Criteria:**
- [ ] Can view profile details
- [ ] Can edit phone number
- [ ] Can edit address
- [ ] Cannot change role (only admin can)

---

## 5. Cross-Role Scenarios

### 5.1 Complete Order Lifecycle

```
1. CUSTOMER scans QR code (sets tableId)
   ↓
2. CUSTOMER logs in / registers
   ↓
3. CUSTOMER browses /menu
   ↓
4. CUSTOMER adds items to cart
   ↓
5. CUSTOMER places order
   ↓
6. Order appears on KITCHEN KDS
   ↓
7. KITCHEN marks order "Preparing"
   ↓
8. KITCHEN marks order "Ready"
   ↓
9. Waiter notified (Kafka event)
   ↓
10. CUSTOMER sees status update
   ↓
11. Order delivered to table
   ↓
12. ADMIN sees analytics updated
```

### 5.2 Role Escalation Path

```
Guest → Register → CUSTOMER (role=1)
                      ↓
              (Admin promotes)
                      ↓
           KITCHEN_STAFF (role=3)
                      ↓
              (Admin promotes)
                      ↓
                ADMIN (role=2)
```

---

## 6. Edge Cases & Error Scenarios

### 6.1 Authentication Errors

| Scenario | Expected Behavior |
|----------|-------------------|
| Invalid credentials | Show error, remain on login page |
| Expired access token | Auto-refresh using refresh token |
| Expired refresh token | Redirect to login, show session expired |
| Account locked | Show specific error message |
| Network error | Show retry option, preserve form data |

### 6.2 Ordering Errors

| Scenario | Expected Behavior |
|----------|-------------------|
| Empty cart checkout | Disable checkout button |
| Item becomes unavailable | Alert user, offer alternatives |
| Payment failure | Preserve cart, show retry |
| Duplicate order submit | Prevent duplicate, show existing |
| Network error during order | Save locally, retry when online |

### 6.3 Permission Errors

| Scenario | Expected Behavior |
|----------|-------------------|
| Customer accesses /admin | Redirect to /unauthorized |
| Kitchen accesses /admin/staff | Redirect to /unauthorized |
| Direct URL to protected page | Redirect to login if not auth'd |
| Token tampering | Reject request, force re-login |

---

## 7. Security Scenarios

### 7.1 Authentication Security

#### SEC-001: Brute Force Prevention
```
GIVEN a user fails login 5 times
WHEN they try a 6th time
THEN account is temporarily locked (15 minutes)
  AND admin is notified
  AND user sees lockout message
```

#### SEC-002: Session Security
```
GIVEN a user is logged in on Device A
WHEN they log in on Device B
THEN both sessions remain valid (multi-device support)
  OR (optional) Device A session is invalidated
```

### 7.2 Authorization Security

#### SEC-003: Role Bypass Attempt
```
GIVEN a CUSTOMER tries to access /admin/menu via direct URL
WHEN the request reaches the gateway
THEN gateway checks JWT role claim
  AND rejects with 403 Forbidden
  AND logs the attempt
```

#### SEC-004: API Endpoint Protection
```
GIVEN a request to POST /api/admin/menu (create item)
WHEN the JWT role is not "ADMIN"
THEN the request is rejected at gateway
  AND no downstream service is called
```

---

## Appendix A: API Endpoint Access Matrix

| Endpoint | Customer | Admin | Kitchen | Public |
|----------|:--------:|:-----:|:-------:|:------:|
| POST /auth/login | ✅ | ✅ | ✅ | ✅ |
| POST /auth/register | ✅ | ✅ | ✅ | ✅ |
| GET /menu | ✅ | ✅ | ✅ | ✅ |
| GET /categories | ✅ | ✅ | ✅ | ✅ |
| POST /orders | ✅ | ✅ | ❌ | ❌ |
| GET /orders | ✅ (own) | ✅ (all) | ✅ (all) | ❌ |
| PUT /orders/:id/status | ❌ | ✅ | ✅ | ❌ |
| GET /profile/me | ✅ | ✅ | ✅ | ❌ |
| PUT /profile/me | ✅ | ✅ | ✅ | ❌ |
| POST /admin/menu | ❌ | ✅ | ❌ | ❌ |
| GET /admin/staff | ❌ | ✅ | ❌ | ❌ |
| POST /admin/staff | ❌ | ✅ | ❌ | ❌ |
| GET /kds/orders | ❌ | ✅ | ✅ | ❌ |
| GET /analytics | ❌ | ✅ | ❌ | ❌ |

---

## Appendix B: Story Status Tracking

| Story ID | Title | Status | Sprint |
|----------|-------|--------|--------|
| US-C001 | Customer Registration | ✅ Implemented | 1 |
| US-C002 | Customer Login | ✅ Implemented | 1 |
| US-C003 | Session Persistence | ✅ Implemented | 1 |
| US-C010 | Browse Menu | ✅ Implemented | 1 |
| US-C020 | Add to Cart | ✅ Implemented | 2 |
| US-C021 | Manage Cart | ✅ Implemented | 2 |
| US-C022 | Place Order | ✅ Implemented | 2 |
| US-C023 | Order History | ✅ Implemented | 2 |
| US-C030 | View Profile | ✅ Implemented | 1 |
| US-C031 | Edit Profile | ✅ Implemented | 1 |
| US-A001 | Admin Dashboard | 🟡 Partial | 3 |
| US-A010 | View Menu Items | ✅ Implemented | 3 |
| US-A011 | Create Menu Item | ✅ Implemented | 3 |
| US-A030 | View Staff | ✅ Implemented | 3 |
| US-A031 | Create Staff | ✅ Implemented | 3 |
| US-K001 | View KDS Orders | 🟡 Partial | 4 |
| US-K002 | Update Order Status | 🔴 Pending | 4 |

---

*Document maintained by: Development Team*  
*Last Review: February 2026*  
*Next Review: March 2026*
