package in.vyanix.webservice.controller;

import in.vyanix.webservice.dto.*;
import in.vyanix.webservice.service.AdminProductService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping({"/api/admin", "/api/v1/admin"})
public class AdminProductController {

    private final AdminProductService adminProductService;

    public AdminProductController(AdminProductService adminProductService) {
        this.adminProductService = adminProductService;
    }

    // Product List & Get
    @GetMapping("/products")
    public ResponseEntity<ApiResponse<Page<ProductResponse>>> getProducts(
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<ProductResponse> products;
        if (search != null && !search.isBlank()) {
            products = adminProductService.searchProducts(search, pageable);
        } else {
            products = adminProductService.getAllProducts(pageable);
        }
        return ResponseEntity.ok(ApiResponse.success(products));
    }

    @GetMapping("/products/{id}")
    public ResponseEntity<ApiResponse<ProductResponse>> getProductById(@PathVariable UUID id) {
        ProductResponse product = adminProductService.getProductById(id);
        return ResponseEntity.ok(ApiResponse.success(product));
    }

    // Product Create
    @PostMapping("/products")
    public ResponseEntity<ApiResponse<ProductResponse>> createProduct(@Valid @RequestBody AdminProductCreateRequest request) {
        ProductResponse product = adminProductService.createProduct(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(product));
    }

    // Product Update
    @PutMapping("/products/{id}")
    public ResponseEntity<ApiResponse<ProductResponse>> updateProduct(
            @PathVariable UUID id,
            @Valid @RequestBody AdminProductCreateRequest request) {
        ProductResponse product = adminProductService.updateProduct(id, request);
        return ResponseEntity.ok(ApiResponse.success(product));
    }

    // Product Delete
    @DeleteMapping("/products/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteProduct(@PathVariable UUID id) {
        adminProductService.deleteProduct(id);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    // Product Options
    @PostMapping("/products/{id}/options")
    public ResponseEntity<ApiResponse<ProductResponse>> createProductOptions(
            @PathVariable UUID id,
            @Valid @RequestBody List<@Valid ProductOptionCreateRequest> requests) {
        ProductResponse product = adminProductService.addOptions(id, requests);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(product));
    }

    @PutMapping("/products/{id}/options/{optionId}")
    public ResponseEntity<ApiResponse<ProductResponse>> updateProductOption(
            @PathVariable UUID id,
            @PathVariable UUID optionId,
            @Valid @RequestBody ProductOptionCreateRequest request) {
        ProductResponse product = adminProductService.updateOption(id, optionId, request);
        return ResponseEntity.ok(ApiResponse.success(product));
    }

    @DeleteMapping("/products/{id}/options/{optionId}")
    public ResponseEntity<ApiResponse<Void>> deleteProductOption(
            @PathVariable UUID id,
            @PathVariable UUID optionId) {
        adminProductService.deleteOption(id, optionId);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    // Product SKUs
    @PostMapping("/products/{id}/skus")
    public ResponseEntity<ApiResponse<ProductResponse>> createProductSkus(
            @PathVariable UUID id,
            @Valid @RequestBody List<@Valid SkuCreateRequest> requests) {
        ProductResponse product = adminProductService.addSkus(id, requests);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(product));
    }

    @PutMapping("/products/{id}/skus/{skuId}")
    public ResponseEntity<ApiResponse<ProductResponse>> updateProductSku(
            @PathVariable UUID id,
            @PathVariable UUID skuId,
            @Valid @RequestBody SkuCreateRequest request) {
        ProductResponse product = adminProductService.updateSku(id, skuId, request);
        return ResponseEntity.ok(ApiResponse.success(product));
    }

    @DeleteMapping("/products/{id}/skus/{skuId}")
    public ResponseEntity<ApiResponse<Void>> deleteProductSku(
            @PathVariable UUID id,
            @PathVariable UUID skuId) {
        adminProductService.deleteSku(id, skuId);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    // Inventory
    @PutMapping("/skus/{id}/inventory")
    public ResponseEntity<ApiResponse<SkuResponse>> updateInventory(
            @PathVariable UUID id,
            @Valid @RequestBody AdminInventoryUpdateRequest request) {
        SkuResponse sku = adminProductService.updateInventory(id, request);
        return ResponseEntity.ok(ApiResponse.success(sku));
    }
}
