package com.example.auth_service.Security;

import java.io.IOException;
import java.util.List;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;

/**
 * Gateway Header Filter - Extracts user identity from gateway headers.
 * 
 * <p>When running behind API Gateway (gateway.enabled=true), this filter:</p>
 * <ul>
 *   <li>Extracts X-User-Id, X-Role, X-Table-Id from gateway headers</li>
 *   <li>Populates Spring SecurityContext for downstream controllers</li>
 *   <li>Enables ProfileController and AdminController to work seamlessly</li>
 * </ul>
 * 
 * <p><strong>Note:</strong> This filter only runs when gateway.enabled=true.
 * The gateway has already validated the JWT token. Auth-service trusts the gateway.</p>
 * 
 * @author Ishanka Senadeera
 * @since 2026-02-16
 */
@Slf4j
@Component
public class GatewayHeaderFilter extends OncePerRequestFilter {

    @Value("${gateway.enabled:false}")
    private boolean gatewayEnabled;

    @Value("${gateway.header.user-id:X-User-Id}")
    private String userIdHeader;

    @Value("${gateway.header.user-role:X-Role}")
    private String userRoleHeader;

    @Value("${gateway.header.table-id:X-Table-Id}")
    private String tableIdHeader;

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {

        // Only process if gateway mode is enabled
        if (!gatewayEnabled) {
            filterChain.doFilter(request, response);
            return;
        }

        // Extract headers from gateway
        String userIdStr = request.getHeader(userIdHeader);
        String roleStr = request.getHeader(userRoleHeader);
        String tableIdStr = request.getHeader(tableIdHeader);

        // If userId present, populate SecurityContext
        if (userIdStr != null && !userIdStr.isEmpty()) {
            try {
                Long userId = Long.parseLong(userIdStr);
                
                // Parse role - gateway sends role name (e.g., "CUSTOMER", "ADMIN", "KITCHEN")
                String roleName = roleStr != null ? roleStr : "CUSTOMER";
                
                // Parse tableId if present
                Long tableId = null;
                if (tableIdStr != null && !tableIdStr.isEmpty()) {
                    try {
                        tableId = Long.parseLong(tableIdStr);
                    } catch (NumberFormatException e) {
                        log.warn("Invalid tableId from gateway: {}", tableIdStr);
                    }
                }

                log.debug("Gateway headers - userId: {}, role: {}, tableId: {}", 
                         userId, roleName, tableId);

                // Create authentication token
                // Principal = userId (as String, compatible with ProfileController)
                // Authorities = ROLE_<roleName>
                UsernamePasswordAuthenticationToken authentication =
                        new UsernamePasswordAuthenticationToken(
                                userId.toString(),
                                null,
                                List.of(new SimpleGrantedAuthority("ROLE_" + roleName))
                        );

                // Store tableId as detail if present
                if (tableId != null) {
                    authentication.setDetails(tableId);
                }

                SecurityContextHolder.getContext().setAuthentication(authentication);
                
                log.debug("SecurityContext populated from gateway headers");

            } catch (NumberFormatException e) {
                log.error("Invalid userId from gateway: {}", userIdStr);
            }
        }

        filterChain.doFilter(request, response);
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        // Skip filter if gateway mode is disabled
        return !gatewayEnabled;
    }
}
