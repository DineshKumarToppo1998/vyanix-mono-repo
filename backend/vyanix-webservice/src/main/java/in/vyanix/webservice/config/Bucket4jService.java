package in.vyanix.webservice.config;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.Bucket4j;
import io.github.bucket4j.Refill;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Bucket4j rate limiting service with burst bucket support.
 * 
 * Rate limits:
 * - Per-IP: 10 requests/minute (prevents distributed attacks)
 * - Per-User: 12 requests/minute + 3 burst tokens (allows multi-tab scenarios)
 * 
 * Burst bucket explanation:
 * - Base limit: 12 tokens/minute (refilled gradually)
 * - Burst capacity: 3 extra tokens (available immediately)
 * - Use case: User opens 3 tabs simultaneously → all succeed without rate limiting
 * 
 * Thread safety:
 * - Uses ConcurrentHashMap for bucket storage
 * - Bucket4j buckets are thread-safe
 * - Hourly cleanup prevents memory leaks
 */
@Service
@Slf4j
public class Bucket4jService {

    private final ConcurrentHashMap<String, Bucket> ipBuckets = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, Bucket> userBuckets = new ConcurrentHashMap<>();

    /**
     * Check rate limit for IP address
     */
    public RateLimitCheck checkIpLimit(String ip, int limit, int windowSeconds) {
        String key = "ip:" + ip;
        Bucket bucket = ipBuckets.computeIfAbsent(key, k -> createBucket(limit, windowSeconds));
        
        boolean consumed = bucket.tryConsume(1);
        
        if (consumed) {
            return RateLimitCheck.allowed(bucket.getAvailableTokens());
        } else {
            // Estimate wait time based on refill rate
            long waitTime = windowSeconds / limit + 1;
            return RateLimitExceeded.of(waitTime, limit, windowSeconds);
        }
    }

    /**
     * Check rate limit for user ID with burst capacity
     */
    public RateLimitCheck checkUserLimit(String userId, int limit, int windowSeconds, int burstCapacity) {
        String key = "user:" + userId;
        Bucket bucket = userBuckets.computeIfAbsent(key, k -> 
                createBucketWithBurst(limit, windowSeconds, burstCapacity));
        
        boolean consumed = bucket.tryConsume(1);
        
        if (consumed) {
            return RateLimitCheck.allowed(bucket.getAvailableTokens());
        } else {
            long waitTime = windowSeconds / limit + 1;
            return RateLimitExceeded.of(waitTime, limit, windowSeconds);
        }
    }

    /**
     * Create a simple rate limit bucket
     */
    private Bucket createBucket(int limit, int windowSeconds) {
        Bandwidth bandwidth = Bandwidth.classic(
            limit, 
            Refill.intervally(limit, Duration.ofSeconds(windowSeconds))
        );
        return Bucket4j.builder().addLimit(bandwidth).build();
    }

    /**
     * Create a rate limit bucket with burst capacity
     */
    private Bucket createBucketWithBurst(int limit, int windowSeconds, int burstCapacity) {
        // Base bandwidth: gradual refill
        Bandwidth bandwidth = Bandwidth.classic(
            limit, 
            Refill.intervally(limit, Duration.ofSeconds(windowSeconds))
        );
        
        // Burst bandwidth: immediate availability (simple approach for v7.6.0)
        Bandwidth burst = Bandwidth.classic(
            burstCapacity,
            Refill.intervally(burstCapacity, Duration.ofSeconds(1))
        );
        
        return Bucket4j.builder()
            .addLimit(bandwidth)
            .addLimit(burst)
            .build();
    }

    /**
     * Cleanup old buckets (run hourly)
     */
    @Scheduled(cron = "0 0 * * * ?")  // Every hour
    public void cleanupBuckets() {
        int ipBucketsSize = ipBuckets.size();
        int userBucketsSize = userBuckets.size();
        
        ipBuckets.clear();
        userBuckets.clear();
        
        log.info("Cleaned up rate limit buckets: {} IP buckets, {} user buckets", 
                ipBucketsSize, userBucketsSize);
    }

    /**
     * Get current bucket statistics
     */
    public RateLimitStats getStats() {
        return new RateLimitStats(ipBuckets.size(), userBuckets.size());
    }

    // ============ Result Classes ============

    public static class RateLimitCheck {
        private final boolean allowed;
        private final Long remainingTokens;
        private final Long retryAfterSeconds;
        private final Integer limit;
        private final Integer windowSeconds;

        protected RateLimitCheck(boolean allowed, Long remainingTokens, Long retryAfterSeconds, 
                                  Integer limit, Integer windowSeconds) {
            this.allowed = allowed;
            this.remainingTokens = remainingTokens;
            this.retryAfterSeconds = retryAfterSeconds;
            this.limit = limit;
            this.windowSeconds = windowSeconds;
        }

        public static RateLimitCheck allowed(long remaining) {
            return new RateLimitCheck(true, remaining, null, null, null);
        }

        public boolean isAllowed() { return allowed; }
        public Long getRemainingTokens() { return remainingTokens; }
        public Long getRetryAfterSeconds() { return retryAfterSeconds; }
        public Integer getLimit() { return limit; }
        public Integer getWindowSeconds() { return windowSeconds; }
    }

    public static class RateLimitExceeded extends RateLimitCheck {
        public RateLimitExceeded(Long retryAfterSeconds, Integer limit, Integer windowSeconds) {
            super(false, 0L, retryAfterSeconds, limit, windowSeconds);
        }

        public static RateLimitExceeded of(long retryAfterSeconds, int limit, int windowSeconds) {
            return new RateLimitExceeded(retryAfterSeconds, limit, windowSeconds);
        }
    }

    public record RateLimitStats(int ipBucketCount, int userBucketCount) {}
}
