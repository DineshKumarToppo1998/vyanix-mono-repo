package in.vyanix.webservice.repository;

import in.vyanix.webservice.entity.ProductOptionValue;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ProductOptionValueRepository extends JpaRepository<ProductOptionValue, UUID> {
    List<ProductOptionValue> findByOptionId(UUID optionId);
}
