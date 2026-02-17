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
 */
@Slf4j
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;
    private final JwtService jwtService;

    public AuthController(AuthService authService, JwtService jwtService) {
        this.authService = authService;
        this.jwtService = jwtService;
    }

    @PostMapping("/register")
    public ResponseEntity<String> register(@RequestBody RegisterRequestDto dto) {
        authService.register(dto);
        log.info("User registered successfully: email={}", dto.getEmail());
        return ResponseEntity.ok("Customer created successfully");
    }

    @PostMapping("/login")
    public ResponseEntity<TokenResponseDto> login(@RequestBody LoginRequestDto dto) {
        log.info("User logged successfully: email={}", dto.getEmail());
        return ResponseEntity.ok(authService.login(dto));
    }


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
            @RequestHeader("X-User-Id") Long userId) {

        // Extract token from Bearer header
        String token = null;
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            token = authHeader.substring(7);
        }

        authService.logoutUser(userId, token);
        log.info("User logged out successfully: userId={}", userId);

        return ResponseEntity.ok("Logged out successfully");
    }


}
