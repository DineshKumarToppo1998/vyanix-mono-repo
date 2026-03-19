package in.vyanix.webservice.service;

import in.vyanix.webservice.entity.Order;
import in.vyanix.webservice.entity.Product;
import in.vyanix.webservice.entity.Sku;
import in.vyanix.webservice.entity.User;
import in.vyanix.webservice.repository.OrderRepository;
import in.vyanix.webservice.repository.ProductRepository;
import in.vyanix.webservice.repository.UserRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@Service
@Transactional(readOnly = true)
public class AdminDashboardService {

    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;

    public AdminDashboardService(
            OrderRepository orderRepository,
            ProductRepository productRepository,
            UserRepository userRepository) {
        this.orderRepository = orderRepository;
        this.productRepository = productRepository;
        this.userRepository = userRepository;
    }

    public Map<String, Object> getDashboardStats() {
        long totalProducts = productRepository.count();
        long totalOrders = orderRepository.count();
        long totalCustomers = userRepository.count();

        // Calculate total revenue from completed orders
        List<Order> allOrders = orderRepository.findAll();
        BigDecimal totalRevenue = allOrders.stream()
                .filter(order -> "COMPLETED".equals(order.getStatus()))
                .map(Order::getTotalAmount)
                .filter(amount -> amount != null)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return Map.of(
                "totalProducts", totalProducts,
                "totalOrders", totalOrders,
                "totalRevenue", totalRevenue,
                "totalCustomers", totalCustomers
        );
    }

    public List<Map<String, Object>> getRecentOrders(int limit) {
        List<Order> orders = orderRepository.findAll(
                PageRequest.of(0, limit, org.springframework.data.domain.Sort.by(
                        org.springframework.data.domain.Sort.Direction.DESC, "createdAt"))
        ).getContent();

        return orders.stream().map(order -> {
            String customerName = order.getUser() != null
                    ? (order.getUser().getFirstName() + " " + order.getUser().getLastName()).trim()
                    : "Guest";

            return Map.<String, Object>of(
                    "id", order.getId() != null ? order.getId().toString() : null,
                    "customerName", customerName,
                    "amount", order.getTotalAmount(),
                    "status", order.getStatus() != null ? order.getStatus().toString() : null,
                    "createdAt", order.getCreatedAt()
            );
        }).toList();
    }

    public List<Map<String, Object>> getRecentProducts(int limit) {
        List<Product> products = productRepository.findAll(
                PageRequest.of(0, limit, org.springframework.data.domain.Sort.by(
                        org.springframework.data.domain.Sort.Direction.DESC, "id"))
        ).getContent();

        return products.stream().map(product -> {
            BigDecimal minPrice = product.getSkus().stream()
                    .map(Sku::getPrice)
                    .filter(java.util.Objects::nonNull)
                    .min(BigDecimal::compareTo)
                    .orElse(null);

            BigDecimal maxPrice = product.getSkus().stream()
                    .map(Sku::getPrice)
                    .filter(java.util.Objects::nonNull)
                    .max(BigDecimal::compareTo)
                    .orElse(null);

            int totalStock = product.getSkus().stream()
                    .mapToInt(sku -> sku.getStock() != null ? sku.getStock() : 0)
                    .sum();

            return Map.<String, Object>of(
                    "id", product.getId() != null ? product.getId().toString() : null,
                    "name", product.getName(),
                    "slug", product.getSlug(),
                    "categoryName", product.getCategory() != null ? product.getCategory().getName() : null,
                    "minPrice", minPrice,
                    "maxPrice", maxPrice,
                    "stock", totalStock
            );
        }).toList();
    }
}
