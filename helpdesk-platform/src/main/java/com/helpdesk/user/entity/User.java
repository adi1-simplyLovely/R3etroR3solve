package com.helpdesk.user.entity;

import com.helpdesk.user.enums.Role;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

/**
 * Represents a user in the Helpdesk system.
 * Uses JPA annotations for database mapping and Lombok for boilerplate reduction.
 */
@Entity
@Table(name = "users") // "user" is a reserved keyword in PostgreSQL, so we use "users"
@Getter
@Setter
@NoArgsConstructor
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 255)
    private String email;

    @Column(name = "password_hash", nullable = false)
    private String passwordHash;

    @Column(name = "first_name", nullable = false, length = 100)
    private String firstName;

    @Column(name = "last_name", nullable = false, length = 100)
    private String lastName;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Role role;

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private com.helpdesk.user.enums.Department department;

    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    // Self-referencing relationship for the reporting hierarchy
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "manager_id")
    private User manager;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @Column(name = "last_login_time")
    private Instant lastLoginTime;

    @Column(name = "last_logout_time")
    private Instant lastLogoutTime;

    /**
     * Automatically sets the createdAt and updatedAt timestamps before inserting.
     */
    @PrePersist
    protected void onCreate() {
        createdAt = Instant.now();
        updatedAt = Instant.now();
        if (isActive == null) {
            isActive = true;
        }
    }

    /**
     * Automatically updates the updatedAt timestamp before modifying the record.
     */
    @PreUpdate
    protected void onUpdate() {
        updatedAt = Instant.now();
    }
}
