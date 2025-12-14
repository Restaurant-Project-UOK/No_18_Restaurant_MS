package com.example.auth_service.Controller;

import com.example.auth_service.Security.JwtService;
import lombok.Data;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import com.example.auth_service.DTO.*;
import com.example.auth_service.Service.AuthService;

import java.util.Map;

@Data
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;
    private final JwtService jwtService;

    @PostMapping("/register")
    public ResponseEntity<ProfileDto> register(@RequestBody RegisterRequestDto dto) {
        ProfileDto profileDto =authService.register(dto);
        System.out.println(profileDto);
        return ResponseEntity.ok(profileDto);
    }

    @PostMapping("/login")
    public ResponseEntity<ResponseDto> login(@RequestBody LoginRequestDto dto) {
        return ResponseEntity.ok(authService.login(dto));
    }

    @PostMapping("/refresh")
    public ResponseEntity<String> generateNewAccessToken(@RequestBody Map<String, String> request) {
        String token = request.get("refreshToken");
        return ResponseEntity.ok(jwtService.generateNewAccessToken(token));
    }

    @PostMapping("/logout")
    public ResponseEntity<String> logout() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();

        if (auth == null || !auth.isAuthenticated()) {
            return ResponseEntity.status(401).body("User not authenticated");
        }

        Integer userId = Integer.parseInt(auth.getName());
        authService.logoutUser(userId);

        return ResponseEntity.ok("Logged out successfully");
    }

}
