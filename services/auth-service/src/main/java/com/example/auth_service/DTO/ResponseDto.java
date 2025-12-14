package com.example.auth_service.DTO;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TokenResponseDto {
    private String accessToken;
    private String refreshToken;
}
