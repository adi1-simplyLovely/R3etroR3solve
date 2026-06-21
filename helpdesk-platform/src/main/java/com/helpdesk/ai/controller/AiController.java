package com.helpdesk.ai.controller;

import com.helpdesk.ai.service.AiService;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/ai")
@RequiredArgsConstructor
public class AiController {

    private final AiService aiService;

    @PostMapping("/draft-reply")
    public ResponseEntity<com.helpdesk.common.dto.ApiResponse<String>> draftReply(@RequestBody DraftRequest request, @org.springframework.security.core.annotation.AuthenticationPrincipal com.helpdesk.auth.security.UserPrincipal userPrincipal) {
        String userName = userPrincipal != null ? userPrincipal.getName() : "Agent";
        String userRole = userPrincipal != null ? userPrincipal.getAuthorities().iterator().next().getAuthority().replace("ROLE_", "") : "SUPPORT_AGENT";
        String draft = aiService.generateDraftReply(
                request.getTicketTitle(), 
                request.getTicketDescription(), 
                request.getPastComments(),
                userName,
                userRole
        );
        return ResponseEntity.ok(com.helpdesk.common.dto.ApiResponse.success(draft));
    }

    @PostMapping("/copilot-chat")
    public ResponseEntity<com.helpdesk.common.dto.ApiResponse<String>> copilotChat(@RequestBody CopilotRequest request, @org.springframework.security.core.annotation.AuthenticationPrincipal com.helpdesk.auth.security.UserPrincipal userPrincipal) {
        String userName = userPrincipal != null ? userPrincipal.getName() : "Agent";
        String userRole = userPrincipal != null ? userPrincipal.getAuthorities().iterator().next().getAuthority().replace("ROLE_", "") : "SUPPORT_AGENT";
        String response = aiService.getCopilotResponse(
                request.getMessage(), 
                request.getContext(),
                userName,
                userRole
        );
        return ResponseEntity.ok(com.helpdesk.common.dto.ApiResponse.success(response));
    }
    @PostMapping("/route-ticket")
    public ResponseEntity<com.helpdesk.common.dto.ApiResponse<String>> routeTicket(@RequestBody TicketAiRequest request) {
        String response = aiService.routeTicket(request.getTitle(), request.getDescription());
        return ResponseEntity.ok(com.helpdesk.common.dto.ApiResponse.success(response));
    }

    @PostMapping("/deflect-ticket")
    public ResponseEntity<com.helpdesk.common.dto.ApiResponse<String>> deflectTicket(@RequestBody TicketAiRequest request) {
        String response = aiService.deflectTicket(request.getTitle(), request.getDescription());
        return ResponseEntity.ok(com.helpdesk.common.dto.ApiResponse.success(response));
    }

    @Data
    public static class TicketAiRequest {
        private String title;
        private String description;
    }
    @Data
    public static class DraftRequest {
        private String ticketTitle;
        private String ticketDescription;
        private String pastComments;
    }

    @Data
    public static class CopilotRequest {
        private String message;
        private String context;
    }
}
