package in.vyanix.webservice.controller;

import in.vyanix.webservice.dto.*;
import in.vyanix.webservice.security.SecurityUtils;
import in.vyanix.webservice.service.OrderService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping({"/api", "/api/v1"})
public class OrderController {

    @Autowired
    private OrderService orderService;

    @Autowired
    private SecurityUtils securityUtils;

    @PostMapping("/orders")
    public ResponseEntity<ApiResponse<OrderResponse>> createOrder(
            @RequestHeader(value = "Idempotency-Key", required = false) String idempotencyKey,
            @Valid @RequestBody OrderCreateRequest request) {
        String key = idempotencyKey != null && !idempotencyKey.isBlank() ? idempotencyKey : UUID.randomUUID().toString();
        UUID userId = securityUtils.getCurrentUserId();
        OrderAddressCreateRequest addressRequest = request.shippingAddress();
        in.vyanix.webservice.entity.OrderAddress address = new in.vyanix.webservice.entity.OrderAddress();
        address.setLine1(addressRequest.line1());
        address.setLine2(addressRequest.line2());
        address.setCity(addressRequest.city());
        address.setState(addressRequest.state());
        address.setCountry(addressRequest.country());
        address.setPostalCode(addressRequest.postalCode());

        List<in.vyanix.webservice.service.OrderService.OrderItemRequest> items = request.items().stream()
                .map(item -> {
                    in.vyanix.webservice.service.OrderService.OrderItemRequest orderItem = new in.vyanix.webservice.service.OrderService.OrderItemRequest();
                    orderItem.setSkuId(item.skuId());
                    orderItem.setQuantity(item.quantity());
                    return orderItem;
                })
                .collect(java.util.stream.Collectors.toList());

        OrderResponse order = orderService.createOrder(userId, idempotencyKey, address, items);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(order));
    }

    @GetMapping("/orders/{id}")
    public ResponseEntity<ApiResponse<OrderResponse>> getOrderById(@PathVariable UUID id) {
        UUID userId = securityUtils.getCurrentUserId();
        OrderResponse order = orderService.getOrderById(userId, id);
        return ResponseEntity.ok(ApiResponse.success(order));
    }

    @GetMapping("/orders")
    public ResponseEntity<ApiResponse<List<OrderResponse>>> getUserOrders() {
        UUID userId = securityUtils.getCurrentUserId();
        List<OrderResponse> orders = orderService.getUserOrders(userId);
        return ResponseEntity.ok(ApiResponse.success(orders));
    }
}
