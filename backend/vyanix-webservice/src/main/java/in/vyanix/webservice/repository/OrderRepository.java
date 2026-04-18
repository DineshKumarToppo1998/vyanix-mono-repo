package in.vyanix.webservice.repository;

import in.vyanix.webservice.entity.Order;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface OrderRepository extends JpaRepository<Order, UUID> {
    @EntityGraph(attributePaths = {"orderAddress", "orderItems", "orderItems.sku", "orderItems.sku.product", "orderItems.sku.product.images", "payment"})
    Optional<Order> findByIdAndUserId(UUID id, UUID userId);

    @EntityGraph(attributePaths = {"orderAddress", "orderItems", "orderItems.sku", "orderItems.sku.product", "orderItems.sku.product.images", "payment"})
    Optional<Order> findByUserIdAndIdempotencyKey(UUID userId, String idempotencyKey);

    @EntityGraph(attributePaths = {"orderAddress", "orderItems", "orderItems.sku", "orderItems.sku.product", "orderItems.sku.product.images", "payment"})
    List<Order> findByUserIdOrderByCreatedAtDesc(UUID userId);

    @EntityGraph(attributePaths = {"user", "orderAddress", "orderItems", "orderItems.sku", "orderItems.sku.product", "orderItems.sku.product.images", "payment"})
    List<Order> findAllByOrderByCreatedAtDesc();
}
