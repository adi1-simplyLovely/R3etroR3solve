package com.helpdesk;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

/**
 * Smoke test: verifies the Spring application context loads successfully.
 * Uses H2 in-memory database for tests (no PostgreSQL needed).
 */
@SpringBootTest
@ActiveProfiles("test")
class HelpdeskApplicationTests {

    @Test
    void contextLoads() {
        // If this test passes, Spring successfully:
        // 1. Found and loaded all configuration
        // 2. Created all beans (services, controllers, repositories)
        // 3. Set up the database connection
        // 4. Configured security
        // The application is healthy!
    }
}
