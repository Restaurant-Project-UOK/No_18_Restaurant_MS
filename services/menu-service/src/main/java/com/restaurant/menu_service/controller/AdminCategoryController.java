package com.restaurant.menu_service.controller;

import com.restaurant.menu_service.dto.CategoryResponse;
import com.restaurant.menu_service.dto.CreateCategoryRequest;
import com.restaurant.menu_service.dto.UpdateCategoryRequest;
import com.restaurant.menu_service.service.CategoryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Admin endpoints for category management
 */
@RestController
@RequestMapping("/api/admin/categories")
@RequiredArgsConstructor
@Slf4j
public class AdminCategoryController {

    private final CategoryService categoryService;

    /**
     * Get all categories
     * GET /api/admin/categories
     */
    @GetMapping
    public ResponseEntity<List<CategoryResponse>> getAllCategories() {
        log.info("GET /api/admin/categories");
        List<CategoryResponse> categories = categoryService.getAllCategories();
        return ResponseEntity.ok(categories);
    }

    /**
     * Get single category by ID
     * GET /api/admin/categories/{categoryId}
     */
    @GetMapping("/{categoryId}")
    public ResponseEntity<CategoryResponse> getCategory(@PathVariable Long categoryId) {
        log.info("GET /api/admin/categories/{}", categoryId);
        CategoryResponse category = categoryService.getCategory(categoryId);
        return ResponseEntity.ok(category);
    }

    /**
     * Create new category
     * POST /api/admin/categories
     */
    @PostMapping
    public ResponseEntity<CategoryResponse> createCategory(
            @Valid @RequestBody CreateCategoryRequest request
    ) {
        log.info("POST /api/admin/categories - name: {}", request.getName());
        CategoryResponse response = categoryService.createCategory(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Update existing category
     * PUT /api/admin/categories/{categoryId}
     */
    @PutMapping("/{categoryId}")
    public ResponseEntity<CategoryResponse> updateCategory(
            @PathVariable Long categoryId,
            @Valid @RequestBody UpdateCategoryRequest request
    ) {
        log.info("PUT /api/admin/categories/{} - updating category", categoryId);
        CategoryResponse response = categoryService.updateCategory(categoryId, request);
        return ResponseEntity.ok(response);
    }

    /**
     * Delete category
     * DELETE /api/admin/categories/{categoryId}
     */
    @DeleteMapping("/{categoryId}")
    public ResponseEntity<Void> deleteCategory(@PathVariable Long categoryId) {
        log.info("DELETE /api/admin/categories/{}", categoryId);
        categoryService.deleteCategory(categoryId);
        return ResponseEntity.noContent().build();
    }
}

