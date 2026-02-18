package com.restaurant.menu_service.service;

import com.restaurant.menu_service.dto.CategoryResponse;
import com.restaurant.menu_service.dto.CreateCategoryRequest;
import com.restaurant.menu_service.dto.UpdateCategoryRequest;
import com.restaurant.menu_service.entity.Category;
import com.restaurant.menu_service.exception.BadRequestException;
import com.restaurant.menu_service.exception.ResourceNotFoundException;
import com.restaurant.menu_service.repository.CategoryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class CategoryService {

    private final CategoryRepository categoryRepository;

    /**
     * Get all categories ordered by sort_order
     */
    @Transactional(readOnly = true)
    public List<CategoryResponse> getAllCategories() {
        log.info("Fetching all categories");
        List<Category> categories = categoryRepository.findAllByOrderBySortOrderAsc();
        log.debug("Found {} categories", categories.size());
        return categories.stream()
                .map(CategoryResponse::fromEntity)
                .collect(Collectors.toList());
    }

    /**
     * Get single category by ID
     */
    @Transactional(readOnly = true)
    public CategoryResponse getCategory(Long categoryId) {
        log.info("Fetching category: {}", categoryId);
        Category category = categoryRepository.findById(categoryId)
                .orElseThrow(() -> new ResourceNotFoundException("Category", "id", categoryId));
        return CategoryResponse.fromEntity(category);
    }

    /**
     * Create new category
     */
    @Transactional
    public CategoryResponse createCategory(CreateCategoryRequest request) {
        log.info("Creating category: {}", request.getName());

        // Check if category with same name already exists
        if (categoryRepository.existsByName(request.getName())) {
            log.warn("Category with name '{}' already exists", request.getName());
            throw new BadRequestException("Category with name '" + request.getName() + "' already exists");
        }

        Category category = Category.builder()
                .name(request.getName())
                .sortOrder(request.getSortOrder() != null ? request.getSortOrder() : 0)
                .build();

        Category savedCategory = categoryRepository.save(category);
        log.info("Category created successfully with ID: {}", savedCategory.getId());

        return CategoryResponse.fromEntity(savedCategory);
    }

    /**
     * Update existing category
     */
    @Transactional
    public CategoryResponse updateCategory(Long categoryId, UpdateCategoryRequest request) {
        log.info("Updating category: {}", categoryId);

        Category category = categoryRepository.findById(categoryId)
                .orElseThrow(() -> new ResourceNotFoundException("Category", "id", categoryId));

        // Update name if provided
        if (request.getName() != null && !request.getName().equals(category.getName())) {
            // Check if new name already exists
            if (categoryRepository.existsByName(request.getName())) {
                log.warn("Category with name '{}' already exists", request.getName());
                throw new BadRequestException("Category with name '" + request.getName() + "' already exists");
            }
            category.setName(request.getName());
        }

        // Update sort order if provided
        if (request.getSortOrder() != null) {
            category.setSortOrder(request.getSortOrder());
        }

        Category updatedCategory = categoryRepository.save(category);
        log.info("Category updated successfully: {}", categoryId);

        return CategoryResponse.fromEntity(updatedCategory);
    }

    /**
     * Delete category
     * Only allowed if no menu items are associated with it
     */
    @Transactional
    public void deleteCategory(Long categoryId) {
        log.info("Deleting category: {}", categoryId);

        Category category = categoryRepository.findById(categoryId)
                .orElseThrow(() -> new ResourceNotFoundException("Category", "id", categoryId));

        // Check if category has associated menu items
        if (category.getMenuItems() != null && !category.getMenuItems().isEmpty()) {
            log.warn("Cannot delete category {} - has {} associated menu items",
                    categoryId, category.getMenuItems().size());
            throw new BadRequestException(
                    "Cannot delete category with associated menu items. " +
                    "Please remove all menu items from this category first."
            );
        }

        categoryRepository.delete(category);
        log.info("Category deleted successfully: {}", categoryId);
    }
}

