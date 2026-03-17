package in.vyanix.webservice.dto;

import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record SkuOptionValueUpdateRequest(
        @NotNull(message = "SKU option value ID is required")
        UUID id,

        @NotNull(message = "Product option value ID is required")
        UUID productOptionValueId
) {
}
