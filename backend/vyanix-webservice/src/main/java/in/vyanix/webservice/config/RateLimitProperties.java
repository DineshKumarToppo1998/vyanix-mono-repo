package in.vyanix.webservice.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * Rate limiting configuration properties.
 *
 * Default values:
 * - Per-IP: 10 requests/minute
 * - Per-User: 12 requests/minute + 3 burst tokens
 *
 * Burst tokens explanation:
 * - Allows handling simultaneous requests (e.g., multiple tabs opening)
 * - Burst capacity refills immediately (1 second)
 * - Base capacity refills gradually over the window
 */
@Data
@Component
@ConfigurationProperties(prefix = "app.ratelimit")
public class RateLimitProperties {

    /**
     * Per-IP rate limit: maximum requests per window
     * Prevents distributed attacks from a single IP
     */
    private int refreshPerIpLimit = 10;

    /**
     * Per-IP rate limit window in seconds
     */
    private int refreshPerIpWindow = 60;

    /**
     * Per-User rate limit: maximum requests per window
     * Legitimate users should never need more than ~10-12 refreshes/minute
     */
    private int refreshPerUserLimit = 12;

    /**
     * Per-User rate limit window in seconds
     */
    private int refreshPerUserWindow = 60;

    /**
     * Burst capacity for per-user rate limit
     * Allows temporary spikes (e.g., 3 tabs opening simultaneously)
     */
    private int refreshPerUserBurst = 3;

    /**
     * Enable rate limiting (for emergency disable)
     */
    private boolean enabled = true;
}
