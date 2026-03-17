package in.vyanix.webservice.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record SkuOptionValueCreateRequest(
        @NotNull(message = "Product option value ID is required")
        UUID productOptionValueId
) {
}
