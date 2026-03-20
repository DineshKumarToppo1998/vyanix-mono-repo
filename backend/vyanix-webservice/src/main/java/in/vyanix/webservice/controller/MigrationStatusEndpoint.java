package in.vyanix.webservice.controller;

import in.vyanix.webservice.service.LegacyTokenCleanupTask;
import in.vyanix.webservice.service.LegacyTokenCleanupTask.MigrationStatus;
import in.vyanix.webservice.service.TokenBlocklistService;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.actuate.endpoint.web.annotation.RestControllerEndpoint;
import org.springframework.stereotype.Component;
import org.springframework.web.bind.annotation.GetMapping;

import java.util.Map;

/**
 * Actuator endpoint for monitoring token migration status.
 * 
 * Endpoints:
 * - GET /actuator/migration/refresh-tokens - Refresh token migration status
 * - GET /actuator/migration/stats - Overall migration statistics
 * 
 * Access:
 * - Only enabled in non-production profiles
 * - Requires actuator access (configure via management.endpoints.web.exposure.include)
 * 
 * Example response:
 * {
 *   "refreshTokens": {
 *     "totalTokens": 1000,
 *     "legacyTokens": 50,
 *     "currentTokens": 950,
 *     "migrationPercentage": 95.0,
 *     "migrationComplete": false,
 *     "cleanupEnabled": false
 *   },
 *   "blocklist": {
 *     "enabled": true,
 *     "description": "Token blocklist active"
 *   }
 * }
 */
@Component
@RestControllerEndpoint(id = "migration")
@RequiredArgsConstructor
public class MigrationStatusEndpoint {

    private final LegacyTokenCleanupTask legacyTokenCleanupTask;
    private final TokenBlocklistService tokenBlocklistService;

    /**
     * Get refresh token migration status
     */
    @GetMapping("/refresh-tokens")
    public Map<String, Object> getRefreshTokenMigrationStatus() {
        MigrationStatus status = legacyTokenCleanupTask.getMigrationStatus();
        
        return Map.of(
                "totalTokens", status.totalTokens(),
                "legacyTokens", status.legacyTokens(),
                "currentTokens", status.currentTokens(),
                "migrationPercentage", status.migrationPercentage(),
                "migrationComplete", status.migrationComplete(),
                "cleanupEnabled", status.cleanupEnabled()
        );
    }

    /**
     * Get overall migration statistics
     */
    @GetMapping("/stats")
    public Map<String, Object> getMigrationStats() {
        MigrationStatus refreshStatus = legacyTokenCleanupTask.getMigrationStatus();
        TokenBlocklistService.BlocklistStats blocklistStats = tokenBlocklistService.getStats();
        
        return Map.of(
                "refreshTokens", Map.of(
                        "totalTokens", refreshStatus.totalTokens(),
                        "legacyTokens", refreshStatus.legacyTokens(),
                        "currentTokens", refreshStatus.currentTokens(),
                        "migrationPercentage", refreshStatus.migrationPercentage(),
                        "migrationComplete", refreshStatus.migrationComplete()
                ),
                "blocklist", Map.of(
                        "enabled", true,
                        "description", blocklistStats.description()
                ),
                "migrationComplete", refreshStatus.migrationComplete()
        );
    }
}
