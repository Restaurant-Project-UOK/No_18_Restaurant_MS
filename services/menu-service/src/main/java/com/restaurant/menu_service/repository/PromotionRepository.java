package com.restaurant.menu_service.repository;

import com.restaurant.menu_service.entity.Promotion;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PromotionRepository extends MongoRepository<Promotion, String> {
    List<Promotion> findByRestaurantId(String restaurantId);
    // basic overlap check will be implemented in service
}
