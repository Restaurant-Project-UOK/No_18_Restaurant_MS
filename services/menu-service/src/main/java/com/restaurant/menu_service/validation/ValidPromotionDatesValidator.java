package com.restaurant.menu_service.validation;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;
import com.restaurant.menu_service.dto.PromotionRequestDTO;

public class ValidPromotionDatesValidator implements ConstraintValidator<ValidPromotionDates, PromotionRequestDTO> {

    @Override
    public boolean isValid(PromotionRequestDTO dto, ConstraintValidatorContext context) {
        if (dto == null)
            return true;
        if (dto.getStartAt() == null || dto.getEndAt() == null)
            return true;

        return dto.getStartAt().isBefore(dto.getEndAt());
    }
}
