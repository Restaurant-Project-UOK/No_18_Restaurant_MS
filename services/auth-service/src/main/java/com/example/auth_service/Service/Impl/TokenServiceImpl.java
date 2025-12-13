package com.example.auth_service.Service.Impl;



import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.auth_service.DTO.TokenResponseDto;
import com.example.auth_service.Entity.User;
import com.example.auth_service.Repository.TokenRepository;
import com.example.auth_service.Repository.UserRepository;
import com.example.auth_service.Security.JwtService;
import com.example.auth_service.Service.TokenService;

@Service
public class TokenServiceImpl implements TokenService {

    @Autowired
    private JwtService jwtService;

    @Autowired
    private TokenRepository tokenRepository;

    @Autowired
    private UserRepository userRepository;

    @Transactional
    @Override
    public TokenResponseDto refreshToken(String refreshToken) {
        // validate refresh token
        if (!jwtService.validateToken(refreshToken)) {
            throw new RuntimeException("Invalid refresh token");
        }

        Integer userId = jwtService.getUserIdFromToken(refreshToken);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        String newAccessToken = jwtService.generateAccessToken(user);
        String newRefreshToken = jwtService.generateRefreshToken(user);

        // optionally save new refresh token in DB and revoke old one
        


        return new TokenResponseDto(newAccessToken, newRefreshToken);
    }
}