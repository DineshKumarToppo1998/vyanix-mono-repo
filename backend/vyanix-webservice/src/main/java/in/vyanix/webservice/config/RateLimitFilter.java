package in.vyanix.webservice.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import in.vyanix.webservice.config.Bucket4jService.RateLimitCheck;
import in.vyanix.webservice.config.Bucket4jService.RateLimitExceeded;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Map;

/**
 * Rate limiting filter for /auth/refresh endpoint.
 *
 * Applies dual rate limits:
 * 1. Per-IP limit: 10 requests/minute (prevents distributed attacks)
 * 2. Per-User limit: 12 requests/minute + 3 burst (allows multi-tab scenarios)
 *
 * Response on rate limit exceeded:
 * - HTTP 429 Too Many Requests
 * - Retry-After header (seconds until retry)
 * - X-RateLimit-Limit header (configured limit)
 * - X-RateLimit-Window header (window size in seconds)
 * - JSON body with error details
 */
@RequiredArgsConstructor
@Slf4j
public class RateLimitFilter extends OncePerRequestFilter {

    private final RateLimitProperties properties;
    private final Bucket4jService bucket4jService;
    private final ObjectMapper objectMapper;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, 
                                     FilterChain filterChain) throws ServletException, IOException {
        
        String path = request.getRequestURI();
        
        // Only apply to refresh endpoint
        if (!path.matches(".*/api/(v\\d+/)?auth/refresh.*")) {
            filterChain.doFilter(request, response);
            return;
        }

        // Get client IP
        String ip = getClientIp(request);

        // Check IP-based rate limit first
        RateLimitCheck ipCheck = bucket4jService.checkIpLimit(
                ip,
                properties.getRefreshPerIpLimit(),
                properties.getRefreshPerIpWindow()
        );

        if (!ipCheck.isAllowed()) {
            log.warn("Rate limit exceeded for IP: {} ({} requests per {} seconds)", 
                    ip, ipCheck.getLimit(), ipCheck.getWindowSeconds());
            sendRateLimitResponse(response, ipCheck, "IP");
            return;
        }

        // Try to get user ID from refresh token for user-based rate limiting
        String refreshToken = extractRefreshToken(request);
        if (refreshToken != null) {
            try {
                // Parse token to get user ID (without full validation)
                // We only need the subject (user ID) for rate limiting
                String userId = extractUserIdFromToken(refreshToken);
                
                if (userId != null) {
                    // Check user-based rate limit with burst capacity
                    RateLimitCheck userCheck = bucket4jService.checkUserLimit(
                            userId,
                            properties.getRefreshPerUserLimit(),
                            properties.getRefreshPerUserWindow(),
                            properties.getRefreshPerUserBurst()
                    );

                    if (!userCheck.isAllowed()) {
                        log.warn("Rate limit exceeded for user: {} ({} requests per {} seconds + {} burst)", 
                                userId, userCheck.getLimit(), userCheck.getWindowSeconds(),
                                properties.getRefreshPerUserBurst());
                        sendRateLimitResponse(response, userCheck, "USER");
                        return;
                    }
                }
            } catch (Exception e) {
                // Token invalid, skip user rate limit (will fail auth anyway)
                log.debug("Could not extract user ID for rate limiting: {}", e.getMessage());
            }
        }

        filterChain.doFilter(request, response);
    }

    /**
     * Send rate limit exceeded response
     */
    private void sendRateLimitResponse(HttpServletResponse response, RateLimitCheck check, String limitType)
            throws IOException {
        
        RateLimitExceeded exceeded = (RateLimitExceeded) check;
        
        response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setHeader(HttpHeaders.RETRY_AFTER, exceeded.getRetryAfterSeconds().toString());
        response.setHeader("X-RateLimit-Limit", exceeded.getLimit().toString());
        response.setHeader("X-RateLimit-Window", exceeded.getWindowSeconds().toString());
        response.setHeader("X-RateLimit-Type", limitType);

        Map<String, Object> errorBody = Map.of(
                "success", false,
                "message", "Rate limit exceeded. Please try again later.",
                "code", "RATE_LIMIT_EXCEEDED",
                "retryAfterSeconds", exceeded.getRetryAfterSeconds(),
                "limit", exceeded.getLimit(),
                "windowSeconds", exceeded.getWindowSeconds(),
                "limitType", limitType
        );

        objectMapper.writeValue(response.getOutputStream(), errorBody);
    }

    /**
     * Extract refresh token from request
     */
    private String extractRefreshToken(HttpServletRequest request) {
        // Check Authorization header first
        String authHeader = request.getHeader("Authorization");
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            return authHeader.substring(7);
        }
        return null;
    }

    /**
     * Extract user ID from JWT token without full validation
     * Only used for rate limiting purposes
     */
    private String extractUserIdFromToken(String token) {
        try {
            // Simple JWT decoding (no signature verification needed for rate limiting)
            String[] parts = token.split("\\.");
            if (parts.length >= 2) {
                // Decode payload (base64url)
                String payload = new String(java.util.Base64.getUrlDecoder().decode(parts[1]));
                // Extract subject using simple JSON parsing
                int subStart = payload.indexOf("\"sub\"");
                if (subStart >= 0) {
                    int valueStart = payload.indexOf("\"", subStart + 5) + 1;
                    int valueEnd = payload.indexOf("\"", valueStart);
                    if (valueStart > 0 && valueEnd > valueStart) {
                        return payload.substring(valueStart, valueEnd);
                    }
                }
            }
        } catch (Exception e) {
            log.debug("Failed to extract user ID from token: {}", e.getMessage());
        }
        return null;
    }

    /**
     * Get client IP address from request
     * Handles X-Forwarded-For and X-Real-IP headers for proxied requests
     */
    private String getClientIp(HttpServletRequest request) {
        String ip = request.getHeader("X-Forwarded-For");
        if (ip == null || ip.isBlank() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeader("X-Real-IP");
        }
        if (ip == null || ip.isBlank() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getRemoteAddr();
        }
        // Handle multiple IPs in X-Forwarded-For (first is client IP)
        if (ip != null && ip.contains(",")) {
            ip = ip.split(",")[0].trim();
        }
        return ip;
    }
}
