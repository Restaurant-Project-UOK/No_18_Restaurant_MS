package com.restaurant.menu_service.validation;

import jakarta.validation.*;
import java.lang.annotation.*;

@Target({ ElementType.FIELD, ElementType.PARAMETER })
@Retention(RetentionPolicy.RUNTIME)
@Constraint(validatedBy = NonEmptyOptionsValidator.class)
@Documented
public @interface NonEmptyOptions {
    String message() default "options must be a non-empty list";

    Class<?>[] groups() default {};

    Class<? extends Payload>[] payload() default {};
}
