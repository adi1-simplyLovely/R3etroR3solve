package com.helpdesk.user.controller;

import com.helpdesk.user.entity.AccountDeletionRequest;
import com.helpdesk.user.entity.User;
import com.helpdesk.user.repository.DeletionRequestRepository;
import com.helpdesk.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/admin/deletion-requests")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final DeletionRequestRepository deletionRequestRepository;
    private final UserRepository userRepository;

    @GetMapping
    public ResponseEntity<List<AccountDeletionRequest>> getPendingRequests() {
        List<AccountDeletionRequest> requests = deletionRequestRepository.findByStatus(AccountDeletionRequest.Status.PENDING);
        return ResponseEntity.ok(requests);
    }

    @PostMapping("/{id}/approve")
    public ResponseEntity<String> approveRequest(@PathVariable Long id) {
        AccountDeletionRequest request = deletionRequestRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Request not found"));
        
        request.setStatus(AccountDeletionRequest.Status.APPROVED);
        request.setProcessedAt(LocalDateTime.now());
        
        User user = request.getUser();
        user.setIsActive(false);
        
        userRepository.save(user);
        deletionRequestRepository.save(request);
        
        return ResponseEntity.ok("Request approved and user deleted.");
    }

    @PostMapping("/{id}/reject")
    public ResponseEntity<String> rejectRequest(@PathVariable Long id, @RequestBody Map<String, String> payload) {
        AccountDeletionRequest request = deletionRequestRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Request not found"));
        
        request.setStatus(AccountDeletionRequest.Status.REJECTED);
        request.setReason(payload.get("reason"));
        request.setProcessedAt(LocalDateTime.now());
        
        deletionRequestRepository.save(request);
        
        return ResponseEntity.ok("Request rejected.");
    }
}
