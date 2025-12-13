package com.restaurant.menu_service.validation;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import com.restaurant.menu_service.dto.CategoryRequestDTO;
import com.restaurant.menu_service.repository.CategoryRepository;

@Component
public class UniqueCategoryNamePerRestaurantValidator
        implements ConstraintValidator<UniqueCategoryNamePerRestaurant, CategoryRequestDTO> {

    @Autowired
    private CategoryRepository categoryRepository;

    @Override
    public boolean isValid(CategoryRequestDTO dto, ConstraintValidatorContext context) {
        if (dto == null)
            return true;
        if (dto.getRestaurantId() == null || dto.getName() == null)
            return true;
        return categoryRepository.findByRestaurantIdOrderBySortOrder(dto.getRestaurantId())
                .stream()
                .noneMatch(c -> c.getName().equalsIgnoreCase(dto.getName()));
    }
}
