package com.restaurant.menu_service.entity;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import lombok.Data;
import java.time.Instant;

@Document("promotions")
@Data
public class Promotion {
    @Id
    private String id;
    private String restaurantId;
    private String name;
    private String discountType; // percentage|fixed
    private Double discountValue;
    private Instant startAt;
    private Instant endAt;
}
