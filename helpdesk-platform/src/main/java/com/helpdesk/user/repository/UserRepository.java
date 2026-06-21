package com.helpdesk.user.repository;

import com.helpdesk.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Spring Data JPA repository for the User entity.
 * Provides basic CRUD operations automatically.
 */
@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    /**
     * Finds a user by their unique email address.
     * Used for login and duplicate email checks during registration.
     *
     * @param email The exact email to search for
     * @return An Optional containing the User if found, empty otherwise
     */
    Optional<User> findByEmail(String email);

    /**
     * Checks if a user exists with the given email address.
     * Faster than findByEmail when we only need to know if the email is taken.
     *
     * @param email The email to check
     * @return true if the email exists in the database
     */
    boolean existsByEmail(String email);
}
