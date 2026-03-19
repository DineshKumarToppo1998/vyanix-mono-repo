package in.vyanix.webservice.controller;

import in.vyanix.webservice.dto.ApiResponse;
import in.vyanix.webservice.dto.CategoryCreateRequest;
import in.vyanix.webservice.dto.CategoryResponse;
import in.vyanix.webservice.dto.CategoryUpdateRequest;
import in.vyanix.webservice.service.AdminCategoryService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping({"/api/admin", "/api/v1/admin"})
public class AdminCategoryController {

    private final AdminCategoryService adminCategoryService;

    public AdminCategoryController(AdminCategoryService adminCategoryService) {
        this.adminCategoryService = adminCategoryService;
    }

    @GetMapping("/categories")
    public ResponseEntity<ApiResponse<List<CategoryResponse>>> getAllCategories() {
        List<CategoryResponse> categories = adminCategoryService.getAllCategories();
        return ResponseEntity.ok(ApiResponse.success(categories));
    }

    @PostMapping("/categories")
    public ResponseEntity<ApiResponse<CategoryResponse>> createCategory(
            @Valid @RequestBody CategoryCreateRequest request) {
        CategoryResponse category = adminCategoryService.createCategory(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(category));
    }

    @PutMapping("/categories/{id}")
    public ResponseEntity<ApiResponse<CategoryResponse>> updateCategory(
            @PathVariable UUID id,
            @Valid @RequestBody CategoryUpdateRequest request) {
        CategoryResponse category = adminCategoryService.updateCategory(id, request);
        return ResponseEntity.ok(ApiResponse.success(category));
    }

    @DeleteMapping("/categories/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteCategory(@PathVariable UUID id) {
        adminCategoryService.deleteCategory(id);
        return ResponseEntity.ok(ApiResponse.success(null));
    }
}
