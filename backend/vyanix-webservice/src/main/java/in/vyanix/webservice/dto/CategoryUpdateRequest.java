package in.vyanix.webservice.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.List;
import java.util.UUID;

public record CategoryUpdateRequest(
        @NotBlank(message = "Category name is required")
        @Size(max = 100, message = "Category name must not exceed 100 characters")
        String name,

        @NotBlank(message = "Category slug is required")
        @Size(max = 100, message = "Category slug must not exceed 100 characters")
        String slug,

        UUID parentId
) {
}
