package in.vyanix.webservice.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.List;
import java.util.UUID;

public record ProductOptionCreateRequest(
        @NotBlank(message = "Option name is required")
        String name,

        List<@NotBlank(message = "Option value is required") String> values
) {
}
