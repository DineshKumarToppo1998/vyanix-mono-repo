package in.vyanix.webservice.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.Clock;

/**
 * Configuration for time-related beans.
 * Provides Clock bean for testable time-based operations.
 */
@Configuration
public class ClockConfig {

    /**
     * System clock with default time zone.
     * Can be mocked in tests for time-dependent logic.
     */
    @Bean
    public Clock clock() {
        return Clock.systemDefaultZone();
    }
}
