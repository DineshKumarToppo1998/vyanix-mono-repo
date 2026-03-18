package in.vyanix.webservice.mapper;

import in.vyanix.webservice.dto.OrderAddressResponse;
import in.vyanix.webservice.dto.OrderItemResponse;
import in.vyanix.webservice.dto.OrderResponse;
import in.vyanix.webservice.dto.OrderStatus;
import in.vyanix.webservice.dto.PaymentResponse;
import in.vyanix.webservice.dto.PaymentStatus;
import in.vyanix.webservice.entity.*;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Component
public class OrderMapper {

    public OrderResponse mapToResponse(Order order) {
        if (order == null) {
            return null;
        }

        OrderResponse.OrderResponseBuilder builder = OrderResponse.builder()
                .id(order.getId())
                .orderNumber(generateOrderNumber(order.getId()))
                .userId(order.getUser() != null ? order.getUser().getId() : null)
                .status(mapToOrderStatus(order.getStatus()))
                .subtotal(order.getSubtotal())
                .tax(order.getTax())
                .shippingCost(order.getShippingCost())
                .totalAmount(order.getTotalAmount())
                .createdAt(order.getCreatedAt());

        // Map shipping address
        OrderAddress shippingAddress = order.getOrderAddress();
        if (shippingAddress != null) {
            builder.shippingAddress(mapOrderAddressToResponse(shippingAddress, order));
        }

        // Map order items
        List<OrderItem> items = order.getOrderItems();
        if (items != null && !items.isEmpty()) {
            builder.items(mapOrderItemsToResponses(items));
        } else {
            builder.items(List.of());
        }

        // Map payment
        Payment payment = order.getPayment();
        if (payment != null) {
            builder.payment(mapPaymentToResponse(payment));
        }

        return builder.build();
    }

    private String generateOrderNumber(UUID orderId) {
        return "ORD-" + orderId.toString().substring(0, 8).toUpperCase();
    }

    private OrderStatus mapToOrderStatus(in.vyanix.webservice.entity.OrderStatus status) {
        if (status == null) {
            return OrderStatus.PENDING;
        }
        return OrderStatus.valueOf(status.name());
    }

    private OrderAddressResponse mapOrderAddressToResponse(OrderAddress address, Order order) {
        if (address == null) {
            return null;
        }

        String fullName = order.getUser() != null ?
                order.getUser().getFirstName() + " " + order.getUser().getLastName() : "";

        return OrderAddressResponse.builder()
                .id(address.getId())
                .line1(address.getLine1())
                .line2(address.getLine2())
                .city(address.getCity())
                .state(address.getState())
                .country(address.getCountry())
                .postalCode(address.getPostalCode())
                .fullName(fullName)
                .email(order.getUser() != null ? order.getUser().getEmail() : "")
                .phone(order.getUser() != null ? order.getUser().getPhone() : "")
                .build();
    }

    private List<OrderItemResponse> mapOrderItemsToResponses(List<OrderItem> items) {
        return items.stream()
                .map(this::mapOrderItemToResponse)
                .collect(Collectors.toList());
    }

    private OrderItemResponse mapOrderItemToResponse(OrderItem item) {
        if (item == null) {
            return null;
        }

        return OrderItemResponse.builder()
                .id(item.getId())
                .orderId(item.getOrder() != null ? item.getOrder().getId() : null)
                .productId(item.getSku() != null && item.getSku().getProduct() != null ? item.getSku().getProduct().getId() : null)
                .skuId(item.getSku() != null ? item.getSku().getId() : null)
                .productName(item.getProductName())
                .productSlug(getProductSlug(item.getSku()))
                .productImage(getProductImage(item.getSku()))
                .skuCode(item.getSku() != null ? item.getSku().getSkuCode() : "")
                .price(item.getPrice())
                .quantity(item.getQuantity())
                .subtotal(item.getPrice().multiply(new BigDecimal(item.getQuantity())))
                .build();
    }

    private String getProductSlug(Sku sku) {
        if (sku == null || sku.getProduct() == null) {
            return "";
        }
        return sku.getProduct().getSlug();
    }

    private String getProductImage(Sku sku) {
        if (sku == null || sku.getProduct() == null || sku.getProduct().getImages() == null || sku.getProduct().getImages().isEmpty()) {
            return "";
        }
        return sku.getProduct().getImages().stream()
                .sorted(Comparator.comparing(in.vyanix.webservice.entity.ProductImage::getPosition, Comparator.nullsLast(Integer::compareTo))
                        .thenComparing(in.vyanix.webservice.entity.ProductImage::getId, Comparator.nullsLast(Comparator.naturalOrder())))
                .filter(img -> img.getPosition() == 0 || img.getPosition() == null)
                .findFirst()
                .map(in.vyanix.webservice.entity.ProductImage::getUrl)
                .orElseGet(() -> sku.getProduct().getImages().stream()
                        .sorted(Comparator.comparing(in.vyanix.webservice.entity.ProductImage::getPosition, Comparator.nullsLast(Integer::compareTo))
                                .thenComparing(in.vyanix.webservice.entity.ProductImage::getId, Comparator.nullsLast(Comparator.naturalOrder())))
                        .map(in.vyanix.webservice.entity.ProductImage::getUrl)
                        .findFirst()
                        .orElse(""));
    }

    private PaymentResponse mapPaymentToResponse(Payment payment) {
        if (payment == null) {
            return null;
        }

        return PaymentResponse.builder()
                .id(payment.getId())
                .orderId(payment.getOrder() != null ? payment.getOrder().getId() : null)
                .paymentProvider(payment.getPaymentProvider())
                .transactionId(payment.getTransactionId())
                .amount(payment.getAmount())
                .status(mapToPaymentStatus(payment.getStatus()))
                .createdAt(payment.getOrder() != null ? payment.getOrder().getCreatedAt() : null)
                .build();
    }

    private PaymentStatus mapToPaymentStatus(in.vyanix.webservice.entity.PaymentStatus status) {
        if (status == null) {
            return PaymentStatus.PENDING;
        }
        return PaymentStatus.valueOf(status.name());
    }
}
