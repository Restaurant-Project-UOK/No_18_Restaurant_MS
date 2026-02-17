# Feature Implementation & Gap Analysis

## 1. Staff Management (Admin)
**Request**: Admin can add/manage Kitchen Staff (Chef) and Waiters.
**Current State**: `auth-service` supports `CUSTOMER` (1), `ADMIN` (2), `KITCHEN` (3). No explicit `WAITER` role or user management APIs.
**Required Changes**:
*   **Database (`auth-service`)**: Add `WAITER` (Role ID 4) to `Role` enum.
*   **API (`auth-service`)**:
    *   `POST /api/admin/staff`: Create user with specific role (Kitchen/Waiter).
    *   `GET /api/admin/staff`: List all staff members.
    *   `DELETE /api/admin/staff/{id}`: Remove staff access.

## 2. Inventory Management (Kitchen/Admin)
**Request**: Kitchen/Admin can view/update inventory; subtract stock on order.
**Current State**: No inventory logic exists in `menu-service` or `order-service`.
**Required Changes**:
*   **Database (`menu-service`)**: Create `inventory` table linked to `menu_items`. fields: `item_id`, `quantity`, `unit`, `min_threshold`.
*   **API (`menu-service`)**:
    *   `GET /api/inventory`: View stock levels (Admin/Kitchen).
    *   `PUT /api/inventory/{itemId}`: Manual stock adjustment (Admin/Kitchen).
*   **Logic**:
    *   Order placement (`order-service`) must trigger stock deduction (Sync or Async Event).

## 3. Waiter Operations & Proxy Ordering
**Request**: Waiter takes orders for unregistered customers; handles cash payment.
**Current State**: `order-service` requires a registered Customer ID context. Payment is online-only (PayPal) or generic status.
**Required Changes**:
*   **Database (`order-service`)**: Add `is_guest_order` (bool) and `created_by_staff_id` (Long).
*   **API (`order-service`)**:
    *   `POST /api/orders/proxy`: Endpoint for Waiters to place orders without a Customer ID.
    *   `PATCH /api/orders/{id}/payment`: Record cash payment (Admin/Waiter only).
*   **Frontend**: "Waiter Mode" on tablet to bypass customer login for ordering.

## 4. Kitchen Flow Enhancements
**Request**: Chef views pending orders, prepares, cooks, and serves.
**Current State**: Basic `PLACED` -> `PREPARING` -> `READY` flow exists.
**Required Changes**:
*   **Workflow**:
    *   Add `ACCEPTED` (Chef acknowledges order).
    *   Add `SERVED` (Waiter delivers to table).
*   **API (`order-service`)**:
    *   `GET /api/orders/kitchen`: Filter by `PLACED`, `ACCEPTED`, `PREPARING`.
    *   `PATCH /api/orders/{id}/status`: Support new status transitions.

## 5. Affected Services Summary

| Service | New Feature | Complexity |
| :--- | :--- | :--- |
| `auth-service` | Staff Management APIs, Waiter Role | Medium |
| `menu-service` | Inventory Tables & APIs | High |
| `order-service` | Proxy Ordering, Cash Payment, Enhanced Status | High |
| `frontend` | Admin Dashboard (Staff/Inv), Waiter Mode, KDS | High |
