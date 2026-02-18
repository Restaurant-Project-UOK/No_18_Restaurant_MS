package com.restaurant.menu_service.controller;

import com.restaurant.menu_service.dto.CategoryResponse;
import com.restaurant.menu_service.service.CategoryService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Public endpoints for viewing categories
 */
@RestController
@RequestMapping("/api/categories")
@RequiredArgsConstructor
@Slf4j
public class CategoryController {

    private final CategoryService categoryService;

    /**
     * Get all categories (Public - No Auth Required)
     * GET /api/categories
     */
    @GetMapping
    public ResponseEntity<List<CategoryResponse>> getAllCategories() {
        log.info("GET /api/categories - public endpoint");
        List<CategoryResponse> categories = categoryService.getAllCategories();
        return ResponseEntity.ok(categories);
    }

    /**
     * Get single category by ID (Public - No Auth Required)
     * GET /api/categories/{categoryId}
     */
    @GetMapping("/{categoryId}")
    public ResponseEntity<CategoryResponse> getCategory(@PathVariable Long categoryId) {
        log.info("GET /api/categories/{} - public endpoint", categoryId);
        CategoryResponse category = categoryService.getCategory(categoryId);
        return ResponseEntity.ok(category);
    }
}

