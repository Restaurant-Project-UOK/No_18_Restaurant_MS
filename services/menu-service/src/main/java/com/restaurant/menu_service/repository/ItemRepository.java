package com.restaurant.menu_service.repository;

import com.restaurant.menu_service.entity.Item;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ItemRepository extends JpaRepository<Item, Long> {

    List<Item> findByRestaurantId(Long restaurantId);

    Optional<Item> findByIdAndRestaurantId(Long id, Long restaurantId);

    boolean existsByIdAndRestaurantId(Long id, Long restaurantId);
}