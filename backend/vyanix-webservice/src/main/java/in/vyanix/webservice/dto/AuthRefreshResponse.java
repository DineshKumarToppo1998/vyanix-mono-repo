package in.vyanix.webservice.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Refresh token response.
 * Returns new access token when refresh token is validated.
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuthRefreshResponse {
    
    /**
     * New access token (JWT)
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
}
