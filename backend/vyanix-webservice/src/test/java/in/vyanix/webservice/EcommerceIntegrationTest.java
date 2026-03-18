package in.vyanix.webservice;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import in.vyanix.webservice.entity.Category;
import in.vyanix.webservice.entity.Product;
import in.vyanix.webservice.entity.ProductImage;
import in.vyanix.webservice.entity.Sku;
import in.vyanix.webservice.repository.CartRepository;
import in.vyanix.webservice.repository.CategoryRepository;
import in.vyanix.webservice.repository.OrderRepository;
import in.vyanix.webservice.repository.ProductRepository;
import in.vyanix.webservice.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.math.BigDecimal;
import java.util.LinkedHashSet;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@Testcontainers
@SpringBootTest(properties = {
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "spring.autoconfigure.exclude=org.springframework.boot.autoconfigure.data.redis.RedisAutoConfiguration,org.springframework.boot.autoconfigure.data.redis.RedisRepositoriesAutoConfiguration"
})
@AutoConfigureMockMvc
class EcommerceIntegrationTest {

    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine");

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
        registry.add("JWT_SECRET", () -> "integration-test-super-secret-key-12345678901234567890");
        registry.add("app.cors.allowed-origins", () -> "http://localhost:3000");
    }

    @Autowired
    private MockMvc mockMvc;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private CartRepository cartRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private UserRepository userRepository;

    @BeforeEach
    void cleanDatabase() {
        orderRepository.deleteAll();
        cartRepository.deleteAll();
        productRepository.deleteAll();
        categoryRepository.deleteAll();
        userRepository.deleteAll();
    }

    @Test
    void authRegisterAndLoginFlowWorks() throws Exception {
        String email = uniqueEmail();

        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "email", email,
                                "password", "SecurePassword123!",
                                "firstName", "Jane",
                                "lastName", "Doe",
                                "phone", "9999999999"
                        ))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.email").value(email))
                .andExpect(jsonPath("$.data.role").value("USER"));

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "email", email,
                                "password", "SecurePassword123!"
                        ))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.token").isNotEmpty())
                .andExpect(jsonPath("$.data.tokenType").value("Bearer"));
    }

    @Test
    void cartOperationsWorkAgainstAuthenticatedUser() throws Exception {
        SeededCatalog seededCatalog = seedCatalog();
        String token = registerAndLogin(uniqueEmail());

        mockMvc.perform(get("/api/v1/cart")
                        .header("Authorization", bearer(token)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.itemCount").value(0));

        MvcResult addResult = mockMvc.perform(post("/api/v1/cart/items")
                        .header("Authorization", bearer(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "skuId", seededCatalog.skuId().toString(),
                                "quantity", 2
                        ))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.itemCount").value(2))
                .andReturn();

        JsonNode addJson = readJson(addResult);
        String itemId = addJson.path("data").path("items").get(0).path("id").asText();

        mockMvc.perform(put("/api/v1/cart/items/{itemId}", itemId)
                        .header("Authorization", bearer(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "quantity", 3
                        ))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.itemCount").value(3));

        mockMvc.perform(delete("/api/v1/cart/items/{itemId}", itemId)
                        .header("Authorization", bearer(token)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.itemCount").value(0));
    }

    @Test
    void checkoutFlowIsPaidAndIdempotent() throws Exception {
        SeededCatalog seededCatalog = seedCatalog();
        String token = registerAndLogin(uniqueEmail());

        mockMvc.perform(post("/api/v1/cart/items")
                        .header("Authorization", bearer(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "skuId", seededCatalog.skuId().toString(),
                                "quantity", 1
                        ))))
                .andExpect(status().isCreated());

        String idempotencyKey = UUID.randomUUID().toString();
        String checkoutRequest = objectMapper.writeValueAsString(Map.of(
                "shippingAddress", Map.of(
                        "line1", "123 Checkout Lane",
                        "line2", "Apartment 9",
                        "city", "Ranchi",
                        "state", "Jharkhand",
                        "country", "India",
                        "postalCode", "834001"
                ),
                "items", new Object[]{Map.of(
                        "skuId", seededCatalog.skuId().toString(),
                        "quantity", 1
                )}
        ));

        MvcResult checkoutResult = mockMvc.perform(post("/api/v1/orders")
                        .header("Authorization", bearer(token))
                        .header("Idempotency-Key", idempotencyKey)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(checkoutRequest))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.status").value("PAID"))
                .andExpect(jsonPath("$.data.payment.status").value("SUCCESS"))
                .andReturn();

        JsonNode checkoutJson = readJson(checkoutResult);
        String firstOrderId = checkoutJson.path("data").path("id").asText();

        MvcResult repeatedCheckout = mockMvc.perform(post("/api/v1/orders")
                        .header("Authorization", bearer(token))
                        .header("Idempotency-Key", idempotencyKey)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(checkoutRequest))
                .andExpect(status().isCreated())
                .andReturn();

        JsonNode repeatedJson = readJson(repeatedCheckout);
        assertThat(repeatedJson.path("data").path("id").asText()).isEqualTo(firstOrderId);
        assertThat(orderRepository.findAll()).hasSize(1);

        mockMvc.perform(get("/api/v1/cart")
                        .header("Authorization", bearer(token)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.itemCount").value(0));
    }

    @Test
    void orderRetrievalReturnsUserOrders() throws Exception {
        SeededCatalog seededCatalog = seedCatalog();
        String token = registerAndLogin(uniqueEmail());

        mockMvc.perform(post("/api/v1/cart/items")
                        .header("Authorization", bearer(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "skuId", seededCatalog.skuId().toString(),
                                "quantity", 1
                        ))))
                .andExpect(status().isCreated());

        MvcResult checkoutResult = mockMvc.perform(post("/api/v1/orders")
                        .header("Authorization", bearer(token))
                        .header("Idempotency-Key", UUID.randomUUID().toString())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "shippingAddress", Map.of(
                                        "line1", "123 Order Street",
                                        "line2", "Near Market",
                                        "city", "Ranchi",
                                        "state", "Jharkhand",
                                        "country", "India",
                                        "postalCode", "834001"
                                ),
                                "items", new Object[]{Map.of(
                                        "skuId", seededCatalog.skuId().toString(),
                                        "quantity", 1
                                )}
                        ))))
                .andExpect(status().isCreated())
                .andReturn();

        String orderId = readJson(checkoutResult).path("data").path("id").asText();

        mockMvc.perform(get("/api/v1/orders")
                        .header("Authorization", bearer(token)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.length()").value(1))
                .andExpect(jsonPath("$.data[0].id").value(orderId));

        mockMvc.perform(get("/api/v1/orders/{id}", orderId)
                        .header("Authorization", bearer(token)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.id").value(orderId))
                .andExpect(jsonPath("$.data.payment.status").value("SUCCESS"));
    }

    private String registerAndLogin(String email) throws Exception {
        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "email", email,
                                "password", "SecurePassword123!",
                                "firstName", "Jane",
                                "lastName", "Doe",
                                "phone", "9999999999"
                        ))))
                .andExpect(status().isCreated());

        MvcResult loginResult = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "email", email,
                                "password", "SecurePassword123!"
                        ))))
                .andExpect(status().isOk())
                .andReturn();

        return readJson(loginResult).path("data").path("token").asText();
    }

    private SeededCatalog seedCatalog() {
        Category category = new Category();
        category.setName("Electronics");
        category.setSlug("electronics");
        category = categoryRepository.save(category);

        Product product = new Product();
        product.setName("Integration Headphones");
        product.setSlug("integration-headphones");
        product.setDescription("Seeded product for integration tests");
        product.setCategory(category);
        product.setRating(4.7);
        product.setReviewsCount(12);
        product.setImages(new LinkedHashSet<>());
        product.setOptions(new LinkedHashSet<>());
        product.setSkus(new LinkedHashSet<>());
        product.setProductTags(new LinkedHashSet<>());

        ProductImage image = new ProductImage();
        image.setProduct(product);
        image.setUrl("https://picsum.photos/seed/integration-product/800/800");
        image.setPosition(0);
        product.getImages().add(image);

        Sku sku = new Sku();
        sku.setProduct(product);
        sku.setSkuCode("IT-SKU-001");
        sku.setPrice(new BigDecimal("249.99"));
        sku.setStock(25);
        sku.setWeight(1.25);
        sku.setOptionValues(new LinkedHashSet<>());
        product.getSkus().add(sku);

        Product savedProduct = productRepository.save(product);
        UUID skuId = savedProduct.getSkus().stream().findFirst().orElseThrow().getId();
        return new SeededCatalog(savedProduct.getId(), skuId);
    }

    private JsonNode readJson(MvcResult result) throws Exception {
        return objectMapper.readTree(result.getResponse().getContentAsString());
    }

    private String bearer(String token) {
        return "Bearer " + token;
    }

    private String uniqueEmail() {
        return "user-" + UUID.randomUUID() + "@example.com";
    }

    private record SeededCatalog(UUID productId, UUID skuId) {
    }
}
