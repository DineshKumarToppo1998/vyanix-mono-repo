package in.vyanix.webservice.mapper;

import in.vyanix.webservice.dto.*;
import in.vyanix.webservice.entity.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.stream.Collectors;

@Component
public class EntityToDTOMapper {

    @Autowired
    private ProductMapper productMapper;

    @Autowired
    private CategoryMapper categoryMapper;

    @Autowired
    private SkuMapper skuMapper;

    @Autowired
    private CartMapper cartMapper;

    @Autowired
    private OrderMapper orderMapper;

    @Autowired
    private UserMapper userMapper;

    @Autowired
    private AddressMapper addressMapper;

    public ProductResponse mapProductToResponse(Product product) {
        return productMapper.mapToResponse(product);
    }

    public CategoryResponse mapCategoryToResponse(Category category) {
        return categoryMapper.mapToResponse(category);
    }

    public SkuResponse mapSkuToResponse(Sku sku) {
        return skuMapper.mapToResponse(sku);
    }

    public CartResponse mapCartToResponse(Cart cart) {
        return cartMapper.mapToResponse(cart);
    }

    public OrderResponse mapOrderToResponse(Order order) {
        return orderMapper.mapToResponse(order);
    }

    public UserResponse mapUserToResponse(User user) {
        return userMapper.mapToResponse(user);
    }

    public AddressResponse mapAddressToResponse(Address address) {
        return addressMapper.mapToResponse(address);
    }

    public List<ProductResponse> mapProductsToResponses(List<Product> products) {
        return products.stream()
                .map(productMapper::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<CategoryResponse> mapCategoriesToResponses(List<Category> categories) {
        return categories.stream()
                .map(categoryMapper::mapToResponse)
                .collect(Collectors.toList());
    }
}
