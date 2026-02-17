package com.example.auth_service.Repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.auth_service.Entity.User;
import com.example.auth_service.Entity.UserActivity;

/**
 * Repository for UserActivity entity.
 * 
 * <p>Provides data access methods for user session tracking.</p>
 * 
 * @author Ishanka Senadeera
 * @since 2026-02-16
 */
public interface UserActivityRepository extends JpaRepository<UserActivity, Long> {
    /**
     * Find the most recent active session for a user (logout_at is null)
     */
    UserActivity findTopByUserAndLogoutAtIsNullOrderByLoginAtDesc(User user);
    
    /**
     * Find all active sessions for a user
     */
    List<UserActivity> findByUserAndLogoutAtIsNull(User user);
}
