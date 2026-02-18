package com.restaurant.menu_service.dto;

import com.restaurant.menu_service.entity.Category;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CategoryResponse {

    private Long id;
    private String name;
    private Integer sortOrder;
    private Integer itemCount; // Number of menu items in this category

    public static CategoryResponse fromEntity(Category category) {
        return CategoryResponse.builder()
                .id(category.getId())
                .name(category.getName())
                .sortOrder(category.getSortOrder())
                .itemCount(category.getMenuItems() != null ? category.getMenuItems().size() : 0)
                .build();
    }
}

