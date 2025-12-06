package com.restaurant.menu_service.dto;

import lombok.Builder;
import lombok.Data;
import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@Data
@Builder
public class ItemResponseDTO {
    private String id;
    private String restaurantId;
    private String name;
    private String description;
    private BigDecimal price;
    private String imageId;
    private Map<String, Object> dietaryInfo;
    private Boolean available;
    private List<String> categoryIds;
    private List<String> modifierIds;
}
