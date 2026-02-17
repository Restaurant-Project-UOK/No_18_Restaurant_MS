package com.example.auth_service.Controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import com.example.auth_service.DTO.ProfileDto;
import com.example.auth_service.Service.ProfileService;
import org.springframework.security.core.context.SecurityContextHolder;

@RestController
@RequestMapping("/api/profile")
public class ProfileController {
    private final ProfileService profileService;

    public ProfileController(ProfileService profileService) {
        this.profileService = profileService;
    }

    @GetMapping("/me")
    public ResponseEntity<ProfileDto> getCurrentProfile(
            @RequestHeader(value = "X-User-Id", required = false) String gatewayUserId) {

        Long userId = null;

        // Try to get user ID from gateway header first (gateway mode)
        if (gatewayUserId != null && !gatewayUserId.isEmpty()) {
            userId = Long.parseLong(gatewayUserId);
        } else {
            // Fallback to SecurityContext (standalone mode)
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth == null || !auth.isAuthenticated()) {
                return ResponseEntity.status(401).build();
            }
            userId = Long.parseLong(auth.getName());
        }

        ProfileDto profileDto = profileService.getProfile(userId);
        return ResponseEntity.ok(profileDto);
    }


    @PutMapping("/me")
    public ResponseEntity<ProfileDto> updateCurrentProfile(
            @RequestBody ProfileDto dto,
            @RequestHeader(value = "X-User-Id", required = false) String gatewayUserId) {

        Long userId = null;

        // Try to get user ID from gateway header first (gateway mode)
        if (gatewayUserId != null && !gatewayUserId.isEmpty()) {
            userId = Long.parseLong(gatewayUserId);
        } else {
            // Fallback to SecurityContext (standalone mode)
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth == null || !auth.isAuthenticated()) {
                return ResponseEntity.status(401).build();
            }
            userId = Long.parseLong(auth.getName());
        }

        return ResponseEntity.ok(profileService.updateProfile(userId, dto));
    }
}
