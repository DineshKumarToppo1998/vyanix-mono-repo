package in.vyanix.webservice.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.util.List;
import java.util.UUID;

public record OrderCreateRequest(
        @NotNull(message = "Shipping address is required")
        OrderAddressCreateRequest shippingAddress,

        @NotNull(message = "Order items are required")
        @Positive(message = "At least one item is required")
        List<OrderItemCreateRequest> items
) {
}
