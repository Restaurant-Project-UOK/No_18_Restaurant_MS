package com.restaurant.menu_service.controller;

import com.restaurant.menu_service.api.ApiResponse;
import com.restaurant.menu_service.dto.*;
import com.restaurant.menu_service.service.PromotionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/restaurants/{restaurantId}/promotions")
public class PromotionController {
    private final PromotionService service;

    @PostMapping
    public ResponseEntity<ApiResponse<PromotionResponseDTO>> create(@PathVariable String restaurantId,
            @Valid @RequestBody PromotionRequestDTO dto) {
        dto.setRestaurantId(restaurantId);
        PromotionResponseDTO created = service.create(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(
                ApiResponse.<PromotionResponseDTO>builder().success(true).message("Created").data(created).build());
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<PromotionResponseDTO>>> list(@PathVariable String restaurantId) {
        return ResponseEntity.ok(ApiResponse.<List<PromotionResponseDTO>>builder().success(true).message("OK")
                .data(service.listByRestaurant(restaurantId)).build());
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<PromotionResponseDTO>> update(@PathVariable String restaurantId,
            @PathVariable String id, @Valid @RequestBody PromotionRequestDTO dto) {
        dto.setRestaurantId(restaurantId);
        return ResponseEntity.ok(ApiResponse.<PromotionResponseDTO>builder().success(true).message("Updated")
                .data(service.update(id, dto)).build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable String restaurantId, @PathVariable String id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.<Void>builder().success(true).message("Deleted").build());
    }
}
