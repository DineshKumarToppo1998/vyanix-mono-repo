package in.vyanix.webservice.repository;

import in.vyanix.webservice.entity.RefreshToken;
import in.vyanix.webservice.entity.RefreshToken.TokenFormat;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Repository for refresh tokens with support for:
 * - Pessimistic locking (prevents race conditions during validation)
 * - Token format queries (migration tracking)
 * - Session management queries
 */
@Repository
public interface RefreshTokenRepository extends JpaRepository<RefreshToken, UUID> {

    /**
     * Find token by hash with pessimistic WRITE lock
     * Used during validation to prevent race conditions
     * Locks the row until transaction completes
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT rt FROM RefreshToken rt WHERE rt.tokenHash = :tokenHash")
    Optional<RefreshToken> findByTokenHashWithLock(@Param("tokenHash") String tokenHash);

    /**
     * Find token by hash with pessimistic READ lock
     * Used for read-only validation scenarios
     */
    @Lock(LockModeType.PESSIMISTIC_READ)
    @Query("SELECT rt FROM RefreshToken rt WHERE rt.tokenHash = :tokenHash")
    Optional<RefreshToken> findByTokenHashWithReadLock(@Param("tokenHash") String tokenHash);

    /**
     * Find token by hash without locking (fast lookup)
     * Use only when concurrent modification is not a concern
     */
    Optional<RefreshToken> findByTokenHash(String tokenHash);

    /**
     * Find all active (non-revoked) tokens for a user
     * Ordered by last used (oldest first) for session limit enforcement
     */
    @Query("SELECT rt FROM RefreshToken rt WHERE rt.userId = :userId AND rt.revoked = false ORDER BY rt.lastUsedAt ASC")
    List<RefreshToken> findByUserIdAndRevokedFalseOrderByLastUsedAtAsc(@Param("userId") UUID userId);

    /**
     * Find all active tokens for a user (unordered)
     */
    List<RefreshToken> findByUserIdAndRevokedFalse(UUID userId);

    /**
     * Find all tokens for a user (including revoked)
     */
    List<RefreshToken> findByUserId(UUID userId);

    /**
     * Find tokens with theft detected for a user
     * Used for security monitoring and alerts
     */
    List<RefreshToken> findByUserIdAndTheftDetectedTrue(UUID userId);

    /**
     * Find active sessions by device info
     * Used for session management UI
     */
    List<RefreshToken> findByUserIdAndDeviceInfoContaining(UUID userId, String deviceInfo);

    /**
     * Find expired tokens for cleanup
     * Tokens that are revoked and past the cleanup cutoff date
     */
    @Query("SELECT rt FROM RefreshToken rt WHERE rt.revoked = true AND rt.revokedAt < :cutoffDate")
    List<RefreshToken> findAllByRevokedTrueAndRevokedAtBefore(@Param("cutoffDate") LocalDateTime cutoffDate);

    /**
     * Find legacy tokens for migration monitoring
     */
    List<RefreshToken> findByTokenFormat(TokenFormat tokenFormat);

    /**
     * Find legacy tokens created before a certain date
     * Used for cleanup after migration period
     */
    @Query("SELECT rt FROM RefreshToken rt WHERE rt.tokenFormat = :format AND rt.createdAt < :beforeDate")
    List<RefreshToken> findByTokenFormatAndCreatedAtBefore(@Param("format") TokenFormat format, 
                                                           @Param("beforeDate") LocalDateTime beforeDate);

    /**
     * Count tokens by format (migration monitoring)
     */
    long countByTokenFormat(TokenFormat tokenFormat);

    /**
     * Count active sessions for a user
     */
    long countByUserIdAndRevokedFalse(UUID userId);

    /**
     * Delete all tokens for a user
     * Used for account deletion
     */
    long deleteByUserId(UUID userId);

    /**
     * Delete revoked tokens for a user
     * Used for cleanup
     */
    long deleteByUserIdAndRevokedTrue(UUID userId);

    /**
     * Delete all revoked tokens
     * Used for global cleanup
     */
    long deleteAllByRevokedTrue();

    /**
     * Check if token hash exists
     */
    boolean existsByTokenHash(String tokenHash);

    /**
     * Find valid token (not revoked, not expired)
     * Used for quick validation
     */
    @Query("SELECT rt FROM RefreshToken rt WHERE rt.tokenHash = :tokenHash AND rt.revoked = false AND rt.expiryDate > :now")
    Optional<RefreshToken> findValidToken(@Param("tokenHash") String tokenHash, @Param("now") LocalDateTime now);

    /**
     * Find tokens expiring within a time window
     * Used for proactive cleanup or user notifications
     */
    @Query("SELECT rt FROM RefreshToken rt WHERE rt.expiryDate BETWEEN :now AND :expiryThreshold")
    List<RefreshToken> findTokensExpiringSoon(@Param("now") LocalDateTime now, 
                                               @Param("expiryThreshold") LocalDateTime expiryThreshold);

    /**
     * Find session by session ID
     * Used for session-specific operations
     */
    @Query("SELECT rt FROM RefreshToken rt WHERE rt.sessionId = :sessionId AND rt.revoked = false")
    List<RefreshToken> findBySessionIdAndRevokedFalse(@Param("sessionId") String sessionId);
}
