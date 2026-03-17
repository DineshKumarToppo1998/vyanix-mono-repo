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
public class SkuResponse {
    private UUID id;
    private String skuCode;
    private BigDecimal price;
    private Integer stock;
    private Double weight;
    private List<SkuOptionValueResponse> optionValues;
}
