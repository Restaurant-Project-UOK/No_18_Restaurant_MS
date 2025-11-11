package com.restaurant.menu_service.controller;

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
@RequestMapping("/api/v1/restaurants") 
@RequiredArgsConstructor
public class RestaurantController {

    private final RestaurantService restaurantService;

    @PostMapping
    public ResponseEntity<RestaurantResponseDTO> createRestaurant(@Valid @RequestBody RestaurantRequestDTO requestDTO) {
        RestaurantResponseDTO createdRestaurant = restaurantService.createRestaurant(requestDTO);
        return new ResponseEntity<>(createdRestaurant, HttpStatus.CREATED);
    }

    @GetMapping("/{restaurantId}")
    public ResponseEntity<RestaurantResponseDTO> getRestaurantById(@PathVariable Long restaurantId) {
        RestaurantResponseDTO restaurant = restaurantService.getRestaurantById(restaurantId);
        return ResponseEntity.ok(restaurant);
    }

    @GetMapping
    public ResponseEntity<List<RestaurantResponseDTO>> getAllRestaurants() {
        List<RestaurantResponseDTO> restaurants = restaurantService.getAllRestaurants();
        return ResponseEntity.ok(restaurants);
    }
}
