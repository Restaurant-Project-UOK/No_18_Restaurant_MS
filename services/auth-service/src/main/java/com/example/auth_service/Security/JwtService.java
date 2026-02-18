package com.example.auth_service.Security;

import com.example.auth_service.DTO.TokenRefreshResponseDto;
import com.example.auth_service.Entity.User;
import com.example.auth_service.Repository.UserRepository;
import com.example.auth_service.Service.TokenBlacklistService;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.JwtException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.Date;

/**
 * JWT Service for token generation and validation.
 * Handles access and refresh tokens with security best practices.
 *
 * @author Ishanka Senadeera
 * @since 2026-02-14
 * @updated 2026-02-15 - Added token refresh with proper JSON response
 */
@Slf4j
@Service
public class JwtService {

    @Value("${jwt.secret:SecretKey123}")
    private String jwtSecret;

    @Value("${jwt.access-token-expiration-ms:900000}")
    private long accessTokenExpirationMs;

    @Value("${jwt.refresh-token-expiration-ms:604800000}")
    private long refreshTokenExpirationMs;

    private final UserRepository userRepository;
    private final TokenBlacklistService tokenBlacklistService;

    public JwtService(UserRepository userRepository, TokenBlacklistService tokenBlacklistService) {
        this.userRepository = userRepository;
        this.tokenBlacklistService = tokenBlacklistService;
    }
    
    public long getAccessTokenExpirationMs() {
        return accessTokenExpirationMs;
    }
    
    public long getRefreshTokenExpirationMs() {
        return refreshTokenExpirationMs;
    }

    public String generateAccessToken(User user, int tableId) {
        return Jwts.builder()
                .setSubject(user.getId().toString())
                .claim("role", user.getRole())
                .claim("tableId", tableId)
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + accessTokenExpirationMs))
                .signWith(SignatureAlgorithm.HS256, jwtSecret)
                .compact();
    }

    public String generateRefreshToken(User user, int tableId) {
        return Jwts.builder()
                .setSubject(user.getId().toString())
                .claim("tableId", tableId)
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + refreshTokenExpirationMs))
                .signWith(SignatureAlgorithm.HS256, jwtSecret)
                .compact();
    }

    public boolean validateToken(String token) {
        try {
            if (tokenBlacklistService.isBlacklisted(token)) {
                log.debug("Token is blacklisted");
                return false;
            }
            Jwts.parser().setSigningKey(jwtSecret).parseClaimsJws(token);
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }

    public boolean validateRefreshToken(String token) {
        try {
            Claims claims = Jwts.parser()
                    .setSigningKey(jwtSecret)
                    .parseClaimsJws(token)
                    .getBody();
            return claims.getExpiration().after(new Date());
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }

    public String generateNewAccessToken(String refreshToken) {
        log.debug("Generating new access token from refresh token");

        if (!validateRefreshToken(refreshToken)) {
            log.warn("Invalid or expired refresh token");
            throw new IllegalArgumentException("Invalid or expired refresh token");
        }

        try {
            Claims claims = Jwts.parser()
                    .setSigningKey(jwtSecret)
                    .parseClaimsJws(refreshToken)
                    .getBody();

            Long userId = Long.valueOf(claims.getSubject());
            Integer tableId = (Integer) claims.get("tableId");

            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new IllegalArgumentException("User not found"));

            log.info("Successfully generated new access token for user ID: {}", userId);
            return generateAccessToken(user, tableId);

        } catch (JwtException e) {
            log.error("Error parsing refresh token: {}", e.getMessage());
            throw new IllegalArgumentException("Invalid refresh token format", e);
        }
    }

    public TokenRefreshResponseDto refreshAccessToken(String refreshToken) {
        log.debug("Refreshing access token");

        if (!validateRefreshToken(refreshToken)) {
            log.warn("Invalid or expired refresh token");
            throw new IllegalArgumentException("Invalid or expired refresh token");
        }

        try {
            Claims claims = Jwts.parser()
                    .setSigningKey(jwtSecret)
                    .parseClaimsJws(refreshToken)
                    .getBody();

            Long userId = Long.valueOf(claims.getSubject());
            Integer tableId = (Integer) claims.get("tableId");

            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new IllegalArgumentException("User not found"));

            String newAccessToken = generateAccessToken(user, tableId);

            log.info("Successfully refreshed access token for user ID: {}", userId);
            
            return TokenRefreshResponseDto.builder()
                    .accessToken(newAccessToken)
                    .expiresIn(accessTokenExpirationMs)
                    .build();

        } catch (JwtException e) {
            log.error("Error parsing refresh token: {}", e.getMessage());
            throw new IllegalArgumentException("Invalid refresh token format", e);
        }
    }

    private Claims getClaimsFromToken(String token) {
        return Jwts.parser()
                .setSigningKey(jwtSecret)
                .parseClaimsJws(token)
                .getBody();
    }

    public Long getUserIdFromToken(String token) {
        return Long.valueOf(getClaimsFromToken(token).getSubject());
    }

    public String getEmailFromToken(String token) {
        return (String) getClaimsFromToken(token).get("email");
    }

    public Integer getRoleFromToken(String token) {
        return (Integer) getClaimsFromToken(token).get("role");
    }

    public Integer getTableIdFromToken(String token) {
        return (Integer) getClaimsFromToken(token).get("tableId");
    }

    public long getTokenRemainingValidityMs(String token) {
        try {
            Claims claims = getClaimsFromToken(token);
            Date expiration = claims.getExpiration();
            long remaining = expiration.getTime() - System.currentTimeMillis();
            return Math.max(0, remaining);
        } catch (JwtException | IllegalArgumentException e) {
            log.debug("Could not get token expiration: {}", e.getMessage());
            return 0;
        }
    }
}
