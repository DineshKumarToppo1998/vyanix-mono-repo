package in.vyanix.webservice.dto;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CartResponse {
    private UUID id;
    private UUID userId;
    private BigDecimal subtotal;
    private Integer itemCount;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private List<CartItemResponse> items;
}
