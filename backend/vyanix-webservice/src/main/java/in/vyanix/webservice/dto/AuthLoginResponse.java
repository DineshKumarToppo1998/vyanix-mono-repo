package in.vyanix.webservice.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Login response with access token and user information.
 * Refresh token is set in HTTP-only cookie (not included in response body for security).
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuthLoginResponse {
    
    /**
     * Access token (JWT) - stored in memory by frontend
     * Short-lived (15 minutes)
     */
    private String accessToken;
    
    /**
     * Token type (always "Bearer")
     */
    @Builder.Default
    private String tokenType = "Bearer";
    
    /**
     * Access token expiration time in seconds
     */
    private long expiresIn;
    
    /**
     * User information
     */
    private UserResponse user;
    
    /**
     * Refresh token - ONLY included on initial login
     * Will be set in HTTP-only cookie by controller
     * Frontend should NOT store this - it's managed automatically
     */
    private String refreshToken;
}
