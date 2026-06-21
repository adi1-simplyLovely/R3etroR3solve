package com.helpdesk.auth.service;

import com.helpdesk.auth.dto.AuthResponse;
import com.helpdesk.auth.dto.LoginRequest;
import com.helpdesk.auth.dto.RegisterRequest;
import com.helpdesk.auth.security.JwtTokenProvider;
import com.helpdesk.common.exception.DuplicateResourceException;
import com.helpdesk.common.exception.UnauthorizedException;
import com.helpdesk.user.entity.User;
import com.helpdesk.user.enums.Role;
import com.helpdesk.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.Instant;

/**
 * Business logic for authentication and registration.
 */
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;

    /**
     * Registers a new user in the system.
     * Transactional ensures that if anything fails, the database write is rolled back.
     *
     * @param request The validated registration request
     * @return AuthResponse containing user details
     */
    @Transactional
    public AuthResponse register(RegisterRequest request) {
        
        // 1. Check for duplicate email
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new DuplicateResourceException("Email is already registered");
        }

        // 2. Hash the password
        String encodedPassword = passwordEncoder.encode(request.getPassword());

        // 3. Create the User entity
        User user = new User();
        user.setEmail(request.getEmail());
        user.setPasswordHash(encodedPassword);
        user.setFirstName(request.getFirstName());
        user.setLastName(request.getLastName());
        
        // Parse role, default to EMPLOYEE if invalid or missing
        try {
            user.setRole(request.getRole() != null ? Role.valueOf(request.getRole()) : Role.EMPLOYEE);
        } catch (IllegalArgumentException e) {
            user.setRole(Role.EMPLOYEE);
        }

        // Parse department
        try {
            if (request.getDepartment() != null && !request.getDepartment().trim().isEmpty()) {
                user.setDepartment(com.helpdesk.user.enums.Department.valueOf(request.getDepartment()));
            }
        } catch (IllegalArgumentException e) {
            // Ignore invalid department
        }

        // 4. Save to database
        User savedUser = userRepository.save(user);

        // 5. Map to response DTO
        return AuthResponse.builder()
                .id(savedUser.getId())
                .email(savedUser.getEmail())
                .firstName(savedUser.getFirstName())
                .lastName(savedUser.getLastName())
                .role(savedUser.getRole())
                .department(savedUser.getDepartment() != null ? savedUser.getDepartment().name() : null)
                .build();
    }

    /**
     * Authenticates a user and generates a JWT token.
     *
     * @param request The login credentials
     * @return AuthResponse containing user details and the JWT token
     */
    @Transactional
    public AuthResponse login(LoginRequest request) {
        // 1. Find user by email
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new UnauthorizedException("Invalid email or password"));

        // 2. Check if account is active
        if (!user.getIsActive()) {
            throw new UnauthorizedException("Account is deactivated");
        }

        // 3. Verify password
        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new UnauthorizedException("Invalid email or password");
        }

        // Update last login time
        user.setLastLoginTime(Instant.now());
        userRepository.save(user);

        // 4. Generate JWT Token
        String token = jwtTokenProvider.generateToken(user);

        // 5. Return response with token
        return AuthResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .role(user.getRole())
                .department(user.getDepartment() != null ? user.getDepartment().name() : null)
                .token(token)
                .tokenType("Bearer")
                .expiresIn(jwtTokenProvider.getExpirationMs() / 1000) // Convert ms to seconds
                .build();
    }

    @Transactional
    public void logout(String email) {
        User user = userRepository.findByEmail(email).orElse(null);
        if (user != null) {
            user.setLastLogoutTime(java.time.Instant.now());
            userRepository.save(user);
        }
    }
}
