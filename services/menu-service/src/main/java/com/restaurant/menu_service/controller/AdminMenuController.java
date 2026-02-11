package com.restaurant.menu_service.controller;

import com.restaurant.menu_service.dto.CreateMenuItemRequest;
import com.restaurant.menu_service.dto.MenuItemResponse;
import com.restaurant.menu_service.dto.UpdateMenuItemRequest;
import com.restaurant.menu_service.service.MenuService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

/**
 * Admin endpoints for menu management
 */
@RestController
@RequestMapping("/api/admin/menu")
@RequiredArgsConstructor
@Slf4j
public class AdminMenuController {

    private final MenuService menuService;

    /**
     * Get all menu items (including inactive)
     * GET /api/admin/menu
     */
    @GetMapping
    public ResponseEntity<List<MenuItemResponse>> getAllMenuItems() {
        log.info("GET /api/admin/menu");
        List<MenuItemResponse> items = menuService.getAllMenuItems();
        return ResponseEntity.ok(items);
    }

    /**
     * Create new menu item with optional image
     * POST /api/admin/menu
     */
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<MenuItemResponse> createMenuItem(
            @Valid @RequestPart("menuItem") CreateMenuItemRequest request,
            @RequestPart(value = "image", required = false) MultipartFile image
    ) {
        log.info("POST /api/admin/menu - name: {}", request.getName());
        MenuItemResponse response = menuService.createMenuItem(request, image);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Update existing menu item
     * PUT /api/admin/menu/{itemId}
     */
    @PutMapping(value = "/{itemId}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<MenuItemResponse> updateMenuItem(
            @PathVariable Long itemId,
            @Valid @RequestPart("menuItem") UpdateMenuItemRequest request,
            @RequestPart(value = "image", required = false) MultipartFile image
    ) {
        log.info("PUT /api/admin/menu/{} - updating menu item", itemId);
        MenuItemResponse response = menuService.updateMenuItem(itemId, request, image);
        return ResponseEntity.ok(response);
    }

    /**
     * Update menu item availability
     * PATCH /api/admin/menu/{itemId}/availability
     */
    @PatchMapping("/{itemId}/availability")
    public ResponseEntity<MenuItemResponse> updateAvailability(
            @PathVariable Long itemId,
            @RequestParam Boolean isActive
    ) {
        log.info("PATCH /api/admin/menu/{}/availability - isActive: {}", itemId, isActive);
        MenuItemResponse response = menuService.updateAvailability(itemId, isActive);
        return ResponseEntity.ok(response);
    }

    /**
     * Delete menu item (soft delete)
     * DELETE /api/admin/menu/{itemId}
     */
    @DeleteMapping("/{itemId}")
    public ResponseEntity<Void> deleteMenuItem(@PathVariable Long itemId) {
        log.info("DELETE /api/admin/menu/{}", itemId);
        menuService.deleteMenuItem(itemId);
        return ResponseEntity.noContent().build();
    }

}

