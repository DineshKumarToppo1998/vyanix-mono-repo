package in.vyanix.webservice.service.payment;

import in.vyanix.webservice.entity.Order;
import in.vyanix.webservice.entity.Payment;
import in.vyanix.webservice.entity.PaymentStatus;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
public class MockPaymentProvider implements PaymentService {

    private static final Logger log = LoggerFactory.getLogger(MockPaymentProvider.class);

    @Override
    public String providerName() {
        return "mock-provider";
    }

    @Override
    public PaymentProcessingResult processPayment(Order order, Payment payment) {
        String transactionId = "MOCK-" + UUID.randomUUID().toString().substring(0, 12).toUpperCase();
        log.info("Mock payment succeeded orderId={} paymentId={} transactionId={}", order.getId(), payment.getId(), transactionId);
        return new PaymentProcessingResult(providerName(), transactionId, PaymentStatus.SUCCESS);
    }
}
