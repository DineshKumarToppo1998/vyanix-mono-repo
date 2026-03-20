package in.vyanix.webservice.service;

import in.vyanix.webservice.entity.User;
import in.vyanix.webservice.entity.UserRole;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.UUID;

/**
 * JWT token provider with production-grade security features:
 * - Separate access and refresh token generation
 * - Token versioning for bulk invalidation
 * - Redis blocklist support for immediate revocation
 * - Configurable expiration (sliding window for refresh tokens)
 */
@Component
@Slf4j
public class JwtTokenProvider {

    @Value("${jwt.secret}")
    private String jwtSecret;

    @Value("${jwt.expiration-ms:900000}")  // 15 minutes default
    private long jwtExpirationMs;

    @Value("${jwt.refresh-expiration-ms:604800000}")  // 7 days default
    private long refreshExpirationMs;

    @Value("${jwt.refresh-inactivity-timeout-ms:2592000000}")  // 30 days default
    private long refreshInactivityTimeoutMs;

    @Value("${jwt.refresh-max-lifetime-ms:7776000000}")  // 90 days default
    private long refreshMaxLifetimeMs;

    @Value("${app.security.enable-token-blocklist:true}")
    private boolean blocklistEnabled;

    private SecretKey getSigningKey() {
        return Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));
    }

    @PostConstruct
    void validateConfiguration() {
        if (jwtSecret == null || jwtSecret.isBlank()) {
            throw new IllegalStateException("JWT secret is required. Set JWT_SECRET in the environment.");
        }

        if (jwtSecret.getBytes(StandardCharsets.UTF_8).length < 32) {
            throw new IllegalStateException("JWT secret must be at least 32 bytes long.");
        }

        log.info("JWT configured: Access token {}ms, Refresh token {}ms (sliding), Max lifetime {}ms",
                jwtExpirationMs, refreshExpirationMs, refreshMaxLifetimeMs);
        log.info("Token blocklist: {}", blocklistEnabled ? "ENABLED" : "DISABLED");
    }

    // ============ Access Token Methods ============

    /**
     * Generate access token with user claims and token version
     * Access tokens are short-lived (15 minutes) and used for API authentication
     */
    public String generateAccessToken(User user) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + jwtExpirationMs);
        int tokenVersion = user.getTokenVersion() != null ? user.getTokenVersion() : 1;

        return Jwts.builder()
                .setSubject(user.getId().toString())
                .setId(UUID.randomUUID().toString())  // Unique token ID for blocklist
                .claim("email", user.getEmail())
                .claim("firstName", user.getFirstName())
                .claim("lastName", user.getLastName())
                .claim("role", user.getRole() != null ? user.getRole().name() : UserRole.USER.name())
                .claim("type", "access")
                .claim("tokenVersion", tokenVersion)
                .setIssuedAt(now)
                .setExpiration(expiryDate)
                .signWith(getSigningKey())
                .compact();
    }

    /**
     * Generate access token from user ID only (for token refresh)
     * Uses default token version 1 - will be validated against database
     */
    public String generateAccessTokenFromId(UUID userId) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + jwtExpirationMs);

        return Jwts.builder()
                .setSubject(userId.toString())
                .setId(UUID.randomUUID().toString())
                .claim("type", "access")
                .claim("tokenVersion", 1)  // Will be validated against DB
                .setIssuedAt(now)
                .setExpiration(expiryDate)
                .signWith(getSigningKey())
                .compact();
    }

    // ============ Refresh Token Methods ============

    /**
     * Generate refresh token value (JWT format)
     * Refresh tokens are long-lived and stored securely (HTTP-only cookie)
     * The raw token is returned once and never stored - only its hash is persisted
     */
    public String generateRefreshTokenValue(User user) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + refreshMaxLifetimeMs);
        int tokenVersion = user.getTokenVersion() != null ? user.getTokenVersion() : 1;

        return Jwts.builder()
                .setSubject(user.getId().toString())
                .setId(UUID.randomUUID().toString())  // Unique token ID
                .claim("type", "refresh")
                .claim("tokenVersion", tokenVersion)
                .setIssuedAt(now)
                .setExpiration(expiryDate)
                .signWith(getSigningKey())
                .compact();
    }

    /**
     * Generate refresh token value from user ID only (for token rotation)
     */
    public String generateRefreshTokenValueFromId(UUID userId) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + refreshMaxLifetimeMs);

        return Jwts.builder()
                .setSubject(userId.toString())
                .setId(UUID.randomUUID().toString())
                .claim("type", "refresh")
                .claim("tokenVersion", 1)  // Will be validated against DB
                .setIssuedAt(now)
                .setExpiration(expiryDate)
                .signWith(getSigningKey())
                .compact();
    }

    // ============ Validation Methods ============

    /**
     * Parse JWT token and extract claims
     */
    public Claims parseToken(String token) {
        return Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    /**
     * Extract user ID from token subject
     */
    public String getUserIdFromToken(String token) {
        return parseToken(token).getSubject();
    }

    /**
     * Extract user role from token claims
     */
    public String getUserRoleFromToken(String token) {
        return parseToken(token).get("role", String.class);
    }

    /**
     * Extract token version from claims
     */
    public Integer getTokenVersionFromToken(String token) {
        return parseToken(token).get("tokenVersion", Integer.class);
    }

    /**
     * Extract token type (access/refresh) from claims
     */
    public String getTokenType(String token) {
        return parseToken(token).get("type", String.class);
    }

    /**
     * Extract token ID (jti) from claims
     */
    public String getTokenId(String token) {
        return parseToken(token).getId();
    }

    /**
     * Validate access token with version check
     * @param token The access token to validate
     * @param currentUserTokenVersion User's current token version (from database)
     * @return true if token is valid and not revoked
     */
    public boolean validateAccessToken(String token, Integer currentUserTokenVersion) {
        try {
            Claims claims = parseToken(token);
            
            // Check expiration
            if (claims.getExpiration().before(new Date())) {
                log.debug("Access token expired");
                return false;
            }

            // Verify token type
            String tokenType = claims.get("type", String.class);
            if (!"access".equals(tokenType)) {
                log.debug("Invalid token type: {}", tokenType);
                return false;
            }

            // Verify token version (bulk invalidation check)
            Integer tokenVersion = claims.get("tokenVersion", Integer.class);
            if (currentUserTokenVersion != null && tokenVersion < currentUserTokenVersion) {
                log.debug("Token version outdated: {} < {}", tokenVersion, currentUserTokenVersion);
                return false;
            }

            return true;
        } catch (Exception e) {
            log.debug("Access token validation failed: {}", e.getMessage());
            return false;
        }
    }

    /**
     * Validate refresh token structure (JWT validity only)
     * Does not check database validity - use RefreshTokenService for that
     */
    public boolean validateRefreshTokenStructure(String token) {
        try {
            Claims claims = parseToken(token);
            
            // Verify token type
            if (!"refresh".equals(claims.get("type", String.class))) {
                return false;
            }

            // Check expiration
            if (claims.getExpiration().before(new Date())) {
                return false;
            }

            return true;
        } catch (Exception e) {
            return false;
        }
    }

    /**
     * Basic token validation (structure and signature only)
     */
    public boolean validateToken(String token) {
        try {
            Jwts.parser()
                    .verifyWith(getSigningKey())
                    .build()
                    .parseSignedClaims(token);
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    /**
     * Check if token is expired
     */
    public boolean isTokenExpired(String token) {
        try {
            Claims claims = parseToken(token);
            return claims.getExpiration().before(new Date());
        } catch (Exception e) {
            return true;
        }
    }

    // ============ Blocklist Methods ============

    /**
     * Get remaining TTL for a token in seconds
     * Used for blocklist expiration
     */
    public long getRemainingTtlSeconds(String token) {
        try {
            Claims claims = parseToken(token);
            long remainingMs = claims.getExpiration().getTime() - System.currentTimeMillis();
            return Math.max(0, remainingMs / 1000);
        } catch (Exception e) {
            return 0;
        }
    }

    // ============ Configuration Getters ============

    public long getJwtExpirationMs() {
        return jwtExpirationMs;
    }

    public long getRefreshExpirationMs() {
        return refreshExpirationMs;
    }

    public long getRefreshInactivityTimeoutMs() {
        return refreshInactivityTimeoutMs;
    }

    public long getRefreshMaxLifetimeMs() {
        return refreshMaxLifetimeMs;
    }

    public boolean isBlocklistEnabled() {
        return blocklistEnabled;
    }
}
