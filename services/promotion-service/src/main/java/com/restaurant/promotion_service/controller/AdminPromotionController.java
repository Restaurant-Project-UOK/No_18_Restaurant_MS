package com.restaurant.promotion_service.controller;

import com.restaurant.promotion_service.dto.CreatePromotionRequest;
import com.restaurant.promotion_service.dto.PromotionResponse;
import com.restaurant.promotion_service.dto.UpdatePromotionRequest;
import com.restaurant.promotion_service.service.PromotionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

/**
 * Admin endpoints for promotion management
 */
@RestController
@RequestMapping("/api/admin/promotion")
@RequiredArgsConstructor
@Slf4j
public class AdminPromotionController {

    private final PromotionService promotionService;

    /**
     * Get all promotions (including inactive)
     * GET /api/admin/promotion
     */
    @GetMapping
    public ResponseEntity<List<PromotionResponse>> getAllPromotions() {
        log.info("GET /api/admin/promotion");
        List<PromotionResponse> promotions = promotionService.getAllPromotions();
        return ResponseEntity.ok(promotions);
    }
    
    /**
     * Create a new promotion
     * POST /api/admin/promotion
     */
    @PostMapping("/promotion")
    public ResponseEntity<PromotionResponse> createPromotion(
            @Valid @RequestBody CreatePromotionRequest request
    ) {
        log.info("POST /api/admin/promotion - title: {}", request.getName());
        PromotionResponse response = promotionService.createPromotion(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }


    /**
     * Update existing promotion
     * PUT /api/admin/promotion/{promotionId}
     */
    @PutMapping("/promotion/{promotionId}")
    public ResponseEntity<PromotionResponse> updatePromotion(
            @PathVariable Long promotionId,
            @Valid @RequestBody UpdatePromotionRequest request
    ) {
        log.info("PUT /api/admin/promotion/{} - updating promotion", promotionId);
        PromotionResponse response = promotionService.updatePromotion(promotionId, request);
        return ResponseEntity.ok(response);
    }

    /**
     * Delete promotion (soft delete)
     * DELETE /api/admin/promotion/{promotionId}
     */
    @DeleteMapping("/{promotionId}")
    public ResponseEntity<Void> deletePromotion(@PathVariable Long promotionId) {
        log.info("DELETE /api/admin/promotion/{}", promotionId);
        promotionService.deletePromotion(promotionId);
        return ResponseEntity.noContent().build();
    }
}
