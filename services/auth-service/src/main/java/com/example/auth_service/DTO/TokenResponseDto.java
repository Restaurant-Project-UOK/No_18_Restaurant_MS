package com.example.auth_service.DTO;

import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor

public class TokenResponseDto {
    
    public TokenResponseDto(String newAccessToken, String newRefreshToken) {
        this.accessToken = newAccessToken;
        this.refreshToken = newRefreshToken;
        
    }
    private String accessToken;
    private String refreshToken;

    
}

