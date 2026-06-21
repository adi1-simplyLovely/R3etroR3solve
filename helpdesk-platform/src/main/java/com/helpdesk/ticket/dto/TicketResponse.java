package com.helpdesk.ticket.dto;

import com.helpdesk.ticket.enums.Category;
import com.helpdesk.ticket.enums.Priority;
import com.helpdesk.ticket.enums.TicketStatus;
import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.List;

@Data
@Builder
public class TicketResponse {
    private Long id;
    private String title;
    private String description;
    private TicketStatus status;
    private Priority priority;
    private Category category;
    private String rejectionReason;
    
    private Long creatorId;
    private String creatorName;
    
    private Long assigneeId;
    private String assigneeName;
    
    private Instant createdAt;
    private Instant updatedAt;
    
    private List<CommentResponse> comments;
}
