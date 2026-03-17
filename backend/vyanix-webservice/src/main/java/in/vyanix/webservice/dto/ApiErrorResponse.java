package in.vyanix.webservice.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ApiErrorResponse {
    private UUID requestId;
    private int statusCode;
    private String error;
    private String message;
    private LocalDateTime timestamp;
    private String path;
}
