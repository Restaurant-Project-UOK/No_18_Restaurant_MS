package com.restaurant.menu_service.controller;

import com.restaurant.menu_service.api.ApiResponse;
import com.restaurant.menu_service.dto.RestaurantRequestDTO;
import com.restaurant.menu_service.dto.RestaurantResponseDTO;
import com.restaurant.menu_service.service.RestaurantService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/restaurants")
public class RestaurantController {

    private final RestaurantService restaurantService;

    @PostMapping
    public ResponseEntity<ApiResponse<RestaurantResponseDTO>> create(
            @Valid @RequestBody RestaurantRequestDTO dto) {
        RestaurantResponseDTO created = restaurantService.create(dto);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.<RestaurantResponseDTO>builder()
                        .success(true)
                        .message("Restaurant created")
                        .data(created)
                        .build());
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<RestaurantResponseDTO>>> listAll() {
        List<RestaurantResponseDTO> restaurants = restaurantService.listAll();
        return ResponseEntity.ok(
                ApiResponse.<List<RestaurantResponseDTO>>builder()
                        .success(true)
                        .message("OK")
                        .data(restaurants)
                        .build());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<RestaurantResponseDTO>> get(@PathVariable String id) {
        RestaurantResponseDTO restaurant = restaurantService.get(id);
        return ResponseEntity.ok(
                ApiResponse.<RestaurantResponseDTO>builder()
                        .success(true)
                        .message("OK")
                        .data(restaurant)
                        .build());
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<RestaurantResponseDTO>> update(
            @PathVariable String id,
            @Valid @RequestBody RestaurantRequestDTO dto) {
        RestaurantResponseDTO updated = restaurantService.update(id, dto);
        return ResponseEntity.ok(
                ApiResponse.<RestaurantResponseDTO>builder()
                        .success(true)
                        .message("Restaurant updated")
                        .data(updated)
                        .build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable String id) {
        restaurantService.delete(id);
        return ResponseEntity.ok(
                ApiResponse.<Void>builder()
                        .success(true)
                        .message("Restaurant deleted")
                        .build());
    }
}
