package in.vyanix.webservice.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public record SkuUpdateRequest(
        @NotNull(message = "SKU ID is required")
        UUID id,

        @NotBlank(message = "SKU code is required")
        String skuCode,

        @NotNull(message = "Price is required")
        @Positive(message = "Price must be positive")
        BigDecimal price,

        @NotNull(message = "Stock is required")
        @Positive(message = "Stock must be positive")
        Integer stock,

        Double weight,

        List<@NotNull SkuOptionValueUpdateRequest> optionValues
) {
}
