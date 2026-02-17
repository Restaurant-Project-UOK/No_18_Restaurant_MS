package com.example.auth_service.DTO;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class LoginRequestDto {
    private String email;
    private String password;
    @JsonProperty(defaultValue = "0")
    private int tableId = 0;
}
