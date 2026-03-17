package in.vyanix.webservice.controller;

import in.vyanix.webservice.dto.*;
import in.vyanix.webservice.service.ProductService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1")
public class ProductController {

    @Autowired
    private ProductService productService;

    @GetMapping("/products")
    public ResponseEntity<ApiResponse<Page<ProductResponse>>> getProducts(
            @RequestParam(required = false) String categorySlug,
            @RequestParam(required = false) String search,
            Pageable pageable) {

        Page<ProductResponse> products;

        if (search != null) {
            products = productService.searchProducts(search, pageable);
        } else if (categorySlug != null) {
            products = productService.getProductsByCategorySlug(categorySlug, pageable);
        } else {
            products = productService.getAllProducts(pageable);
        }

        ApiResponse<Page<ProductResponse>> response = ApiResponse.<Page<ProductResponse>>builder()
                .requestId(UUID.randomUUID())
                .statusCode(HttpStatus.OK.value())
                .message("Products retrieved successfully")
                .data(products)
                .build();

        return ResponseEntity.ok(response);
    }

    @GetMapping("/products/{id}")
    public ResponseEntity<ApiResponse<ProductResponse>> getProductById(@PathVariable UUID id) {
        ProductResponse product = productService.getProductById(id);
        ApiResponse<ProductResponse> response = ApiResponse.<ProductResponse>builder()
                .requestId(UUID.randomUUID())
                .statusCode(HttpStatus.OK.value())
                .message("Product retrieved successfully")
                .data(product)
                .build();
        return ResponseEntity.ok(response);
    }

    @GetMapping("/products/slug/{slug}")
    public ResponseEntity<ApiResponse<ProductResponse>> getProductBySlug(@PathVariable String slug) {
        ProductResponse product = productService.getProductBySlug(slug);
        ApiResponse<ProductResponse> response = ApiResponse.<ProductResponse>builder()
                .requestId(UUID.randomUUID())
                .statusCode(HttpStatus.OK.value())
                .message("Product retrieved successfully")
                .data(product)
                .build();
        return ResponseEntity.ok(response);
    }

    @GetMapping("/categories")
    public ResponseEntity<ApiResponse<List<CategoryResponse>>> getAllCategories() {
        List<CategoryResponse> categories = productService.getAllCategories();
        ApiResponse<List<CategoryResponse>> response = ApiResponse.<List<CategoryResponse>>builder()
                .requestId(UUID.randomUUID())
                .statusCode(HttpStatus.OK.value())
                .message("Categories retrieved successfully")
                .data(categories)
                .build();
        return ResponseEntity.ok(response);
    }

    @GetMapping("/categories/{slug}/products")
    public ResponseEntity<ApiResponse<List<ProductResponse>>> getProductsByCategorySlug(@PathVariable String slug) {
        List<ProductResponse> products = productService.getProductsByCategorySlug(slug);
        ApiResponse<List<ProductResponse>> response = ApiResponse.<List<ProductResponse>>builder()
                .requestId(UUID.randomUUID())
                .statusCode(HttpStatus.OK.value())
                .message("Products retrieved successfully")
                .data(products)
                .build();
        return ResponseEntity.ok(response);
    }

    @GetMapping("/products/search")
    public ResponseEntity<ApiResponse<Page<ProductResponse>>> searchProducts(
            @RequestParam String q,
            Pageable pageable) {
        Page<ProductResponse> products = productService.searchProducts(q, pageable);
        ApiResponse<Page<ProductResponse>> response = ApiResponse.<Page<ProductResponse>>builder()
                .requestId(UUID.randomUUID())
                .statusCode(HttpStatus.OK.value())
                .message("Products searched successfully")
                .data(products)
                .build();
        return ResponseEntity.ok(response);
    }

    @GetMapping("/products/related/{productId}")
    public ResponseEntity<ApiResponse<List<ProductResponse>>> getRelatedProducts(@PathVariable UUID productId) {
        List<ProductResponse> products = productService.getRelatedProducts(productId);
        ApiResponse<List<ProductResponse>> response = ApiResponse.<List<ProductResponse>>builder()
                .requestId(UUID.randomUUID())
                .statusCode(HttpStatus.OK.value())
                .message("Related products retrieved successfully")
                .data(products)
                .build();
        return ResponseEntity.ok(response);
    }
}
