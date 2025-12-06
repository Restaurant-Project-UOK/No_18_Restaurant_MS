package com.restaurant.menu_service.repository;

import com.restaurant.menu_service.entity.Item;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ItemRepository extends MongoRepository<Item, String> {
    List<Item> findByRestaurantId(String restaurantId);

    List<Item> findByRestaurantIdAndCategoryIdsIn(String restaurantId, List<String> categoryIds);

    boolean existsByCategoryIdsContaining(String categoryId);

    boolean existsByModifierIdsContaining(String modifierId);
}
