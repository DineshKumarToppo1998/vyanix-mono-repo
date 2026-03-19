package in.vyanix.webservice.controller;

import in.vyanix.webservice.dto.ApiResponse;
import in.vyanix.webservice.service.AdminDashboardService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

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
}
