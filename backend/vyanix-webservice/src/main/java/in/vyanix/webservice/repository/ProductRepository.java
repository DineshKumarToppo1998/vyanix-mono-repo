package in.vyanix.webservice.repository;

import in.vyanix.webservice.entity.Product;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ProductRepository extends JpaRepository<Product, UUID> {
    Optional<Product> findBySlug(String slug);

    @Query("SELECT p FROM Product p WHERE LOWER(p.name) LIKE LOWER(CONCAT('%', :query, '%'))")
    Page<Product> searchByName(@Param("query") String query, Pageable pageable);

    Page<Product> findByCategoryId(UUID categoryId, Pageable pageable);

    List<Product> findByCategoryId(UUID categoryId);

    List<Product> findByCategorySlug(String categorySlug);

    @Query("SELECT p FROM Product p LEFT JOIN FETCH p.images LEFT JOIN FETCH p.skus WHERE p.id = :id")
    Optional<Product> findByIdWithImagesAndSkus(@Param("id") UUID id);

    @Query("SELECT p FROM Product p LEFT JOIN FETCH p.images LEFT JOIN FETCH p.skus s LEFT JOIN FETCH s.optionValues sov LEFT JOIN FETCH sov.optionValue WHERE p.slug = :slug")
    Optional<Product> findBySlugWithRelations(@Param("slug") String slug);
}
