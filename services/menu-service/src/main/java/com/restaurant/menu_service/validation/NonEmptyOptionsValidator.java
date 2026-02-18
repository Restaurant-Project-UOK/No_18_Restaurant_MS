package com.restaurant.menu_service.validation;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;
import java.util.List;
import java.util.Map;

public class NonEmptyOptionsValidator implements ConstraintValidator<NonEmptyOptions, List<Map<String, Object>>> {

    @Override
    public boolean isValid(List<Map<String, Object>> value, ConstraintValidatorContext context) {
        if (value == null)
            return true; // allow null if not required
        return !value.isEmpty();
    }
}
