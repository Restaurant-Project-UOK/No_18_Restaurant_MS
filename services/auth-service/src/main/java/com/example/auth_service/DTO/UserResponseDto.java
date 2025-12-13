package com.example.auth_service.DTO;

import com.example.auth_service.Entity.User;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor

public class UserResponseDto {

    private Integer id;
    private String email;
    private Integer role;      // 1=CUSTOMER, 2=ADMIN, 3=KITCHEN
    private Integer provider;  // 1=LOCAL, 2=GOOGLE
    private ProfileDto profile;


        // Convert User entity to DTO
    public UserResponseDto(User user) {
        this.id = user.getId();
        this.email = user.getEmail();
        this.role = user.getRole();
        this.provider = user.getProvider();
    }
}