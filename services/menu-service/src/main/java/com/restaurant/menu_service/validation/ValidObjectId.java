package com.restaurant.menu_service.validation;

import jakarta.validation.*;
import java.lang.annotation.*;

@Target({ ElementType.FIELD, ElementType.PARAMETER })
@Retention(RetentionPolicy.RUNTIME)
@Constraint(validatedBy = ValidObjectIdValidator.class)
@Documented
public @interface ValidObjectId {
    String message() default "Invalid MongoDB ObjectId";

    Class<?>[] groups() default {};

    Class<? extends Payload>[] payload() default {};
}
