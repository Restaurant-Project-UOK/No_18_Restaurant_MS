package com.example.auth_service.Repository;

import com.example.auth_service.Entity.User;
import com.example.auth_service.Entity.UserActivity;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserActivityRepository extends JpaRepository<UserActivity, Long> {
    UserActivity findTopByUserAndLogoutAtIsNullOrderByLoginAtDesc(User user);
}
