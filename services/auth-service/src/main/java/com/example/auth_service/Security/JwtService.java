package com.example.auth_service.Security;

import com.example.auth_service.Entity.User;
import com.example.auth_service.Repository.UserRepository;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.JwtException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.Date;
import java.util.Objects;
import java.util.Optional;

@Service
public class JwtService {

    @Value("${jwt.secret:SecretKey123}") // fallback for development
    private String jwtSecret;

    @Value("${jwt.access-token-expiration-ms:900000}") // 15 minutes
    private long accessTokenExpirationMs;

    @Value("${jwt.refresh-token-expiration-ms:604800000}") // 7 days
    private long refreshTokenExpirationMs;

    @Autowired
    private UserRepository userRepository;
    /** Generate Access Token */
    public String generateAccessToken(User user,int tableId) {
        return Jwts.builder()
                .setSubject(user.getId().toString())
                .claim("role", user.getRole())
                .claim("tableId",tableId)
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + accessTokenExpirationMs))
                .signWith(SignatureAlgorithm.HS512, jwtSecret)
                .compact();
    }

    /** Generate Refresh Token */
    public String generateRefreshToken(User user, int tableId) {
        return Jwts.builder()
                .setSubject(user.getId().toString())
                .claim("tableId", tableId )
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + refreshTokenExpirationMs))
                .signWith(SignatureAlgorithm.HS512, jwtSecret)
                .compact();
    }

    /** Validate JWT Token */
    public boolean validateToken(String token) {
        try {
            Jwts.parser().setSigningKey(jwtSecret).parseClaimsJws(token);
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }

    /** Validate Refresh Token */
    public boolean validateRefreshToken(String token) {
        try {
            Claims claims = Jwts.parser()
                    .setSigningKey(jwtSecret)
                    .parseClaimsJws(token)
                    .getBody();
            // Optional: check expiration manually (not strictly needed, parser already does this)
            return claims.getExpiration().after(new Date());
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }

    /** Generate new Access Token from a valid Refresh Token */
    public String generateNewAccessToken(String refreshToken) {
        if (!validateRefreshToken(refreshToken)) {
            throw new IllegalArgumentException("Invalid or expired refresh token");
        }

        Claims claims = Jwts.parser()
                .setSigningKey(jwtSecret)
                .parseClaimsJws(refreshToken)
                .getBody();

        Integer userId = Integer.parseInt(claims.getSubject());
        User user = (userRepository.findById(userId)).orElse(null);
        String token = generateAccessToken(Objects.requireNonNull(user));
        System.out.println(token);
        return token;
    }


    /** Extract User ID from JWT */
    private Claims getClaimsFromToken(String token) {
        return Jwts.parser()
                .setSigningKey(jwtSecret)
                .parseClaimsJws(token)
                .getBody();
    }

    public Integer getUserIdFromToken(String token) {
        return Integer.parseInt(getClaimsFromToken(token).getSubject());
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

}
