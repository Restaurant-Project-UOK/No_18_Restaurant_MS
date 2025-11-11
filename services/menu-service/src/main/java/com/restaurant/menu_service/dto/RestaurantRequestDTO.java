package com.restaurant.menu_service.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RestaurantRequestDTO(
    @NotBlank(message = "Restaurant name cannot be blank")
    @Size(max = 100, message = "Restaurant name must be less than 100 characters")
    String name
) {
    
}