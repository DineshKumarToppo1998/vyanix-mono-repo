package in.vyanix.webservice.controller;

import in.vyanix.webservice.dto.*;
import in.vyanix.webservice.security.SecurityUtils;
import in.vyanix.webservice.service.CartService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1")
public class CartController {

    @Autowired
    private CartService cartService;

    @Autowired
    private SecurityUtils securityUtils;

    @GetMapping("/cart")
    public ResponseEntity<ApiResponse<CartResponse>> getCart() {
        UUID userId = securityUtils.getCurrentUserId();
        CartResponse cart = cartService.getOrCreateCart(userId);
        ApiResponse<CartResponse> response = ApiResponse.<CartResponse>builder()
                .requestId(UUID.randomUUID())
                .statusCode(HttpStatus.OK.value())
                .message("Cart retrieved successfully")
                .data(cart)
                .build();
        return ResponseEntity.ok(response);
    }

    @PostMapping("/cart/items")
    public ResponseEntity<ApiResponse<CartResponse>> addToCart(@Valid @RequestBody CartItemUpdateRequest request) {
        UUID userId = securityUtils.getCurrentUserId();
        CartResponse cart = cartService.addToCart(userId, request.skuId(), request.quantity());
        ApiResponse<CartResponse> response = ApiResponse.<CartResponse>builder()
                .requestId(UUID.randomUUID())
                .statusCode(HttpStatus.CREATED.value())
                .message("Item added to cart successfully")
                .data(cart)
                .build();
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PutMapping("/cart/items/{itemId}")
    public ResponseEntity<ApiResponse<CartResponse>> updateCartItem(@PathVariable UUID itemId, @Valid @RequestBody CartItemUpdateRequest request) {
        UUID userId = securityUtils.getCurrentUserId();
        CartResponse cart = cartService.updateCartItem(userId, itemId, request.quantity());
        ApiResponse<CartResponse> response = ApiResponse.<CartResponse>builder()
                .requestId(UUID.randomUUID())
                .statusCode(HttpStatus.OK.value())
                .message("Cart item updated successfully")
                .data(cart)
                .build();
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/cart/items/{itemId}")
    public ResponseEntity<ApiResponse<CartResponse>> removeFromCart(@PathVariable UUID itemId) {
        UUID userId = securityUtils.getCurrentUserId();
        CartResponse cart = cartService.removeFromCart(userId, itemId);
        ApiResponse<CartResponse> response = ApiResponse.<CartResponse>builder()
                .requestId(UUID.randomUUID())
                .statusCode(HttpStatus.OK.value())
                .message("Item removed from cart successfully")
                .data(cart)
                .build();
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/cart/clear")
    public ResponseEntity<ApiResponse<Void>> clearCart() {
        UUID userId = securityUtils.getCurrentUserId();
        cartService.clearCart(userId);
        ApiResponse<Void> response = ApiResponse.<Void>builder()
                .requestId(UUID.randomUUID())
                .statusCode(HttpStatus.NO_CONTENT.value())
                .message("Cart cleared successfully")
                .build();
        return ResponseEntity.noContent().build();
    }
}
