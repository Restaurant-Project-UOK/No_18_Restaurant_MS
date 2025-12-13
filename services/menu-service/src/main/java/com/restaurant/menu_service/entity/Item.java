package com.restaurant.menu_service.entity;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import lombok.Data;
import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@Document("menu_items")
@Data
public class Item {
    @Id
    private String id;
    private String restaurantId;
    private String name;
    private String description;
    private BigDecimal price;
    private String imageId;
    private Map<String, Object> dietaryInfo;
    private Boolean available = true;
    private List<String> categoryIds;
    private List<String> modifierIds;
}
