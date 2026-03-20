package in.vyanix.webservice.exception;

import in.vyanix.webservice.dto.ApiErrorResponse;
import in.vyanix.webservice.dto.ValidationError;
import in.vyanix.webservice.service.exception.BadRequestException;
import in.vyanix.webservice.service.exception.RateLimitExceededException;
import in.vyanix.webservice.service.exception.ResourceNotFoundException;
import in.vyanix.webservice.service.exception.TokenTheftException;
import in.vyanix.webservice.service.exception.UnauthorizedException;
import jakarta.persistence.OptimisticLockException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.dao.PessimisticLockingFailureException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * Global exception handler with error code support for frontend handling.
 * 
 * Error response format:
 * {
 *   "success": false,
 *   "message": "User-friendly error message",
 *   "code": "ERROR_CODE"  // For frontend switch statements
 * }
 */
@ControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ApiErrorResponse> handleResourceNotFoundException(ResourceNotFoundException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(ApiErrorResponse.of(ex.getMessage(), "RESOURCE_NOT_FOUND"));
    }

    @ExceptionHandler(BadRequestException.class)
    public ResponseEntity<ApiErrorResponse> handleBadRequestException(BadRequestException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ApiErrorResponse.of(ex.getMessage(), "BAD_REQUEST"));
    }

    @ExceptionHandler(UnauthorizedException.class)
    public ResponseEntity<ApiErrorResponse> handleUnauthorizedException(UnauthorizedException ex) {
        String code = ex.getCode() != null ? ex.getCode() : "UNAUTHORIZED";
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(ApiErrorResponse.of(ex.getMessage(), code));
    }

    @ExceptionHandler(TokenTheftException.class)
    public ResponseEntity<ApiErrorResponse> handleTokenTheftException(TokenTheftException ex) {
        log.error("SECURITY: Token theft detected - sessionId={}, allSessionsRevoked={}", 
                ex.getSessionId(), ex.isAllSessionsRevoked());
        
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(ApiErrorResponse.of(
                    "Your session was revoked due to suspicious activity. Please log in again.",
                    "SECURITY_THEFT_DETECTED"
                ));
    }

    @ExceptionHandler(RateLimitExceededException.class)
    public ResponseEntity<Map<String, Object>> handleRateLimitExceededException(RateLimitExceededException ex) {
        Map<String, Object> response = Map.of(
                "success", false,
                "message", ex.getMessage(),
                "code", "RATE_LIMIT_EXCEEDED",
                "retryAfterSeconds", ex.getRetryAfterSeconds(),
                "limit", ex.getLimit(),
                "windowSeconds", ex.getWindowSeconds(),
                "limitType", ex.getLimitType()
        );

        return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                .header("Retry-After", String.valueOf(ex.getRetryAfterSeconds()))
                .header("X-RateLimit-Limit", String.valueOf(ex.getLimit()))
                .header("X-RateLimit-Window", String.valueOf(ex.getWindowSeconds()))
                .body(response);
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ApiErrorResponse> handleAccessDeniedException(AccessDeniedException ex) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(ApiErrorResponse.of("Access denied", "ACCESS_DENIED"));
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ApiErrorResponse> handleDataIntegrityViolationException(DataIntegrityViolationException ex) {
        log.warn("Data integrity violation", ex);
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(ApiErrorResponse.of("Request conflicts with existing data", "DATA_CONFLICT"));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiErrorResponse> handleValidationException(MethodArgumentNotValidException ex) {
        List<ValidationError> errors = new ArrayList<>();
        for (FieldError fieldError : ex.getBindingResult().getFieldErrors()) {
            errors.add(ValidationError.of(fieldError.getField(), fieldError.getDefaultMessage()));
        }

        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ApiErrorResponse.of("Validation errors occurred", "VALIDATION_ERROR", errors));
    }

    @ExceptionHandler(OptimisticLockException.class)
    public ResponseEntity<ApiErrorResponse> handleOptimisticLockException(OptimisticLockException ex) {
        log.warn("Optimistic lock failure - concurrent modification detected");
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(ApiErrorResponse.of("Resource was modified by another request. Please try again.", "CONCURRENT_MODIFICATION"));
    }

    @ExceptionHandler(PessimisticLockingFailureException.class)
    public ResponseEntity<ApiErrorResponse> handlePessimisticLockingFailureException(PessimisticLockingFailureException ex) {
        log.warn("Database lock failure - high contention detected");
        return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                .body(ApiErrorResponse.of("Service temporarily busy. Please try again.", "SERVICE_BUSY"));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiErrorResponse> handleGeneralException(Exception ex) {
        log.error("Unhandled exception", ex);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiErrorResponse.of("An unexpected error occurred", "INTERNAL_ERROR"));
    }
}
