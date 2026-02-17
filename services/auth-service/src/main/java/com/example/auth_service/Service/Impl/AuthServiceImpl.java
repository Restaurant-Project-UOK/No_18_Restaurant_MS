package com.example.auth_service.Service.Impl;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.auth_service.DTO.CreateStaffRequestDto;
import com.example.auth_service.DTO.LoginRequestDto;
import com.example.auth_service.DTO.RegisterRequestDto;
import com.example.auth_service.DTO.TokenResponseDto;
import com.example.auth_service.DTO.UserResponseDto;
import com.example.auth_service.Entity.Profile;
import com.example.auth_service.Entity.User;
import com.example.auth_service.Entity.UserActivity;
import com.example.auth_service.Repository.UserActivityRepository;
import com.example.auth_service.Repository.UserRepository;
import com.example.auth_service.Security.JwtService;
import com.example.auth_service.Service.AuthService;
import com.example.auth_service.Service.TokenBlacklistService;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final UserActivityRepository userActivityRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final TokenBlacklistService tokenBlacklistService;

    public AuthServiceImpl(
            UserRepository userRepository,
            UserActivityRepository userActivityRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService,
            TokenBlacklistService tokenBlacklistService
    ) {
        this.userRepository = userRepository;
        this.userActivityRepository = userActivityRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.tokenBlacklistService = tokenBlacklistService;
    }

    @Transactional
    @Override
    public void register(RegisterRequestDto dto) {
        if (userRepository.existsByEmail(dto.getEmail())) {
            throw new RuntimeException("Email already in use");
        }

        User user = new User();
        user.setEmail(dto.getEmail());
        user.setPassword(passwordEncoder.encode(dto.getPassword()));
        user.setRole(dto.getRole() != null ? dto.getRole() : 1);
        user.setProvider(dto.getProvider() != null ? dto.getProvider() : 1);

        // Create profile
        Profile profile = new Profile();
        profile.setUser(user);
        profile.setFullName(dto.getFullName());
        profile.setPhone(dto.getPhone());
        profile.setAddress(dto.getAddress());
        user.setProfile(profile);

        userRepository.save(user);
    }

    @Override
    public TokenResponseDto login(LoginRequestDto dto) {
        User user = userRepository.findByEmail(dto.getEmail())
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (!passwordEncoder.matches(dto.getPassword(), user.getPassword())) {
            throw new RuntimeException("Invalid password");
        }

        int tableId =  dto.getTableId();

        String accessToken = jwtService.generateAccessToken(user, tableId);
        String refreshToken = jwtService.generateRefreshToken(user, tableId);

        // Track user activity - record login
        UserActivity activity = new UserActivity();
        activity.setUser(user);
        activity.setTableNo(tableId);// Will be updated from client if customer
        activity.setLoginAt(LocalDateTime.now());
        activity.setLogoutAt(null); ;
        userActivityRepository.save(activity);
        log.info("User activity tracked - login for user: {}", user.getEmail());

        return TokenResponseDto.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .tokenType("Bearer")
                .accessTokenExpiresIn(jwtService.getAccessTokenExpirationMs())
                .refreshTokenExpiresIn(jwtService.getRefreshTokenExpirationMs())
                .build();
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

        String accessToken = jwtService.generateAccessToken(user, 0);
        String refreshToken = jwtService.generateRefreshToken(user, 0);

        int tableId = dto.getTableId();
        // Track user activity - record login
        UserActivity activity = new UserActivity();
        activity.setUser(user);
        activity.setTableNo(tableId);// Will be updated from client if customer
        activity.setLoginAt(LocalDateTime.now());
        activity.setLogoutAt(null); ;

        userActivityRepository.save(activity);
        log.info("User activity tracked - Google login for user: {}", user.getEmail());

        return TokenResponseDto.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .tokenType("Bearer")
                .accessTokenExpiresIn(jwtService.getAccessTokenExpirationMs())
                .refreshTokenExpiresIn(jwtService.getRefreshTokenExpirationMs())
                .build();
    }

    /**
     * Logs out the user by blacklisting their current token.
     * 
     * <p>The token is added to Redis blacklist with TTL matching the token's
     * remaining validity period. This ensures the token cannot be reused
     * even if the client doesn't discard it.</p>
     * 
     * <p>Also updates user_activity table to record logout timestamp.</p>
     *
     * @param userId The ID of the user logging out
     * @param token The JWT access token to invalidate
     */
    @Override
    public void logoutUser(Long userId, String token) {
        // Get user
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        // Update user activity - mark active session as logged out
        UserActivity activeSession = userActivityRepository.findTopByUserAndLogoutAtIsNullOrderByLoginAtDesc(user);
        if (activeSession != null) {
            activeSession.setLogoutAt(LocalDateTime.now());
            userActivityRepository.save(activeSession);
            log.info("User activity tracked - logout for user: {}", user.getEmail());
        }
        
        // Get token expiration time for blacklist TTL
        long remainingValidityMs = jwtService.getTokenRemainingValidityMs(token);
        
        if (remainingValidityMs > 0) {
            tokenBlacklistService.blacklistToken(token, remainingValidityMs);
            log.info("User {} logged out, token blacklisted for {} ms", userId, remainingValidityMs);
        } else {
            log.info("User {} logged out, token already expired", userId);
        }
    }

    @Transactional
    @Override
    public void createStaff(CreateStaffRequestDto dto) {
        if (userRepository.existsByEmail(dto.getEmail())) {
            throw new RuntimeException("Email already in use");
        }

        // Validate role
        int role = dto.getRole();
        if (role < 2 || role > 4) {
            throw new RuntimeException("Invalid role. Allowed values: 2 (Admin), 3 (Kitchen Staff), 4 (Waiter)");
        }

        User user = new User();
        user.setEmail(dto.getEmail());
        user.setPassword(passwordEncoder.encode(dto.getPassword()));
        // Enforce role to be whatever is passed, assuming validation happens at controller or via trust (this is internal/admin method)
        // Default to Staff/Kitchen (3) if null, but explicit is better.
        user.setRole(role);
        user.setProvider(1); // LOCAL
        user.setStatus(1); // ACTIVE

        // Create profile
        Profile profile = new Profile();
        profile.setUser(user);
        profile.setFullName(dto.getFullName());
        profile.setPhone(dto.getPhone());
        profile.setAddress(dto.getAddress());
        user.setProfile(profile);

    }

    @Override
    public List<UserResponseDto> getAllUsers() {
        return userRepository.findAll().stream()
                .map(UserResponseDto::new)
                .collect(Collectors.toList());
    }
}
