package com.helpdesk.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

/**
 * Global configuration for authentication beans.
 */
@Configuration
public class AuthConfig {

    /**
     * Configures the password encoder used throughout the application.
     * We use BCrypt with strength 12 for strong cryptographic hashing.
     */
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(12);
    }
}
