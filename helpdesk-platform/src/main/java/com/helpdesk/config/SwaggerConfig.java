package com.helpdesk.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Global configuration for OpenAPI / Swagger documentation.
 */
@Configuration
public class SwaggerConfig {

    @Bean
    public OpenAPI helpdeskOpenAPI() {
        final String securitySchemeName = "bearerAuth";

        return new OpenAPI()
                .info(new Info()
                        .title("AI-Powered Enterprise Helpdesk API")
                        .description("REST API documentation for the Enterprise Helpdesk & Workflow Automation Platform.")
                        .version("v1.0.0")
                        .contact(new Contact()
                                .name("Helpdesk Team")
                                .email("support@helpdesk.com"))
                        .license(new License().name("Apache 2.0").url("http://springdoc.org")))
                // 1. Add the global security requirement
                .addSecurityItem(new SecurityRequirement().addList(securitySchemeName))
                // 2. Define how the security scheme works (Bearer token in the Authorization header)
                .components(new Components()
                        .addSecuritySchemes(securitySchemeName, new SecurityScheme()
                                .name(securitySchemeName)
                                .type(SecurityScheme.Type.HTTP)
                                .scheme("bearer")
                                .bearerFormat("JWT")));
    }
}
