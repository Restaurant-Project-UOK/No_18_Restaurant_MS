package com.restaurant.menu_service.validation;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;
import java.util.Set;

public class AllowedModifierTypeValidator implements ConstraintValidator<AllowedModifierType, String> {
    private static final Set<String> ALLOWED = Set.of("single", "multiple");

    @Override
    public boolean isValid(String value, ConstraintValidatorContext context) {
        if (value == null)
            return true;
        return ALLOWED.contains(value.toLowerCase());
    }
}
