package com.restaurant.menu_service.dto;

import jakarta.validation.constraints.*;
import com.restaurant.menu_service.validation.AllowedModifierType;
import com.restaurant.menu_service.validation.NonEmptyOptions;
import com.restaurant.menu_service.validation.ValidObjectId;
import lombok.Data;

import java.util.List;
import java.util.Map;

@Data
public class ModifierRequestDTO {
    @NotBlank(message = "name is required")
    private String name;

    @NotBlank(message = "type is required")
    @AllowedModifierType
    private String type;

    @NonEmptyOptions
    private List<Map<String, Object>> options;

    @ValidObjectId
    private String itemId;
}
