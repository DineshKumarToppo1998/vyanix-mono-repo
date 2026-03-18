package in.vyanix.webservice.service.payment;

import in.vyanix.webservice.entity.PaymentStatus;

public record PaymentProcessingResult(
        String paymentProvider,
        String transactionId,
        PaymentStatus status
) {
}
