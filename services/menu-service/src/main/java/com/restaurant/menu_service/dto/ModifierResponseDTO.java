package com.restaurant.menu_service.dto;

import lombok.Builder;
import lombok.Data;
import java.util.List;
import java.util.Map;

@Data
@Builder
public class ModifierResponseDTO {
    private String id;
    private String itemId;
    private String name;
    private String type;
    private List<Map<String, Object>> options;
}
