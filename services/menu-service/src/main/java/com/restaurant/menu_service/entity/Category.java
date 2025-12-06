package com.restaurant.menu_service.entity;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import lombok.Data;

@Document("categories")
@Data
public class Category {
    @Id
    private String id;
    private String restaurantId;
    private String name;
    private Integer sortOrder = 0;
}
