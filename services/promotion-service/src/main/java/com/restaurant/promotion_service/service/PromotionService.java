package com.restaurant.promotion_service.service;

import com.restaurant.promotion_service.dto.CreatePromotionRequest;
import com.restaurant.promotion_service.dto.PromotionResponse;
import com.restaurant.promotion_service.dto.UpdatePromotionRequest;
import com.restaurant.promotion_service.entity.Promotion;
import com.restaurant.promotion_service.exception.ResourceNotFoundException;
import com.restaurant.promotion_service.repository.PromotionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class PromotionService {

    private final PromotionRepository promotionRepository;

    /**
     * Get all promotions
     */
    @Transactional(readOnly = true)
    public List<PromotionResponse> getAllPromotions() {
        log.info("Fetching all promotions");

        return promotionRepository.findAll()
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    /**
     * Get single promotion by ID
     */
    @Transactional(readOnly = true)
    public PromotionResponse getPromotion(Long promotionId) {
        log.info("Fetching promotion: {}", promotionId);

        Promotion promotion = promotionRepository.findById(promotionId)
                .orElseThrow(() -> new ResourceNotFoundException("Promotion", "id", promotionId));

        return toResponse(promotion);
    }

    /**
     * Create new promotion
     */
    @Transactional
    public PromotionResponse createPromotion(CreatePromotionRequest request) {
        log.info("Creating promotion: {}", request.getName());

        Promotion promotion = Promotion.builder()
                .name(request.getName())
                .discountType(request.getDiscountType())
                .discountValue(request.getDiscountValue())
                .startAt(request.getStartAt())
                .endAt(request.getEndAt())
                .build();

        Promotion savedPromotion = promotionRepository.save(promotion);

        log.info("Promotion created successfully with ID: {}", savedPromotion.getId());

        return toResponse(savedPromotion);
    }

    /**
     * Update existing promotion
     */
    @Transactional
    public PromotionResponse updatePromotion(Long promotionId, UpdatePromotionRequest request) {
        log.info("Updating promotion: {}", promotionId);

        Promotion promotion = promotionRepository.findById(promotionId)
                .orElseThrow(() -> new ResourceNotFoundException("Promotion", "id", promotionId));

        if (request.getName() != null) {
            promotion.setName(request.getName());
        }
        if (request.getDiscountType() != null) {
            promotion.setDiscountType(request.getDiscountType());
        }
        if (request.getDiscountValue() != null) {
            promotion.setDiscountValue(request.getDiscountValue());
        }
        if (request.getStartAt() != null) {
            promotion.setStartAt(request.getStartAt());
        }
        if (request.getEndAt() != null) {
            promotion.setEndAt(request.getEndAt());
        }

        Promotion updatedPromotion = promotionRepository.save(promotion);

        log.info("Promotion updated successfully: {}", promotionId);

        return toResponse(updatedPromotion);
    }

    /**
     * Delete promotion (Hard delete)
     */
    @Transactional
    public void deletePromotion(Long promotionId) {
        log.info("Deleting promotion: {}", promotionId);

        Promotion promotion = promotionRepository.findById(promotionId)
                .orElseThrow(() -> new ResourceNotFoundException("Promotion", "id", promotionId));

        promotionRepository.delete(promotion);

        log.info("Promotion deleted successfully: {}", promotionId);
    }

    /**
     * Convert entity to DTO
     */
    private PromotionResponse toResponse(Promotion promotion) {
        return PromotionResponse.builder()
                .id(promotion.getId())
                .name(promotion.getName())
                .discountType(promotion.getDiscountType())
                .discountValue(promotion.getDiscountValue())
                .startAt(promotion.getStartAt())
                .endAt(promotion.getEndAt())
                .build();
    }

    @Transactional(readOnly = true)
    public List<PromotionResponse> getAvailablePromotions() {
        LocalDateTime now = LocalDateTime.now();

        return promotionRepository.findAll()
                .stream()
                .filter(p -> 
                    (p.getStartAt() == null || !now.isBefore(p.getStartAt())) &&
                    (p.getEndAt() == null || !now.isAfter(p.getEndAt()))
                )
                .map(this::toResponse)
                .toList();
    }
}
