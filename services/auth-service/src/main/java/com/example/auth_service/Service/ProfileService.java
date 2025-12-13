package com.example.auth_service.Service;

import com.example.auth_service.DTO.ProfileDto;

public interface ProfileService {
    ProfileDto getProfile(Integer userId);
    ProfileDto updateProfile(Integer userId, ProfileDto dto);
}