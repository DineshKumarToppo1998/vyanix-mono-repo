package in.vyanix.webservice.service.payment;

import in.vyanix.webservice.entity.Order;
import in.vyanix.webservice.entity.Payment;

public interface PaymentService {

    String providerName();

    PaymentProcessingResult processPayment(Order order, Payment payment);
}
