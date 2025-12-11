package com.restaurant.menu_service.dto;

import jakarta.validation.constraints.*;
import com.restaurant.menu_service.validation.ValidPromotionDates;
import lombok.Data;
import java.time.Instant;

@Data
@ValidPromotionDates
public class PromotionRequestDTO {
    @NotBlank(message = "name required")
    private String name;

    private String restaurantId;

    @NotBlank(message = "discountType required")
    private String discountType; // percentage|fixed

    @NotNull(message = "discountValue required")
    private Double discountValue;

    @NotNull(message = "startAt required")
    private Instant startAt;

    @NotNull(message = "endAt required")
    private Instant endAt;
}
