package com.example.auth_service.Service.Impl;

import java.time.LocalDateTime;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.auth_service.DTO.ProfileDto;
import com.example.auth_service.Entity.Profile;
import com.example.auth_service.Entity.User;
import com.example.auth_service.Repository.ProfileRepository;
import com.example.auth_service.Repository.UserRepository;
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
    public ProfileDto getProfile(Integer userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Profile profile = profileRepository.findById(userId).orElse(null);

        return new ProfileDto(user, profile);
    }

    @Transactional
    @Override
    public ProfileDto updateProfile(Integer userId, ProfileDto profileDto) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Profile profile = profileRepository.findById(userId).orElseGet(() -> {
            Profile newProfile = new Profile();
            newProfile.setId(userId);
            newProfile.setUser(user);
            newProfile.setCreatedAt(LocalDateTime.now());
            return newProfile;
        });

        profile.setFullName(profileDto.getFullName());
        profile.setPhone(profileDto.getPhone());
        profile.setAddress(profileDto.getAddress());
//        profile.setAdditionalInfo(profileDto.getAdditionalInfo());
        profile.setUpdatedAt(LocalDateTime.now());

        profileRepository.save(profile);

        return new ProfileDto(user, profile);
    }
}