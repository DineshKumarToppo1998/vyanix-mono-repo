package in.vyanix.webservice.service;

import in.vyanix.webservice.dto.CategoryResponse;
import in.vyanix.webservice.dto.ProductResponse;
import in.vyanix.webservice.entity.Category;
import in.vyanix.webservice.entity.Product;
import in.vyanix.webservice.mapper.CategoryMapper;
import in.vyanix.webservice.mapper.ProductMapper;
import in.vyanix.webservice.repository.CategoryRepository;
import in.vyanix.webservice.repository.ProductRepository;
import in.vyanix.webservice.service.exception.ResourceNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class ProductService {

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private ProductMapper productMapper;

    @Transactional(readOnly = true)
    public Page<ProductResponse> getAllProducts(Pageable pageable) {
        Page<Product> products = productRepository.findAll(pageable);
        return products.map(productMapper::mapToListingResponse);
    }

    @Transactional(readOnly = true)
    public List<ProductResponse> getAllProducts() {
        List<Product> products = productRepository.findAll();
        return products.stream()
                .map(productMapper::mapToListingResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public ProductResponse getProductById(UUID id) {
        Product product = productRepository.findByIdWithRelations(id)
                .orElseThrow(() -> new ResourceNotFoundException(Product.class, id));
        return productMapper.mapToResponse(product);
    }

    @Transactional(readOnly = true)
    public ProductResponse getProductBySlug(String slug) {
        Product product = productRepository.findBySlugWithRelations(slug)
                .orElseThrow(() -> new ResourceNotFoundException(Product.class, slug));
        return productMapper.mapToResponse(product);
    }

    @Transactional(readOnly = true)
    public Page<ProductResponse> getProductsByCategorySlug(String categorySlug, Pageable pageable) {
        Page<Product> products = productRepository.findByCategorySlug(categorySlug, pageable);
        return products.map(productMapper::mapToListingResponse);
    }

    @Transactional(readOnly = true)
    public List<ProductResponse> getProductsByCategorySlug(String categorySlug) {
        List<Product> products = productRepository.findByCategorySlug(categorySlug);
        return products.stream()
                .map(productMapper::mapToListingResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<CategoryResponse> getAllCategories() {
        List<Category> categories = categoryRepository.findByParentIsNull();
        return categories.stream()
                .map(new CategoryMapper()::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public CategoryResponse getCategoryBySlug(String slug) {
        Category category = categoryRepository.findBySlug(slug)
                .orElseThrow(() -> new ResourceNotFoundException(Category.class, slug));
        return new CategoryMapper().mapToResponse(category);
    }

    @Transactional(readOnly = true)
    public Page<ProductResponse> searchProducts(String query, Pageable pageable) {
        Page<Product> products = productRepository.searchByName(query, pageable);
        return products.map(productMapper::mapToListingResponse);
    }

    @Transactional(readOnly = true)
    public List<ProductResponse> getRelatedProducts(UUID productId) {
        Product product = productRepository.findByIdWithRelations(productId)
                .orElseThrow(() -> new ResourceNotFoundException(Product.class, productId));

        if (product.getCategory() == null) {
            return List.of();
        }

        List<Product> relatedProducts = productRepository.findByCategoryId(product.getCategory().getId());
        return relatedProducts.stream()
                .filter(p -> !p.getId().equals(productId))
                .limit(4)
                .map(productMapper::mapToListingResponse)
                .collect(Collectors.toList());
    }
}
