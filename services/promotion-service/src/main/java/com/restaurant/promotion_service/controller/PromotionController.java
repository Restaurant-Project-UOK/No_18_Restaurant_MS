package com.restaurant.promotion_service.controller;

import com.restaurant.promotion_service.dto.PromotionResponse;
import com.restaurant.promotion_service.service.PromotionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Customer-facing promotion endpoints
 */
@RestController
@RequestMapping("/api/promotion")
@RequiredArgsConstructor
@Slf4j
public class PromotionController {
    
    private final PromotionService promotionService;

    /**
     * Get available promotions
     * GET /api/promotion
     */
    @GetMapping
    public ResponseEntity<List<PromotionResponse>> getPromotions() {
        log.info("GET /api/promotion");
        List<PromotionResponse> promotions = promotionService.getAvailablePromotions();
        return ResponseEntity.ok(promotions);
    }

    /**
     * Get single promotiion by ID
     * GET /api/promotion/{promotionId}
     */
    @GetMapping("/{promotionId}")
    public ResponseEntity<PromotionResponse> getPromotion(
            @PathVariable Long promotionId
    ) {
        log.info("GET /api/promotion/{}", promotionId);
        PromotionResponse promotion = promotionService.getPromotion(promotionId);
        return ResponseEntity.ok(promotion);
    }
}
