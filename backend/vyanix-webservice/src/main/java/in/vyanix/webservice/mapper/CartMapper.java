package in.vyanix.webservice.mapper;

import in.vyanix.webservice.dto.CartItemResponse;
import in.vyanix.webservice.dto.CartResponse;
import in.vyanix.webservice.dto.SkuResponse;
import in.vyanix.webservice.entity.Cart;
import in.vyanix.webservice.entity.CartItem;
import in.vyanix.webservice.entity.Sku;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@Component
public class CartMapper {

    public CartResponse mapToResponse(Cart cart) {
        if (cart == null) {
            return null;
        }

        CartResponse.CartResponseBuilder builder = CartResponse.builder()
                .id(cart.getId())
                .userId(cart.getUser() != null ? cart.getUser().getId() : null)
                .createdAt(cart.getCreatedAt())
                .updatedAt(cart.getUpdatedAt());

        List<CartItem> items = cart.getItems();
        if (items != null && !items.isEmpty()) {
            builder.items(mapCartItemsToResponses(items))
                    .itemCount(items.stream().mapToInt(CartItem::getQuantity).sum())
                    .subtotal(calculateSubtotal(items));
        } else {
            builder.items(List.of()).itemCount(0).subtotal(BigDecimal.ZERO);
        }

        return builder.build();
    }

    private BigDecimal calculateSubtotal(List<CartItem> items) {
        return items.stream()
                .map(item -> {
                    Sku sku = item.getSku();
                    if (sku == null) {
                        return BigDecimal.ZERO;
                    }
                    return sku.getPrice().multiply(new BigDecimal(item.getQuantity()));
                })
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private List<CartItemResponse> mapCartItemsToResponses(List<CartItem> items) {
        return items.stream()
                .map(this::mapCartItemToResponse)
                .collect(Collectors.toList());
    }

    private CartItemResponse mapCartItemToResponse(CartItem item) {
        if (item == null) {
            return null;
        }

        Sku sku = item.getSku();
        if (sku == null) {
            return null;
        }

        return CartItemResponse.builder()
                .id(item.getId())
                .cartId(item.getCart().getId())
                .skuId(sku.getId())
                .productName(sku.getProduct() != null ? sku.getProduct().getName() : "Unknown Product")
                .productSlug(sku.getProduct() != null ? sku.getProduct().getSlug() : "")
                .productImage(getProductImage(sku))
                .price(sku.getPrice())
                .quantity(item.getQuantity())
                .subtotal(sku.getPrice().multiply(new BigDecimal(item.getQuantity())))
                .sku(new SkuMapper().mapToResponse(sku))
                .build();
    }

    private String getProductImage(Sku sku) {
        if (sku.getProduct() == null || sku.getProduct().getImages() == null || sku.getProduct().getImages().isEmpty()) {
            return "";
        }
        return sku.getProduct().getImages().stream()
                .filter(img -> img.getPosition() == 0 || img.getPosition() == null)
                .findFirst()
                .map(in.vyanix.webservice.entity.ProductImage::getUrl)
                .orElse("");
    }
}
