package com.restaurant.promotion_service.dto;

import jakarta.validation.constraints.*;
import lombok.*;
import java.time.LocalDateTime;
import java.math.BigDecimal;
import java.util.Set;

@Data
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder

public class UpdatePromotionRequest {
    @NotBlank(message = "Promotion name is required")
    @Size(max = 100, message = "Promotion name cannot exceed 100 characters")
    private String name;

    @NotBlank(message = "Discount type is required")
    private String discountType; 
    // Example values: "PERCENTAGE", "FIXED"

    @NotNull(message = "Discount value is required")
    @Positive(message = "Discount value must be positive")
    private BigDecimal discountValue;

    @NotNull(message = "Start date and time is required")
    private LocalDateTime startAt;

    @NotNull(message = "End date and time is required")
    private LocalDateTime endAt;
}