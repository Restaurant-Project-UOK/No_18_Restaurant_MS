package com.example.auth_service.Service.Impl;

import java.time.LocalDateTime;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.auth_service.DTO.ProfileDto;
import com.example.auth_service.Entity.*;
import com.example.auth_service.Repository.*;
import com.example.auth_service.Service.ProfileService;

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
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        Profile profile = profileRepository.findById(userId).orElse(null);
        ProfileDto dto = new ProfileDto(user, profile);
        //dto.setProvider(null); // hide provider if not needed
        return dto;
    }



    @Transactional
    @Override
    public ProfileDto updateProfile(Long userId, ProfileDto dto) {
        User user = userRepository.findById(userId).orElseThrow();

        Profile profile = profileRepository.findById(userId).orElseGet(() -> {
            Profile newProfile = new Profile();
            newProfile.setUser(user);
            newProfile.setId(userId);
            newProfile.setCreatedAt(LocalDateTime.now());
            return newProfile;
        });

        profile.setFullName(dto.getFullName());
        profile.setPhone(dto.getPhone());
        profile.setAddress(dto.getAddress());
        profile.setUpdatedAt(LocalDateTime.now());

        profileRepository.save(profile);
        return new ProfileDto(user, profile);
    }
}
