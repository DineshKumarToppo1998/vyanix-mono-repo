package in.vyanix.webservice.service;

import in.vyanix.webservice.dto.RevokeReason;
import in.vyanix.webservice.entity.RefreshToken;
import in.vyanix.webservice.entity.User;
import in.vyanix.webservice.entity.UserRole;
import in.vyanix.webservice.repository.RefreshTokenRepository;
import in.vyanix.webservice.repository.UserRepository;
import in.vyanix.webservice.security.TokenHashUtil;
import in.vyanix.webservice.service.exception.TokenTheftException;
import in.vyanix.webservice.service.exception.UnauthorizedException;
import in.vyanix.webservice.service.UserService.UserAccountChangedEvent;
import in.vyanix.webservice.service.UserService.AccountChangeReason;
import jakarta.persistence.LockModeType;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.dao.PessimisticLockingFailureException;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

import java.time.Clock;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;

/**
 * Refresh token service with production-grade security features:
 * - SHA-256 token hashing
 * - Atomic grace window consumption (prevents race conditions)
 * - Token theft detection and response
 * - Sliding expiration with inactivity timeout
 * - Concurrent session limits
 * - Token rotation on every refresh
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class RefreshTokenService {

    private final RefreshTokenRepository refreshTokenRepository;
    private final JwtTokenProvider jwtTokenProvider;
    private final TokenHashUtil tokenHashUtil;
    private final UserRepository userRepository;  // For reading user during validation
    private final Clock clock;
    private final ApplicationEventPublisher eventPublisher;

    @Value("${app.security.max-concurrent-sessions:5}")
    private int maxConcurrentSessions;

    @Value("${app.security.grace-period-seconds:30}")
    private int gracePeriodSeconds;

    // ============ Token Creation ============

    /**
     * Create and persist a new refresh token with device tracking
     * Enforces concurrent session limit
     *
     * @param user User to create token for
     * @param ipAddress Client IP address
     * @param userAgent Client user agent
     * @param sessionId Session ID (generated if null)
     * @return RefreshToken entity with raw token value stored in transient field
     */
    @Transactional
    public RefreshToken createRefreshToken(
            User user,
            String ipAddress,
            String userAgent,
            String sessionId) {

        // Enforce concurrent session limit
        enforceSessionLimit(user);

        // Generate refresh token value (JWT format)
        String refreshTokenValue = jwtTokenProvider.generateRefreshTokenValue(user);
        
        // Hash the token BEFORE saving (never store raw token in DB)
        String tokenHash = tokenHashUtil.hashRefreshToken(refreshTokenValue);

        LocalDateTime now = LocalDateTime.now(clock);

        RefreshToken refreshToken = new RefreshToken();
        refreshToken.setUserId(user.getId());
        refreshToken.setTokenHash(tokenHash);  // Store HASH in database

        // Sliding expiration: start with refreshExpirationMs from now
        refreshToken.setExpiryDate(now.plus(
                jwtTokenProvider.getRefreshExpirationMs(), ChronoUnit.MILLIS));
        refreshToken.setCreatedAt(now);
        refreshToken.setLastUsedAt(now);

        // Set grace period (30 seconds from now for rotation)
        refreshToken.setGracePeriodEndsAt(now.plusSeconds(gracePeriodSeconds));
        refreshToken.setGraceUsed(false);

        refreshToken.setDeviceInfo(extractDeviceInfo(userAgent));
        refreshToken.setIpAddress(ipAddress);
        refreshToken.setUserAgent(userAgent);
        refreshToken.setSessionId(sessionId != null ? sessionId : UUID.randomUUID().toString());
        refreshToken.setTokenFormat(RefreshToken.TokenFormat.CURRENT);

        // Save to database - tokenHash MUST be set before this
        refreshTokenRepository.save(refreshToken);
        log.info("Created refresh token for user {} session {}", user.getId(), refreshToken.getSessionId());

        // Store raw token in transient field (NOT persisted to DB)
        // This is returned to the caller and sent to the client
        refreshToken.setRawToken(refreshTokenValue);
        
        // DO NOT clear tokenHash - it must remain in the database!
        // The entity is returned but tokenHash is never exposed to clients
        
        return refreshToken;
    }

    /**
     * Enforce concurrent session limit
     * Revokes oldest session if limit exceeded
     */
    private void enforceSessionLimit(User user) {
        List<RefreshToken> activeSessions = refreshTokenRepository
                .findByUserIdAndRevokedFalseOrderByLastUsedAtAsc(user.getId());
        
        if (activeSessions.size() >= maxConcurrentSessions) {
            // Revoke oldest session with user-friendly error code
            RefreshToken oldestSession = activeSessions.get(0);
            
            oldestSession.revokeWithReason(
                RevokeReason.SESSION_LIMIT_EXCEEDED.getReason(),
                RevokeReason.SESSION_LIMIT_EXCEEDED.getMessageCode()
            );
            
            refreshTokenRepository.save(oldestSession);
            
            log.info("Revoked oldest session for user {} due to session limit (max {})", 
                    user.getId(), maxConcurrentSessions);
        }
    }

    // ============ Token Validation ============

    /**
     * Validate refresh token with atomic grace window handling
     * 
     * Uses pessimistic locking to prevent race conditions during:
     * - Grace period consumption
     * - Token rotation
     * - Theft detection
     * 
     * @param refreshTokenValue Raw refresh token value
     * @return Valid RefreshToken entity
     * @throws UnauthorizedException if token is invalid, expired, or revoked
     * @throws TokenTheftException if token reuse is detected (CRITICAL)
     */
    @Transactional
    public RefreshToken validateRefreshToken(String refreshTokenValue) {
        try {
            // Step 1: Validate JWT structure and signature
            if (!jwtTokenProvider.validateRefreshTokenStructure(refreshTokenValue)) {
                throw new UnauthorizedException("Invalid refresh token", "TOKEN_INVALID");
            }

            // Step 2: Extract claims for version check
            var claims = jwtTokenProvider.parseToken(refreshTokenValue);
            String userId = claims.getSubject();
            Integer tokenVersion = jwtTokenProvider.getTokenVersionFromToken(refreshTokenValue);

            // Step 3: Lookup token in database with pessimistic lock
            String tokenHash = tokenHashUtil.hashRefreshToken(refreshTokenValue);
            LocalDateTime now = LocalDateTime.now(clock);

            RefreshToken refreshToken = refreshTokenRepository
                    .findByTokenHashWithLock(tokenHash)  // ← PESSIMISTIC WRITE LOCK
                    .orElseThrow(() -> new UnauthorizedException("Refresh token not found", "TOKEN_NOT_FOUND"));

            // Step 4: Check token version against user's current version
            User user = userRepository.findById(UUID.fromString(userId))
                    .orElseThrow(() -> new UnauthorizedException("User not found", "USER_NOT_FOUND"));

            if (user.getTokenVersion() != null && tokenVersion < user.getTokenVersion()) {
                throw new UnauthorizedException(
                    "Token version outdated (password/role changed)",
                    "TOKEN_INVALIDATED"
                );
            }

            // Step 5: TRANSPARENT MIGRATION - Legacy token → Current format
            if (refreshToken.isLegacyToken()) {
                log.info("Migrating legacy refresh token to current format: userId={}", 
                        refreshToken.getUserId());
                
                refreshToken.migrateToCurrentFormat();
                refreshToken.setTokenHash(tokenHash);  // Ensure hash is stored
                refreshTokenRepository.save(refreshToken);
            }

            // Step 6: Check if token is revoked
            if (refreshToken.isRevoked()) {
                // ATOMIC: Try to consume grace period (thread-safe)
                boolean graceConsumed = refreshToken.consumeGracePeriod(now);
                
                if (graceConsumed) {
                    log.info("Grace period consumed for token: userId={}, sessionId={}",
                            refreshToken.getUserId(), refreshToken.getSessionId());
                    
                    // Persist graceUsed = true immediately
                    refreshTokenRepository.save(refreshToken);
                    
                    // Allow this request (last time for this token)
                    return refreshToken;
                }

                // Grace period expired or already used = THEFT DETECTED
                log.error("CRITICAL: Revoked token reused outside grace period - theft detected! userId={}, sessionId={}",
                        refreshToken.getUserId(), refreshToken.getSessionId());
                
                refreshToken.setTheftDetected(true);
                refreshToken.setTheftDetectedAt(now);
                refreshToken.revokeWithReason(
                    RevokeReason.THEFT_DETECTED.getReason(),
                    RevokeReason.THEFT_DETECTED.getMessageCode()
                );
                refreshTokenRepository.save(refreshToken);

                // CRITICAL: Revoke ALL user sessions immediately
                revokeAllUserSessionsForTheft(refreshToken.getUserId(), refreshToken.getSessionId());
                
                throw new TokenTheftException(
                    "Refresh token reuse detected - all sessions revoked",
                    refreshToken.getSessionId(),
                    true
                );
            }

            // Step 7: Check expiration (sliding window)
            if (refreshToken.getExpiryDate().isBefore(now)) {
                refreshToken.revokeWithReason(
                    RevokeReason.EXPIRED.getReason(),
                    RevokeReason.EXPIRED.getMessageCode()
                );
                refreshTokenRepository.save(refreshToken);
                throw new UnauthorizedException("Refresh token expired", "TOKEN_EXPIRED");
            }

            // Step 8: Check inactivity timeout
            if (refreshToken.getLastUsedAt() != null) {
                long inactivityMs = ChronoUnit.MILLIS.between(refreshToken.getLastUsedAt(), now);
                if (inactivityMs > jwtTokenProvider.getRefreshInactivityTimeoutMs()) {
                    refreshToken.revokeWithReason(
                        RevokeReason.INACTIVITY.getReason(),
                        RevokeReason.INACTIVITY.getMessageCode()
                    );
                    refreshTokenRepository.save(refreshToken);
                    throw new UnauthorizedException("Session expired due to inactivity", "SESSION_EXPIRED");
                }
            }

            // Step 9: Check max lifetime
            long lifetimeMs = ChronoUnit.MILLIS.between(refreshToken.getCreatedAt(), now);
            if (lifetimeMs > jwtTokenProvider.getRefreshMaxLifetimeMs()) {
                refreshToken.revokeWithReason(
                    RevokeReason.MAX_LIFETIME.getReason(),
                    RevokeReason.MAX_LIFETIME.getMessageCode()
                );
                refreshTokenRepository.save(refreshToken);
                throw new UnauthorizedException("Session exceeded maximum lifetime", "SESSION_EXPIRED");
            }

            return refreshToken;

        } catch (PessimisticLockingFailureException e) {
            log.warn("Database lock contention on refresh token validation", e);
            throw new UnauthorizedException("Token validation failed - please try again", "VALIDATION_ERROR");
        }
    }

    // ============ Token Rotation ============

    /**
     * Rotate refresh token with sliding expiration
     * 
     * Process:
     * 1. Revoke old token with grace period (allows race condition handling)
     * 2. Create new token with extended expiry
     * 3. Maintain session continuity (same sessionId)
     * 4. Link old token to new one (audit trail)
     * 
     * @param oldToken The current refresh token being rotated
     * @param ipAddress Current request IP address
     * @param userAgent Current request user agent
     * @return New RefreshToken entity with raw token value
     */
    @Transactional
    public RefreshToken rotateRefreshToken(
            RefreshToken oldToken,
            String ipAddress,
            String userAgent) {

        UUID userId = oldToken.getUserId();
        LocalDateTime now = LocalDateTime.now(clock);

        // Revoke old token with grace period (not immediate theft detection)
        oldToken.setRevoked(true);
        oldToken.setRevokedAt(now);
        oldToken.setRevokeReason(RevokeReason.ROTATION.getReason());
        oldToken.setRevokeMessageCode(null);  // No error for normal rotation
        oldToken.setGracePeriodEndsAt(now.plusSeconds(gracePeriodSeconds));  // Grace window
        oldToken.setGraceUsed(false);  // Reset for grace period consumption

        // Create new token with SLIDING expiration
        String newRefreshTokenValue = jwtTokenProvider.generateRefreshTokenValueFromId(userId);
        String newTokenHash = tokenHashUtil.hashRefreshToken(newRefreshTokenValue);

        RefreshToken newToken = new RefreshToken();
        newToken.setUserId(userId);
        newToken.setTokenHash(newTokenHash);  // Store HASH in database

        // Sliding window: extend expiry from NOW (not from old expiry)
        newToken.setExpiryDate(now.plus(
                jwtTokenProvider.getRefreshExpirationMs(), ChronoUnit.MILLIS));
        newToken.setCreatedAt(oldToken.getCreatedAt());  // Maintain original creation for max lifetime
        newToken.setLastUsedAt(now);  // Update last used
        newToken.setGracePeriodEndsAt(now.plusSeconds(gracePeriodSeconds));
        newToken.setGraceUsed(false);

        newToken.setDeviceInfo(extractDeviceInfo(userAgent));
        newToken.setIpAddress(ipAddress);
        newToken.setUserAgent(userAgent);
        newToken.setSessionId(oldToken.getSessionId());  // Maintain session continuity
        newToken.setTokenFormat(RefreshToken.TokenFormat.CURRENT);

        // Link old token to new one for audit trail
        oldToken.setReplacedByTokenHash(newTokenHash);

        // Save both tokens - tokenHash MUST be set before saving
        refreshTokenRepository.save(oldToken);
        refreshTokenRepository.save(newToken);

        log.info("Rotated refresh token for user {} session {}", userId, oldToken.getSessionId());

        // Store raw token in transient field (NOT persisted to DB)
        newToken.setRawToken(newRefreshTokenValue);
        
        // DO NOT clear tokenHash - it must remain in the database!
        return newToken;
    }

    // ============ Token Revocation ============

    /**
     * CRITICAL: Revoke all sessions due to token theft
     * 
     * Actions:
     * 1. Revoke all active refresh tokens
     * 2. Increment user's token version (invalidates all access tokens)
     * 3. Publish security event for audit
     */
    @Transactional
    public void revokeAllUserSessionsForTheft(UUID userId, String currentSessionId) {
        List<RefreshToken> tokens = refreshTokenRepository.findByUserIdAndRevokedFalse(userId);
        LocalDateTime now = LocalDateTime.now(clock);
        
        tokens.forEach(token -> {
            if (!token.getSessionId().equals(currentSessionId)) {
                token.revokeWithReason(
                    RevokeReason.THEFT_RESPONSE.getReason(),
                    RevokeReason.THEFT_RESPONSE.getMessageCode()
                );
                token.setRevokedAt(now);
            }
        });
        
        refreshTokenRepository.saveAll(tokens);

        // Increment user's token version to invalidate ALL tokens
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UnauthorizedException("User not found", "USER_NOT_FOUND"));
        Integer currentVersion = user.getTokenVersion() != null ? user.getTokenVersion() : 1;
        user.setTokenVersion(currentVersion + 1);
        userRepository.save(user);

        // Publish security event
        eventPublisher.publishEvent(new TokenTheftDetectedEvent(this, userId, currentSessionId));

        log.error("SECURITY ALERT: All sessions revoked for user {} due to token theft", userId);
    }

    /**
     * Normal logout: revoke single session
     */
    @Transactional
    public void revokeRefreshToken(String refreshTokenValue) {
        try {
            String tokenHash = tokenHashUtil.hashRefreshToken(refreshTokenValue);
            RefreshToken token = refreshTokenRepository
                    .findByTokenHash(tokenHash)
                    .orElse(null);

            if (token != null && !token.isRevoked()) {
                token.revokeWithReason(
                    RevokeReason.USER_REQUEST.getReason(),
                    RevokeReason.USER_REQUEST.getMessageCode()
                );
                refreshTokenRepository.save(token);
                log.info("Revoked refresh token for user {}", token.getUserId());
            }
        } catch (Exception e) {
            log.warn("Failed to revoke refresh token", e);
        }
    }

    /**
     * Logout from all devices (user-initiated)
     */
    @Transactional
    public void revokeAllUserTokens(UUID userId) {
        List<RefreshToken> tokens = refreshTokenRepository.findByUserIdAndRevokedFalse(userId);
        LocalDateTime now = LocalDateTime.now(clock);
        
        tokens.forEach(token -> {
            token.revokeWithReason(
                RevokeReason.USER_LOGOUT_ALL.getReason(),
                RevokeReason.USER_LOGOUT_ALL.getMessageCode()
            );
            token.setRevokedAt(now);
        });
        
        refreshTokenRepository.saveAll(tokens);

        // Also increment token version
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UnauthorizedException("User not found", "USER_NOT_FOUND"));
        Integer currentVersion = user.getTokenVersion() != null ? user.getTokenVersion() : 1;
        user.setTokenVersion(currentVersion + 1);
        userRepository.save(user);

        log.info("Revoked all {} refresh tokens for user {}", tokens.size(), userId);
    }

    /**
     * Revoke specific session by ID
     */
    @Transactional
    public void revokeSession(UUID userId, String sessionId) {
        List<RefreshToken> tokens = refreshTokenRepository.findByUserIdAndRevokedFalse(userId);
        LocalDateTime now = LocalDateTime.now(clock);
        
        tokens.stream()
                .filter(t -> t.getSessionId().equals(sessionId))
                .forEach(token -> {
                    token.revokeWithReason(
                        RevokeReason.USER_REVOKED_SESSION.getReason(),
                        RevokeReason.USER_REVOKED_SESSION.getMessageCode()
                    );
                    token.setRevokedAt(now);
                });
        
        refreshTokenRepository.saveAll(tokens);
    }

    // ============ Session Management ============

    /**
     * Get active sessions for a user
     */
    @Transactional(readOnly = true)
    public List<RefreshToken> getUserActiveSessions(UUID userId) {
        return refreshTokenRepository.findByUserIdAndRevokedFalse(userId);
    }

    /**
     * Cleanup expired tokens (scheduled daily at 2 AM)
     */
    @Transactional
    @Scheduled(cron = "0 0 2 * * ?")
    public void cleanupExpiredTokens() {
        LocalDateTime cutoff = LocalDateTime.now(clock).minusDays(90);
        List<RefreshToken> expiredTokens = refreshTokenRepository.findAllByRevokedTrueAndRevokedAtBefore(cutoff);
        
        if (!expiredTokens.isEmpty()) {
            refreshTokenRepository.deleteAll(expiredTokens);
            log.info("Cleaned up {} expired/revoked refresh tokens", expiredTokens.size());
        }
    }

    // ============ Utilities ============

    /**
     * Extract device info from user agent string
     * Package-public for use by AuthController
     */
    public String extractDeviceInfo(String userAgent) {
        if (userAgent == null || userAgent.isBlank()) {
            return "Unknown";
        }

        if (userAgent.contains("Mobile")) {
            if (userAgent.contains("Android")) return "Mobile (Android)";
            if (userAgent.contains("iPhone")) return "Mobile (iOS)";
            return "Mobile";
        }
        if (userAgent.contains("Tablet")) return "Tablet";
        if (userAgent.contains("Chrome")) return "Desktop (Chrome)";
        if (userAgent.contains("Firefox")) return "Desktop (Firefox)";
        if (userAgent.contains("Safari")) return "Desktop (Safari)";
        if (userAgent.contains("Edg")) return "Desktop (Edge)";

        return "Desktop";
    }

    // ============ Event Listeners ============

    /**
     * Handle user role/account change events
     * Revokes all refresh tokens and increments token version
     * 
     * Uses TransactionPhase.AFTER_COMMIT to ensure token invalidation
     * happens after the user change is committed
     */
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void handleUserAccountChanged(UserAccountChangedEvent event) {
        log.info("Handling user account change event: userId={}, reason={}", event.getUserId(), event.getReason());

        try {
            UUID userId = event.getUserId();
            LocalDateTime now = LocalDateTime.now(clock);

            // Revoke all active refresh tokens for this user
            List<RefreshToken> tokens = refreshTokenRepository.findByUserIdAndRevokedFalse(userId);
            tokens.forEach(token -> {
                token.revokeWithReason(
                    RevokeReason.ROLE_CHANGE.getReason(),
                    RevokeReason.ROLE_CHANGE.getMessageCode()
                );
                token.setRevokedAt(now);
            });

            if (!tokens.isEmpty()) {
                refreshTokenRepository.saveAll(tokens);
                log.info("Revoked {} refresh tokens for user {} due to {}", tokens.size(), userId, event.getReason());
            }

            // Increment user's token version to invalidate all access tokens
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new UnauthorizedException("User not found", "USER_NOT_FOUND"));
            Integer currentVersion = user.getTokenVersion() != null ? user.getTokenVersion() : 1;
            user.setTokenVersion(currentVersion + 1);
            userRepository.save(user);

            log.info("Incremented token version for user {} to {}", userId, user.getTokenVersion());
        } catch (UnauthorizedException e) {
            log.error("Failed to revoke tokens for user {} after account change: {}",
                    event.getUserId(), e.getMessage(), e);
        }
    }

    // ============ Event Classes ============

    /**
     * Event published when token theft is detected
     */
    public static class TokenTheftDetectedEvent {
        private final Object source;
        private final UUID userId;
        private final String sessionId;

        public TokenTheftDetectedEvent(Object source, UUID userId, String sessionId) {
            this.source = source;
            this.userId = userId;
            this.sessionId = sessionId;
        }

        public UUID getUserId() { return userId; }
        public String getSessionId() { return sessionId; }
    }
}
