package in.vyanix.webservice.mapper;

import in.vyanix.webservice.dto.SkuResponse;
import in.vyanix.webservice.dto.SkuOptionValueResponse;
import in.vyanix.webservice.entity.ProductOptionValue;
import in.vyanix.webservice.entity.Sku;
import in.vyanix.webservice.entity.SkuOptionValue;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.stream.Collectors;

@Component
public class SkuMapper {

    public SkuResponse mapToResponse(Sku sku) {
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
}
