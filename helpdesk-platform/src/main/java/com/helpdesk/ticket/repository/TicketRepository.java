package com.helpdesk.ticket.repository;

import com.helpdesk.ticket.entity.Ticket;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TicketRepository extends JpaRepository<Ticket, Long> {
    List<Ticket> findByCreatedByIdOrderByCreatedAtDesc(Long userId);
    List<Ticket> findByAssigneeIdOrderByCreatedAtDesc(Long assigneeId);
}
