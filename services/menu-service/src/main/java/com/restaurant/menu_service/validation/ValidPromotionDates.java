package com.restaurant.menu_service.validation;

import jakarta.validation.*;
import java.lang.annotation.*;

@Target(ElementType.TYPE)
@Retention(RetentionPolicy.RUNTIME)
@Constraint(validatedBy = ValidPromotionDatesValidator.class)
@Documented
public @interface ValidPromotionDates {
    String message() default "startAt must be before endAt";

    Class<?>[] groups() default {};

    Class<? extends Payload>[] payload() default {};
}
