package in.vyanix.webservice.dto;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

/**
 * Enumeration of revocation reasons with user-friendly error codes and messages.
 * 
 * Usage:
 * - revokeReason: Internal audit logging (not exposed to client)
 * - revokeMessageCode: Frontend error code for displaying user-friendly messages
 * - userMessage: Default message shown to user (frontend can customize)
 */
@Getter
@RequiredArgsConstructor
public enum RevokeReason {

    // ============ User-Initiated ============
    
    /**
     * User explicitly logged out
     */
    USER_REQUEST("USER_REQUEST", "USER_LOGOUT", "You have been logged out successfully"),
    
    /**
     * User logged out from all devices
     */
    USER_LOGOUT_ALL("USER_LOGOUT_ALL", "USER_LOGOUT_ALL", "You have been logged out from all devices"),
    
    /**
     * User manually revoked a specific session
     */
    USER_REVOKED_SESSION("USER_REVOKED_SESSION", "SESSION_REVOKED", "Session has been revoked"),

    // ============ Normal Operations ============
    
    /**
     * Token rotated normally (not an error)
     */
    ROTATION("ROTATION", null, null),
    
    /**
     * Session limit exceeded - oldest session evicted
     */
    SESSION_LIMIT_EXCEEDED("SESSION_LIMIT_EXCEEDED", "SESSION_LIMIT_EXCEEDED", 
            "You were signed out because you exceeded the maximum number of active devices (5)."),

    // ============ Security Events ============
    
    /**
     * Token reuse detected after grace period - possible theft
     */
    THEFT_DETECTED("THEFT_DETECTED", "SECURITY_THEFT_DETECTED", 
            "Your session was revoked due to suspicious activity. Please log in again."),
    
    /**
     * Response to detected theft - other sessions revoked
     */
    THEFT_RESPONSE("THEFT_RESPONSE", "SECURITY_THEFT_DETECTED", 
            "Your other sessions were revoked due to suspicious activity."),
    
    /**
     * Password was changed - all tokens invalidated
     */
    PASSWORD_CHANGE("PASSWORD_CHANGE", "PASSWORD_CHANGED", 
            "Your password was changed. Please log in again."),
    
    /**
     * Role/permissions were changed - all tokens invalidated
     */
    ROLE_CHANGE("ROLE_CHANGE", "PERMISSIONS_CHANGED", 
            "Your permissions have changed. Please log in again."),
    
    /**
     * Account was disabled - all tokens invalidated
     */
    ACCOUNT_DISABLED("ACCOUNT_DISABLED", "ACCOUNT_DISABLED", 
            "Your account has been disabled. Please contact support."),

    // ============ Expiration ============
    
    /**
     * Token expired naturally
     */
    EXPIRED("EXPIRED", "TOKEN_EXPIRED", "Your session has expired. Please log in again."),
    
    /**
     * Session expired due to inactivity
     */
    INACTIVITY("INACTIVITY", "SESSION_EXPIRED", 
            "Your session has expired due to inactivity. Please log in again."),
    
    /**
     * Session exceeded maximum lifetime
     */
    MAX_LIFETIME("MAX_LIFETIME", "SESSION_EXPIRED", 
            "Your session has exceeded the maximum lifetime. Please log in again."),
    
    /**
     * Token version outdated (password/role change)
     */
    VERSION_OUTDATED("VERSION_OUTDATED", "TOKEN_INVALIDATED", 
            "Your session is no longer valid. Please log in again.");

    /**
     * Internal reason code (for audit logging)
     */
    private final String reason;
    
    /**
     * Frontend error code (for displaying user-friendly messages)
     * Can be null for internal-only reasons (e.g., ROTATION)
     */
    private final String messageCode;
    
    /**
     * Default user-facing message
     * Can be null for internal-only reasons
     */
    private final String userMessage;

    /**
     * Check if this reason should be exposed to the user
     * @return true if there's a user-facing message
     */
    public boolean hasUserMessage() {
        return messageCode != null && userMessage != null;
    }

    /**
     * Check if this is a security-related revocation
     * @return true if theft or account security event
     */
    public boolean isSecurityRelated() {
        return this == THEFT_DETECTED || this == THEFT_RESPONSE || this == ACCOUNT_DISABLED;
    }

    /**
     * Check if this is a normal/expected revocation
     * @return true if user-initiated or normal operation
     */
    public boolean isNormal() {
        return this == USER_REQUEST || this == USER_LOGOUT_ALL || 
               this == ROTATION || this == EXPIRED;
    }
}
