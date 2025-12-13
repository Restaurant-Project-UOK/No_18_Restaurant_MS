package com.example.auth_service.Service;

import com.example.auth_service.DTO.LoginRequestDto;
import com.example.auth_service.DTO.RegisterRequestDto;
import com.example.auth_service.DTO.TokenResponseDto;
import com.example.auth_service.DTO.ProfileDto;

public interface AuthService {
    ProfileDto register(RegisterRequestDto dto);
    TokenResponseDto login(LoginRequestDto dto);
    TokenResponseDto googleLogin(LoginRequestDto dto);
}