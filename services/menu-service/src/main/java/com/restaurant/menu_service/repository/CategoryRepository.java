package com.restaurant.menu_service.repository;

import com.restaurant.menu_service.entity.Category;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CategoryRepository extends JpaRepository<Category, Long> {

    /**
     * Find all categories ordered by sort_order ascending
     */
    List<Category> findAllByOrderBySortOrderAsc();

    /**
     * Check if a category with the given name exists
     */
    boolean existsByName(String name);
}

