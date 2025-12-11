package com.restaurant.menu_service.validation;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;
import org.bson.types.ObjectId;
import java.util.List;

public class ValidObjectIdValidator implements ConstraintValidator<ValidObjectId, Object> {

    @Override
    public boolean isValid(Object value, ConstraintValidatorContext context) {
        if (value == null) {
            return true; // Use @NotNull for null checks
        }

        // Handle single String
        if (value instanceof String) {
            return isValidObjectId((String) value);
        }

        // Handle List of Strings
        if (value instanceof List) {
            List<?> list = (List<?>) value;
            for (Object item : list) {
                if (item instanceof String) {
                    if (!isValidObjectId((String) item)) {
                        return false;
                    }
                } else {
                    return false;
                }
            }
            return true;
        }

        return false;
    }

    private boolean isValidObjectId(String id) {
        if (id == null || id.trim().isEmpty()) {
            return false;
        }
        return ObjectId.isValid(id);
    }
}
