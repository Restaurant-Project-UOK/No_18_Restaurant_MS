package com.example.auth_service.Security;

import java.util.Arrays;
import java.util.List;

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
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

/**
 * Security configuration for Auth Service.
 * 
 * <p>Supports two operating modes:</p>
 * <ul>
 *   <li><strong>Standalone Mode (default):</strong> CORS enabled, all endpoints public, JWT generation only</li>
 *   <li><strong>Gateway Mode:</strong> CORS disabled, extracts user identity from gateway headers</li>
 * </ul>
 * 
 * <p>Auth-service is responsible for JWT creation. JWT validation is handled by the API Gateway.</p>
 * 
 * @author Ishanka Senadeera
 * @since 2026-02-14
 * @updated 2026-02-16 - Added gateway mode support with GatewayHeaderFilter
 */
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private final GatewayHeaderFilter gatewayHeaderFilter;

    @Value("${cors.enabled:true}")
    private boolean corsEnabled;

    @Value("${cors.allowed-origins:http://localhost:3000,http://localhost:3001}")
    private String allowedOrigins;

    @Value("${gateway.enabled:false}")
    private boolean gatewayEnabled;

    public SecurityConfig(GatewayHeaderFilter gatewayHeaderFilter) {
        this.gatewayHeaderFilter = gatewayHeaderFilter;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf.disable())
                .sessionManagement(session ->
                        session.sessionCreationPolicy(SessionCreationPolicy.STATELESS)
                )
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(
                                "/",
                                "/api/auth/**",
                                "/api/profile/**",
                                "/api/admin/**",
                                "/swagger-ui.html",
                                "/swagger-ui/**",
                                "/v3/api-docs/**"
                        ).permitAll()
                        .anyRequest().authenticated()
                );

        // Conditionally enable CORS
        if (corsEnabled) {
            http.cors(cors -> cors.configurationSource(corsConfigurationSource()));
        } else {
            http.cors(cors -> cors.disable());
        }

        // Add GatewayHeaderFilter when running behind API Gateway
        if (gatewayEnabled) {
            http.addFilterBefore(gatewayHeaderFilter, UsernamePasswordAuthenticationFilter.class);
        }

        return http.build();
    }

    /**
     * CORS configuration to allow frontend access.
     * Supports multiple origins for development (React, Vue, etc.)
     * 
     * NOTE: When running behind API Gateway, disable CORS in auth-service
     * by setting cors.enabled=false in application-gateway.properties
     */
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        
        // Parse and set allowed origins
        List<String> origins = Arrays.asList(allowedOrigins.split(","));
        configuration.setAllowedOrigins(origins);
        
        // Allow standard HTTP methods
        configuration.setAllowedMethods(Arrays.asList(
                "GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"
        ));
        
        // Allow common headers
        configuration.setAllowedHeaders(Arrays.asList("*"));
        
        // Allow credentials (cookies, authorization headers)
        configuration.setAllowCredentials(true);
        
        // Cache preflight response for 1 hour
        configuration.setMaxAge(3600L);
        
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        
        return source;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
