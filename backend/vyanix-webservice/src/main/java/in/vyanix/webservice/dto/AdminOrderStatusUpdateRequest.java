package in.vyanix.webservice.dto;

import in.vyanix.webservice.entity.OrderStatus;
import jakarta.validation.constraints.NotNull;

public record AdminOrderStatusUpdateRequest(
        @NotNull(message = "Status is required")
        OrderStatus status
) {
}