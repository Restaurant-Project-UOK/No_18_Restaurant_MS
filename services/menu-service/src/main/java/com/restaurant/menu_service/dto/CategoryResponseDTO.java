package com.restaurant.menu_service.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class CategoryResponseDTO {
    private String id;
    private String restaurantId;
    private String name;
    private Integer sortOrder;
}
