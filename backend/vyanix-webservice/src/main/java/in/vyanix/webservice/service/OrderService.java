package in.vyanix.webservice.service;

import in.vyanix.webservice.dto.OrderResponse;
import in.vyanix.webservice.entity.*;
import in.vyanix.webservice.mapper.OrderMapper;
import in.vyanix.webservice.repository.*;
import in.vyanix.webservice.service.payment.PaymentProcessingResult;
import in.vyanix.webservice.service.payment.PaymentService;
import in.vyanix.webservice.service.exception.BadRequestException;
import in.vyanix.webservice.service.exception.ResourceNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class OrderService {

    private static final Logger log = LoggerFactory.getLogger(OrderService.class);

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private OrderItemRepository orderItemRepository;

    @Autowired
    private OrderAddressRepository orderAddressRepository;

    @Autowired
    private PaymentRepository paymentRepository;

    @Autowired
    private CartRepository cartRepository;

    @Autowired
    private CartItemRepository cartItemRepository;

    @Autowired
    private SkuRepository skuRepository;

    @Autowired
    private OrderMapper orderMapper;

    @Autowired
    private PaymentService paymentService;

    @Transactional
    public OrderResponse createOrder(UUID userId, String idempotencyKey, OrderAddress shippingAddress, List<OrderItemRequest> items) {
        if (idempotencyKey == null || idempotencyKey.isBlank()) {
            throw new BadRequestException("Idempotency-Key header is required");
        }

        log.info("Checkout started userId={} requestedItemCount={} idempotencyKey={}", userId, items == null ? 0 : items.size(), idempotencyKey);

        Order existingOrder = orderRepository.findByUserIdAndIdempotencyKey(userId, idempotencyKey).orElse(null);
        if (existingOrder != null) {
            log.info("Checkout request reused existing order userId={} orderId={} idempotencyKey={}", userId, existingOrder.getId(), idempotencyKey);
            return orderMapper.mapToResponse(existingOrder);
        }

        Cart cart = cartRepository.findWithItemsByCurrentUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException(Cart.class, userId));

        List<CheckoutItem> checkoutItems = validateAndBuildCheckoutItems(cart, items);
        validateInventory(checkoutItems);

        Order order = new Order();
        order.setUser(cart.getUser());
        order.setIdempotencyKey(idempotencyKey);
        order.setStatus(in.vyanix.webservice.entity.OrderStatus.PENDING);
        order.setCreatedAt(LocalDateTime.now());

        BigDecimal subtotal = calculateSubtotal(checkoutItems);

        BigDecimal tax = subtotal.multiply(new BigDecimal("0.1")); // 10% tax
        BigDecimal shippingCost = new BigDecimal("12.99"); // Flat shipping
        BigDecimal totalAmount = subtotal.add(tax).add(shippingCost);

        order.setSubtotal(subtotal);
        order.setTax(tax);
        order.setShippingCost(shippingCost);
        order.setTotalAmount(totalAmount);

        order = orderRepository.save(order);

        shippingAddress.setOrder(order);
        orderAddressRepository.save(shippingAddress);
        order.setOrderAddress(shippingAddress);

        List<OrderItem> orderItems = new ArrayList<>();
        for (CheckoutItem checkoutItem : checkoutItems) {
            OrderItem orderItem = new OrderItem();
            orderItem.setOrder(order);
            orderItem.setSku(checkoutItem.sku());
            orderItem.setProductName(checkoutItem.sku().getProduct() != null ? checkoutItem.sku().getProduct().getName() : "");
            orderItem.setPrice(checkoutItem.sku().getPrice());
            orderItem.setQuantity(checkoutItem.quantity());

            orderItems.add(orderItem);
        }

        orderItemRepository.saveAll(orderItems);
        order.setOrderItems(orderItems);

        Payment payment = new Payment();
        payment.setOrder(order);
        payment.setAmount(totalAmount);
        payment.setStatus(in.vyanix.webservice.entity.PaymentStatus.PENDING);
        payment.setPaymentProvider(paymentService.providerName());
        log.info("Payment attempt initialized userId={} orderId={} provider={} amount={}", userId, order.getId(), payment.getPaymentProvider(), totalAmount);
        payment = paymentRepository.save(payment);

        PaymentProcessingResult paymentResult = paymentService.processPayment(order, payment);
        payment.setPaymentProvider(paymentResult.paymentProvider());
        payment.setTransactionId(paymentResult.transactionId());
        payment.setStatus(paymentResult.status());
        paymentRepository.save(payment);

        if (paymentResult.status() == PaymentStatus.SUCCESS) {
            order.setStatus(in.vyanix.webservice.entity.OrderStatus.PAID);
        }

        order.setPayment(payment);
        orderRepository.save(order);

        decreaseInventory(checkoutItems);
        clearCart(cart);

        log.info("Order created userId={} orderId={} totalAmount={} itemCount={} paymentStatus={}", userId, order.getId(), totalAmount, orderItems.size(), payment.getStatus());

        return orderMapper.mapToResponse(order);
    }

    @Transactional(readOnly = true)
    public OrderResponse getOrderById(UUID userId, UUID orderId) {
        Order order = orderRepository.findByIdAndUserId(orderId, userId)
                .orElseThrow(() -> new ResourceNotFoundException(Order.class, orderId));
        return orderMapper.mapToResponse(order);
    }

    @Transactional(readOnly = true)
    public List<OrderResponse> getUserOrders(UUID userId) {
        List<Order> orders = orderRepository.findByUserIdOrderByCreatedAtDesc(userId);
        return orders.stream()
                .map(orderMapper::mapToResponse)
                .collect(Collectors.toList());
    }

    private List<CheckoutItem> validateAndBuildCheckoutItems(Cart cart, List<OrderItemRequest> requestedItems) {
        if (cart.getItems() == null || cart.getItems().isEmpty()) {
            throw new BadRequestException("Cart is empty");
        }

        if (requestedItems == null || requestedItems.isEmpty()) {
            throw new BadRequestException("Checkout items are required");
        }

        Set<UUID> uniqueSkuIds = new HashSet<>();
        for (OrderItemRequest requestedItem : requestedItems) {
            if (!uniqueSkuIds.add(requestedItem.getSkuId())) {
                throw new BadRequestException("Duplicate SKU found in checkout request");
            }
        }

        Map<UUID, CartItem> cartItemsBySkuId = cart.getItems().stream()
                .collect(Collectors.toMap(item -> item.getSku().getId(), Function.identity()));

        if (cartItemsBySkuId.size() != requestedItems.size()) {
            throw new BadRequestException("Checkout items must match the authenticated user's cart");
        }

        List<CheckoutItem> checkoutItems = new ArrayList<>();
        for (OrderItemRequest requestedItem : requestedItems) {
            CartItem cartItem = cartItemsBySkuId.get(requestedItem.getSkuId());
            if (cartItem == null) {
                throw new BadRequestException("Checkout item is not present in the authenticated user's cart");
            }

            if (!cartItem.getQuantity().equals(requestedItem.getQuantity())) {
                throw new BadRequestException("Checkout quantities must match the authenticated user's cart");
            }

            checkoutItems.add(new CheckoutItem(cartItem.getSku(), requestedItem.getQuantity()));
        }

        return checkoutItems;
    }

    private void validateInventory(List<CheckoutItem> checkoutItems) {
        for (CheckoutItem checkoutItem : checkoutItems) {
            Integer availableStock = checkoutItem.sku().getStock();
            if (availableStock == null || availableStock < checkoutItem.quantity()) {
                log.warn("Checkout inventory validation failed skuId={} skuCode={} requested={} available={}",
                        checkoutItem.sku().getId(),
                        checkoutItem.sku().getSkuCode(),
                        checkoutItem.quantity(),
                        availableStock);
                throw new BadRequestException("Insufficient stock for product: " + checkoutItem.sku().getSkuCode());
            }
        }
    }

    private BigDecimal calculateSubtotal(List<CheckoutItem> checkoutItems) {
        return checkoutItems.stream()
                .map(item -> item.sku().getPrice().multiply(BigDecimal.valueOf(item.quantity())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private void decreaseInventory(List<CheckoutItem> checkoutItems) {
        for (CheckoutItem checkoutItem : checkoutItems) {
            int updatedRows = skuRepository.decreaseStockIfAvailable(checkoutItem.sku().getId(), checkoutItem.quantity());
            if (updatedRows == 0) {
                log.warn("Checkout stock update failed skuId={} skuCode={} requested={}",
                        checkoutItem.sku().getId(),
                        checkoutItem.sku().getSkuCode(),
                        checkoutItem.quantity());
                throw new BadRequestException("Insufficient stock for product: " + checkoutItem.sku().getSkuCode());
            }

            checkoutItem.sku().setStock(checkoutItem.sku().getStock() - checkoutItem.quantity());
        }
    }

    private void clearCart(Cart cart) {
        cartItemRepository.deleteAll(cart.getItems());
        cart.getItems().clear();
        cart.setUpdatedAt(LocalDateTime.now());
        cartRepository.save(cart);
    }

    private record CheckoutItem(Sku sku, Integer quantity) {
    }

    public static class OrderItemRequest {
        private UUID skuId;
        private Integer quantity;

        public UUID getSkuId() {
            return skuId;
        }

        public void setSkuId(UUID skuId) {
            this.skuId = skuId;
        }

        public Integer getQuantity() {
            return quantity;
        }

        public void setQuantity(Integer quantity) {
            this.quantity = quantity;
        }
    }
}
