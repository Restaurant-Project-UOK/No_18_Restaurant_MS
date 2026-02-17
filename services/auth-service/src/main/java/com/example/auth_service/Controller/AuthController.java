package com.example.auth_service.Controller;

import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.auth_service.DTO.LoginRequestDto;
import com.example.auth_service.DTO.RegisterRequestDto;
import com.example.auth_service.DTO.TokenRefreshResponseDto;
import com.example.auth_service.DTO.TokenResponseDto;
import com.example.auth_service.DTO.UserResponseDto;
import com.example.auth_service.Security.JwtService;
import com.example.auth_service.Service.AuthService;

import lombok.Data;
import lombok.extern.slf4j.Slf4j;

/**
 * Authentication Controller
 * Handles user registration, login, token refresh, and logout.
 * 
 * @author Ishanka Senadeera
 * @since 2026-02-14
 * @updated 2026-02-15 - Improved token refresh to return JSON response
 */
@Slf4j
@Data
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;
    private final JwtService jwtService;

    @PostMapping("/register")
    public ResponseEntity<UserResponseDto> register(@RequestBody RegisterRequestDto dto) {
        UserResponseDto userResponse = authService.register(dto);
        log.info("User registered successfully: email={}", userResponse.getEmail());
        return ResponseEntity.ok(userResponse);
    }

    @PostMapping("/login")
    public ResponseEntity<TokenResponseDto> login(@RequestBody LoginRequestDto dto) {
        return ResponseEntity.ok(authService.login(dto));
    }

    /**
     * Refresh access token using a valid refresh token.
     * Returns a new access token with expiration information in JSON format.
     * 
     * @param request Map containing refreshToken
     * @return TokenRefreshResponseDto with new access token
     */
    @PostMapping("/refresh")
    public ResponseEntity<TokenRefreshResponseDto> generateNewAccessToken(@RequestBody Map<String, String> request) {
        String refreshToken = request.get("refreshToken");
        
        if (refreshToken == null || refreshToken.isBlank()) {
            throw new IllegalArgumentException("Refresh token is required");
        }
        
        TokenRefreshResponseDto response = jwtService.refreshAccessToken(refreshToken);
        log.info("Access token refreshed successfully");
        
        return ResponseEntity.ok(response);
    }

    @PostMapping("/logout")
    public ResponseEntity<String> logout(
            @RequestHeader("Authorization") String authHeader,
            @RequestHeader(value = "X-User-Id", required = false) String gatewayUserId) {

        Long userId = null;

        // Try to get user ID from gateway header first (gateway mode)
        if (gatewayUserId != null && !gatewayUserId.isEmpty()) {
            userId = Long.parseLong(gatewayUserId);
        } else {
            // Fallback to SecurityContext (standalone mode)
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth == null || !auth.isAuthenticated()) {
                return ResponseEntity.status(401).body("User not authenticated");
            }
            userId = Long.parseLong(auth.getName());
        }

        // Extract token from Bearer header
        String token = null;
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            token = authHeader.substring(7);
        }

        authService.logoutUser(userId, token);

        return ResponseEntity.ok("Logged out successfully");
    }

}
