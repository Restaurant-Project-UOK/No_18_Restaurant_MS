package com.restaurant.menu_service.repository;

import com.restaurant.menu_service.entity.Category;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CategoryRepository extends MongoRepository<Category, String> {
    List<Category> findByRestaurantIdOrderBySortOrder(String restaurantId);

    boolean existsByRestaurantIdAndNameIgnoreCase(String restaurantId, String name);
}
