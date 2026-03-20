package in.vyanix.webservice.mapper;

import in.vyanix.webservice.dto.*;
import in.vyanix.webservice.entity.*;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.Collection;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

@Component
public class ProductMapper {

    public ProductResponse mapToResponse(Product product) {
        return mapProduct(product, true);
    }

    public ProductResponse mapToListingResponse(Product product) {
        return mapProduct(product, false);
    }

    private ProductResponse mapProduct(Product product, boolean includeSkuOptionValues) {
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
                .skus(mapSkusToResponses(product.getSkus(), includeSkuOptionValues))
                .tags(mapProductTagsToNames(product.getProductTags()))
                .minPrice(calculateMinPrice(product.getSkus()))
                .maxPrice(calculateMaxPrice(product.getSkus()))
                .stock(calculateTotalStock(product.getSkus()))
                .createdAt(product.getCreatedAt())
                .build();
    }

    private List<ProductImageResponse> mapProductImagesToResponses(Collection<ProductImage> images) {
        if (images == null) {
            return List.of();
        }
        return images.stream()
                .sorted(Comparator.comparing(ProductImage::getPosition, Comparator.nullsLast(Integer::compareTo))
                        .thenComparing(ProductImage::getId, Comparator.nullsLast(Comparator.naturalOrder())))
                .map(image -> ProductImageResponse.builder()
                        .id(image.getId())
                        .url(image.getUrl())
                        .position(image.getPosition())
                        .build())
                .collect(Collectors.toList());
    }

    private List<ProductOptionResponse> mapProductOptionsToResponses(Collection<ProductOption> options) {
        if (options == null) {
            return List.of();
        }
        return options.stream()
                .sorted(Comparator.comparing(ProductOption::getName, Comparator.nullsLast(String::compareToIgnoreCase))
                        .thenComparing(ProductOption::getId, Comparator.nullsLast(Comparator.naturalOrder())))
                .map(option -> ProductOptionResponse.builder()
                        .id(option.getId())
                        .name(option.getName())
                        .values(mapOptionValues(option.getValues()))
                        .build())
                .collect(Collectors.toList());
    }

    private List<ProductOptionValueResponse> mapOptionValues(Collection<ProductOptionValue> values) {
        if (values == null) {
            return List.of();
        }
        return values.stream()
                .sorted(Comparator.comparing(ProductOptionValue::getValue, Comparator.nullsLast(String::compareToIgnoreCase))
                        .thenComparing(ProductOptionValue::getId, Comparator.nullsLast(Comparator.naturalOrder())))
                .map(value -> ProductOptionValueResponse.builder()
                        .id(value.getId())
                        .value(value.getValue())
                        .build())
                .collect(Collectors.toList());
    }

    private List<SkuResponse> mapSkusToResponses(Collection<Sku> skus, boolean includeSkuOptionValues) {
        if (skus == null) {
            return List.of();
        }
        return skus.stream()
                .sorted(Comparator.comparing(Sku::getSkuCode, Comparator.nullsLast(String::compareToIgnoreCase))
                        .thenComparing(Sku::getId, Comparator.nullsLast(Comparator.naturalOrder())))
                .map(sku -> mapSkuToResponse(sku, includeSkuOptionValues))
                .collect(Collectors.toList());
    }

    private SkuResponse mapSkuToResponse(Sku sku, boolean includeSkuOptionValues) {
        if (sku == null) {
            return null;
        }
        return SkuResponse.builder()
                .id(sku.getId())
                .skuCode(sku.getSkuCode())
                .price(sku.getPrice())
                .stock(sku.getStock())
                .weight(sku.getWeight())
                .optionValues(includeSkuOptionValues ? mapSkuOptionValues(sku.getOptionValues()) : List.of())
                .build();
    }

    private List<SkuOptionValueResponse> mapSkuOptionValues(Collection<SkuOptionValue> optionValues) {
        if (optionValues == null) {
            return List.of();
        }
        return optionValues.stream()
                .sorted(Comparator.comparing(
                                (SkuOptionValue value) -> value.getOptionValue() != null && value.getOptionValue().getOption() != null
                                        ? value.getOptionValue().getOption().getName()
                                        : null,
                                Comparator.nullsLast(String::compareToIgnoreCase))
                        .thenComparing(value -> value.getOptionValue() != null ? value.getOptionValue().getValue() : null,
                                Comparator.nullsLast(String::compareToIgnoreCase))
                        .thenComparing(SkuOptionValue::getId, Comparator.nullsLast(Comparator.naturalOrder())))
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

    private List<String> mapProductTagsToNames(Collection<ProductTag> tags) {
        if (tags == null) {
            return List.of();
        }
        return tags.stream()
                .sorted(Comparator.comparing(ProductTag::getName, Comparator.nullsLast(String::compareToIgnoreCase))
                        .thenComparing(ProductTag::getId, Comparator.nullsLast(Comparator.naturalOrder())))
                .map(ProductTag::getName)
                .collect(Collectors.toList());
    }

    private BigDecimal calculateMinPrice(Collection<Sku> skus) {
        if (skus == null || skus.isEmpty()) {
            return null;
        }
        return skus.stream()
                .map(Sku::getPrice)
                .min(BigDecimal::compareTo)
                .orElse(null);
    }

    private BigDecimal calculateMaxPrice(Collection<Sku> skus) {
        if (skus == null || skus.isEmpty()) {
            return null;
        }
        return skus.stream()
                .map(Sku::getPrice)
                .max(BigDecimal::compareTo)
                .orElse(null);
    }

    private Integer calculateTotalStock(Collection<Sku> skus) {
        if (skus == null || skus.isEmpty()) {
            return 0;
        }
        return skus.stream()
                .map(Sku::getStock)
                .reduce(0, Integer::sum);
    }
}
