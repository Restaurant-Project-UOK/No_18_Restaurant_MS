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

import java.util.Map;

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
     * Create new menu item WITHOUT image (JSON only)
     * POST /api/admin/menu
     */
    @PostMapping
    public ResponseEntity<MenuItemResponse> createMenuItem(
            @Valid @RequestBody CreateMenuItemRequest request) {
        log.info("POST /api/admin/menu - Creating menu item without image: {}", request.getName());
        MenuItemResponse response = menuService.createMenuItem(request, null);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Create new menu item WITH image (Multipart)
     * POST /api/admin/menu/with-image
     */
    @PostMapping(value = "/with-image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<MenuItemResponse> createMenuItemWithImage(
            @Valid @RequestPart("menuItem") CreateMenuItemRequest request,
            @RequestPart("image") MultipartFile image) {
        log.info("POST /api/admin/menu/with-image - Creating menu item with image: {}", request.getName());
        MenuItemResponse response = menuService.createMenuItem(request, image);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Update existing menu item WITHOUT image (JSON only)
     * PUT /api/admin/menu/{itemId}
     */
    @PutMapping("/{itemId}")
    public ResponseEntity<MenuItemResponse> updateMenuItem(
            @PathVariable Long itemId,
            @Valid @RequestBody UpdateMenuItemRequest request) {
        log.info("PUT /api/admin/menu/{} - Updating menu item without image", itemId);
        MenuItemResponse response = menuService.updateMenuItem(itemId, request, null);
        return ResponseEntity.ok(response);
    }

    /**
     * Update existing menu item WITH image (Multipart)
     * PUT /api/admin/menu/{itemId}/with-image
     */
    @PutMapping(value = "/{itemId}/with-image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<MenuItemResponse> updateMenuItemWithImage(
            @PathVariable Long itemId,
            @Valid @RequestPart("menuItem") UpdateMenuItemRequest request,
            @RequestPart("image") MultipartFile image) {
        log.info("PUT /api/admin/menu/{}/with-image - Updating menu item with image", itemId);
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
            @RequestParam Boolean isActive) {
        log.info("PATCH /api/admin/menu/{}/availability - isActive: {}", itemId, isActive);
        MenuItemResponse response = menuService.updateAvailability(itemId, isActive);
        return ResponseEntity.ok(response);
    }

    /**
     * Delete menu item (soft delete)
     * DELETE /api/admin/menu/{itemId}
     */
    @DeleteMapping("/{itemId}")
    public ResponseEntity<Map<String, String>> deleteMenuItem(@PathVariable Long itemId) {
        log.info("DELETE /api/admin/menu/{} - Hard delete", itemId);
        menuService.deleteMenuItem(itemId);
        return ResponseEntity.ok(Map.of(
                "message", "Menu item with ID " + itemId + " has been permanently deleted from all storage systems."));
    }

}
