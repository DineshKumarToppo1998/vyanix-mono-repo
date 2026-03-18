package in.vyanix.webservice.controller;

import in.vyanix.webservice.dto.AdminInventoryUpdateRequest;
import in.vyanix.webservice.dto.AdminProductCreateRequest;
import in.vyanix.webservice.dto.ApiResponse;
import in.vyanix.webservice.dto.ProductOptionCreateRequest;
import in.vyanix.webservice.dto.ProductResponse;
import in.vyanix.webservice.dto.SkuCreateRequest;
import in.vyanix.webservice.dto.SkuResponse;
import in.vyanix.webservice.service.AdminProductService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping({"/api/admin", "/api/v1/admin"})
public class AdminProductController {

    private final AdminProductService adminProductService;

    public AdminProductController(AdminProductService adminProductService) {
        this.adminProductService = adminProductService;
    }

    @PostMapping("/products")
    public ResponseEntity<ApiResponse<ProductResponse>> createProduct(@Valid @RequestBody AdminProductCreateRequest request) {
        ProductResponse product = adminProductService.createProduct(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(product));
    }

    @PostMapping("/products/{id}/options")
    public ResponseEntity<ApiResponse<ProductResponse>> createProductOptions(
            @PathVariable UUID id,
            @Valid @RequestBody List<@Valid ProductOptionCreateRequest> requests) {
        ProductResponse product = adminProductService.addOptions(id, requests);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(product));
    }

    @PostMapping("/products/{id}/skus")
    public ResponseEntity<ApiResponse<ProductResponse>> createProductSkus(
            @PathVariable UUID id,
            @Valid @RequestBody List<@Valid SkuCreateRequest> requests) {
        ProductResponse product = adminProductService.addSkus(id, requests);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(product));
    }

    @PutMapping("/skus/{id}/inventory")
    public ResponseEntity<ApiResponse<SkuResponse>> updateInventory(
            @PathVariable UUID id,
            @Valid @RequestBody AdminInventoryUpdateRequest request) {
        SkuResponse sku = adminProductService.updateInventory(id, request);
        return ResponseEntity.ok(ApiResponse.success(sku));
    }
}
