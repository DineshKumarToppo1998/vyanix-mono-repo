package in.vyanix.webservice.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.List;
import java.util.UUID;

public record ProductCreateRequest(
        @NotBlank(message = "Product name is required")
        @Size(max = 255, message = "Product name must not exceed 255 characters")
        String name,

        @NotBlank(message = "Product slug is required")
        @Size(max = 255, message = "Product slug must not exceed 255 characters")
        String slug,

        @NotBlank(message = "Product description is required")
        String description,

        @NotNull(message = "Category ID is required")
        UUID categoryId,

        Double rating,

        Integer reviewsCount,

        List<String> tags,

        List<@NotNull ProductOptionCreateRequest> options,

        List<@NotNull SkuCreateRequest> skus
) {
}
