package com.example.auth_service.config;

import com.example.auth_service.Entity.User;
import com.example.auth_service.Repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

/**
 * Seeds an admin user on application startup if one doesn't exist.
 * Admin credentials can be configured via environment variables.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class AdminSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${admin.email:admin@restaurant.com}")
    private String adminEmail;

    @Value("${admin.password:Admin@123}")
    private String adminPassword;

    @Value("${admin.seed.enabled:true}")
    private boolean seedEnabled;

    @Override
    public void run(String... args) {
        if (!seedEnabled) {
            log.info("Admin seeding is disabled");
            return;
        }

        if (userRepository.existsByEmail(adminEmail)) {
            log.info("Admin user already exists: {}", adminEmail);
            return;
        }

        User admin = new User();
        admin.setEmail(adminEmail);
        admin.setPassword(passwordEncoder.encode(adminPassword));
        admin.setProvider(1); // LOCAL
        admin.setRole(2);     // ADMIN
        admin.setStatus(1);   // ACTIVE

        userRepository.save(admin);
        log.info("Admin user created: {}", adminEmail);
    }
}
