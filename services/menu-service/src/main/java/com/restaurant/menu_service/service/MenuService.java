package com.restaurant.menu_service.service;

import com.restaurant.menu_service.dto.ItemRequestDTO;
import com.restaurant.menu_service.dto.ItemResponseDTO;
import com.restaurant.menu_service.entity.Item;
import com.restaurant.menu_service.entity.Restaurant;
import com.restaurant.menu_service.repository.ItemRepository;
import com.restaurant.menu_service.repository.RestaurantRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor 
public class MenuService {

   private final ItemRepository itemRepository;
    private final RestaurantRepository restaurantRepository;

    @Transactional
    public ItemResponseDTO createItem(Long restaurantId, ItemRequestDTO requestDTO) {
        Restaurant restaurant = restaurantRepository.findById(restaurantId)
            .orElseThrow(() -> new EntityNotFoundException("Restaurant not found with id: " + restaurantId));

        Item item = new Item();
        item.setRestaurant(restaurant);
        item.setName(requestDTO.name());
        item.setDescription(requestDTO.description());
        item.setPrice(requestDTO.price());
        item.setImageId(requestDTO.imageId());
        item.setDietary(requestDTO.dietary());
        item.set_active(requestDTO.is_active());

        Item savedItem = itemRepository.save(item);
        return mapToResponseDTO(savedItem);
    }

    @Transactional(readOnly = true)
    public List<ItemResponseDTO> getAllItemsByRestaurant(Long restaurantId) {
        if (!restaurantRepository.existsById(restaurantId)) {
            throw new EntityNotFoundException("Restaurant not found with id: " + restaurantId);
        }
        return itemRepository.findByRestaurantId(restaurantId).stream()
                .map(this::mapToResponseDTO)
                .collect(Collectors.toList());
    }
    
    @Transactional
    public ItemResponseDTO updateItem(Long restaurantId, Long itemId, ItemRequestDTO requestDTO) {
        Item item = itemRepository.findByIdAndRestaurantId(itemId, restaurantId)
                .orElseThrow(() -> new EntityNotFoundException("Item not found with id: " + itemId + " for restaurant " + restaurantId));

        item.setName(requestDTO.name());
        item.setDescription(requestDTO.description());
        item.setPrice(requestDTO.price());
        item.setImageId(requestDTO.imageId());
        item.setDietary(requestDTO.dietary());
        item.set_active(requestDTO.is_active());

        Item updatedItem = itemRepository.save(item);
        return mapToResponseDTO(updatedItem);
    }

    @Transactional
    public void deleteItem(Long restaurantId, Long itemId) {
        if (!itemRepository.existsByIdAndRestaurantId(itemId, restaurantId)) {
            throw new EntityNotFoundException("Item not found with id: " + itemId + " for restaurant " + restaurantId);
        }
        itemRepository.deleteById(itemId);
    }
    
    private ItemResponseDTO mapToResponseDTO(Item item) {
        return new ItemResponseDTO(
            item.getId(),
            item.getRestaurant().getId(),
            item.getName(),
            item.getDescription(),
            item.getPrice(),
            item.getImageId(),
            item.getDietary(),
            item.is_active()
        );
    }
}
