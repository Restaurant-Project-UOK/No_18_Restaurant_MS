Payment service (minimal) — PayPal sandbox

This service exposes a single endpoint to create a PayPal order and returns the approval URL (sandbox).

Run:

- Add PayPal sandbox credentials to `src/main/resources/application.properties`:
  - `paypal.clientId`
  - `paypal.clientSecret`

- Build and run with Maven:

  mvn -DskipTests package
  mvn spring-boot:run

Endpoint:

POST http://localhost:8081/payments/create
Content-Type: application/json

Body example:

{
  "orderId": 5,
  "amount": 2700.0
}

Response:

- 200 OK with a PayPal sandbox approval URL: `https://www.sandbox.paypal.com/checkoutnow?token=XXXX`

Notes:

- This is minimal code for demonstration. In production add proper error handling, logging, and secure storage of credentials.

