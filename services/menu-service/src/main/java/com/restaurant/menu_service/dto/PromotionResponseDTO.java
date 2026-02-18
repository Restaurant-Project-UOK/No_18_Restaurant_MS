package com.restaurant.menu_service.dto;

import lombok.Builder;
import lombok.Data;
import java.time.Instant;

@Data
@Builder
public class PromotionResponseDTO {
    private String id;
    private String restaurantId;
    private String name;
    private String discountType;
    private Double discountValue;
    private Instant startAt;
    private Instant endAt;
}
