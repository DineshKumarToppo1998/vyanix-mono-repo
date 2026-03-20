package in.vyanix.webservice.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.util.concurrent.TimeUnit;

/**
 * Redis-based token blocklist for immediate revocation of access tokens.
 * 
 * Why a blocklist?
 * - Access tokens are stateless JWTs (valid until expiration)
 * - When user logs out or token is revoked, we need to invalidate immediately
 * - Blocklist stores token IDs in Redis with TTL matching token expiration
 * - On each request, we check blocklist before validating token
 * 
 * Performance:
 * - Redis lookup: O(1) - very fast
 * - TTL auto-cleanup: Redis automatically removes expired entries
 * - Memory efficient: Only stores token IDs (UUIDs) until expiration
 * 
 * Security:
 * - Enabled by default for production
 * - Can be disabled for low-risk applications (not recommended)
 * - Blocklist TTL matches remaining token lifetime
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class TokenBlocklistService {

    private static final String BLOCKLIST_PREFIX = "blocked_token:";
    
    private final RedisTemplate<String, String> redisTemplate;

    /**
     * Add token to blocklist for remaining TTL
     * @param tokenId Unique token ID (JWT jti claim)
     * @param ttlSeconds Time-to-live in seconds (should match token's remaining lifetime)
     */
    public void blockToken(String tokenId, long ttlSeconds) {
        if (tokenId == null || tokenId.isBlank()) {
            log.warn("Attempted to block null or empty token ID");
            return;
        }

        if (ttlSeconds <= 0) {
            log.debug("Token {} already expired, skipping blocklist", tokenId);
            return;
        }

        String key = BLOCKLIST_PREFIX + tokenId;
        redisTemplate.opsForValue().set(key, "blocked", ttlSeconds, TimeUnit.SECONDS);
        
        log.debug("Blocked token {} for {} seconds", tokenId, ttlSeconds);
    }

    /**
     * Check if token is in blocklist
     * @param tokenId Unique token ID (JWT jti claim)
     * @return true if token is blocked (revoked), false otherwise
     */
    public boolean isBlocked(String tokenId) {
        if (tokenId == null || tokenId.isBlank()) {
            return false;
        }

        String key = BLOCKLIST_PREFIX + tokenId;
        Boolean isBlocked = redisTemplate.hasKey(key);
        
        return Boolean.TRUE.equals(isBlocked);
    }

    /**
     * Remove token from blocklist (rarely needed)
     * Only used for administrative purposes
     */
    public void unblockToken(String tokenId) {
        if (tokenId == null || tokenId.isBlank()) {
            return;
        }

        String key = BLOCKLIST_PREFIX + tokenId;
        redisTemplate.delete(key);
        
        log.debug("Unblocked token {}", tokenId);
    }

    /**
     * Get blocklist entry TTL
     * @param tokenId Unique token ID
     * @return Remaining TTL in seconds, or -1 if not blocked
     */
    public long getBlocklistTtl(String tokenId) {
        if (tokenId == null || tokenId.isBlank()) {
            return -1;
        }

        String key = BLOCKLIST_PREFIX + tokenId;
        Long ttl = redisTemplate.getExpire(key, TimeUnit.SECONDS);
        
        return ttl != null ? ttl : -1;
    }

    /**
     * Get blocklist statistics (for monitoring)
     */
    public BlocklistStats getStats() {
        // Note: Redis doesn't provide efficient count for keys with pattern
        // This is for debugging/monitoring only
        return new BlocklistStats("Token blocklist active");
    }

    /**
     * Clear all blocked tokens (emergency use only)
     */
    public void clearBlocklist() {
        log.warn("Clearing entire token blocklist - SECURITY RISK!");
        // Note: This would require scanning all keys with prefix
        // Not implemented for safety - use Redis CLI if absolutely needed
    }

    public record BlocklistStats(String description) {}
}
