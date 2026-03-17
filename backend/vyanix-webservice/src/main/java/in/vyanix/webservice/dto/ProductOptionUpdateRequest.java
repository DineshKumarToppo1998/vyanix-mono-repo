package in.vyanix.webservice.dto;

import jakarta.validation.constraints.NotBlank;
import java.util.UUID;

public record ProductOptionUpdateRequest(
        UUID id,

        @NotBlank(message = "Option name is required")
        String name,

        java.util.List<@NotBlank(message = "Option value is required") String> values
) {
}
