package in.vyanix.webservice.service;

import in.vyanix.webservice.entity.User;
import in.vyanix.webservice.entity.UserRole;
import in.vyanix.webservice.repository.UserRepository;
import in.vyanix.webservice.service.exception.ResourceNotFoundException;
import in.vyanix.webservice.service.exception.UnauthorizedException;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * User service with security-focused operations.
 * 
 * Uses application events to trigger token invalidation, avoiding circular
 * dependencies with RefreshTokenService. When a user's role changes or account
 * is disabled, an event is published that RefreshTokenService listens to.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final ApplicationEventPublisher eventPublisher;

    /**
     * Get user by ID
     */
    @Transactional(readOnly = true)
    public User getUserById(UUID userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    /**
     * Get user by email
     */
    @Transactional(readOnly = true)
    public User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    /**
     * Update user role and publish event for token invalidation
     * 
     * The actual token revocation is handled by RefreshTokenService via
     * @EventListener, ensuring no circular dependency.
     */
    @Transactional
    public void updateUserRole(UUID userId, UserRole newRole) {
        User user = getUserById(userId);
        UserRole oldRole = user.getRole();

        user.setRole(newRole);
        user.setLastRoleChangeAt(LocalDateTime.now());
        userRepository.save(user);

        // Publish event for token invalidation (handled by RefreshTokenService)
        eventPublisher.publishEvent(new UserAccountChangedEvent(
            this, 
            userId, 
            AccountChangeReason.ROLE_CHANGE,
            "Role changed from " + oldRole + " to " + newRole
        ));

        log.info("Updated user {} role from {} to {}, token invalidation event published", userId, oldRole, newRole);
    }

    /**
     * Disable user account and publish event for token invalidation
     * 
     * The actual token revocation is handled by RefreshTokenService via
     * @EventListener.
     */
    @Transactional
    public void disableUser(UUID userId) {
        User user = getUserById(userId);
        user.setEnabled(false);
        userRepository.save(user);

        // Publish event for token invalidation (handled by RefreshTokenService)
        eventPublisher.publishEvent(new UserAccountChangedEvent(
            this,
            userId,
            AccountChangeReason.ACCOUNT_DISABLED,
            "Account disabled"
        ));

        log.info("Disabled user {}, token invalidation event published", userId);
    }

    /**
     * Enable user account
     */
    @Transactional
    public void enableUser(UUID userId) {
        User user = getUserById(userId);
        user.setEnabled(true);
        userRepository.save(user);
        log.info("Enabled user {}", userId);
    }

    /**
     * Change user password and publish event for token invalidation
     * 
     * The actual token revocation is handled by RefreshTokenService via
     * @EventListener.
     */
    @Transactional
    public void changePassword(UUID userId, String oldPassword, String newPassword) {
        User user = getUserById(userId);

        // Verify old password
        if (!passwordEncoder.matches(oldPassword, user.getPassword())) {
            throw new UnauthorizedException("Current password is incorrect", "INVALID_PASSWORD");
        }

        // Set new password
        user.setPassword(passwordEncoder.encode(newPassword));
        user.setLastPasswordChangeAt(LocalDateTime.now());
        userRepository.save(user);

        // Publish event for token invalidation (handled by RefreshTokenService)
        eventPublisher.publishEvent(new UserAccountChangedEvent(
            this,
            userId,
            AccountChangeReason.PASSWORD_CHANGE,
            "Password changed"
        ));

        log.info("Password changed for user {}, token invalidation event published", userId);
    }

    /**
     * Check if user account is enabled
     */
    public boolean isUserEnabled(UUID userId) {
        User user = getUserById(userId);
        return user.isEnabled();
    }

    // ============ Event Classes ============

    /**
     * Reason for user account change event
     */
    @Getter
    @RequiredArgsConstructor
    public enum AccountChangeReason {
        ROLE_CHANGE("Role changed"),
        ACCOUNT_DISABLED("Account disabled"),
        PASSWORD_CHANGE("Password changed");

        private final String description;
    }

    /**
     * Event published when user account changes require token invalidation.
     * 
     * This event is published by UserService and consumed by RefreshTokenService
     * to revoke all active tokens and increment the user's token version.
     */
    @Getter
    @RequiredArgsConstructor
    public static class UserAccountChangedEvent {
        private final Object source;
        private final UUID userId;
        private final AccountChangeReason reason;
        private final String details;
    }
}
