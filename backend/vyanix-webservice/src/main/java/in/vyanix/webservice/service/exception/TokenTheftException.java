package in.vyanix.webservice.service.exception;

import lombok.Getter;

/**
 * Exception thrown when token theft is detected.
 * 
 * This occurs when a revoked refresh token is reused outside the grace period,
 * indicating a potential security breach (stolen token being used by an attacker).
 * 
 * When this exception is thrown:
 * - All user sessions are immediately revoked
 * - Token version is incremented (invalidates all access tokens)
 * - Security event is logged and published
 * - User must re-authenticate
 */
@Getter
public class TokenTheftException extends UnauthorizedException {

    private final String sessionId;
    private final boolean allSessionsRevoked;

    public TokenTheftException(String message) {
        super(message, "SECURITY_THEFT_DETECTED");
        this.sessionId = null;
        this.allSessionsRevoked = false;
    }

    public TokenTheftException(String message, String sessionId) {
        super(message, "SECURITY_THEFT_DETECTED");
        this.sessionId = sessionId;
        this.allSessionsRevoked = false;
    }

    public TokenTheftException(String message, String sessionId, boolean allSessionsRevoked) {
        super(message, "SECURITY_THEFT_DETECTED");
        this.sessionId = sessionId;
        this.allSessionsRevoked = allSessionsRevoked;
    }
}
