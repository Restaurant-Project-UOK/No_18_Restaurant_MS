package com.restaurant.menu_service.validation;

import jakarta.validation.*;
import java.lang.annotation.*;

@Target({ ElementType.TYPE })
@Retention(RetentionPolicy.RUNTIME)
@Constraint(validatedBy = UniqueCategoryNamePerRestaurantValidator.class)
@Documented
public @interface UniqueCategoryNamePerRestaurant {
    String message() default "Category name already exists for this restaurant";

    Class<?>[] groups() default {};

    Class<? extends Payload>[] payload() default {};
}
