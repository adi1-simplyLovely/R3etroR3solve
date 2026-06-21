package com.helpdesk.ticket.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CommentRequest {
    
    @NotBlank(message = "Comment content cannot be empty")
    private String content;
    
    private boolean isInternal;
}
