package in.vyanix.webservice.repository;

import in.vyanix.webservice.entity.SkuOptionValue;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface SkuOptionValueRepository extends JpaRepository<SkuOptionValue, UUID> {
    List<SkuOptionValue> findBySkuId(UUID skuId);
}
