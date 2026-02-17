package com.example.auth_service.DTO;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CreateStaffRequestDto {
    private String fullName;
    private String email;
    private String password;
    private Integer role; // 3=KITCHEN, 4=WAITER
    private String phone;
    private String address;
}
