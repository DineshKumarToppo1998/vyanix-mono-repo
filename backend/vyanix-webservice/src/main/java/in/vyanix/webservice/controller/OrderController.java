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
@RequestMapping("/api/v1")
public class OrderController {

    @Autowired
    private OrderService orderService;

    @Autowired
    private SecurityUtils securityUtils;

    @PostMapping("/orders")
    public ResponseEntity<ApiResponse<OrderResponse>> createOrder(@Valid @RequestBody OrderCreateRequest request) {
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

        OrderResponse order = orderService.createOrder(userId, address, items);
        ApiResponse<OrderResponse> response = ApiResponse.<OrderResponse>builder()
                .requestId(UUID.randomUUID())
                .statusCode(HttpStatus.CREATED.value())
                .message("Order created successfully")
                .data(order)
                .build();
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/orders/{id}")
    public ResponseEntity<ApiResponse<OrderResponse>> getOrderById(@PathVariable UUID id) {
        OrderResponse order = orderService.getOrderById(id);
        ApiResponse<OrderResponse> response = ApiResponse.<OrderResponse>builder()
                .requestId(UUID.randomUUID())
                .statusCode(HttpStatus.OK.value())
                .message("Order retrieved successfully")
                .data(order)
                .build();
        return ResponseEntity.ok(response);
    }

    @GetMapping("/orders")
    public ResponseEntity<ApiResponse<List<OrderResponse>>> getUserOrders() {
        UUID userId = securityUtils.getCurrentUserId();
        List<OrderResponse> orders = orderService.getUserOrders(userId);
        ApiResponse<List<OrderResponse>> response = ApiResponse.<List<OrderResponse>>builder()
                .requestId(UUID.randomUUID())
                .statusCode(HttpStatus.OK.value())
                .message("Orders retrieved successfully")
                .data(orders)
                .build();
        return ResponseEntity.ok(response);
    }
}
