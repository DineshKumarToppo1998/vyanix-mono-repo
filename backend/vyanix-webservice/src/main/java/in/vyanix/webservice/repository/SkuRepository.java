package in.vyanix.webservice.repository;

import in.vyanix.webservice.entity.Sku;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface SkuRepository extends JpaRepository<Sku, UUID> {
    Optional<Sku> findBySkuCode(String skuCode);
    List<Sku> findByProductId(UUID productId);

    @Modifying(flushAutomatically = true)
    @Query("""
            UPDATE Sku s
            SET s.stock = s.stock - :quantity
            WHERE s.id = :skuId
              AND s.stock >= :quantity
            """)
    int decreaseStockIfAvailable(@Param("skuId") UUID skuId, @Param("quantity") Integer quantity);
}
