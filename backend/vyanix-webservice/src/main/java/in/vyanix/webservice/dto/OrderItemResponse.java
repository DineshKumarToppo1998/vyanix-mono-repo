package in.vyanix.webservice.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderItemResponse {
    private UUID id;
    private UUID orderId;
    private UUID productId;
    private UUID skuId;
    private String productName;
    private String productSlug;
    private String productImage;
    private String skuCode;
    private BigDecimal price;
    private Integer quantity;
    private BigDecimal subtotal;
}
