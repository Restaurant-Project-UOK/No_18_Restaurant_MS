package com.restaurant.menu_service.controller;

import com.restaurant.menu_service.api.ApiResponse;
import com.restaurant.menu_service.dto.*;
import com.restaurant.menu_service.service.CategoryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/restaurants/{restaurantId}/categories")
public class CategoryController {
    private final CategoryService service;

    @PostMapping
    public ResponseEntity<ApiResponse<CategoryResponseDTO>> create(@PathVariable String restaurantId,
            @Valid @RequestBody CategoryRequestDTO dto) {
        dto.setRestaurantId(restaurantId);
        CategoryResponseDTO created = service.create(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(
                ApiResponse.<CategoryResponseDTO>builder().success(true).message("Created").data(created).build());
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<CategoryResponseDTO>>> list(@PathVariable String restaurantId) {
        return ResponseEntity.ok(ApiResponse.<List<CategoryResponseDTO>>builder().success(true).message("OK")
                .data(service.list(restaurantId)).build());
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<CategoryResponseDTO>> update(@PathVariable String restaurantId,
            @PathVariable String id, @Valid @RequestBody CategoryRequestDTO dto) {
        dto.setRestaurantId(restaurantId);
        return ResponseEntity.ok(ApiResponse.<CategoryResponseDTO>builder().success(true).message("Updated")
                .data(service.update(id, dto)).build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable String restaurantId, @PathVariable String id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.<Void>builder().success(true).message("Deleted").build());
    }
}
