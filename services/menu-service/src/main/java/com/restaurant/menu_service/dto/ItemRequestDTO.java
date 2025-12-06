package com.restaurant.menu_service.dto;

import jakarta.validation.constraints.*;
import com.restaurant.menu_service.validation.ValidObjectId;
import lombok.Data;
import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@Data
public class ItemRequestDTO {
    @NotBlank(message = "name is required")
    private String name;

    private String description;

    @NotNull(message = "price is required")
    @DecimalMin(value = "0.01", inclusive = true, message = "price must be positive")
    private BigDecimal price;

    @ValidObjectId(message = "imageId must be a valid ObjectId")
    private String imageId;

    private Map<String, Object> dietaryInfo;

    private Boolean available = true;

    @ValidObjectId
    private List<String> categoryIds;

    @ValidObjectId
    private List<String> modifierIds;

    @NotBlank(message = "restaurantId is required")
    private String restaurantId;
}
