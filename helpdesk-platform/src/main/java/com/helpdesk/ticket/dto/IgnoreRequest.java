package com.helpdesk.ticket.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class IgnoreRequest {
    @NotBlank(message = "Reason is required to ignore a ticket")
    private String reason;
}
