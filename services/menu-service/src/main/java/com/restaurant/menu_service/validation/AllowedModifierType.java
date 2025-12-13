package com.restaurant.menu_service.validation;

import jakarta.validation.*;
import java.lang.annotation.*;

@Target({ ElementType.FIELD, ElementType.PARAMETER })
@Retention(RetentionPolicy.RUNTIME)
@Constraint(validatedBy = AllowedModifierTypeValidator.class)
@Documented
public @interface AllowedModifierType {
    String message() default "Invalid modifier type";

    Class<?>[] groups() default {};

    Class<? extends Payload>[] payload() default {};
}
