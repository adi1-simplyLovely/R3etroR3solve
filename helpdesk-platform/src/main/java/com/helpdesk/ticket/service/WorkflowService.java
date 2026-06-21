package com.helpdesk.ticket.service;

import com.helpdesk.common.exception.InvalidStateTransitionException;
import com.helpdesk.common.exception.ResourceNotFoundException;
import com.helpdesk.common.exception.UnauthorizedException;
import com.helpdesk.ticket.entity.Ticket;
import com.helpdesk.ticket.enums.TicketStatus;
import com.helpdesk.ticket.repository.TicketRepository;
import com.helpdesk.user.entity.User;
import com.helpdesk.user.enums.Role;
import com.helpdesk.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.helpdesk.ticket.repository.TicketHistoryRepository;
import com.helpdesk.ticket.entity.TicketHistory;
import java.time.Instant;

/**
 * Acts as a State Machine to enforce business rules for ticket status transitions.
 */
@Service
@RequiredArgsConstructor
public class WorkflowService {

    private final TicketRepository ticketRepository;
    private final UserRepository userRepository;
    private final TicketHistoryRepository ticketHistoryRepository;

    private void logHistory(Long ticketId, String actorEmail, String action, String details) {
        TicketHistory history = TicketHistory.builder()
                .ticketId(ticketId)
                .actorEmail(actorEmail)
                .action(action)
                .details(details)
                .timestamp(Instant.now())
                .build();
    }

    /**
     * Agent assigns a ticket to themselves and moves it to IN_PROGRESS.
     */
    @Transactional
    public void pickupTicket(Long ticketId, Long agentId) {
        Ticket ticket = getTicket(ticketId);
        User agent = getUser(agentId);

        if (ticket.getStatus() != TicketStatus.OPEN) {
            throw new InvalidStateTransitionException("Only OPEN tickets can be picked up. Current status: " + ticket.getStatus());
        }

        ticket.setStatus(TicketStatus.IN_PROGRESS);
        ticket.setAssignee(agent);
        ticketRepository.save(ticket);
        
        logHistory(ticketId, agent.getEmail(), "TICKET_ASSIGNED", "Ticket assigned to " + agent.getFirstName() + " " + agent.getLastName() + ". Status changed to IN_PROGRESS.");
    }

    /**
     * Agent marks a ticket as WAITING_ON_USER.
     */
    @Transactional
    public void waitForUser(Long ticketId, Long requestingAgentId) {
        Ticket ticket = getTicket(ticketId);
        verifyAssignee(ticket, requestingAgentId);

        if (ticket.getStatus() != TicketStatus.IN_PROGRESS) {
            throw new InvalidStateTransitionException("Ticket must be IN_PROGRESS to wait for user.");
        }

        ticket.setStatus(TicketStatus.WAITING_ON_USER);
        ticketRepository.save(ticket);
        
        User agent = getUser(requestingAgentId);
        logHistory(ticketId, agent.getEmail(), "TICKET_WAITING", "Status changed to WAITING_ON_USER.");
    }

    /**
     * Agent marks a ticket as IGNORED and provides a reason.
     */
    @Transactional
    public void ignoreTicket(Long ticketId, Long requestingAgentId, String reason) {
        Ticket ticket = getTicket(ticketId);
        verifyAssignee(ticket, requestingAgentId);

        if (ticket.getStatus() != TicketStatus.IN_PROGRESS && ticket.getStatus() != TicketStatus.WAITING_ON_USER) {
            throw new InvalidStateTransitionException("Only active tickets can be ignored.");
        }

        ticket.setStatus(TicketStatus.IGNORED);
        ticket.setRejectionReason(reason);
        ticketRepository.save(ticket);
        
        User agent = getUser(requestingAgentId);
        logHistory(ticketId, agent.getEmail(), "TICKET_IGNORED", "Ticket ignored. Reason: " + reason);
    }

    /**
     * Agent marks the ticket as RESOLVED.
     */
    @Transactional
    public void resolveTicket(Long ticketId, Long requestingAgentId, String resolutionNote) {
        Ticket ticket = getTicket(ticketId);
        verifyAssignee(ticket, requestingAgentId);

        if (ticket.getStatus() != TicketStatus.IN_PROGRESS && ticket.getStatus() != TicketStatus.WAITING_ON_USER) {
            throw new InvalidStateTransitionException("Only active tickets can be resolved.");
        }

        ticket.setStatus(TicketStatus.RESOLVED);
        User agent = getUser(requestingAgentId);
        
        if (resolutionNote != null && !resolutionNote.trim().isEmpty()) {
            com.helpdesk.ticket.entity.Comment comment = new com.helpdesk.ticket.entity.Comment();
            comment.setContent("Resolution Note: " + resolutionNote);
            comment.setIsInternal(false);
            comment.setAuthor(agent);
            ticket.addComment(comment);
        }
        
        ticketRepository.save(ticket);
        
        logHistory(ticketId, agent.getEmail(), "TICKET_RESOLVED", "Ticket successfully resolved by agent.");
    }

    /**
     * Admin explicitly closes a resolved ticket.
     */
    @Transactional
    public void closeTicket(Long ticketId, Long adminId) {
        Ticket ticket = getTicket(ticketId);

        if (ticket.getStatus() != TicketStatus.RESOLVED) {
            throw new InvalidStateTransitionException("Only RESOLVED tickets can be officially CLOSED.");
        }

        ticket.setStatus(TicketStatus.CLOSED);
        ticketRepository.save(ticket);
        
        User admin = getUser(adminId);
        logHistory(ticketId, admin.getEmail(), "TICKET_CLOSED", "Ticket officially closed by administrator.");
    }

    // --- Helper Methods ---

    private Ticket getTicket(Long ticketId) {
        return ticketRepository.findById(ticketId)
                .orElseThrow(() -> new ResourceNotFoundException("Ticket", "id", ticketId));
    }

    private User getUser(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
    }

    private void verifyAssignee(Ticket ticket, Long agentId) {
        if (ticket.getAssignee() == null || !ticket.getAssignee().getId().equals(agentId)) {
            throw new UnauthorizedException("Only the assigned agent can perform this action.");
        }
    }
}
