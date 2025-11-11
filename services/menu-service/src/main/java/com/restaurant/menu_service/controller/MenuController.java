package com.restaurant.menu_service.controller;

import com.restaurant.menu_service.dto.ItemRequestDTO;
import com.restaurant.menu_service.dto.ItemResponseDTO;
import com.restaurant.menu_service.service.MenuService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/restaurants/{restaurantId}/items") 
@RequiredArgsConstructor
public class MenuController {

    private final MenuService menuService;

    @PostMapping
    public ResponseEntity<ItemResponseDTO> createItem(
            @PathVariable Long restaurantId,
            @Valid @RequestBody ItemRequestDTO itemRequest) {
        ItemResponseDTO createdItem = menuService.createItem(restaurantId, itemRequest);
        return new ResponseEntity<>(createdItem, HttpStatus.CREATED);
    }

    @GetMapping
    public ResponseEntity<List<ItemResponseDTO>> getAllItemsByRestaurant(@PathVariable Long restaurantId) {
        List<ItemResponseDTO> items = menuService.getAllItemsByRestaurant(restaurantId);
        return ResponseEntity.ok(items);
    }

    @PutMapping("/{itemId}")
    public ResponseEntity<ItemResponseDTO> updateItem(
            @PathVariable Long restaurantId,
            @PathVariable Long itemId,
            @Valid @RequestBody ItemRequestDTO itemRequest) {
        ItemResponseDTO updatedItem = menuService.updateItem(restaurantId, itemId, itemRequest);
        return ResponseEntity.ok(updatedItem);
    }

    @DeleteMapping("/{itemId}")
    public ResponseEntity<Void> deleteItem(
            @PathVariable Long restaurantId,
            @PathVariable Long itemId) {
        menuService.deleteItem(restaurantId, itemId);
        return ResponseEntity.noContent().build();
    }
}