package com.helpdesk.user.controller;

import com.helpdesk.user.entity.User;
import com.helpdesk.user.repository.UserRepository;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/workforce")
@RequiredArgsConstructor
public class WorkforceController {

    private final UserRepository userRepository;

    @GetMapping
    public ResponseEntity<List<WorkforceDto>> getWorkforce() {
        List<User> users = userRepository.findAll();
        List<WorkforceDto> workforce = users.stream().map(u -> new WorkforceDto(
                u.getId(),
                u.getFirstName() + " " + u.getLastName(),
                u.getRole().name(),
                u.getDepartment() != null ? u.getDepartment().name() : "N/A",
                u.getIsActive(),
                u.getLastLoginTime(),
                u.getLastLogoutTime()
        )).collect(Collectors.toList());

        return ResponseEntity.ok(workforce);
    }

    @Data
    public static class WorkforceDto {
        private final Long id;
        private final String name;
        private final String role;
        private final String department;
        private final Boolean isActive;
        private final Instant lastLoginTime;
        private final Instant lastLogoutTime;
    }
}
