package com.restaurant.menu_service.service;

import com.restaurant.menu_service.dto.*;
import com.restaurant.menu_service.entity.*;
import com.restaurant.menu_service.exception.*;
import com.restaurant.menu_service.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ItemService {
    private final ItemRepository itemRepo;
    private final RestaurantRepository restaurantRepo;
    private final CategoryRepository categoryRepo;
    private final ModifierRepository modifierRepo;

    @Transactional
    public ItemResponseDTO create(ItemRequestDTO dto) {
        // restaurant exists
        restaurantRepo.findById(dto.getRestaurantId()).orElseThrow(() -> new NotFoundException("Restaurant not found"));

        // category check if provided
        if (dto.getCategoryIds() != null && !dto.getCategoryIds().isEmpty()) {
            // ensure each category exists and belongs to same restaurant
            dto.getCategoryIds().forEach(catId -> {
                Category cat = categoryRepo.findById(catId)
                        .orElseThrow(() -> new NotFoundException("Category not found: " + catId));
                if (!dto.getRestaurantId().equals(cat.getRestaurantId())) {
                    throw new BadRequestException("Category " + catId + " does not belong to restaurant");
                }
            });
        }

        // create item
        Item item = new Item();
        item.setRestaurantId(dto.getRestaurantId());
        item.setName(dto.getName());
        item.setDescription(dto.getDescription());
        item.setPrice(dto.getPrice());
        item.setImageId(dto.getImageId());
        item.setDietaryInfo(dto.getDietaryInfo());
        item.setAvailable(dto.getAvailable());
        item.setCategoryIds(dto.getCategoryIds());
        item.setModifierIds(dto.getModifierIds());

        Item saved = itemRepo.save(item);
        return map(saved);
    }

    @Transactional(readOnly = true)
    public List<ItemResponseDTO> listByRestaurant(String restaurantId) {
        restaurantRepo.findById(restaurantId).orElseThrow(() -> new NotFoundException("Restaurant not found"));
        return itemRepo.findByRestaurantId(restaurantId).stream().map(this::map).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public ItemResponseDTO get(String id) {
        Item item = itemRepo.findById(id).orElseThrow(() -> new NotFoundException("Item not found"));
        return map(item);
    }

    @Transactional
    public ItemResponseDTO update(String id, ItemRequestDTO dto) {
        Item item = itemRepo.findById(id).orElseThrow(() -> new NotFoundException("Item not found"));

        if (dto.getName() != null)
            item.setName(dto.getName());
        if (dto.getDescription() != null)
            item.setDescription(dto.getDescription());
        if (dto.getPrice() != null) {
            if (dto.getPrice().doubleValue() <= 0)
                throw new BadRequestException("Price must be positive");
            item.setPrice(dto.getPrice());
        }
        if (dto.getImageId() != null)
            item.setImageId(dto.getImageId());
        if (dto.getDietaryInfo() != null)
            item.setDietaryInfo(dto.getDietaryInfo());
        if (dto.getAvailable() != null)
            item.setAvailable(dto.getAvailable());
        if (dto.getCategoryIds() != null) {
            dto.getCategoryIds().forEach(catId -> {
                Category cat = categoryRepo.findById(catId)
                        .orElseThrow(() -> new NotFoundException("Category not found: " + catId));
                if (!item.getRestaurantId().equals(cat.getRestaurantId()))
                    throw new BadRequestException("Category does not belong to restaurant");
            });
            item.setCategoryIds(dto.getCategoryIds());
        }
        if (dto.getModifierIds() != null) {
            dto.getModifierIds().forEach(modId -> {
                if (!modifierRepo.existsById(modId))
                    throw new NotFoundException("Modifier not found: " + modId);
            });
            item.setModifierIds(dto.getModifierIds());
        }

        Item saved = itemRepo.save(item);
        return map(saved);
    }

    @Transactional
    public void delete(String id) {
        Item item = itemRepo.findById(id).orElseThrow(() -> new NotFoundException("Item not found"));
        // prevent deletion if modifiers exist referencing it? Document said prevent
        // orphan modifiers - check
        if (modifierRepo.findByItemId(id).size() > 0) {
            throw new BadRequestException("Cannot delete item with existing modifiers");
        }
        itemRepo.deleteById(id);
    }

    private ItemResponseDTO map(Item item) {
        return ItemResponseDTO.builder()
                .id(item.getId())
                .restaurantId(item.getRestaurantId())
                .name(item.getName())
                .description(item.getDescription())
                .price(item.getPrice())
                .imageId(item.getImageId())
                .dietaryInfo(item.getDietaryInfo())
                .available(item.getAvailable())
                .categoryIds(item.getCategoryIds())
                .modifierIds(item.getModifierIds())
                .build();
    }
}
