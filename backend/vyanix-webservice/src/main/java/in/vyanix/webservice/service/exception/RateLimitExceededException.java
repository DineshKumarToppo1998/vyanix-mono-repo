package in.vyanix.webservice.service.exception;

import lombok.Getter;

/**
 * Exception thrown when rate limit is exceeded.
 * 
 * Used for rate limiting on sensitive endpoints like /auth/refresh.
 * Includes metadata about the rate limit for client-side handling.
 */
@Getter
public class RateLimitExceededException extends RuntimeException {

    private final long retryAfterSeconds;
    private final int limit;
    private final int windowSeconds;
    private final String limitType;  // "IP" or "USER"

    public RateLimitExceededException(long retryAfterSeconds, int limit, int windowSeconds) {
        this(retryAfterSeconds, limit, windowSeconds, "IP");
    }

    public RateLimitExceededException(long retryAfterSeconds, int limit, int windowSeconds, String limitType) {
        super(String.format("Rate limit exceeded: %d requests per %d seconds. Retry after %d seconds.",
                limit, windowSeconds, retryAfterSeconds));
        this.retryAfterSeconds = retryAfterSeconds;
        this.limit = limit;
        this.windowSeconds = windowSeconds;
        this.limitType = limitType;
    }

    /**
     * Get retry-after timestamp (Unix epoch seconds)
     */
    public long getRetryAfterTimestamp() {
        return System.currentTimeMillis() / 1000 + retryAfterSeconds;
    }
}
