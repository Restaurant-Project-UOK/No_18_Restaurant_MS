package com.example.auth_service.Service.Impl;

import lombok.Data;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.auth_service.DTO.*;
import com.example.auth_service.Entity.*;
import com.example.auth_service.Repository.*;
import com.example.auth_service.Security.JwtService;
import com.example.auth_service.Service.AuthService;
import com.example.auth_service.Exception.*;

import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDateTime;

@Data
@Service
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final ProfileRepository profileRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final UserActivityRepository userActivityRepository;

    @Transactional
    @Override
    public ProfileDto register(RegisterRequestDto dto) {
        if (userRepository.existsByEmail(dto.getEmail())) {
            throw new UserAlreadyExistsException("Email already in use");
        }

        User user = new User();
        user.setEmail(dto.getEmail());
        user.setPassword(passwordEncoder.encode(dto.getPassword()));
        user.setRole(dto.getRole());
        user.setProvider(dto.getProvider() == null ? 1 : dto.getProvider());

        User savedUser = userRepository.save(user);

        Profile profile = new Profile();
        profile.setUser(savedUser);
        profile.setFullName(dto.getFullName());
        profile.setPhone(dto.getPhone());
//        profile.setAddress(dto.getAddress());
        profileRepository.save(profile);

        return new ProfileDto(savedUser, profile);
    }

    @Transactional
    @Override
    public ResponseDto login(LoginRequestDto dto) {


        int tableId = dto.getTableId();
        User user = userRepository.findByEmail(dto.getEmail())
                .orElseThrow(() -> new InvalidCredentialsException("Invalid email or password"));

        if (!passwordEncoder.matches(dto.getPassword(), user.getPassword())) {
            throw new InvalidCredentialsException("Invalid email or password");
        }

        String accessToken = jwtService.generateAccessToken(user,tableId);
        String refreshToken = jwtService.generateRefreshToken(user,tableId);

        UserActivity activity = new UserActivity();
        activity.setUser(user);
        activity.setTableNo(tableId);
        activity.setLoginAt(LocalDateTime.now());
        userActivityRepository.save(activity);

        return new ResponseDto(accessToken, refreshToken,tableId);
    }

    @Transactional
    public void logoutUser(Integer userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        UserActivity activity = userActivityRepository
                .findTopByUserAndLogoutAtIsNullOrderByLoginAtDesc(user);

        if (activity != null) {
            activity.setLogoutAt(LocalDateTime.now());
            userActivityRepository.save(activity);
        }
    }
}
