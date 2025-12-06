package com.restaurant.menu_service.entity;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import lombok.Data;

import java.util.List;
import java.util.Map;

@Document("modifiers")
@Data
public class Modifier {
    @Id
    private String id;
    private String itemId;
    private String name;
    private String type; // single|multiple
    private List<Map<String, Object>> options;
}
