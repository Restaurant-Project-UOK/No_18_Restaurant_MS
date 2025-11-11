package com.restaurant.menu_service.service;

import com.restaurant.menu_service.dto.RestaurantRequestDTO;
import com.restaurant.menu_service.dto.RestaurantResponseDTO;
import com.restaurant.menu_service.entity.Restaurant;
import com.restaurant.menu_service.repository.RestaurantRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RestaurantService {

    private final RestaurantRepository restaurantRepository;

    @Transactional
    public RestaurantResponseDTO createRestaurant(RestaurantRequestDTO requestDTO) {
        Restaurant restaurant = new Restaurant();
        restaurant.setName(requestDTO.name());

        Restaurant savedRestaurant = restaurantRepository.save(restaurant);
        return mapToResponseDTO(savedRestaurant);
    }

    @Transactional(readOnly = true)
    public RestaurantResponseDTO getRestaurantById(Long restaurantId) {
        Restaurant restaurant = restaurantRepository.findById(restaurantId)
                .orElseThrow(() -> new EntityNotFoundException("Restaurant not found with id: " + restaurantId));
        return mapToResponseDTO(restaurant);
    }

    @Transactional(readOnly = true)
    public List<RestaurantResponseDTO> getAllRestaurants() {
        return restaurantRepository.findAll().stream()
                .map(this::mapToResponseDTO)
                .collect(Collectors.toList());
    }

    private RestaurantResponseDTO mapToResponseDTO(Restaurant restaurant) {
        return new RestaurantResponseDTO(restaurant.getId(), restaurant.getName());
    }
}
