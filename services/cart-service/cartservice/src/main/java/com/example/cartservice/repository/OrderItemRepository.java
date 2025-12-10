package com.example. cartservice.repository;

import com.example.cartservice.entity.OrderItem;
import org.springframework. data.jpa. repository.JpaRepository;
import org. springframework.stereotype.Repository;

import java. util.Optional;

@Repository
public interface OrderItemRepository extends JpaRepository<OrderItem, Long> {
    
    Optional<OrderItem> findByOrderIdAndMenuItemId(Long orderId, Long menuItemId);
}