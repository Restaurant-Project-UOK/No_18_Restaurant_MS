package com.example.auth_service.Service;

import com.example.auth_service.DTO.*;

public interface AuthService {
    ProfileDto register(RegisterRequestDto dto);
    ResponseDto login(LoginRequestDto dto);
    void logoutUser(Integer userId);
}
