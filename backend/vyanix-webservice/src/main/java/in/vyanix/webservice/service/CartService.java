package in.vyanix.webservice.service;

import in.vyanix.webservice.dto.CartResponse;
import in.vyanix.webservice.entity.Cart;
import in.vyanix.webservice.entity.CartItem;
import in.vyanix.webservice.entity.Sku;
import in.vyanix.webservice.entity.User;
import in.vyanix.webservice.mapper.CartMapper;
import in.vyanix.webservice.repository.CartItemRepository;
import in.vyanix.webservice.repository.CartRepository;
import in.vyanix.webservice.repository.SkuRepository;
import in.vyanix.webservice.repository.UserRepository;
import in.vyanix.webservice.service.exception.BadRequestException;
import in.vyanix.webservice.service.exception.ResourceNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.UUID;

@Service
public class CartService {

    @Autowired
    private CartRepository cartRepository;

    @Autowired
    private CartItemRepository cartItemRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private SkuRepository skuRepository;

    @Autowired
    private CartMapper cartMapper;

    @Transactional
    public CartResponse getOrCreateCart(UUID userId) {
        Cart cart = cartRepository.findWithItemsByCurrentUserId(userId)
                .orElseGet(() -> createCart(userId));
        return cartMapper.mapToResponse(cart);
    }

    @Transactional
    public CartResponse addToCart(UUID userId, UUID skuId, Integer quantity) {
        if (quantity <= 0) {
            throw new BadRequestException("Quantity must be greater than 0");
        }

        Cart cart = cartRepository.findWithItemsByCurrentUserId(userId)
                .orElseGet(() -> createCart(userId));

        Sku sku = skuRepository.findById(skuId)
                .orElseThrow(() -> new ResourceNotFoundException(Sku.class, skuId));

        // Check if item already exists
        CartItem existingItem = cart.getItems().stream()
                .filter(item -> item.getSku().getId().equals(skuId))
                .findFirst()
                .orElse(null);

        if (existingItem != null) {
            int updatedQuantity = existingItem.getQuantity() + quantity;
            validateStockAvailability(sku, updatedQuantity);
            existingItem.setQuantity(updatedQuantity);
        } else {
            validateStockAvailability(sku, quantity);
            CartItem newItem = new CartItem();
            newItem.setCart(cart);
            newItem.setSku(sku);
            newItem.setQuantity(quantity);
            cart.getItems().add(newItem);
        }

        cart.setUpdatedAt(LocalDateTime.now());
        cartRepository.save(cart);

        return cartMapper.mapToResponse(cart);
    }

    @Transactional
    public CartResponse updateCartItem(UUID userId, UUID itemId, Integer quantity) {
        if (quantity <= 0) {
            throw new BadRequestException("Quantity must be greater than 0");
        }

        Cart cart = cartRepository.findWithItemsByCurrentUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException(Cart.class, userId));

        CartItem item = cart.getItems().stream()
                .filter(i -> i.getId().equals(itemId))
                .findFirst()
                .orElseThrow(() -> new ResourceNotFoundException(CartItem.class, itemId));

        validateStockAvailability(item.getSku(), quantity);
        item.setQuantity(quantity);
        cart.setUpdatedAt(LocalDateTime.now());
        cartRepository.save(cart);

        return cartMapper.mapToResponse(cart);
    }

    @Transactional
    public CartResponse removeFromCart(UUID userId, UUID itemId) {
        Cart cart = cartRepository.findWithItemsByCurrentUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException(Cart.class, userId));

        CartItem item = cart.getItems().stream()
                .filter(i -> i.getId().equals(itemId))
                .findFirst()
                .orElseThrow(() -> new ResourceNotFoundException(CartItem.class, itemId));

        cart.getItems().remove(item);
        cartItemRepository.delete(item);

        cart.setUpdatedAt(LocalDateTime.now());
        cartRepository.save(cart);

        return cartMapper.mapToResponse(cart);
    }

    @Transactional
    public void clearCart(UUID userId) {
        Cart cart = cartRepository.findWithItemsByCurrentUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException(Cart.class, userId));

        cartItemRepository.deleteAll(cart.getItems());
        cart.getItems().clear();
        cart.setUpdatedAt(LocalDateTime.now());
        cartRepository.save(cart);
    }

    private Cart createCart(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException(User.class, userId));

        Cart cart = new Cart();
        cart.setUser(user);
        cart.setCreatedAt(LocalDateTime.now());
        cart.setUpdatedAt(LocalDateTime.now());
        cart.setItems(new ArrayList<>());
        return cartRepository.save(cart);
    }

    private void validateStockAvailability(Sku sku, int requestedQuantity) {
        if (sku.getStock() == null || sku.getStock() < requestedQuantity) {
            throw new BadRequestException("Insufficient stock for product: " + sku.getSkuCode());
        }
    }
}
