package com.helpdesk.user.controller;

import com.helpdesk.auth.security.UserPrincipal;
import com.helpdesk.user.entity.AccountDeletionRequest;
import com.helpdesk.user.entity.User;
import com.helpdesk.user.repository.DeletionRequestRepository;
import com.helpdesk.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
public class UserController {

    private final UserRepository userRepository;
    private final DeletionRequestRepository deletionRequestRepository;

    @GetMapping("/me")
    public ResponseEntity<com.helpdesk.common.dto.ApiResponse<User>> getCurrentUser(@AuthenticationPrincipal UserPrincipal userPrincipal) {
        User user = userRepository.findById(userPrincipal.getId())
                .orElseThrow(() -> new RuntimeException("User not found"));
        return ResponseEntity.ok(com.helpdesk.common.dto.ApiResponse.success(user));
    }

    @PostMapping("/me/deletion-request")
    public ResponseEntity<String> requestDeletion(@AuthenticationPrincipal UserPrincipal userPrincipal) {
        User user = userRepository.findById(userPrincipal.getId())
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (user.getRole().name().equals("ADMIN")) {
            return ResponseEntity.badRequest().body("Admins should use direct deletion.");
        }

        AccountDeletionRequest request = new AccountDeletionRequest();
        request.setUser(user);
        request.setStatus(AccountDeletionRequest.Status.PENDING);
        request.setRequestedAt(LocalDateTime.now());
        
        deletionRequestRepository.save(request);

        return ResponseEntity.ok("Deletion request submitted.");
    }

    @DeleteMapping("/me")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<String> deleteAdminSelf(@AuthenticationPrincipal UserPrincipal userPrincipal) {
        User user = userRepository.findById(userPrincipal.getId())
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        user.setIsActive(false);
        userRepository.save(user);

        return ResponseEntity.ok("Admin account deleted.");
    }
}
