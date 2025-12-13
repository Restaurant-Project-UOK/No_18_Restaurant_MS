package com.restaurant.menu_service.validation;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;
import java.lang.annotation.*;

@Target({ElementType.FIELD, ElementType.PARAMETER})
@Retention(RetentionPolicy.RUNTIME)
@Constraint(validatedBy = ValidObjectIdValidator.class)
@Documented
public @interface ValidObjectId {
    String message() default "Invalid ObjectId format";
    Class<?>[] groups() default {};
    Class<? extends Payload>[] payload() default {};
}