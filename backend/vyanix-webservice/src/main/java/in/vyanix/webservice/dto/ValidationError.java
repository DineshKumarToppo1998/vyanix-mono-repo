package in.vyanix.webservice.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ValidationError {
    private String field;
    private String message;

    public static ValidationError of(String field, String message) {
        ValidationError error = new ValidationError();
        error.field = field;
        error.message = message;
        return error;
    }
}
