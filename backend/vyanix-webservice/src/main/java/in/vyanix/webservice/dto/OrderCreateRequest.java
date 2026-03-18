package in.vyanix.webservice.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.util.List;

public record OrderCreateRequest(
        @NotNull(message = "Shipping address is required")
        @Valid
        OrderAddressCreateRequest shippingAddress,

        @NotEmpty(message = "At least one item is required")
        @Valid
        List<OrderItemCreateRequest> items
) {
}
