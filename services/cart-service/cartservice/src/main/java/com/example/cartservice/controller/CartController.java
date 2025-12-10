package com.example.cartservice.controller;

import com.example. cartservice.dto. AddToCartRequest;
import com.example.cartservice.dto.CartResponse;
import com.example. cartservice.dto. CheckoutResponse;
import com.example. cartservice.dto. UpdateCartItemRequest;
import com.example.cartservice.service.CartService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org. springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation. DeleteMapping;
import org.springframework.web.bind.annotation. GetMapping;
import org.springframework.web.bind.annotation. PathVariable;
import org.springframework.web.bind.annotation. PostMapping;
import org.springframework.web.bind.annotation. PutMapping;
import org.springframework. web.bind.annotation.RequestBody;
import org.springframework. web.bind.annotation.RequestMapping;
import org.springframework. web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/cart")
@RequiredArgsConstructor
public class CartController {
    
    private final CartService cartService;
    
    @PostMapping("/open")
    public ResponseEntity<CartResponse> openCart(Authentication authentication) {
        String email = (String) authentication.getPrincipal();
        Long userId = (Long) authentication.getCredentials();
        
        CartResponse response = cartService.openCart(userId, email);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
    
    @GetMapping
    public ResponseEntity<CartResponse> getCart(Authentication authentication) {
        String email = (String) authentication.getPrincipal();
        Long userId = (Long) authentication.getCredentials();
        
        return ResponseEntity.ok(cartService.getCart(userId, email));
    }
    
    @GetMapping("/order/{orderId}")
    public ResponseEntity<CartResponse> getOrderByOrderId(@PathVariable String orderId) {
        return ResponseEntity.ok(cartService.getOrderByOrderId(orderId));
    }
    
    @PostMapping("/items")
    public ResponseEntity<CartResponse> addToCart(
            Authentication authentication,
            @Valid @RequestBody AddToCartRequest request) {
        
        String email = (String) authentication.getPrincipal();
        Long userId = (Long) authentication.getCredentials();
        
        CartResponse response = cartService.addToCart(userId, email, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
    
    @PutMapping("/items/{itemId}")
    public ResponseEntity<CartResponse> updateCartItem(
            Authentication authentication,
            @PathVariable Long itemId,
            @Valid @RequestBody UpdateCartItemRequest request) {
        
        String email = (String) authentication.getPrincipal();
        Long userId = (Long) authentication.getCredentials();
        
        return ResponseEntity.ok(cartService.updateCartItem(userId, email, itemId, request));
    }
    
    @DeleteMapping("/items/{itemId}")
    public ResponseEntity<CartResponse> removeFromCart(
            Authentication authentication,
            @PathVariable Long itemId) {
        
        String email = (String) authentication.getPrincipal();
        Long userId = (Long) authentication.getCredentials();
        
        return ResponseEntity.ok(cartService.removeFromCart(userId, email, itemId));
    }
    
    @DeleteMapping
    public ResponseEntity<CartResponse> clearCart(Authentication authentication) {
        String email = (String) authentication.getPrincipal();
        Long userId = (Long) authentication.getCredentials();
        
        return ResponseEntity.ok(cartService.clearCart(userId, email));
    }
    
    @PostMapping("/checkout")
    public ResponseEntity<CheckoutResponse> checkout(Authentication authentication) {
        String email = (String) authentication.getPrincipal();
        Long userId = (Long) authentication.getCredentials();
        
        return ResponseEntity. ok(cartService. checkout(userId, email));
    }
}