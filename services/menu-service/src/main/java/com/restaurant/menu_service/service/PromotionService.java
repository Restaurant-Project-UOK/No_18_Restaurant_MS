package com.restaurant.menu_service.service;

import com.restaurant.menu_service.dto.*;
import com.restaurant.menu_service.entity.Promotion;
import com.restaurant.menu_service.exception.*;
import com.restaurant.menu_service.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PromotionService {
    private final PromotionRepository repo;
    private final RestaurantRepository restaurantRepo;

    @Transactional
    public PromotionResponseDTO create(PromotionRequestDTO dto) {
        restaurantRepo.findById(dto.getRestaurantId()).orElseThrow(() -> new NotFoundException("Restaurant not found"));
        // Check overlap with existing promotions of restaurant
        List<Promotion> existing = repo.findByRestaurantId(dto.getRestaurantId());
        boolean overlap = existing.stream()
                .anyMatch(p -> !(dto.getEndAt().isBefore(p.getStartAt()) || dto.getStartAt().isAfter(p.getEndAt())));
        if (overlap)
            throw new BadRequestException("Promotion overlaps with an existing promotion");
        Promotion p = new Promotion();
        p.setRestaurantId(dto.getRestaurantId());
        p.setName(dto.getName());
        p.setDiscountType(dto.getDiscountType());
        p.setDiscountValue(dto.getDiscountValue());
        p.setStartAt(dto.getStartAt());
        p.setEndAt(dto.getEndAt());
        Promotion saved = repo.save(p);
        return map(saved);
    }

    @Transactional(readOnly = true)
    public List<PromotionResponseDTO> listByRestaurant(String restaurantId) {
        restaurantRepo.findById(restaurantId).orElseThrow(() -> new NotFoundException("Restaurant not found"));
        return repo.findByRestaurantId(restaurantId).stream().map(this::map).collect(Collectors.toList());
    }

    @Transactional
    public PromotionResponseDTO update(String id, PromotionRequestDTO dto) {
        Promotion p = repo.findById(id)
                .orElseThrow(() -> new NotFoundException("Promotion not found"));

        // Track if dates are being changed
        boolean datesChanged = false;
        
        if (dto.getName() != null) {
            p.setName(dto.getName());
        }
        
        if (dto.getDiscountType() != null) {
            p.setDiscountType(dto.getDiscountType());
        }
        
        if (dto.getDiscountValue() != null) {
            p.setDiscountValue(dto.getDiscountValue());
        }
        
        if (dto.getStartAt() != null) {
            p.setStartAt(dto.getStartAt());
            datesChanged = true;
        }
        
        if (dto.getEndAt() != null) {
            p.setEndAt(dto.getEndAt());
            datesChanged = true;
        }

        // Re-check overlap if dates changed
        if (datesChanged) {
            List<Promotion> existing = repo.findByRestaurantId(p.getRestaurantId());
            boolean overlap = existing.stream()
                    .filter(existingPromo -> !existingPromo.getId().equals(id)) // Exclude current promotion
                    .anyMatch(existingPromo -> 
                        !(p.getEndAt().isBefore(existingPromo.getStartAt()) || 
                        p.getStartAt().isAfter(existingPromo.getEndAt()))
                    );
            
            if (overlap) {
                throw new BadRequestException("Updated promotion overlaps with an existing promotion");
            }
        }

        Promotion saved = repo.save(p);
        return map(saved);
    }

    @Transactional
    public void delete(String id) {
        repo.deleteById(id);
    }

    private PromotionResponseDTO map(Promotion p) {
        return PromotionResponseDTO.builder()
                .id(p.getId())
                .restaurantId(p.getRestaurantId())
                .name(p.getName())
                .discountType(p.getDiscountType())
                .discountValue(p.getDiscountValue())
                .startAt(p.getStartAt())
                .endAt(p.getEndAt())
                .build();
    }
}
