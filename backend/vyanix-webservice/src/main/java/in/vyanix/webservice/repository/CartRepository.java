package in.vyanix.webservice.repository;

import in.vyanix.webservice.entity.Cart;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.UUID;

public interface CartRepository extends JpaRepository<Cart, UUID> {
    @Query("SELECT c FROM Cart c WHERE c.user.id = :currentUserId")
    Optional<Cart> findByCurrentUserId(@Param("currentUserId") UUID currentUserId);

    @Query("""
            SELECT DISTINCT c
            FROM Cart c
            LEFT JOIN FETCH c.items i
            LEFT JOIN FETCH i.sku s
            LEFT JOIN FETCH s.product p
            LEFT JOIN FETCH p.images
            WHERE c.user.id = :currentUserId
            """)
    Optional<Cart> findWithItemsByCurrentUserId(@Param("currentUserId") UUID currentUserId);
}
