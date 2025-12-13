package com.restaurant.menu_service.entity;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import lombok.Data;

@Document("restaurants")
@Data
public class Restaurant {
    @Id
    private String id;
    private String name;
}
