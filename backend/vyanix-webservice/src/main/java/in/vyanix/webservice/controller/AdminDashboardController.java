package in.vyanix.webservice.controller;

import in.vyanix.webservice.dto.AdminOrderStatusUpdateRequest;
import in.vyanix.webservice.dto.ApiResponse;
import in.vyanix.webservice.entity.Order;
import in.vyanix.webservice.entity.OrderStatus;
import in.vyanix.webservice.service.AdminDashboardService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping({"/api/admin", "/api/v1/admin"})
public class AdminDashboardController {

    private final AdminDashboardService adminDashboardService;

    public AdminDashboardController(AdminDashboardService adminDashboardService) {
        this.adminDashboardService = adminDashboardService;
    }

    @GetMapping("/dashboard/stats")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getDashboardStats() {
        Map<String, Object> stats = adminDashboardService.getDashboardStats();
        return ResponseEntity.ok(ApiResponse.success(stats));
    }

    @GetMapping("/dashboard/orders")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getRecentOrders(
            @RequestParam(defaultValue = "10") int limit) {
        List<Map<String, Object>> orders = adminDashboardService.getRecentOrders(limit);
        return ResponseEntity.ok(ApiResponse.success(orders));
    }

    @GetMapping("/dashboard/products")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getRecentProducts(
            @RequestParam(defaultValue = "10") int limit) {
        List<Map<String, Object>> products = adminDashboardService.getRecentProducts(limit);
        return ResponseEntity.ok(ApiResponse.success(products));
    }

    @GetMapping("/orders")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getAllOrders(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        List<Map<String, Object>> orders = adminDashboardService.getAllOrders(page, size);
        return ResponseEntity.ok(ApiResponse.success(orders));
    }

    @PatchMapping("/orders/{id}/status")
    public ResponseEntity<ApiResponse<Order>> updateOrderStatus(
            @PathVariable UUID id,
            @Valid @RequestBody AdminOrderStatusUpdateRequest request) {
        Order order = adminDashboardService.updateOrderStatus(id, request.status());
        return ResponseEntity.ok(ApiResponse.success(order));
    }
}
