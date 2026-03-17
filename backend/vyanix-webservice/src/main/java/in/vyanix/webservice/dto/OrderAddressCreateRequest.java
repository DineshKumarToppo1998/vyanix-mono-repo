package in.vyanix.webservice.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.util.UUID;

public record OrderAddressCreateRequest(
        @NotBlank(message = "Line 1 is required")
        String line1,

        String line2,

        @NotBlank(message = "City is required")
        String city,

        @NotBlank(message = "State is required")
        String state,

        @NotBlank(message = "Country is required")
        String country,

        @NotBlank(message = "Postal code is required")
        String postalCode
) {
}
