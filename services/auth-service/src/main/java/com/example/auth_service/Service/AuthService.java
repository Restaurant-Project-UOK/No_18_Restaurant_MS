package com.example.auth_service.Service;

import com.example.auth_service.DTO.*;

import java.util.List;

public interface AuthService {
    void register(RegisterRequestDto dto);
    TokenResponseDto login(LoginRequestDto dto);
    TokenResponseDto googleLogin(LoginRequestDto dto);
    void logoutUser(Long userId, String token);

    // Admin / Staff Management
    void createStaff(CreateStaffRequestDto dto);
    List<UserResponseDto> getAllUsers();
}
