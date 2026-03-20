package in.vyanix.webservice.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Refresh token entity with production-grade security features:
 * - SHA-256 token hashing (fast database lookups)
 * - Grace period for token rotation (prevents false positive theft detection)
 * - Token format tracking (LEGACY vs CURRENT for migration)
 * - Optimistic locking (version field)
 * - Enhanced revocation tracking with user-friendly error codes
 * - Theft detection and session tracking
 */
@Entity
@Table(name = "refresh_tokens", indexes = {
    @Index(name = "idx_refresh_token_hash", columnList = "token_hash"),
    @Index(name = "idx_refresh_token_user", columnList = "user_id"),
    @Index(name = "idx_refresh_token_session", columnList = "session_id"),
    @Index(name = "idx_refresh_token_expiry", columnList = "expiry_date"),
    @Index(name = "idx_refresh_token_last_used", columnList = "last_used_at"),
    @Index(name = "idx_refresh_token_grace", columnList = "grace_period_ends_at"),
    @Index(name = "idx_refresh_token_format", columnList = "token_format")
})
@Getter
@Setter
public class RefreshToken {

    @Id
    @GeneratedValue
    private UUID id;

    @Column(nullable = false, length = 36)
    private UUID userId;

    /**
     * SHA-256 hash of the refresh token (64 hex characters)
     * Raw token is never stored - only the hash
     */
    @Column(name = "token_hash", nullable = false, length = 64, unique = true)
    private String tokenHash;

    @Column(name = "expiry_date", nullable = false)
    private LocalDateTime expiryDate;

    @Column(name = "created_at", nullable = false, updatable = false)
    @CreationTimestamp
    private LocalDateTime createdAt;

    /**
     * Last time this token was used for refresh
     * Used for sliding expiration and session management
     */
    @Column(name = "last_used_at")
    @UpdateTimestamp
    private LocalDateTime lastUsedAt;

    /**
     * Grace period end time for token rotation
     * During this window (30 seconds after rotation), the old token
     * can still be used once to prevent race conditions
     */
    @Column(name = "grace_period_ends_at")
    private LocalDateTime gracePeriodEndsAt;

    /**
     * Atomic flag indicating whether grace period has been consumed
     * Prevents multiple simultaneous requests from both succeeding
     */
    @Column(name = "grace_used", nullable = false)
    private boolean graceUsed = false;

    @Column(name = "revoked", nullable = false)
    private boolean revoked = false;

    @Column(name = "revoked_at")
    private LocalDateTime revokedAt;

    /**
     * Reason for revocation (internal audit)
     * Values: USER_REQUEST, ROTATION, THEFT_DETECTED, PASSWORD_CHANGE, 
     *         ROLE_CHANGE, SESSION_LIMIT_EXCEEDED, INACTIVITY, MAX_LIFETIME
     */
    @Column(name = "revoke_reason", length = 50)
    private String revokeReason;

    /**
     * User-friendly error code for frontend display
     * Values: SESSION_LIMIT_EXCEEDED, SECURITY_THEFT_DETECTED, 
     *         PERMISSIONS_CHANGED, PASSWORD_CHANGED, TOKEN_EXPIRED, SESSION_EXPIRED
     */
    @Column(name = "revoke_message_code", length = 50)
    private String revokeMessageCode;

    /**
     * Device information extracted from user agent
     * Values: "Desktop (Chrome)", "Mobile (iOS)", "Tablet", etc.
     */
    @Column(name = "device_info", length = 255)
    private String deviceInfo;

    @Column(name = "ip_address", length = 45)
    private String ipAddress;

    @Column(name = "user_agent", length = 512)
    private String userAgent;

    /**
     * Unique session identifier - maintained across token rotations
     * Allows tracking a "session" even as tokens are rotated
     */
    @Column(name = "session_id", length = 36)
    private String sessionId;

    /**
     * Hash of the token that replaced this one (audit trail)
     */
    @Column(name = "replaced_by_token_hash", length = 64)
    private String replacedByTokenHash;

    /**
     * Flag indicating token theft was detected
     * Set when a revoked token is reused outside the grace period
     */
    @Column(name = "theft_detected", nullable = false)
    private boolean theftDetected = false;

    @Column(name = "theft_detected_at")
    private LocalDateTime theftDetectedAt;

    /**
     * Token format for migration tracking
     * LEGACY: Pre-migration tokens (no SHA-256, no grace period)
     * CURRENT: SHA-256 hashed tokens with full security features
     */
    @Column(name = "token_format", nullable = false, length = 20)
    @Enumerated(EnumType.STRING)
    private TokenFormat tokenFormat = TokenFormat.LEGACY;

    /**
     * Optimistic locking version
     * Prevents lost updates in concurrent scenarios
     */
    @Version
    @Column(name = "version")
    private Long version;

    /**
     * Temporary field to hold raw token value during creation
     * NEVER persisted to database - cleared before save
     */
    @Transient
    private String rawToken;

    /**
     * Token format enumeration for migration tracking
     */
    public enum TokenFormat {
        /**
         * Legacy format: Pre-migration tokens
         * - May not have SHA-256 hash
         * - No grace period support
         * - Will be transparently migrated on first use
         */
        LEGACY,
        /**
         * Current format: Production-grade security
         * - SHA-256 hashed
         * - Grace period support
         * - Full theft detection
         */
        CURRENT
    }

    // ============ Helper Methods ============

    /**
     * Check if this is a legacy token that needs migration
     */
    public boolean isLegacyToken() {
        return this.tokenFormat == TokenFormat.LEGACY;
    }

    /**
     * Migrate legacy token to current format
     * Called transparently on first use of a legacy token
     */
    public void migrateToCurrentFormat() {
        if (isLegacyToken()) {
            this.tokenFormat = TokenFormat.CURRENT;
            this.graceUsed = false;
            // Set default grace period end (30 seconds from now)
            this.gracePeriodEndsAt = LocalDateTime.now().plusSeconds(30);
        }
    }

    /**
     * Check if token is within grace period
     * @param now Current timestamp
     * @return true if grace period is active and not yet expired
     */
    public boolean isInGracePeriod(LocalDateTime now) {
        return gracePeriodEndsAt != null && now.isBefore(gracePeriodEndsAt);
    }

    /**
     * Atomically consume grace period
     * Thread-safe check-and-set operation
     * 
     * @param now Current timestamp
     * @return true if successfully consumed, false if already used or expired
     */
    public boolean consumeGracePeriod(LocalDateTime now) {
        if (gracePeriodEndsAt == null || now.isAfter(gracePeriodEndsAt)) {
            return false;  // No grace period or expired
        }
        if (graceUsed) {
            return false;  // Already consumed
        }
        graceUsed = true;
        return true;
    }

    /**
     * Set revocation with frontend-friendly error code
     * @param reason Internal reason code
     * @param messageCode Frontend error code (for user messages)
     */
    public void revokeWithReason(String reason, String messageCode) {
        this.revoked = true;
        this.revokedAt = LocalDateTime.now();
        this.revokeReason = reason;
        this.revokeMessageCode = messageCode;
    }

    /**
     * Check if token can be used (not revoked or within grace period)
     * @param now Current timestamp
     * @return true if token is valid for use
     */
    public boolean canBeUsed(LocalDateTime now) {
        if (!revoked) {
            return true;
        }
        // Revoked tokens can be used once during grace period
        return isInGracePeriod(now) && !graceUsed;
    }

    @Override
    public String toString() {
        return "RefreshToken{" +
                "id=" + id +
                ", userId=" + userId +
                ", sessionId=" + sessionId +
                ", deviceInfo=" + deviceInfo +
                ", revoked=" + revoked +
                ", tokenFormat=" + tokenFormat +
                '}';
    }
}
