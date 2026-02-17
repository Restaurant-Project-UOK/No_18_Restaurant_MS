package com.example.auth_service.Service;

import com.example.auth_service.DTO.ProfileDto;

public interface ProfileService {
    ProfileDto getProfile(Long userId);
    ProfileDto updateProfile(Long userId, ProfileDto profileDto);
}
