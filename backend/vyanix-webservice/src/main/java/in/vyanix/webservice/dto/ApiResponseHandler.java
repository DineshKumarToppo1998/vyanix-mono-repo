package in.vyanix.webservice.dto;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ControllerAdvice;

@ControllerAdvice
public class ApiResponseHandler {

    protected <T> ResponseEntity<ApiResponse<T>> buildResponse(
            HttpStatus status,
            T data) {
        return ResponseEntity.status(status).body(ApiResponse.success(data));
    }

    protected ResponseEntity<ApiResponse<Void>> buildErrorResponse(
            HttpStatus status,
            String message) {
        return ResponseEntity.status(status).body(ApiResponse.error(message));
    }

    protected ResponseEntity<ApiResponse<Void>> buildValidationErrorResponse(
            HttpStatus status,
            String message,
            java.util.List<ValidationError> errors) {
        return ResponseEntity.status(status).body(ApiResponse.error(message, errors));
    }
}
