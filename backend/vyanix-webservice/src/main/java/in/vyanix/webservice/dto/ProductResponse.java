package in.vyanix.webservice.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductResponse {
    private UUID id;
    private String name;
    private String slug;
    private String description;
    private String categoryName;
    private UUID categoryId;
    private Double rating;
    private Integer reviewsCount;
    private List<ProductImageResponse> images;
    private List<ProductOptionResponse> options;
    private List<SkuResponse> skus;
    private List<String> tags;
    private BigDecimal minPrice;
    private BigDecimal maxPrice;
    private Integer stock;
}
