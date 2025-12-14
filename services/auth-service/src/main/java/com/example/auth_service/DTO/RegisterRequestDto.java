package com.example.auth_service.DTO;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RegisterRequestDto {
    private String fullName;
    private String email;
    private String password;
    private Integer role;      // 1=CUSTOMER, 2=ADMIN, 3=KITCHEN
    private Integer provider;  // 1=LOCAL, 2=GOOGLE
    private String phone;
    private String address;
}
