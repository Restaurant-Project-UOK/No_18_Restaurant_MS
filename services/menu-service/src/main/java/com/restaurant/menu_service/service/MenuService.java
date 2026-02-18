package com.restaurant.menu_service.service;

import com.restaurant.menu_service.dto.CreateMenuItemRequest;
import com.restaurant.menu_service.dto.MenuItemResponse;
import com.restaurant.menu_service.dto.UpdateMenuItemRequest;
import com.restaurant.menu_service.entity.Category;
import com.restaurant.menu_service.entity.MenuItem;
import com.restaurant.menu_service.exception.ResourceNotFoundException;
import com.restaurant.menu_service.repository.CategoryRepository;
import com.restaurant.menu_service.repository.MenuItemRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class MenuService {

    private final MenuItemRepository menuItemRepository;
    private final CategoryRepository categoryRepository;
    private final MediaService mediaService;

    @Value("${app.base-url}")
    private String baseUrl;

    /**
     * Get all available menu items (Customer view)
     */
    @Transactional(readOnly = true)
    public List<MenuItemResponse> getAvailableMenuItems() {
        log.info("Fetching available menu items");
        List<MenuItem> items = menuItemRepository.findByIsActive(true);
        return items.stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    /**
     * Get all menu items (Admin view)
     */
    @Transactional(readOnly = true)
    public List<MenuItemResponse> getAllMenuItems() {
        log.info("Fetching all menu items");
        List<MenuItem> items = menuItemRepository.findAll();
        return items.stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    /**
     * Get single menu item by ID
     */
    @Transactional(readOnly = true)
    public MenuItemResponse getMenuItem(Long itemId) {
        log.info("Fetching menu item: {}", itemId);
        MenuItem item = menuItemRepository.findById(itemId)
                .orElseThrow(() -> new ResourceNotFoundException("Menu item", "id", itemId));
        return toResponse(item);
    }

    /**
     * Create new menu item with optional image
     */
    @Transactional
    public MenuItemResponse createMenuItem(CreateMenuItemRequest request, MultipartFile image) {
        log.info("Creating menu item: {}", request.getName());

        // Upload image if provided
        String imageId = null;
        if (image != null && !image.isEmpty()) {
            imageId = mediaService.uploadImage(image);
        }

        // Get categories
        Set<Category> categories = new HashSet<>();
        if (request.getCategoryIds() != null && !request.getCategoryIds().isEmpty()) {
            categories = request.getCategoryIds().stream()
                    .map(id -> categoryRepository.findById(id)
                            .orElseThrow(() -> new ResourceNotFoundException("Category", "id", id)))
                    .collect(Collectors.toSet());
        }

        // Create menu item
        MenuItem item = MenuItem.builder()
                .name(request.getName())
                .description(request.getDescription())
                .price(request.getPrice())
                .imageId(imageId)
                .isActive(request.getIsActive() != null ? request.getIsActive() : true)
                .categories(categories)
                .build();

        MenuItem savedItem = menuItemRepository.save(item);
        log.info("Menu item created successfully with ID: {}", savedItem.getId());

        return toResponse(savedItem);
    }

    /**
     * Update existing menu item with optional image
     */
    @Transactional
    public MenuItemResponse updateMenuItem(Long itemId, UpdateMenuItemRequest request, MultipartFile image) {
        log.info("Updating menu item: {}", itemId);

        MenuItem item = menuItemRepository.findById(itemId)
                .orElseThrow(() -> new ResourceNotFoundException("Menu item", "id", itemId));

        // Update image if provided
        if (image != null && !image.isEmpty()) {
            // Delete old image
            if (item.getImageId() != null) {
                mediaService.deleteImage(item.getImageId());
            }
            // Upload new image
            String newImageId = mediaService.uploadImage(image);
            item.setImageId(newImageId);
        }

        // Update fields
        if (request.getName() != null) {
            item.setName(request.getName());
        }
        if (request.getDescription() != null) {
            item.setDescription(request.getDescription());
        }
        if (request.getPrice() != null) {
            item.setPrice(request.getPrice());
        }
        if (request.getIsActive() != null) {
            item.setIsActive(request.getIsActive());
        }

        // Update categories
        if (request.getCategoryIds() != null) {
            Set<Category> categories = request.getCategoryIds().stream()
                    .map(id -> categoryRepository.findById(id)
                            .orElseThrow(() -> new ResourceNotFoundException("Category", "id", id)))
                    .collect(Collectors.toSet());
            item.setCategories(categories);
        }

        MenuItem updatedItem = menuItemRepository.save(item);
        log.info("Menu item updated successfully: {}", itemId);

        return toResponse(updatedItem);
    }

    /**
     * Toggle menu item availability
     */
    @Transactional
    public MenuItemResponse updateAvailability(Long itemId, Boolean isActive) {
        log.info("Updating availability for menu item: {} to {}", itemId, isActive);

        MenuItem item = menuItemRepository.findById(itemId)
                .orElseThrow(() -> new ResourceNotFoundException("Menu item", "id", itemId));

        item.setIsActive(isActive);
        MenuItem updatedItem = menuItemRepository.save(item);

        log.info("Menu item availability updated: {}", itemId);
        return toResponse(updatedItem);
    }

    /**
     * Soft delete menu item (set isActive = false)
     */
    @Transactional
    public void deleteMenuItem(Long itemId) {
        log.info("Permanently deleting menu item: {}", itemId);

        MenuItem item = menuItemRepository.findById(itemId)
                .orElseThrow(() -> new ResourceNotFoundException("Menu item", "id", itemId));

        // Delete image from MongoDB first
        if (item.getImageId() != null) {
            mediaService.deleteImage(item.getImageId());
        }

        // Hard delete from MySQL
        menuItemRepository.delete(item);

        log.info("Menu item and associated resources deleted permanently: {}", itemId);
    }

    /**
     * Convert entity to DTO
     */
    private MenuItemResponse toResponse(MenuItem item) {
        String imageUrl = null;
        if (item.getImageId() != null && !item.getImageId().isEmpty()) {
            imageUrl = String.format("%s/api/media/%s", baseUrl, item.getImageId());
        }

        Set<MenuItemResponse.CategoryInfo> categoryInfos = item.getCategories().stream()
                .map(category -> MenuItemResponse.CategoryInfo.builder()
                        .id(category.getId())
                        .name(category.getName())
                        .sortOrder(category.getSortOrder())
                        .build())
                .collect(Collectors.toSet());

        return MenuItemResponse.builder()
                .id(item.getId())
                .name(item.getName())
                .description(item.getDescription())
                .price(item.getPrice())
                .imageUrl(imageUrl)
                .isActive(item.getIsActive())
                .categories(categoryInfos)
                .createdAt(item.getCreatedAt())
                .updatedAt(item.getUpdatedAt())
                .build();
    }

}
