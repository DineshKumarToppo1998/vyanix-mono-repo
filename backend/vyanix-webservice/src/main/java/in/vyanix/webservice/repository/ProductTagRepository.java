package in.vyanix.webservice.repository;

import in.vyanix.webservice.entity.Product;
import in.vyanix.webservice.entity.ProductTag;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ProductTagRepository extends JpaRepository<ProductTag, UUID> {
    List<ProductTag> findByProductId(UUID productId);
}
