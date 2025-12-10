package com.example.cartservice.service;

import com. example.cartservice. dto.AddToCartRequest;
import com.example. cartservice.dto. CartResponse;
import com.example.cartservice.dto.CheckoutResponse;
import com.example.cartservice.dto.UpdateCartItemRequest;
import com.example.cartservice.entity.Order;
import com. example.cartservice. entity.OrderItem;
import com.example.cartservice.entity.OrderStatus;
import com.example.cartservice.exception.ResourceNotFoundException;
import com. example.cartservice. repository.OrderItemRepository;
import com.example.cartservice.repository.OrderRepository;

import org.springframework.stereotype.Service;
import org.springframework. transaction.annotation. Transactional;

import java.util. Random;
import java. util.stream.Collectors;

import lombok.Data;
@Data
@Service
public class CartService {

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;

    public CartService(OrderRepository orderRepository, OrderItemRepository orderItemRepository) {
        this.orderRepository = orderRepository;
        this.orderItemRepository = orderItemRepository;
    }

    private String generateOrderId() {
        long timestamp = System.currentTimeMillis();
        int random = new Random().nextInt(10000);
        return String.format("ORD-%d-%04d", timestamp, random);
    }

    @Transactional
    public CartResponse openCart(Long userId, String userEmail) {
        Order existingOrder = orderRepository.findByUserIdAndStatus(userId, OrderStatus.PENDING)
                .orElse(null);

        if (existingOrder != null) {
            return mapToCartResponse(existingOrder);
        }

        Order newOrder = Order.builder()
                .orderId(generateOrderId())
                .userId(userId)
                .userEmail(userEmail)
                .status(OrderStatus. PENDING)
                .build();

        Order savedOrder = orderRepository.save(newOrder);
        return mapToCartResponse(savedOrder);
    }

    @Transactional
    public CartResponse getCart(Long userId, String userEmail) {
        return openCart(userId, userEmail);
    }

    @Transactional
    public CartResponse addToCart(Long userId, String userEmail, AddToCartRequest request) {
        Order order = orderRepository. findByUserIdAndStatus(userId, OrderStatus.PENDING)
                .orElseGet(() -> {
                    Order newOrder = Order.builder()
                            .orderId(generateOrderId())
                            .userId(userId)
                            .userEmail(userEmail)
                            .status(OrderStatus.PENDING)
                            .build();
                    return orderRepository.save(newOrder);
                });

        OrderItem existingItem = order.getItems().stream()
                .filter(item -> item. getMenuItemId().equals(request.getMenuItemId()))
                .findFirst()
                .orElse(null);

        

        if (existingItem != null) {
            existingItem.setQuantity(existingItem.getQuantity() + request.getQuantity());
            if (request.getNote() != null && !request.getNote().isEmpty()) {
                existingItem. setNote(request. getNote());
            }
        } else {
            OrderItem newItem = OrderItem.builder()
                    .menuItemId(request. getMenuItemId())
                    .itemName(request.getItemName())
                    .price(request.getPrice())
                    .quantity(request.getQuantity())
                    . note(request.getNote())
                    . build();
            order.addItem(newItem);
        }

        order.calculateTotal();
        Order savedOrder = orderRepository.save(order);

        return mapToCartResponse(savedOrder);
    }

    @Transactional
    public CartResponse updateCartItem(Long userId, String userEmail,
                                       Long itemId, UpdateCartItemRequest request) {
        Order order = orderRepository.findByUserIdAndStatus(userId, OrderStatus. PENDING)
                .orElseThrow(() -> new ResourceNotFoundException("Cart not found. Please open cart first."));

        OrderItem item = order.getItems().stream()
                .filter(i -> i.getId().equals(itemId))
                .findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("Item not found in cart"));

        if (request. getQuantity() != null) {
            item. setQuantity(request.getQuantity());
        }
        if (request.getNote() != null) {
            item. setNote(request. getNote());
        }

        order. calculateTotal();
        Order savedOrder = orderRepository.save(order);

        return mapToCartResponse(savedOrder);
    }

    @Transactional
    public CartResponse removeFromCart(Long userId, String userEmail, Long itemId) {
        Order order = orderRepository.findByUserIdAndStatus(userId, OrderStatus. PENDING)
                .orElseThrow(() -> new ResourceNotFoundException("Cart not found. Please open cart first."));

        OrderItem item = order. getItems().stream()
                .filter(i -> i.getId().equals(itemId))
                .findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("Item not found in cart"));

        order.removeItem(item);
        orderItemRepository.delete(item);
        order.calculateTotal();

        Order savedOrder = orderRepository.save(order);
        return mapToCartResponse(savedOrder);
    }

    @Transactional
    public CartResponse clearCart(Long userId, String userEmail) {
        Order order = orderRepository. findByUserIdAndStatus(userId, OrderStatus.PENDING)
                .orElseThrow(() -> new ResourceNotFoundException("Cart not found. Please open cart first."));

        order.getItems().clear();
        order.calculateTotal();

        Order savedOrder = orderRepository.save(order);
        return mapToCartResponse(savedOrder);
    }

    @Transactional
    public CheckoutResponse checkout(Long userId, String userEmail) {
        Order order = orderRepository.findByUserIdAndStatus(userId, OrderStatus. PENDING)
                .orElseThrow(() -> new ResourceNotFoundException("Cart not found. Please open cart first."));

        if (order.getItems().isEmpty()) {
            throw new ResourceNotFoundException("Cart is empty.  Add items before checkout.");
        }

        order.setStatus(OrderStatus.CONFIRMED);
        order.calculateTotal();
        Order savedOrder = orderRepository.save(order);

        return CheckoutResponse.builder()
                .orderId(savedOrder.getOrderId())
                .userId(savedOrder.getUserId())
                .userEmail(savedOrder.getUserEmail())
                .status(savedOrder.getStatus().name())
                .items(savedOrder.getItems().stream()
                        .map(item -> CheckoutResponse.OrderItemDetail.builder()
                                .menuItemId(item. getMenuItemId())
                                .itemName(item.getItemName())
                                .price(item.getPrice())
                                .quantity(item.getQuantity())
                                . subtotal(item. getSubtotal())
                                .note(item.getNote())
                                . build())
                        .collect(Collectors.toList()))
                .totalAmount(savedOrder.getTotalAmount())
                .confirmedAt(savedOrder.getUpdatedAt())
                .message("Order confirmed successfully!  Ready for payment.")
                .build();
    }

    @Transactional(readOnly = true)
    public CartResponse getOrderByOrderId(String orderId) {
        Order order = orderRepository.findByOrderId(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found:  " + orderId));
        return mapToCartResponse(order);
    }

    private CartResponse mapToCartResponse(Order order) {
        return CartResponse. builder()
                .orderId(order. getOrderId())
                .status(order.getStatus().name())
                .userId(order.getUserId())
                .userEmail(order.getUserEmail())
                .items(order.getItems().stream()
                        .map(this::mapToCartItemResponse)
                        .collect(Collectors.toList()))
                .totalAmount(order.getTotalAmount())
                .totalItems(order. getItems().stream()
                        .mapToInt(OrderItem::getQuantity)
                        .sum())
                .createdAt(order. getCreatedAt())
                .updatedAt(order.getUpdatedAt())
                .build();
    }

    private CartResponse. CartItemResponse mapToCartItemResponse(OrderItem item) {
        return CartResponse. CartItemResponse.builder()
                .itemId(item.getId())
                .menuItemId(item. getMenuItemId())
                .itemName(item.getItemName())
                .price(item.getPrice())
                .quantity(item.getQuantity())
                .note(item. getNote())
                .subtotal(item.getSubtotal())
                .addedAt(item. getAddedAt())
                .build();
    }
}