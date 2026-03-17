package in.vyanix.webservice.dto;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentResponse {
    private UUID id;
    private UUID orderId;
    private String paymentProvider;
    private String transactionId;
    private BigDecimal amount;
    private PaymentStatus status;
    private LocalDateTime createdAt;
}
