package com.helpdesk.ticket.dto;

import lombok.Builder;
import lombok.Data;
import java.time.Instant;

@Data
@Builder
public class CommentResponse {
    private Long id;
    private String content;
    private boolean isInternal;
    private Long authorId;
    private String authorName;
    private Instant createdAt;
}
