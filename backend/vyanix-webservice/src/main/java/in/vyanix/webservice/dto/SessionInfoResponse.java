package in.vyanix.webservice.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * Session information response for session management UI.
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SessionInfoResponse {
    
    /**
     * Unique session identifier
     */
    private String sessionId;
    
    /**
     * Device information (e.g., "Desktop (Chrome)", "Mobile (iOS)")
     */
    private String deviceInfo;
    
    /**
     * IP address of the session
     */
    private String ipAddress;
    
    /**
     * User agent (masked for privacy)
     */
    private String userAgent;
    
    /**
     * Session creation timestamp
     */
    private LocalDateTime createdAt;
    
    /**
     * Last activity timestamp
     */
    private LocalDateTime lastUsedAt;
    
    /**
     * Session expiration timestamp
     */
    private LocalDateTime expiresAt;
    
    /**
     * Whether this is the current session
     */
    @Builder.Default
    private boolean isCurrentSession = false;
}
