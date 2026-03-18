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
        return ResponseEntity.ok(ApiResponse.success(cart));
    }

    @PostMapping("/cart/items")
    public ResponseEntity<ApiResponse<CartResponse>> addToCart(@Valid @RequestBody CartItemUpdateRequest request) {
        UUID userId = securityUtils.getCurrentUserId();
        CartResponse cart = cartService.addToCart(userId, request.skuId(), request.quantity());
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(cart));
    }

    @PutMapping("/cart/items/{itemId}")
    public ResponseEntity<ApiResponse<CartResponse>> updateCartItem(@PathVariable UUID itemId, @Valid @RequestBody CartItemQuantityUpdateRequest request) {
        UUID userId = securityUtils.getCurrentUserId();
        CartResponse cart = cartService.updateCartItem(userId, itemId, request.quantity());
        return ResponseEntity.ok(ApiResponse.success(cart));
    }

    @DeleteMapping("/cart/items/{itemId}")
    public ResponseEntity<ApiResponse<CartResponse>> removeFromCart(@PathVariable UUID itemId) {
        UUID userId = securityUtils.getCurrentUserId();
        CartResponse cart = cartService.removeFromCart(userId, itemId);
        return ResponseEntity.ok(ApiResponse.success(cart));
    }

    @DeleteMapping("/cart/clear")
    public ResponseEntity<ApiResponse<Void>> clearCart() {
        UUID userId = securityUtils.getCurrentUserId();
        cartService.clearCart(userId);
        return ResponseEntity.ok(ApiResponse.success(null));
    }
}
