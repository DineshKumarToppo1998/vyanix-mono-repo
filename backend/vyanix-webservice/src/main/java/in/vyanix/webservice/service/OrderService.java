package in.vyanix.webservice.service;

import in.vyanix.webservice.dto.OrderResponse;
import in.vyanix.webservice.entity.*;
import in.vyanix.webservice.mapper.OrderMapper;
import in.vyanix.webservice.repository.*;
import in.vyanix.webservice.service.exception.BadRequestException;
import in.vyanix.webservice.service.exception.ResourceNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class OrderService {

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

    @Transactional
    public OrderResponse createOrder(UUID userId, OrderAddress shippingAddress, List<OrderItemRequest> items) {
        Cart cart = cartRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException(Cart.class, userId));

        // Validate items and check stock
        for (OrderItemRequest itemRequest : items) {
            Sku sku = skuRepository.findById(itemRequest.getSkuId())
                    .orElseThrow(() -> new ResourceNotFoundException(Sku.class, itemRequest.getSkuId()));

            if (sku.getStock() < itemRequest.getQuantity()) {
                throw new BadRequestException("Insufficient stock for product: " + sku.getSkuCode());
            }
        }

        // Create order
        Order order = new Order();
        order.setUser(cart.getUser());
        order.setStatus(in.vyanix.webservice.entity.OrderStatus.PENDING);
        order.setCreatedAt(LocalDateTime.now());

        // Calculate totals
        BigDecimal subtotal = BigDecimal.ZERO;
        for (OrderItemRequest itemRequest : items) {
            Sku sku = skuRepository.findById(itemRequest.getSkuId())
                    .orElseThrow(() -> new ResourceNotFoundException(Sku.class, itemRequest.getSkuId()));
            BigDecimal itemTotal = sku.getPrice().multiply(new BigDecimal(itemRequest.getQuantity()));
            subtotal = subtotal.add(itemTotal);
        }

        BigDecimal tax = subtotal.multiply(new BigDecimal("0.1")); // 10% tax
        BigDecimal shippingCost = new BigDecimal("12.99"); // Flat shipping
        BigDecimal totalAmount = subtotal.add(tax).add(shippingCost);

        order.setSubtotal(subtotal);
        order.setTax(tax);
        order.setShippingCost(shippingCost);
        order.setTotalAmount(totalAmount);

        order = orderRepository.save(order);

        // Save shipping address
        shippingAddress.setOrder(order);
        orderAddressRepository.save(shippingAddress);

        // Create order items
        List<OrderItem> orderItems = new ArrayList<>();
        for (OrderItemRequest itemRequest : items) {
            Sku sku = skuRepository.findById(itemRequest.getSkuId())
                    .orElseThrow(() -> new ResourceNotFoundException(Sku.class, itemRequest.getSkuId()));

            OrderItem orderItem = new OrderItem();
            orderItem.setOrder(order);
            orderItem.setSku(sku);
            orderItem.setProductName(sku.getProduct() != null ? sku.getProduct().getName() : "");
            orderItem.setPrice(sku.getPrice());
            orderItem.setQuantity(itemRequest.getQuantity());

            orderItems.add(orderItem);
        }

        orderItemRepository.saveAll(orderItems);
        order.setOrderItems(orderItems);

        // Create payment
        Payment payment = new Payment();
        payment.setOrder(order);
        payment.setAmount(totalAmount);
        payment.setStatus(in.vyanix.webservice.entity.PaymentStatus.PENDING);
        payment.setPaymentProvider("stripe"); // Default, can be configured
        payment = paymentRepository.save(payment);
        order.setPayment(payment);

        // Clear cart
        cart.getItems().forEach(cartItemRepository::delete);
        cartRepository.delete(cart);

        return orderMapper.mapToResponse(order);
    }

    public OrderResponse getOrderById(UUID orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException(Order.class, orderId));
        return orderMapper.mapToResponse(order);
    }

    public List<OrderResponse> getUserOrders(UUID userId) {
        List<Order> orders = orderRepository.findByUserId(userId);
        return orders.stream()
                .map(orderMapper::mapToResponse)
                .collect(Collectors.toList());
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
