package com.helpdesk.auth.dto;

import com.helpdesk.user.enums.Role;
import lombok.Builder;
import lombok.Data;

/**
 * DTO returned after successful registration or login.
 * Explicitly omits sensitive fields like password hashes.
 */
@Data
@Builder
public class AuthResponse {
    
    private Long id;
    private String email;
    private String firstName;
    private String lastName;
    private Role role;
    private String department;
    
    // Will be populated during login (Phase E), null for registration
    private String token;
    private String tokenType;
    private Long expiresIn;
}
