package in.vyanix.webservice.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;

public record AdminInventoryUpdateRequest(
        @NotNull(message = "Stock is required")
        @PositiveOrZero(message = "Stock must be zero or greater")
        Integer stock
) {
}
