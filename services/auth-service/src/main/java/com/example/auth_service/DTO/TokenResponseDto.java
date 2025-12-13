package com.example.auth_service.DTO;

import com.example.auth_service.Entity.User;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TokenResponseDto {
    
    private String accessToken;
    private String refreshToken;
    private Long accessTokenExpiry;
    private Long refreshTokenExpiry;
    private UserResponseDto user;

    public TokenResponseDto(String accessToken, String refreshToken, int accessTokenExpirySeconds, int refreshTokenExpirySeconds, User user) {
        this.accessToken = accessToken;
        this.refreshToken = refreshToken;
        this.accessTokenExpiry = System.currentTimeMillis() + (accessTokenExpirySeconds * 1000L);
        this.refreshTokenExpiry = System.currentTimeMillis() + (refreshTokenExpirySeconds * 1000L);
        this.user = new UserResponseDto(user);
    }
}

