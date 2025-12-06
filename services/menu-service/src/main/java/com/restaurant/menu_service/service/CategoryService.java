package com.restaurant.menu_service.service;

import com.restaurant.menu_service.dto.*;
import com.restaurant.menu_service.entity.*;
import com.restaurant.menu_service.exception.*;
import com.restaurant.menu_service.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CategoryService {
    private final CategoryRepository categoryRepo;
    private final RestaurantRepository restaurantRepo;
    private final ItemRepository itemRepo;

    @Transactional
    public CategoryResponseDTO create(CategoryRequestDTO dto) {
        restaurantRepo.findById(dto.getRestaurantId()).orElseThrow(() -> new NotFoundException("Restaurant not found"));
        if (categoryRepo.existsByRestaurantIdAndNameIgnoreCase(dto.getRestaurantId(), dto.getName())) {
            throw new BadRequestException("Category name already exists for this restaurant");
        }
        Category c = new Category();
        c.setRestaurantId(dto.getRestaurantId());
        c.setName(dto.getName());
        c.setSortOrder(dto.getSortOrder());
        Category saved = categoryRepo.save(c);
        return map(saved);
    }

    @Transactional(readOnly = true)
    public List<CategoryResponseDTO> list(String restaurantId) {
        restaurantRepo.findById(restaurantId).orElseThrow(() -> new NotFoundException("Restaurant not found"));
        return categoryRepo.findByRestaurantIdOrderBySortOrder(restaurantId).stream().map(this::map)
                .collect(Collectors.toList());
    }

    @Transactional
    public CategoryResponseDTO update(String id, CategoryRequestDTO dto) {
        Category c = categoryRepo.findById(id).orElseThrow(() -> new NotFoundException("Category not found"));
        if (dto.getName() != null) {
            if (categoryRepo.existsByRestaurantIdAndNameIgnoreCase(c.getRestaurantId(), dto.getName())
                    && !c.getName().equalsIgnoreCase(dto.getName())) {
                throw new BadRequestException("Category name already exists");
            }
            c.setName(dto.getName());
        }
        if (dto.getSortOrder() != null)
            c.setSortOrder(dto.getSortOrder());
        Category saved = categoryRepo.save(c);
        return map(saved);
    }

    @Transactional
    public void delete(String id) {
        Category c = categoryRepo.findById(id).orElseThrow(() -> new NotFoundException("Category not found"));
        // prevent deleting if items exist in category
        if (itemRepo.existsByCategoryIdsContaining(id)) {
            throw new BadRequestException("Cannot delete category linked to items");
        }
        categoryRepo.deleteById(id);
    }

    private CategoryResponseDTO map(Category c) {
        return CategoryResponseDTO.builder()
                .id(c.getId())
                .restaurantId(c.getRestaurantId())
                .name(c.getName())
                .sortOrder(c.getSortOrder())
                .build();
    }
}
