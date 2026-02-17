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
    public ResponseEntity<String> createStaff(@RequestBody CreateStaffRequestDto dto) {
        authService.createStaff(dto);
        log.info("Creating staff user: {}", dto.getEmail());
        return ResponseEntity.ok("Staff created successfully");
    }

    @GetMapping("/users")
    public ResponseEntity<List<UserResponseDto>> getAllUsers() {
        return ResponseEntity.ok(authService.getAllUsers());
    }
}
