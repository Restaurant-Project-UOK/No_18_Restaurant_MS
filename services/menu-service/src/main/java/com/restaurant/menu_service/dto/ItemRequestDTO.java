package com.restaurant.menu_service.dto;

import jakarta.validation.constraints.*;
import java.math.BigDecimal;

public record ItemRequestDTO(
    @NotBlank(message = "Item name cannot be blank")
    @Size(max = 255)
    String name,
    String description,
    @NotNull(message = "Price cannot be null")
    @Positive(message = "Price must be a positive number")
    BigDecimal price,
    String imageId,
    String dietary, 
    @NotNull Boolean is_active
) {
    
}