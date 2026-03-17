package in.vyanix.webservice.repository;

import in.vyanix.webservice.entity.CartItem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface CartItemRepository extends JpaRepository<CartItem, UUID> {
    List<CartItem> findByCartId(UUID cartId);
    void deleteByCartIdAndSkuId(UUID cartId, UUID skuId);
}
