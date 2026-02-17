package com.example.auth_service.Controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.auth_service.DTO.CreateStaffRequestDto;
import com.example.auth_service.DTO.UserResponseDto;
import com.example.auth_service.Service.AuthService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final AuthService authService;

    @PostMapping("/staff")
    public ResponseEntity<UserResponseDto> createStaff(@RequestBody CreateStaffRequestDto dto) {
        // Here we should ideally check if the requester is ADMIN.
        // But since this is a microservice behind a Gateway, we trust the Gateway to route /api/admin/** only to authorized users
        // OR we check the security context if the token is passed through.
        
        // For now, relies on gateway routing / simple accessibility.
        // IMPORTANT: In production, ensure SecurityConfig checks for Role 2 (ADMIN).
        
        log.info("Creating staff user: {}", dto.getEmail());
        return ResponseEntity.ok(authService.createStaff(dto));
    }

    @GetMapping("/users")
    public ResponseEntity<List<UserResponseDto>> getAllUsers() {
        return ResponseEntity.ok(authService.getAllUsers());
    }
}
