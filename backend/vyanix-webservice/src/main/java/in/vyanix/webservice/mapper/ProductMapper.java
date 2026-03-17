package in.vyanix.webservice.mapper;

import in.vyanix.webservice.dto.*;
import in.vyanix.webservice.entity.*;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@Component
public class ProductMapper {

    public ProductResponse mapToResponse(Product product) {
        if (product == null) {
            return null;
        }

        return ProductResponse.builder()
                .id(product.getId())
                .name(product.getName())
                .slug(product.getSlug())
                .description(product.getDescription())
                .categoryName(product.getCategory() != null ? product.getCategory().getName() : null)
                .categoryId(product.getCategory() != null ? product.getCategory().getId() : null)
                .rating(product.getRating())
                .reviewsCount(product.getReviewsCount())
                .images(mapProductImagesToResponses(product.getImages()))
                .options(mapProductOptionsToResponses(product.getOptions()))
                .skus(mapSkusToResponses(product.getSkus()))
                .tags(mapProductTagsToNames(product.getProductTags()))
                .minPrice(calculateMinPrice(product.getSkus()))
                .maxPrice(calculateMaxPrice(product.getSkus()))
                .stock(calculateTotalStock(product.getSkus()))
                .build();
    }

    private List<ProductImageResponse> mapProductImagesToResponses(List<ProductImage> images) {
        if (images == null) {
            return List.of();
        }
        return images.stream()
                .map(image -> ProductImageResponse.builder()
                        .id(image.getId())
                        .url(image.getUrl())
                        .position(image.getPosition())
                        .build())
                .collect(Collectors.toList());
    }

    private List<ProductOptionResponse> mapProductOptionsToResponses(List<ProductOption> options) {
        if (options == null) {
            return List.of();
        }
        return options.stream()
                .map(option -> ProductOptionResponse.builder()
                        .id(option.getId())
                        .name(option.getName())
                        .values(mapOptionValues(option.getValues()))
                        .build())
                .collect(Collectors.toList());
    }

    private List<ProductOptionValueResponse> mapOptionValues(List<ProductOptionValue> values) {
        if (values == null) {
            return List.of();
        }
        return values.stream()
                .map(value -> ProductOptionValueResponse.builder()
                        .id(value.getId())
                        .value(value.getValue())
                        .build())
                .collect(Collectors.toList());
    }

    private List<SkuResponse> mapSkusToResponses(List<Sku> skus) {
        if (skus == null) {
            return List.of();
        }
        return skus.stream()
                .map(this::mapSkuToResponse)
                .collect(Collectors.toList());
    }

    private SkuResponse mapSkuToResponse(Sku sku) {
        if (sku == null) {
            return null;
        }
        return SkuResponse.builder()
                .id(sku.getId())
                .skuCode(sku.getSkuCode())
                .price(sku.getPrice())
                .stock(sku.getStock())
                .weight(sku.getWeight())
                .optionValues(mapSkuOptionValues(sku.getOptionValues()))
                .build();
    }

    private List<SkuOptionValueResponse> mapSkuOptionValues(List<SkuOptionValue> optionValues) {
        if (optionValues == null) {
            return List.of();
        }
        return optionValues.stream()
                .map(value -> {
                    ProductOptionValue optionVal = value.getOptionValue();
                    return SkuOptionValueResponse.builder()
                            .id(value.getId())
                            .optionName(optionVal != null && optionVal.getOption() != null ? optionVal.getOption().getName() : null)
                            .optionValue(optionVal != null ? optionVal.getValue() : null)
                            .build();
                })
                .collect(Collectors.toList());
    }

    private List<String> mapProductTagsToNames(List<ProductTag> tags) {
        if (tags == null) {
            return List.of();
        }
        return tags.stream()
                .map(ProductTag::getName)
                .collect(Collectors.toList());
    }

    private BigDecimal calculateMinPrice(List<Sku> skus) {
        if (skus == null || skus.isEmpty()) {
            return null;
        }
        return skus.stream()
                .map(Sku::getPrice)
                .min(BigDecimal::compareTo)
                .orElse(null);
    }

    private BigDecimal calculateMaxPrice(List<Sku> skus) {
        if (skus == null || skus.isEmpty()) {
            return null;
        }
        return skus.stream()
                .map(Sku::getPrice)
                .max(BigDecimal::compareTo)
                .orElse(null);
    }

    private Integer calculateTotalStock(List<Sku> skus) {
        if (skus == null || skus.isEmpty()) {
            return 0;
        }
        return skus.stream()
                .map(Sku::getStock)
                .reduce(0, Integer::sum);
    }
}
