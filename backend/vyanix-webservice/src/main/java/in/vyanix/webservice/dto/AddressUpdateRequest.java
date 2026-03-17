package in.vyanix.webservice.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.util.UUID;

public record AddressUpdateRequest(
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
        @Size(max = 10, message = "Postal code must not exceed 10 characters")
        String postalCode
) {
}
