package com.restaurant.menu_service.repository;

import com.restaurant.menu_service.entity.Modifier;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ModifierRepository extends MongoRepository<Modifier, String> {
    List<Modifier> findByItemId(String itemId);
}
