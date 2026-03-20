package in.vyanix.webservice.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Rate limiting configuration using Bucket4j.
 *
 * Registers the RateLimitFilter for the /auth/refresh endpoint.
 * Filter order is set to 1 to run before authentication filters.
 */
@Configuration
public class RateLimitConfig {

    /**
     * Register rate limit filter for /auth/refresh endpoint
     * Order 1 ensures it runs before authentication filters
     */
    @Bean
    public FilterRegistrationBean<RateLimitFilter> rateLimitFilter(
            RateLimitProperties properties,
            Bucket4jService bucket4jService,
            ObjectMapper objectMapper) {

        FilterRegistrationBean<RateLimitFilter> registration = new FilterRegistrationBean<>();
        registration.setFilter(new RateLimitFilter(properties, bucket4jService, objectMapper));
        registration.addUrlPatterns("/api/auth/refresh", "/api/v1/auth/refresh");
        registration.setOrder(1);  // Run before auth filters
        registration.setName("rateLimitFilter");

        // Enable/disable based on configuration
        registration.setEnabled(properties.isEnabled());

        return registration;
    }

    /**
     * Bucket4j service bean for rate limiting
     */
    @Bean
    public Bucket4jService bucket4jService() {
        return new Bucket4jService();
    }

    @Bean
    public ObjectMapper objectMapper() {
        return new ObjectMapper();
    }
}
