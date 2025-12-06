package com.restaurant.menu_service.validation;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;
import org.bson.types.ObjectId;

public class ValidObjectIdValidator implements ConstraintValidator<ValidObjectId, String> {
    @Override
    public boolean isValid(String value, ConstraintValidatorContext context) {
        if (value == null)
            return true; // use @NotBlank/@NotNull for required
        return ObjectId.isValid(value);
    }
}
