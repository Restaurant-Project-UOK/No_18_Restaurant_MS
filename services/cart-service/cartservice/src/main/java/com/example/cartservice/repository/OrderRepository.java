package com.example.cartservice.repository;

import com. example.cartservice. entity.Order;
import com.example.cartservice.entity.OrderStatus;
import org. springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {
    
    Optional<Order> findByUserIdAndStatus(Long userId, OrderStatus status);
    
    Optional<Order> findByOrderId(String orderId);
    
    List<Order> findByUserIdOrderByCreatedAtDesc(Long userId);
    
    boolean existsByUserIdAndStatus(Long userId, OrderStatus status);
}