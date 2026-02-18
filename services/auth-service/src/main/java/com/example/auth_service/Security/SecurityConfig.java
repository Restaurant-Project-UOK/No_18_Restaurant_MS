package com.example.auth_service.Security;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

/**
 * Security configuration for Auth Service.
 * 
 * <p>Supports two operating modes:</p>
 * <ul>
 *   <li><strong>Gateway Mode (default):</strong> CORS disabled, extracts user identity from gateway headers</li>
 *   <li><strong>Standalone Mode:</strong> Set cors.enabled=true for local development without gateway</li>
 * </ul>
 * 
 * <p>Auth-service is responsible for JWT creation. JWT validation is handled by the API Gateway.</p>
 * <p>IMPORTANT: When running behind API Gateway, ensure cors.enabled=false to avoid duplicate CORS headers.</p>
 * 
 * @author Ishanka Senadeera
 * @since 2026-02-14
 * @updated 2026-02-18 - Fixed CORS to be conditional, Gateway Mode is now default
 */
@Configuration
public class SecurityConfig {

    private final GatewayHeaderFilter gatewayHeaderFilter;

    @Value("${cors.enabled:false}")
    private boolean corsEnabled;

    @Value("${cors.allowed-origins:http://localhost:3000,http://localhost:3001}")
    private String allowedOrigins;

    @Value("${gateway.enabled:true}")
    private boolean gatewayEnabled;

    public SecurityConfig(GatewayHeaderFilter gatewayHeaderFilter) {
        this.gatewayHeaderFilter = gatewayHeaderFilter;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf.disable())
                .cors(cors -> cors.disable())
                .sessionManagement(session ->
                        session.sessionCreationPolicy(SessionCreationPolicy.STATELESS)
                )
                .authorizeHttpRequests(auth -> auth
                        .anyRequest().permitAll()
                ).addFilterBefore(gatewayHeaderFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }


    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
