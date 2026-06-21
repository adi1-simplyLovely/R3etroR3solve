package com.helpdesk.ticket.service;

import com.helpdesk.common.exception.ResourceNotFoundException;
import com.helpdesk.common.exception.UnauthorizedException;
import com.helpdesk.ticket.dto.CommentRequest;
import com.helpdesk.ticket.dto.CommentResponse;
import com.helpdesk.ticket.dto.TicketCreateRequest;
import com.helpdesk.ticket.dto.TicketResponse;
import com.helpdesk.ticket.entity.Comment;
import com.helpdesk.ticket.entity.Ticket;
import com.helpdesk.ticket.enums.TicketStatus;
import com.helpdesk.ticket.repository.CommentRepository;
import com.helpdesk.ticket.repository.TicketRepository;
import com.helpdesk.user.entity.User;
import com.helpdesk.user.enums.Role;
import com.helpdesk.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

import com.helpdesk.ticket.entity.TicketHistory;
import com.helpdesk.ticket.repository.TicketHistoryRepository;
import java.time.Instant;

import org.springframework.messaging.simp.SimpMessagingTemplate;

@Service
@RequiredArgsConstructor
public class TicketService {

    private final TicketRepository ticketRepository;
    private final CommentRepository commentRepository;
    private final UserRepository userRepository;
    private final TicketHistoryRepository ticketHistoryRepository;
    private final SimpMessagingTemplate messagingTemplate;

    @Transactional
    public TicketResponse createTicket(TicketCreateRequest request, Long userId) {
        User creator = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        Ticket ticket = new Ticket();
        ticket.setTitle(request.getTitle());
        ticket.setDescription(request.getDescription());
        ticket.setPriority(request.getPriority());
        ticket.setCategory(request.getCategory());
        ticket.setStatus(TicketStatus.OPEN);
        ticket.setCreatedBy(creator);

        Ticket savedTicket = ticketRepository.save(ticket);
        
        logHistory(savedTicket.getId(), creator.getEmail(), "TICKET_CREATED", "Ticket created with status OPEN and priority " + request.getPriority());
        
        TicketResponse response = mapToResponse(savedTicket, false);
        
        // Notify agents of new ticket
        messagingTemplate.convertAndSend("/topic/tickets", response);
        
        return response;
    }
    
    private void logHistory(Long ticketId, String actorEmail, String action, String details) {
        TicketHistory history = TicketHistory.builder()
                .ticketId(ticketId)
                .actorEmail(actorEmail)
                .action(action)
                .details(details)
                .timestamp(Instant.now())
                .build();
        ticketHistoryRepository.save(history);
    }

    @Transactional(readOnly = true)
    public TicketResponse getTicketById(Long ticketId, Long requestingUserId, Role requestingUserRole) {
        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new ResourceNotFoundException("Ticket", "id", ticketId));

        // Basic RBAC for read: Employees can only view their own tickets.
        if (requestingUserRole == Role.EMPLOYEE && !ticket.getCreatedBy().getId().equals(requestingUserId)) {
            throw new UnauthorizedException("You do not have permission to view this ticket");
        }

        return mapToResponse(ticket, requestingUserRole != Role.EMPLOYEE);
    }

    @Transactional(readOnly = true)
    public List<TicketHistory> getTicketHistory(Long ticketId, Long requestingUserId, Role requestingUserRole) {
        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new ResourceNotFoundException("Ticket", "id", ticketId));

        if (requestingUserRole == Role.EMPLOYEE && !ticket.getCreatedBy().getId().equals(requestingUserId)) {
            throw new UnauthorizedException("You do not have permission to view this ticket's history");
        }

        return ticketHistoryRepository.findByTicketIdOrderByTimestampDesc(ticketId);
    }

    @Transactional(readOnly = true)
    public List<TicketResponse> getAllTickets(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
        
        com.helpdesk.user.enums.Department department = user.getDepartment();
        boolean isAdmin = user.getRole() == Role.ADMIN;

        return ticketRepository.findAll().stream()
                .filter(t -> isAdmin || department == null || t.getCategory().getAssociatedDepartment() == department)
                .map(t -> mapToResponse(t, true))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<TicketResponse> getMyTickets(Long userId) {
        return ticketRepository.findByCreatedByIdOrderByCreatedAtDesc(userId).stream()
                .map(t -> mapToResponse(t, false))
                .collect(Collectors.toList());
    }

    @Transactional
    public CommentResponse addComment(Long ticketId, CommentRequest request, Long userId, Role userRole) {
        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new ResourceNotFoundException("Ticket", "id", ticketId));

        if (userRole == Role.EMPLOYEE && !ticket.getCreatedBy().getId().equals(userId)) {
            throw new UnauthorizedException("You do not have permission to comment on this ticket");
        }

        // Employees cannot make internal comments
        boolean isInternal = request.isInternal();
        if (userRole == Role.EMPLOYEE) {
            isInternal = false; 
        }

        User author = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        Comment comment = new Comment();
        comment.setContent(request.getContent());
        comment.setIsInternal(isInternal);
        comment.setAuthor(author);
        
        ticket.addComment(comment);
        // Cascades down to save the comment
        ticketRepository.save(ticket);

        return mapCommentToResponse(comment);
    }

    // --- Helper Mapping Methods ---

    private TicketResponse mapToResponse(Ticket ticket, boolean includeInternalComments) {
        List<CommentResponse> mappedComments = ticket.getComments().stream()
                .filter(c -> includeInternalComments || !c.getIsInternal())
                .map(this::mapCommentToResponse)
                .collect(Collectors.toList());

        return TicketResponse.builder()
                .id(ticket.getId())
                .title(ticket.getTitle())
                .description(ticket.getDescription())
                .status(ticket.getStatus())
                .priority(ticket.getPriority())
                .category(ticket.getCategory())
                .rejectionReason(ticket.getRejectionReason())
                .creatorId(ticket.getCreatedBy().getId())
                .creatorName(ticket.getCreatedBy().getFirstName() + " " + ticket.getCreatedBy().getLastName())
                .assigneeId(ticket.getAssignee() != null ? ticket.getAssignee().getId() : null)
                .assigneeName(ticket.getAssignee() != null ? ticket.getAssignee().getFirstName() + " " + ticket.getAssignee().getLastName() : null)
                .createdAt(ticket.getCreatedAt())
                .updatedAt(ticket.getUpdatedAt())
                .comments(mappedComments)
                .build();
    }

    private CommentResponse mapCommentToResponse(Comment comment) {
        return CommentResponse.builder()
                .id(comment.getId())
                .content(comment.getContent())
                .isInternal(comment.getIsInternal())
                .authorId(comment.getAuthor().getId())
                .authorName(comment.getAuthor().getFirstName() + " " + comment.getAuthor().getLastName())
                .createdAt(comment.getCreatedAt())
                .build();
    }
}
