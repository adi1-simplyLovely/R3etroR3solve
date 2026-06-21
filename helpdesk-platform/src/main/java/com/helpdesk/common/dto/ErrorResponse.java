package com.helpdesk.common.dto;

import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.List;

/**
 * Standardized error response format.
 * Guarantees that clients always receive errors in the exact same JSON structure.
 */
@Data
@Builder
public class ErrorResponse {
    
    @Builder.Default
    private boolean success = false;
    
    private Instant timestamp;
    private int status;
    private String error;
    private String message;
    private List<String> details;
    private String path;
}
