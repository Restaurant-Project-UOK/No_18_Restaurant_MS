package com.example.auth_service.Service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.util.concurrent.TimeUnit;

/**
 * Service for managing JWT token blacklist using Redis.
 * 
 * <p>When a user logs out, their token is added to the blacklist.
 * The token remains blacklisted until its natural expiration time,
 * preventing reuse of logged-out tokens.</p>
 * 
 * <p>This service uses Redis with automatic TTL to ensure tokens
 * are automatically removed after they expire.</p>
 */
@Slf4j
@Service
public class TokenBlacklistService {

    private static final String BLACKLIST_PREFIX = "blacklist:token:";
    
    private final StringRedisTemplate redisTemplate;

    public TokenBlacklistService(StringRedisTemplate redisTemplate) {
        this.redisTemplate = redisTemplate;
    }

    /**
     * Add a token to the blacklist.
     * 
     * @param token The JWT token to blacklist
     * @param expirationMs Time in milliseconds until the token naturally expires
     */
    public void blacklistToken(String token, long expirationMs) {
        String key = BLACKLIST_PREFIX + token;
        try {
            redisTemplate.opsForValue().set(key, "blacklisted", expirationMs, TimeUnit.MILLISECONDS);
            log.info("Token blacklisted successfully, expires in {} ms", expirationMs);
        } catch (Exception e) {
            log.error("Failed to blacklist token: {}", e.getMessage());
            // Don't throw - graceful degradation, logout still works client-side
        }
    }

    /**
     * Check if a token is blacklisted.
     * 
     * @param token The JWT token to check
     * @return true if the token is blacklisted, false otherwise
     */
    public boolean isBlacklisted(String token) {
        String key = BLACKLIST_PREFIX + token;
        try {
            Boolean exists = redisTemplate.hasKey(key);
            return Boolean.TRUE.equals(exists);
        } catch (Exception e) {
            log.error("Failed to check token blacklist: {}", e.getMessage());
            // On Redis failure, allow the token (fail-open for availability)
            // Consider fail-close for higher security requirements
            return false;
        }
    }

    /**
     * Remove a token from the blacklist (for testing/admin purposes).
     * 
     * @param token The JWT token to remove from blacklist
     */
    public void removeFromBlacklist(String token) {
        String key = BLACKLIST_PREFIX + token;
        try {
            redisTemplate.delete(key);
            log.info("Token removed from blacklist");
        } catch (Exception e) {
            log.error("Failed to remove token from blacklist: {}", e.getMessage());
        }
    }
}
