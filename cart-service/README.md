# Cart Service

## Get All User Items

**Endpoint:** `GET /cart/user-items`

**Headers:**
- `table-id`: Table identifier
- `user-id`: User identifier

**Description:**  
Retrieves all cart items for the specified user at the given table from Redis.

**Response:**
```json
[
  
]
```

## Delete All User Items

**Endpoint:** `DELETE /cart/user-items`

**Headers:**
- `table-id`: Table identifier
- `user-id`: User identifier

**Description:**  
Deletes all cart items for the specified user at the given table from Redis.

**Response:**
```
{
  "message": "User items deleted successfully"
}
```

## Testing Cart Service with Postman

1. **Set the base URL:**  
   Use `http://localhost:<port>/cart` (replace `<port>` with your service port).

2. **Add Items to Cart:**  
   - Method: `POST`  
   - URL: `/add`  
   - Headers:  
     - `table-id`: your-table-id  
     - `user-id`: your-user-id  
   - Body (raw JSON):  
     ```json
     {
       "itemId": "item123",
       "quantity": 2
     }
     ```

3. **Get All User Items:**  
   - Method: `GET`  
   - URL: `/user-items`  
   - Headers:  
     - `table-id`: your-table-id  
     - `user-id`: your-user-id  

4. **Delete All User Items:**  
   - Method: `DELETE`  
   - URL: `/user-items`  
   - Headers:  
     - `table-id`: your-table-id  
     - `user-id`: your-user-id  

**Tips:**  
- Use the "Headers" tab in Postman to add `table-id` and `user-id`.
- For POST, use the "Body" tab, select "raw" and "JSON".
- Check responses for success messages or returned data.
