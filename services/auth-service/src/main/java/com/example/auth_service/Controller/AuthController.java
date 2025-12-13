package com.example.auth_service.Controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.auth_service.DTO.LoginRequestDto;
import com.example.auth_service.DTO.ProfileDto;
import com.example.auth_service.DTO.RegisterRequestDto;
import com.example.auth_service.DTO.TokenResponseDto;
import com.example.auth_service.Service.AuthService;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private AuthService authService; // use @Autowired as you prefer

    // Register new user
    @PostMapping("/register")
    @Transactional
    public ResponseEntity<ProfileDto> register(@RequestBody RegisterRequestDto dto) {
        ProfileDto profileDto = authService.register(dto);
        return ResponseEntity.ok(profileDto);
    }

    // Login user (email + password)
    @PostMapping("/login")
    public ResponseEntity<TokenResponseDto> login(@RequestBody LoginRequestDto dto) {
        TokenResponseDto tokens = authService.login(dto);
        return ResponseEntity.ok(tokens);
    }

    // Google OAuth login
    @PostMapping("/google-login")
    public ResponseEntity<TokenResponseDto> googleLogin(@RequestBody LoginRequestDto dto) {
        TokenResponseDto tokens = authService.googleLogin(dto);
        return ResponseEntity.ok(tokens);
    }
}
