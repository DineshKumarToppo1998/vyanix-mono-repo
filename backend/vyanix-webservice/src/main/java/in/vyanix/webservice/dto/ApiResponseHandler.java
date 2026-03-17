package in.vyanix.webservice.dto;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ControllerAdvice;

import java.time.LocalDateTime;
import java.util.UUID;

@ControllerAdvice
public class ApiResponseHandler {

    protected <T> ResponseEntity<ApiResponse<T>> buildResponse(
            HttpStatus status,
            String message,
            T data) {
        ApiResponse<T> response = ApiResponse.<T>builder()
                .requestId(UUID.randomUUID())
                .statusCode(status.value())
                .message(message)
                .data(data)
                .build();

        return ResponseEntity.status(status).body(response);
    }

    protected ResponseEntity<ApiResponse<Void>> buildErrorResponse(
            HttpStatus status,
            String message) {
        ApiResponse<Void> response = ApiResponse.<Void>builder()
                .requestId(UUID.randomUUID())
                .statusCode(status.value())
                .message(message)
                .data(null)
                .build();

        return ResponseEntity.status(status).body(response);
    }

    protected ResponseEntity<ApiResponse<Void>> buildValidationErrorResponse(
            HttpStatus status,
            String message,
            java.util.List<ValidationError> errors) {
        ApiResponse<Void> response = ApiResponse.<Void>builder()
                .requestId(UUID.randomUUID())
                .statusCode(status.value())
                .message(message)
                .data(null)
                .errors(errors)
                .build();

        return ResponseEntity.status(status).body(response);
    }
}
