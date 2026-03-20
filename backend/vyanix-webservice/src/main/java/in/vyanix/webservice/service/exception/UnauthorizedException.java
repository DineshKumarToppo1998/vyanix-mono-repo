package in.vyanix.webservice.service.exception;

import lombok.Getter;

/**
 * Exception for authentication failures
 * @param message Error message
 * @param code Error code for frontend handling (e.g., "TOKEN_EXPIRED", "SECURITY_THEFT_DETECTED")
 */
@Getter
public class UnauthorizedException extends RuntimeException {
    
    private final String code;

    public UnauthorizedException(String message) {
        super(message);
        this.code = null;
    }

    public UnauthorizedException(String message, String code) {
        super(message);
        this.code = code;
    }

    public UnauthorizedException(String message, Throwable cause) {
        super(message, cause);
        this.code = null;
    }

    public UnauthorizedException(String message, String code, Throwable cause) {
        super(message, cause);
        this.code = code;
    }
}
