package com.helpdesk;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

/**
 * AI-Powered Enterprise Helpdesk & Workflow Automation Platform
 *
 * Main entry point for the Spring Boot application.
 *
 * @SpringBootApplication combines:
 *   - @Configuration: Marks this class as a source of bean definitions
 *   - @EnableAutoConfiguration: Tells Spring Boot to auto-configure based on dependencies
 *   - @ComponentScan: Scans for components in this package and sub-packages
 *
 * @EnableAsync enables async method execution for AI processing
 */
@SpringBootApplication
@EnableAsync
public class HelpdeskApplication {

    public static void main(String[] args) {
        SpringApplication.run(HelpdeskApplication.class, args);
    }
}
