package com.example.auth_service.Service.Impl;

import java.time.LocalDateTime;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.auth_service.DTO.ProfileDto;
import com.example.auth_service.Entity.*;
import com.example.auth_service.Repository.*;
import com.example.auth_service.Service.ProfileService;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
public class ProfileServiceImpl implements ProfileService {

    private final UserRepository userRepository;
    private final ProfileRepository profileRepository;

    public ProfileServiceImpl(UserRepository userRepository, ProfileRepository profileRepository) {
        this.userRepository = userRepository;
        this.profileRepository = profileRepository;
    }

    @Override
    public ProfileDto getProfile(Long userId) {
        log.info("Fetching profile for userId: {}", userId);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found: " + userId));
        
        // Use the association if available, else fetch from repo
        Profile profile = user.getProfile();
        if (profile == null) {
            profile = profileRepository.findById(userId).orElse(null);
        }
        
        return new ProfileDto(user, profile);
    }



    @Transactional
    @Override
    public ProfileDto updateProfile(Long userId, ProfileDto dto) {
        log.info("Attempting to update profile for userId: {}", userId);
        
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found: " + userId));

        // Check association first, then repo
        Profile profile = user.getProfile();
        if (profile == null) {
            profile = profileRepository.findById(userId).orElse(null);
        }

        if (profile == null) {
            log.info("No existing profile found for user {}, creating new one", userId);
            profile = new Profile();
            profile.setUser(user);
            user.setProfile(profile);
        }

        profile.setFullName(dto.getFullName());
        profile.setPhone(dto.getPhone());
        profile.setAddress(dto.getAddress());
        profile.setUpdatedAt(LocalDateTime.now());

        log.info("Saving profile for user: {}", user.getEmail());
        Profile saved = profileRepository.save(profile);
        
        return new ProfileDto(user, saved);
    }
}
