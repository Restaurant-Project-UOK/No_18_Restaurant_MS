package com.example.auth_service.Service.Impl;

import java.time.LocalDateTime;

import com.example.auth_service.Repository.ProfileRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.auth_service.DTO.LoginRequestDto;
import com.example.auth_service.DTO.RegisterRequestDto;
import com.example.auth_service.DTO.TokenResponseDto;
import com.example.auth_service.DTO.ProfileDto;
import com.example.auth_service.Entity.Profile;
import com.example.auth_service.Entity.Token;
import com.example.auth_service.Entity.User;
import com.example.auth_service.Repository.TokenRepository;
import com.example.auth_service.Repository.UserRepository;
import com.example.auth_service.Security.JwtService;
import com.example.auth_service.Service.AuthService;

@Service
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final TokenRepository tokenRepository;
    private final ProfileRepository profileRepository;

    public AuthServiceImpl(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService,
            TokenRepository tokenRepository,
            ProfileRepository profileRepository
    ) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.tokenRepository = tokenRepository;
        this.profileRepository = profileRepository;
    }

    @Transactional
    @Override
    public ProfileDto register(RegisterRequestDto dto) {
        if (userRepository.existsByEmail(dto.getEmail())) {
            throw new RuntimeException("Email already in use");
        }

        // Create and save user
        User user = new User();
        user.setEmail(dto.getEmail());
        user.setPassword(passwordEncoder.encode(dto.getPassword()));
        user.setRole(dto.getRole());
        user.setProvider(dto.getProvider());
        User savedUser = userRepository.save(user);

        // Create profile linked to the user
        Profile profile = new Profile();
        profile.setUser(savedUser);        // crucial: maps ID automatically
        profile.setFullName(dto.getFullName());
        // optional: set phone, address, additionalInfo if provided
        profileRepository.save(profile);

        return new ProfileDto(savedUser, profile);
    }

    @Override
    @Transactional
    public TokenResponseDto login(LoginRequestDto dto) {
        User user = userRepository.findByEmail(dto.getEmail())
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (!passwordEncoder.matches(dto.getPassword(), user.getPassword())) {
            throw new RuntimeException("Invalid password");
        }

        // Update last login

        userRepository.save(user);

        String accessToken = jwtService.generateAccessToken(user);
        String refreshToken = jwtService.generateRefreshToken(user);

        // ✅ SAVE TOKENS TO DATABASE
        saveToken(user, accessToken, 1); // 1 = ACCESS
        saveToken(user, refreshToken, 2); // 2 = REFRESH

        return new TokenResponseDto(accessToken, refreshToken);
    }

    private void saveToken(User user, String tokenString, Integer type) {
        Token token = new Token();
        token.setUser(user);
        token.setToken(tokenString);
        token.setType(type);
        token.setExpiry(type == 1 
            ? LocalDateTime.now().plusMinutes(15) 
            : LocalDateTime.now().plusDays(7));
        token.setRevoked(0);
        tokenRepository.save(token);
    }
    @Override
    public TokenResponseDto googleLogin(LoginRequestDto dto) {
        User user = userRepository.findByEmail(dto.getEmail())
                .orElseGet(() -> {
                    User newUser = new User();
                    newUser.setEmail(dto.getEmail());
                    newUser.setProvider(2); // GOOGLE
                    newUser.setRole(1); // CUSTOMER default
                    return userRepository.save(newUser);
                });

        String accessToken = jwtService.generateAccessToken(user);
        String refreshToken = jwtService.generateRefreshToken(user);

        return new TokenResponseDto(accessToken, refreshToken);
    }
}
