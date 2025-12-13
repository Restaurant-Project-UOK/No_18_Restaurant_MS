package com.restaurant.menu_service.controller;

import com.restaurant.menu_service.api.ApiResponse;
import com.restaurant.menu_service.dto.*;
import com.restaurant.menu_service.service.ItemService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/restaurants/{restaurantId}/items")
public class ItemController {
    private final ItemService itemService;

    @PostMapping
    public ResponseEntity<ApiResponse<ItemResponseDTO>> create(@PathVariable String restaurantId,
            @Valid @RequestBody ItemRequestDTO dto) {
        dto.setRestaurantId(restaurantId);
        ItemResponseDTO created = itemService.create(dto);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.<ItemResponseDTO>builder().success(true).message("Item created").data(created)
                        .build());
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<ItemResponseDTO>>> list(@PathVariable String restaurantId) {
        List<ItemResponseDTO> list = itemService.listByRestaurant(restaurantId);
        return ResponseEntity
                .ok(ApiResponse.<List<ItemResponseDTO>>builder().success(true).message("OK").data(list).build());
    }

    @GetMapping("/{itemId}")
    public ResponseEntity<ApiResponse<ItemResponseDTO>> get(@PathVariable String restaurantId,
            @PathVariable String itemId) {
        ItemResponseDTO dto = itemService.get(itemId);
        return ResponseEntity.ok(ApiResponse.<ItemResponseDTO>builder().success(true).message("OK").data(dto).build());
    }

    @PutMapping("/{itemId}")
    public ResponseEntity<ApiResponse<ItemResponseDTO>> update(@PathVariable String restaurantId,
            @PathVariable String itemId, @Valid @RequestBody ItemRequestDTO dto) {
        dto.setRestaurantId(restaurantId);
        ItemResponseDTO updated = itemService.update(itemId, dto);
        return ResponseEntity
                .ok(ApiResponse.<ItemResponseDTO>builder().success(true).message("Updated").data(updated).build());
    }

    @DeleteMapping("/{itemId}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable String restaurantId, @PathVariable String itemId) {
        itemService.delete(itemId);
        return ResponseEntity.ok(ApiResponse.<Void>builder().success(true).message("Deleted").build());
    }
}
