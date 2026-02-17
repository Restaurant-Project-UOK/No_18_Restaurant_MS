package com.example.auth_service.DTO;

import com.example.auth_service.Entity.User;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Response DTO for authentication endpoints.
 * Includes JWT tokens and user information with expiration metadata.
 * 
 * @author Ishanka Senadeera
 * @since 2026-02-14
 * @updated 2026-02-15 - Added expiration times for frontend token management
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TokenResponseDto {

    private String accessToken;
    private String refreshToken;
    private UserResponseDto user;
    
    @Builder.Default
    private String tokenType = "Bearer";
    
    private long accessTokenExpiresIn; // milliseconds until access token expires
    private long refreshTokenExpiresIn; // milliseconds until refresh token expires

    /**
     * Legacy constructor for backward compatibility
     */
    public TokenResponseDto(String accessToken, String refreshToken, User user) {
        this.accessToken = accessToken;
        this.refreshToken = refreshToken;
        this.tokenType = "Bearer";
    }
}

