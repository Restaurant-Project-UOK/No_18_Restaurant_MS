package com.restaurant.menu_service.dto;

import jakarta.validation.constraints.*;
import com.restaurant.menu_service.validation.UniqueCategoryNamePerRestaurant;
import lombok.Data;

@Data
@UniqueCategoryNamePerRestaurant
public class CategoryRequestDTO {
    @NotBlank(message = "name is required")
    private String name;

    private Integer sortOrder = 0;

    @NotBlank(message = "restaurantId is required")
    private String restaurantId;
}
