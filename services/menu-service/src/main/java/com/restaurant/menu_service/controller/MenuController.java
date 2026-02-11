package com.restaurant.menu_service.controller;

import com.restaurant.menu_service.dto.MenuItemResponse;
import com.restaurant.menu_service.service.MenuService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Customer-facing menu endpoints
 */
@RestController
@RequestMapping("/api/menu")
@RequiredArgsConstructor
@Slf4j
public class MenuController {

    private final MenuService menuService;

    /**
     * Get available menu items
     * GET /api/menu
     */
    @GetMapping
    public ResponseEntity<List<MenuItemResponse>> getMenuItems() {
        log.info("GET /api/menu");
        List<MenuItemResponse> items = menuService.getAvailableMenuItems();
        return ResponseEntity.ok(items);
    }

    /**
     * Get single menu item by ID
     * GET /api/menu/{itemId}
     */
    @GetMapping("/{itemId}")
    public ResponseEntity<MenuItemResponse> getMenuItem(
            @PathVariable Long itemId
    ) {
        log.info("GET /api/menu/{}", itemId);
        MenuItemResponse item = menuService.getMenuItem(itemId);
        return ResponseEntity.ok(item);
    }

}

