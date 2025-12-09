package com.example.auth_service.DTO;

import com.example.auth_service.Entity.User;

import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor

public class TokenResponseDto {
    
    public TokenResponseDto(String newAccessToken, String newRefreshToken, User user) {
        this.accessToken = newAccessToken;
        this.refreshToken = newRefreshToken;
        this.user = user;
    }
    private String accessToken;
    private String refreshToken;
    private User user;
    
}

