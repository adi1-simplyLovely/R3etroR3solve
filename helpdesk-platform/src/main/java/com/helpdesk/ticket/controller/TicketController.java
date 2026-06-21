package com.helpdesk.ticket.controller;

import com.helpdesk.auth.security.UserPrincipal;
import com.helpdesk.common.dto.ApiResponse;
import com.helpdesk.ticket.dto.CommentRequest;
import com.helpdesk.ticket.dto.CommentResponse;
import com.helpdesk.ticket.dto.TicketCreateRequest;
import com.helpdesk.ticket.dto.TicketResponse;
import com.helpdesk.ticket.service.TicketService;
import com.helpdesk.ticket.service.WorkflowService;
import com.helpdesk.user.enums.Role;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/tickets")
@RequiredArgsConstructor
public class TicketController {

    private final TicketService ticketService;
    private final WorkflowService workflowService;

    @PostMapping
    public ResponseEntity<ApiResponse<TicketResponse>> createTicket(
            @Valid @RequestBody TicketCreateRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser) {
            
        TicketResponse response = ticketService.createTicket(request, currentUser.getId());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Ticket created successfully", response));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<TicketResponse>> getTicketById(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal currentUser) {
            
        Role role = currentUser.getAuthorities().stream()
                .findFirst()
                .map(auth -> Role.valueOf(auth.getAuthority().replace("ROLE_", "")))
                .orElse(Role.EMPLOYEE);
                
        TicketResponse response = ticketService.getTicketById(id, currentUser.getId(), role);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/my")
    public ResponseEntity<ApiResponse<List<TicketResponse>>> getMyTickets(
            @AuthenticationPrincipal UserPrincipal currentUser) {
            
        List<TicketResponse> responses = ticketService.getMyTickets(currentUser.getId());
        return ResponseEntity.ok(ApiResponse.success(responses));
    }

    @GetMapping("/{id}/history")
    public ResponseEntity<ApiResponse<List<com.helpdesk.ticket.entity.TicketHistory>>> getTicketHistory(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        Role role = currentUser.getAuthorities().stream()
                .findFirst()
                .map(auth -> Role.valueOf(auth.getAuthority().replace("ROLE_", "")))
                .orElse(Role.EMPLOYEE);
        List<com.helpdesk.ticket.entity.TicketHistory> history = ticketService.getTicketHistory(id, currentUser.getId(), role);
        return ResponseEntity.ok(ApiResponse.success(history));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('SUPPORT_AGENT', 'ADMIN')")
    public ResponseEntity<ApiResponse<List<TicketResponse>>> getAllTickets(
            @AuthenticationPrincipal UserPrincipal currentUser) {
        List<TicketResponse> responses = ticketService.getAllTickets(currentUser.getId());
        return ResponseEntity.ok(ApiResponse.success(responses));
    }

    @PostMapping("/{id}/comments")
    public ResponseEntity<ApiResponse<CommentResponse>> addComment(
            @PathVariable Long id,
            @Valid @RequestBody CommentRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser) {
            
        Role role = currentUser.getAuthorities().stream()
                .findFirst()
                .map(auth -> Role.valueOf(auth.getAuthority().replace("ROLE_", "")))
                .orElse(Role.EMPLOYEE);

        CommentResponse response = ticketService.addComment(id, request, currentUser.getId(), role);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Comment added successfully", response));
    }

    // --- WORKFLOW ENDPOINTS ---

    @PostMapping("/{id}/pickup")
    @PreAuthorize("hasRole('SUPPORT_AGENT')")
    public ResponseEntity<ApiResponse<Void>> pickupTicket(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal currentUser) {
            
        workflowService.pickupTicket(id, currentUser.getId());
        return ResponseEntity.ok(ApiResponse.success("Ticket picked up successfully", null));
    }

    @PostMapping("/{id}/wait")
    @PreAuthorize("hasRole('SUPPORT_AGENT')")
    public ResponseEntity<ApiResponse<Void>> waitForUser(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal currentUser) {
            
        workflowService.waitForUser(id, currentUser.getId());
        return ResponseEntity.ok(ApiResponse.success("Ticket is now waiting on user", null));
    }

    @PostMapping("/{id}/resolve")
    @PreAuthorize("hasRole('SUPPORT_AGENT')")
    public ResponseEntity<ApiResponse<Void>> resolveTicket(
            @PathVariable Long id,
            @RequestBody(required = false) com.helpdesk.ticket.dto.ResolutionRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser) {
            
        String resolutionNote = (request != null) ? request.getResolutionNote() : null;
        workflowService.resolveTicket(id, currentUser.getId(), resolutionNote);
        return ResponseEntity.ok(ApiResponse.success("Ticket resolved successfully", null));
    }

    @PostMapping("/{id}/ignore")
    @PreAuthorize("hasRole('SUPPORT_AGENT')")
    public ResponseEntity<ApiResponse<Void>> ignoreTicket(
            @PathVariable Long id,
            @Valid @RequestBody com.helpdesk.ticket.dto.IgnoreRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser) {
            
        workflowService.ignoreTicket(id, currentUser.getId(), request.getReason());
        return ResponseEntity.ok(ApiResponse.success("Ticket ignored successfully", null));
    }

    @PostMapping("/{id}/close")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> closeTicket(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        workflowService.closeTicket(id, currentUser.getId());
        return ResponseEntity.ok(ApiResponse.success("Ticket permanently closed", null));
    }
}
