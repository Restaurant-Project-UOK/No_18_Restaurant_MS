package com.example.auth_service.Controller;

import ch.qos.logback.classic.Logger;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import com.example.auth_service.DTO.ProfileDto;
import com.example.auth_service.Service.ProfileService;
import org.springframework.security.core.context.SecurityContextHolder;
@Slf4j
@RestController
@RequestMapping("/api/profile")
public class ProfileController {
    private final ProfileService profileService;

    public ProfileController(ProfileService profileService) {
        this.profileService = profileService;
    }

    @GetMapping("/me")
    public ResponseEntity<ProfileDto> getCurrentProfile(
            @RequestHeader("X-User-Id") Long userId) {
        log.info("Fetching profile for userId: {}", userId);
        ProfileDto profileDto = profileService.getProfile(userId);
        return ResponseEntity.ok(profileDto);
    }

    @PutMapping("/me")
    public ResponseEntity<ProfileDto> updateCurrentProfile(
            @RequestBody ProfileDto dto,
            @RequestHeader("X-User-Id") Long userId) {
        log.info("Updating profile for userId: {}", userId);
        return ResponseEntity.ok(profileService.updateProfile(userId, dto));
    }
}