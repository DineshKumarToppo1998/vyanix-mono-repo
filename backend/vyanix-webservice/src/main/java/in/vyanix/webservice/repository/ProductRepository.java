package in.vyanix.webservice.repository;

import in.vyanix.webservice.entity.Product;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ProductRepository extends JpaRepository<Product, UUID> {
    Optional<Product> findBySlug(String slug);

    @Override
    @EntityGraph(attributePaths = {"images", "options", "options.values", "skus", "productTags"})
    List<Product> findAll();

    @Override
    @EntityGraph(attributePaths = {"images", "options", "options.values", "skus", "productTags"})
    Page<Product> findAll(Pageable pageable);

    @EntityGraph(attributePaths = {"images", "options", "options.values", "skus", "productTags"})
    @Query(
            value = "SELECT DISTINCT p FROM Product p WHERE LOWER(p.name) LIKE LOWER(CONCAT('%', :query, '%'))",
            countQuery = "SELECT COUNT(p) FROM Product p WHERE LOWER(p.name) LIKE LOWER(CONCAT('%', :query, '%'))"
    )
    Page<Product> searchByName(@Param("query") String query, Pageable pageable);

    Page<Product> findByCategoryId(UUID categoryId, Pageable pageable);

    @EntityGraph(attributePaths = {"images", "options", "options.values", "skus", "productTags"})
    List<Product> findByCategoryId(UUID categoryId);

    @EntityGraph(attributePaths = {"images", "options", "options.values", "skus", "productTags"})
    Page<Product> findByCategorySlug(String categorySlug, Pageable pageable);

    @EntityGraph(attributePaths = {"images", "options", "options.values", "skus", "productTags"})
    List<Product> findByCategorySlug(String categorySlug);

    @EntityGraph(attributePaths = {
            "images",
            "options",
            "options.values",
            "skus",
            "skus.optionValues",
            "skus.optionValues.optionValue",
            "skus.optionValues.optionValue.option",
            "productTags"
    })
    @Query("SELECT DISTINCT p FROM Product p WHERE p.id = :id")
    Optional<Product> findByIdWithRelations(@Param("id") UUID id);

    @EntityGraph(attributePaths = {
            "images",
            "options",
            "options.values",
            "skus",
            "skus.optionValues",
            "skus.optionValues.optionValue",
            "skus.optionValues.optionValue.option",
            "productTags"
    })
    @Query("SELECT DISTINCT p FROM Product p WHERE p.slug = :slug")
    Optional<Product> findBySlugWithRelations(@Param("slug") String slug);
}
