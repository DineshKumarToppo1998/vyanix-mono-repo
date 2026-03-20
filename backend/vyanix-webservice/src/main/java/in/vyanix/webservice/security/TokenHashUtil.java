package in.vyanix.webservice.security;

import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;

/**
 * Utility for hashing refresh tokens using SHA-256 with optional server-side pepper.
 * 
 * Why SHA-256 instead of BCrypt?
 * - BCrypt is intentionally slow (designed for passwords)
 * - Refresh tokens need fast database lookups (indexed queries)
 * - Security comes from token entropy (JWT with strong signing key)
 * - Pepper adds server-side secret (stored in environment, not database)
 * 
 * Security properties:
 * - Token hash is 64 hex characters (SHA-256 output)
 * - Pepper is concatenated before hashing (server-side secret)
 * - Constant-time comparison prevents timing attacks
 */
@Component
@Slf4j
public class TokenHashUtil {

    /**
     * Server-side pepper for additional security
     * Should be set via environment variable: REFRESH_TOKEN_PEPPER
     * Must be at least 32 characters for adequate security
     */
    @Value("${app.security.refresh-token-pepper:}")
    private String pepper;

    @PostConstruct
    void validatePepper() {
        if (pepper == null || pepper.isBlank()) {
            log.warn("REFRESH_TOKEN_PEPPER not configured. Running without pepper (reduced security). " +
                    "Set APP_SECURITY_REFRESH_TOKEN_PEPPER environment variable with at least 32 random characters.");
        } else if (pepper.length() < 32) {
            log.warn("REFRESH_TOKEN_PEPPER is less than 32 characters. " +
                    "For production, use at least 32 random characters.");
        } else {
            log.info("REFRESH_TOKEN_PEPPER configured ({} characters)", pepper.length());
        }
    }

    /**
     * Hash refresh token using SHA-256 with optional pepper
     * 
     * @param refreshToken The raw refresh token value (JWT string)
     * @return Hex-encoded SHA-256 hash (64 characters)
     */
    public String hashRefreshToken(String refreshToken) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            
            // Add pepper if configured
            String tokenWithPepper = refreshToken + (pepper != null ? pepper : "");
            byte[] tokenBytes = tokenWithPepper.getBytes(StandardCharsets.UTF_8);
            byte[] hashBytes = digest.digest(tokenBytes);
            
            // Convert to hex string (64 characters)
            return bytesToHex(hashBytes);
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 algorithm not available", e);
        }
    }

    /**
     * Verify refresh token matches stored hash
     * Uses constant-time comparison to prevent timing attacks
     * 
     * @param refreshToken The raw refresh token value
     * @param storedHash The hash stored in database
     * @return true if token matches hash, false otherwise
     */
    public boolean verifyRefreshToken(String refreshToken, String storedHash) {
        if (storedHash == null || storedHash.length() != 64) {
            return false;  // Invalid hash format
        }
        
        String computedHash = hashRefreshToken(refreshToken);
        
        // Constant-time comparison (prevents timing attacks)
        return MessageDigest.isEqual(
            computedHash.getBytes(StandardCharsets.UTF_8),
            storedHash.getBytes(StandardCharsets.UTF_8)
        );
    }

    /**
     * Convert byte array to hex string
     * 
     * @param bytes Byte array to convert
     * @return Hex string (lowercase)
     */
    private String bytesToHex(byte[] bytes) {
        StringBuilder hexString = new StringBuilder(bytes.length * 2);
        for (byte b : bytes) {
            String hex = Integer.toHexString(0xff & b);
            if (hex.length() == 1) {
                hexString.append('0');  // Pad with leading zero
            }
            hexString.append(hex);
        }
        return hexString.toString();
    }

    /**
     * Verify a hash format (64 hex characters)
     * 
     * @param hash Hash string to validate
     * @return true if valid SHA-256 hex format
     */
    public boolean isValidHashFormat(String hash) {
        if (hash == null || hash.length() != 64) {
            return false;
        }
        return hash.matches("^[0-9a-fA-F]{64}$");
    }
}
