# Cart Service

A Spring Boot microservice for managing user carts, supporting order creation and integration with order-service.

## Purpose
- Provides user-scoped cart management (add, update, remove, clear items)
- Exposes an endpoint for order-service to fetch cart items for order creation

## Key Endpoints
- `POST /api/cart/open` — Open/create a cart
- `POST /api/cart/items` — Add item to cart (`menuItemId` required)
- `GET /api/cart/items` — List all cart items
- `GET /api/cart` — Get items formatted for order-service (`ItemForOrder[]`)
- `PUT /api/cart/items/{itemId}` — Update cart item
- `DELETE /api/cart/items/{itemId}` — Remove item from cart
- `DELETE /api/cart` — Clear cart
- `POST /api/cart/checkout` — Checkout and create order

## Integration (Order-Service)
- Call `GET /api/cart` with `X-User-Id` (and optional `X-Table-Name`)
- Response:  
  ```json
  {
    "items": [
      {
        "itemId": 456,
        "itemName": "Chicken Pizza",
        "quantity": 1,
        "unitPrice": 1200.00
      }
    ]
  }
  ```
- `itemId` is mapped from `menuItemId` in the cart

## Common Issues
- Empty cart response: Ensure same `X-User-Id` and `X-Table-Name` for add/read
- `itemId: null`: Add-to-cart payload must include `menuItemId`
- Auth: Use numeric `X-User-Id` header if principal is not numeric

## Tech Stack
- Java, Spring Boot, Maven, Redis

## Run Locally
1. Start Redis
2. `mvn clean package`
3. `java -jar target/cartservice-*.jar`

