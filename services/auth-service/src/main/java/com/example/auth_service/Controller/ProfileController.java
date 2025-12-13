package com.example.auth_service.Controller;

import com.example.auth_service.Security.JwtService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.example.auth_service.DTO.ProfileDto;
import com.example.auth_service.Service.ProfileService;

import java.util.Map;

@RestController
@RequestMapping("/api/profile")
public class ProfileController {

    @Autowired
    private ProfileService profileService;

    @Autowired
    private JwtService jwtService;


    // Get profile of current user
    @GetMapping("/me")
    public ResponseEntity<?> getMyProfile(
            @RequestHeader(name = "Authorization", required = false) String authHeader) {
        System.out.println("++++++++++++++++++"+ authHeader);
        try {
            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                return ResponseEntity.status(401).body(null);
            }

            String token = authHeader.substring(7);
            Integer userId = jwtService.getUserIdFromToken(token);
            System.out.println("++++++++++++++++++"+ userId);
            ProfileDto profileDto = profileService.getProfile(userId);
            System.out.println("++++++++++++++++++"+ profileDto);

            ObjectMapper objectMapper = new ObjectMapper();
            String json = objectMapper.writeValueAsString(profileDto);

            // Return as JSON
            return ResponseEntity
                    .ok()
                    .header("Content-Type", "application/json")
                    .body(json);

        } catch (Exception e) {
            e.printStackTrace(); // logs the exact cause in backend
            return ResponseEntity.status(500).body(null);
        }
    }




    // Update profile of current user
    @PutMapping("/me")
    public ResponseEntity<?> updateProfile(
            @RequestHeader(name = "Authorization", required = false) String authHeader,
            @RequestBody ProfileDto profileDto) {

        try {
            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                return ResponseEntity.status(401).body(null);
            }

            String token = authHeader.substring(7);
            Integer userId = jwtService.getUserIdFromToken(token);

            ProfileDto updatedProfile = profileService.updateProfile(userId, profileDto);
            ObjectMapper objectMapper = new ObjectMapper();
            String json = objectMapper.writeValueAsString(updatedProfile);

            // Return as JSON
            return ResponseEntity
                    .ok()
                    .header("Content-Type", "application/json")
                    .body(json);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(null);
        }
    }
}
