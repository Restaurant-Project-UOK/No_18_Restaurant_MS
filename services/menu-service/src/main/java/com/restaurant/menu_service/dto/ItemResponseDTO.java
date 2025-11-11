package com.restaurant.menu_service.dto;

import java.math.BigDecimal;

public record ItemResponseDTO(
    Long id,
    Long restaurantId,
    String name,
    String description,
    BigDecimal price,
    String imageId,
    String dietary,
    boolean is_active
) {
    
}
