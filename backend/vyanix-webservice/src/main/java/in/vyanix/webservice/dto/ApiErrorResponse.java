package in.vyanix.webservice.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@JsonInclude(JsonInclude.Include.NON_NULL)
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ApiErrorResponse {
    @Builder.Default
    private boolean success = false;
    private String message;
    private String code;
    private List<ValidationError> errors;

    public static ApiErrorResponse of(String message) {
        ApiErrorResponse response = new ApiErrorResponse();
        response.message = message;
        return response;
    }

    public static ApiErrorResponse of(String message, String code) {
        ApiErrorResponse response = new ApiErrorResponse();
        response.message = message;
        response.code = code;
        return response;
    }

    public static ApiErrorResponse of(String message, List<ValidationError> errors) {
        ApiErrorResponse response = new ApiErrorResponse();
        response.message = message;
        response.errors = errors;
        return response;
    }

    public static ApiErrorResponse of(String message, String code, List<ValidationError> errors) {
        ApiErrorResponse response = new ApiErrorResponse();
        response.message = message;
        response.code = code;
        response.errors = errors;
        return response;
    }
}
