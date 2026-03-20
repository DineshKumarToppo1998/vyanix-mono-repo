package in.vyanix.webservice.service;

import in.vyanix.webservice.entity.RefreshToken;
import in.vyanix.webservice.repository.RefreshTokenRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Scheduled task to clean up legacy refresh tokens after migration period.
 *
 * Migration timeline:
 * - Day 0: Deploy V2 migration script (adds new columns)
 * - Day 0-30: Transparent migration (legacy tokens migrated on first use)
 * - Day 30+: Enable this cleanup task (set app.migration.legacy-token-migration-ended=true)
 *
 * This task deletes legacy tokens that:
 * - Haven't been used in 90 days
 * - Are already revoked
 * - Have expired
 *
 * Safety:
 * - Only runs when app.migration.legacy-token-migration-ended is true
 * - Logs count of deleted tokens for audit
 * - Runs daily at 3 AM (low-traffic period)
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class LegacyTokenCleanupTask {

    private final RefreshTokenRepository refreshTokenRepository;
    private final Clock clock;

    /**
     * Flag to enable legacy token cleanup after migration period ends.
     * Set in application.yaml: app.migration.legacy-token-migration-ended=true
     * Or via environment: APP_MIGRATION_LEGACY_TOKEN_MIGRATION_ENDED=true
     */
    @Value("${app.migration.legacy-token-migration-ended:false}")
    private boolean migrationPeriodEnded;

    /**
     * Clean up legacy tokens
     * Runs daily at 3 AM
     * Only executes after migration period ends
     */
    @Scheduled(cron = "0 0 3 * * ?")
    @Transactional
    public void cleanupLegacyTokens() {
        if (!migrationPeriodEnded) {
            log.debug("Legacy token cleanup skipped - migration period still active. " +
                    "Set app.migration.legacy-token-migration-ended=true to enable cleanup.");
            return;
        }

        LocalDateTime cutoffDate = LocalDateTime.now(clock).minusDays(90);

        // Find legacy tokens created before cutoff
        List<RefreshToken> legacyTokens = refreshTokenRepository
                .findByTokenFormatAndCreatedAtBefore(RefreshToken.TokenFormat.LEGACY, cutoffDate);

        if (!legacyTokens.isEmpty()) {
            refreshTokenRepository.deleteAll(legacyTokens);
            log.info("Cleaned up {} legacy refresh tokens (created before {})",
                    legacyTokens.size(), cutoffDate);
        } else {
            log.debug("No legacy tokens to clean up");
        }
    }

    /**
     * Get migration status for monitoring
     */
    public MigrationStatus getMigrationStatus() {
        long totalTokens = refreshTokenRepository.count();
        long legacyTokens = refreshTokenRepository.countByTokenFormat(RefreshToken.TokenFormat.LEGACY);
        long currentTokens = refreshTokenRepository.countByTokenFormat(RefreshToken.TokenFormat.CURRENT);

        double migrationPercentage = totalTokens > 0 ?
                (double) currentTokens / totalTokens * 100 : 100.0;

        return new MigrationStatus(
                totalTokens,
                legacyTokens,
                currentTokens,
                migrationPercentage,
                legacyTokens == 0,
                migrationPeriodEnded
        );
    }

    /**
     * Migration status record
     */
    public record MigrationStatus(
            long totalTokens,
            long legacyTokens,
            long currentTokens,
            double migrationPercentage,
            boolean migrationComplete,
            boolean cleanupEnabled
    ) {}
}
