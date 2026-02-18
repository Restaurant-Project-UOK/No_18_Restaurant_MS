package com.example.auth_service.DTO;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Response DTO for token refresh endpoint.
 * Returns new access token with expiration metadata.
 * 
 * @author Ishanka Senadeera
 * @since 2026-02-15
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TokenRefreshResponseDto {
    private String accessToken;
    
    @Builder.Default
    private String tokenType = "Bearer";
    
    private long expiresIn; // milliseconds until expiration
}
