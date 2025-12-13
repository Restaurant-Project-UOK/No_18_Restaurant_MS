package com.restaurant.menu_service.service;

import com.restaurant.menu_service.dto.RestaurantRequestDTO;
import com.restaurant.menu_service.dto.RestaurantResponseDTO;
import com.restaurant.menu_service.entity.Restaurant;
import com.restaurant.menu_service.exception.BadRequestException;
import com.restaurant.menu_service.exception.NotFoundException;
import com.restaurant.menu_service.repository.RestaurantRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RestaurantService {

    private final RestaurantRepository restaurantRepo;

    @Transactional
    public RestaurantResponseDTO create(RestaurantRequestDTO dto) {
        // Validate unique name (optional business rule)
        if (dto.name() == null || dto.name().isBlank()) {
            throw new BadRequestException("Restaurant name is required");
        }

        Restaurant restaurant = new Restaurant();
        restaurant.setName(dto.name().trim());
        
        Restaurant saved = restaurantRepo.save(restaurant);
        return map(saved);
    }

    @Transactional(readOnly = true)
    public List<RestaurantResponseDTO> listAll() {
        return restaurantRepo.findAll()
                .stream()
                .map(this::map)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public RestaurantResponseDTO get(String id) {
        Restaurant restaurant = restaurantRepo.findById(id)
                .orElseThrow(() -> new NotFoundException("Restaurant not found"));
        return map(restaurant);
    }

    @Transactional
    public RestaurantResponseDTO update(String id, RestaurantRequestDTO dto) {
        Restaurant restaurant = restaurantRepo.findById(id)
                .orElseThrow(() -> new NotFoundException("Restaurant not found"));

        if (dto.name() != null && !dto.name().isBlank()) {
            restaurant.setName(dto.name().trim());
        }

        Restaurant saved = restaurantRepo.save(restaurant);
        return map(saved);
    }

    @Transactional
    public void delete(String id) {
        if (!restaurantRepo.existsById(id)) {
            throw new NotFoundException("Restaurant not found");
        }
        
        // TODO: Check if restaurant has associated data (items, categories, etc.)
        // For now, allow deletion
        restaurantRepo.deleteById(id);
    }

    private RestaurantResponseDTO map(Restaurant restaurant) {
        return new RestaurantResponseDTO(
                restaurant.getId(),
                restaurant.getName()
        );
    }
}
