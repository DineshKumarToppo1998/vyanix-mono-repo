package in.vyanix.webservice.controller;

import in.vyanix.webservice.dto.*;
import in.vyanix.webservice.entity.RefreshToken;
import in.vyanix.webservice.security.SecurityUtils;
import in.vyanix.webservice.service.AuthService;
import in.vyanix.webservice.service.JwtTokenProvider;
import in.vyanix.webservice.service.RefreshTokenService;
import in.vyanix.webservice.service.TokenBlocklistService;
import in.vyanix.webservice.service.exception.UnauthorizedException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Authentication controller with refresh token support.
 * 
 * Endpoints:
 * - POST /auth/register - Register new user
 * - POST /auth/login - Login (returns access token, sets refresh cookie)
 * - POST /auth/refresh - Refresh access token (reads refresh cookie)
 * - POST /auth/logout - Logout (revokes refresh token, clears cookie)
 * - POST /auth/logout/all - Logout from all devices
 * - GET /auth/sessions - Get active sessions
 * - DELETE /auth/sessions/{sessionId} - Revoke specific session
 * - GET /auth/me - Get current user
 */
@RestController
@RequestMapping({"/api/auth", "/api/v1/auth"})
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final RefreshTokenService refreshTokenService;
    private final JwtTokenProvider jwtTokenProvider;
    private final TokenBlocklistService tokenBlocklistService;
    private final SecurityUtils securityUtils;

    /**
     * Register a new user
     */
    @PostMapping("/register")
    public ResponseEntity<ApiResponse<UserResponse>> register(
            @Valid @RequestBody UserRegisterRequest request,
            HttpServletRequest httpRequest) {
        
        UserResponse user = authService.register(request.email(), request.password(),
                request.firstName(), request.lastName(), request.phone());
        
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(user));
    }

    /**
     * Login with email and password
     * Returns access token in body, sets refresh token in HTTP-only cookie
     */
    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthLoginResponse>> login(
            @Valid @RequestBody LoginRequest request,
            HttpServletRequest httpRequest) {
        
        AuthLoginResponse result = authService.login(
                request.email(), request.password(), httpRequest);
        
        // Set refresh token in HTTP-only cookie
        ResponseCookie refreshCookie = createRefreshCookie(result.getRefreshToken());
        
        // Block the old access token if re-login (optional security measure)
        // tokenBlocklistService.blockToken(...);
        
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, refreshCookie.toString())
                .body(ApiResponse.success(result));
    }

    /**
     * Refresh access token using refresh token from cookie
     */
    @PostMapping("/refresh")
    public ResponseEntity<ApiResponse<AuthRefreshResponse>> refreshAccessToken(
            @CookieValue(name = "refresh_token", required = false) String refreshTokenValue,
            HttpServletRequest httpRequest) {
        
        if (refreshTokenValue == null || refreshTokenValue.isBlank()) {
            throw new UnauthorizedException("Refresh token not provided", "TOKEN_MISSING");
        }

        try {
            // Validate and rotate token (includes theft detection)
            RefreshToken oldToken = refreshTokenService.validateRefreshToken(refreshTokenValue);
            String ipAddress = getClientIp(httpRequest);
            String userAgent = httpRequest.getHeader("User-Agent");

            // Rotate token (revoke old, create new with sliding expiration)
            RefreshToken newToken = refreshTokenService.rotateRefreshToken(
                    oldToken, ipAddress, userAgent);

            // Generate new access token
            String newAccessToken = jwtTokenProvider.generateAccessTokenFromId(oldToken.getUserId());

            AuthRefreshResponse response = AuthRefreshResponse.builder()
                    .accessToken(newAccessToken)
                    .tokenType("Bearer")
                    .expiresIn(jwtTokenProvider.getJwtExpirationMs() / 1000)
                    .build();

            // Set new refresh token cookie
            ResponseCookie refreshCookie = createRefreshCookie(newToken.getRawToken());

            return ResponseEntity.ok()
                    .header(HttpHeaders.SET_COOKIE, refreshCookie.toString())
                    .body(ApiResponse.success(response));

        } catch (UnauthorizedException e) {
            // Re-throw with appropriate error code
            throw e;
        }
    }

    /**
     * Logout - revoke refresh token and clear cookie
     */
    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<Void>> logout(
            @CookieValue(name = "refresh_token", required = false) String refreshTokenValue,
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            HttpServletResponse httpResponse) {
        
        // Block the access token immediately (if blocklist enabled)
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String accessToken = authHeader.substring(7);
            String tokenId = jwtTokenProvider.getTokenId(accessToken);
            long remainingTtl = jwtTokenProvider.getRemainingTtlSeconds(accessToken);
            if (tokenId != null && remainingTtl > 0) {
                tokenBlocklistService.blockToken(tokenId, remainingTtl);
            }
        }

        // Revoke refresh token if provided
        if (refreshTokenValue != null && !refreshTokenValue.isBlank()) {
            refreshTokenService.revokeRefreshToken(refreshTokenValue);
        }

        // Clear refresh cookie
        ResponseCookie refreshCookie = clearRefreshCookie();

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, refreshCookie.toString())
                .body(ApiResponse.success(null));
    }

    /**
     * Logout from all devices - revoke all refresh tokens
     */
    @PostMapping("/logout/all")
    public ResponseEntity<ApiResponse<Void>> logoutFromAllDevices(
            @RequestHeader("Authorization") String authHeader) {
        
        // Get current user ID from JWT
        String token = authHeader.substring(7);
        UUID userId = UUID.fromString(jwtTokenProvider.getUserIdFromToken(token));

        // Revoke all sessions
        refreshTokenService.revokeAllUserTokens(userId);

        // Clear refresh cookie
        ResponseCookie refreshCookie = clearRefreshCookie();

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, refreshCookie.toString())
                .body(ApiResponse.success(null));
    }

    /**
     * Get active sessions for current user
     */
    @GetMapping("/sessions")
    public ResponseEntity<ApiResponse<List<SessionInfoResponse>>> getActiveSessions(
            @RequestHeader("Authorization") String authHeader) {
        
        String token = authHeader.substring(7);
        UUID userId = UUID.fromString(jwtTokenProvider.getUserIdFromToken(token));

        List<RefreshToken> sessions = refreshTokenService.getUserActiveSessions(userId);

        List<SessionInfoResponse> sessionInfos = sessions.stream()
                .map(tokenEntity -> SessionInfoResponse.builder()
                        .sessionId(tokenEntity.getSessionId())
                        .deviceInfo(tokenEntity.getDeviceInfo())
                        .ipAddress(tokenEntity.getIpAddress())
                        .userAgent(maskUserAgent(tokenEntity.getUserAgent()))
                        .createdAt(tokenEntity.getCreatedAt())
                        .lastUsedAt(tokenEntity.getLastUsedAt())
                        .expiresAt(tokenEntity.getExpiryDate())
                        .isCurrentSession(false)  // Would need comparison logic
                        .build())
                .collect(Collectors.toList());

        return ResponseEntity.ok(ApiResponse.success(sessionInfos));
    }

    /**
     * Revoke specific session
     */
    @DeleteMapping("/sessions/{sessionId}")
    public ResponseEntity<ApiResponse<Void>> revokeSession(
            @PathVariable String sessionId,
            @RequestHeader("Authorization") String authHeader) {
        
        String token = authHeader.substring(7);
        UUID userId = UUID.fromString(jwtTokenProvider.getUserIdFromToken(token));

        refreshTokenService.revokeSession(userId, sessionId);

        return ResponseEntity.ok(ApiResponse.success(null));
    }

    /**
     * Get current user information
     */
    @GetMapping("/me")
    public ResponseEntity<ApiResponse<UserResponse>> getCurrentUser(
            @RequestHeader("Authorization") String authHeader) {
        
        String token = authHeader.substring(7);
        String userId = jwtTokenProvider.getUserIdFromToken(token);

        UserResponse user = authService.getCurrentUser(UUID.fromString(userId));
        return ResponseEntity.ok(ApiResponse.success(user));
    }

    // ============ Helper Methods ============

    /**
     * Create HTTP-only refresh token cookie
     */
    private ResponseCookie createRefreshCookie(String refreshTokenValue) {
        return ResponseCookie.from("refresh_token", refreshTokenValue)
                .httpOnly(true)
                .secure(true)  // HTTPS only
                .sameSite("Strict")
                .maxAge(jwtTokenProvider.getRefreshExpirationMs() / 1000)
                .path("/")
                .build();
    }

    /**
     * Clear refresh token cookie
     */
    private ResponseCookie clearRefreshCookie() {
        return ResponseCookie.from("refresh_token", "")
                .httpOnly(true)
                .secure(true)
                .sameSite("Strict")
                .maxAge(0)
                .path("/")
                .build();
    }

    /**
     * Extract client IP address
     */
    private String getClientIp(HttpServletRequest request) {
        String ip = request.getHeader("X-Forwarded-For");
        if (ip == null || ip.isBlank() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeader("X-Real-IP");
        }
        if (ip == null || ip.isBlank() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getRemoteAddr();
        }
        if (ip != null && ip.contains(",")) {
            ip = ip.split(",")[0].trim();
        }
        return ip;
    }

    /**
     * Mask user agent for privacy
     */
    private String maskUserAgent(String userAgent) {
        if (userAgent == null) return "Unknown";
        // Return only device type, not full UA string
        return refreshTokenService.extractDeviceInfo(userAgent);
    }
}
