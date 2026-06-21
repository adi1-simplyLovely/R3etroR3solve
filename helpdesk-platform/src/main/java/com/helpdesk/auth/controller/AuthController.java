package com.helpdesk.auth.controller;

import com.helpdesk.auth.dto.AuthResponse;
import com.helpdesk.auth.dto.LoginRequest;
import com.helpdesk.auth.dto.RegisterRequest;
import com.helpdesk.auth.service.AuthService;
import com.helpdesk.common.dto.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * REST Controller for authentication endpoints.
 */
@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    /**
     * Endpoint to register a new user.
     * The @Valid annotation triggers bean validation on the RegisterRequest.
     */
    @PostMapping("/register")
    public ResponseEntity<ApiResponse<AuthResponse>> register(@Valid @RequestBody RegisterRequest request) {
        AuthResponse response = authService.register(request);
        
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success("User registered successfully", response));
    }

    /**
     * Endpoint to authenticate a user and retrieve a JWT token.
     */
    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(@Valid @RequestBody LoginRequest request) {
        AuthResponse response = authService.login(request);
        
        return ResponseEntity.ok(ApiResponse.success("Login successful", response));
    }

    @PostMapping("/logout")
    public ResponseEntity<com.helpdesk.common.dto.ApiResponse<String>> logout(@org.springframework.security.core.annotation.AuthenticationPrincipal com.helpdesk.auth.security.UserPrincipal userPrincipal) {
        if (userPrincipal != null) {
            authService.logout(userPrincipal.getEmail());
        }
        return ResponseEntity.ok(com.helpdesk.common.dto.ApiResponse.success("Logout successful", null));
    }

    @GetMapping("/public-users")
    public ResponseEntity<java.util.List<com.helpdesk.user.entity.User>> getPublicUsers(
            @org.springframework.beans.factory.annotation.Autowired com.helpdesk.user.repository.UserRepository userRepo) {
        return ResponseEntity.ok(userRepo.findAll());
    }
}
