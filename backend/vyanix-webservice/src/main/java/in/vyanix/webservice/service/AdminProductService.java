package in.vyanix.webservice.service;

import in.vyanix.webservice.dto.AdminInventoryUpdateRequest;
import in.vyanix.webservice.dto.AdminProductCreateRequest;
import in.vyanix.webservice.dto.ProductOptionCreateRequest;
import in.vyanix.webservice.dto.ProductResponse;
import in.vyanix.webservice.dto.SkuCreateRequest;
import in.vyanix.webservice.dto.SkuResponse;
import in.vyanix.webservice.entity.Category;
import in.vyanix.webservice.entity.Product;
import in.vyanix.webservice.entity.ProductImage;
import in.vyanix.webservice.entity.ProductOption;
import in.vyanix.webservice.entity.ProductOptionValue;
import in.vyanix.webservice.entity.ProductTag;
import in.vyanix.webservice.entity.Sku;
import in.vyanix.webservice.entity.SkuOptionValue;
import in.vyanix.webservice.mapper.ProductMapper;
import in.vyanix.webservice.mapper.SkuMapper;
import in.vyanix.webservice.repository.CategoryRepository;
import in.vyanix.webservice.repository.ProductOptionValueRepository;
import in.vyanix.webservice.repository.ProductRepository;
import in.vyanix.webservice.repository.SkuRepository;
import in.vyanix.webservice.service.exception.BadRequestException;
import in.vyanix.webservice.service.exception.ResourceNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class AdminProductService {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final ProductOptionValueRepository productOptionValueRepository;
    private final SkuRepository skuRepository;
    private final ProductMapper productMapper;
    private final SkuMapper skuMapper;

    public AdminProductService(
            ProductRepository productRepository,
            CategoryRepository categoryRepository,
            ProductOptionValueRepository productOptionValueRepository,
            SkuRepository skuRepository,
            ProductMapper productMapper,
            SkuMapper skuMapper) {
        this.productRepository = productRepository;
        this.categoryRepository = categoryRepository;
        this.productOptionValueRepository = productOptionValueRepository;
        this.skuRepository = skuRepository;
        this.productMapper = productMapper;
        this.skuMapper = skuMapper;
    }

    @Transactional
    public ProductResponse createProduct(AdminProductCreateRequest request) {
        if (productRepository.findBySlug(request.slug()).isPresent()) {
            throw new BadRequestException("Product slug already exists");
        }

        Category category = categoryRepository.findById(request.categoryId())
                .orElseThrow(() -> new ResourceNotFoundException(Category.class, request.categoryId()));

        Product product = new Product();
        product.setName(request.name());
        product.setSlug(request.slug());
        product.setDescription(request.description());
        product.setCategory(category);
        product.setRating(request.rating() != null ? request.rating() : 0.0);
        product.setReviewsCount(request.reviewsCount() != null ? request.reviewsCount() : 0);
        product.setImages(buildImages(product, request.imageUrls()));
        product.setOptions(new LinkedHashSet<>());
        product.setSkus(new LinkedHashSet<>());
        product.setProductTags(buildTags(product, request.tags()));

        Product savedProduct = productRepository.save(product);
        return productMapper.mapToResponse(loadProduct(savedProduct.getId()));
    }

    @Transactional
    public ProductResponse addOptions(UUID productId, List<ProductOptionCreateRequest> requests) {
        if (requests == null || requests.isEmpty()) {
            throw new BadRequestException("At least one option is required");
        }

        Product product = loadProduct(productId);
        Set<ProductOption> options = product.getOptions() != null ? product.getOptions() : new LinkedHashSet<>();

        for (ProductOptionCreateRequest request : requests) {
            ProductOption option = new ProductOption();
            option.setProduct(product);
            option.setName(request.name());
            option.setValues(buildOptionValues(option, request.values()));
            options.add(option);
        }

        product.setOptions(options);
        productRepository.save(product);
        return productMapper.mapToResponse(loadProduct(productId));
    }

    @Transactional
    public ProductResponse addSkus(UUID productId, List<SkuCreateRequest> requests) {
        if (requests == null || requests.isEmpty()) {
            throw new BadRequestException("At least one SKU is required");
        }

        Product product = loadProduct(productId);
        Set<Sku> skus = product.getSkus() != null ? product.getSkus() : new LinkedHashSet<>();

        Map<UUID, ProductOptionValue> optionValuesById = product.getOptions().stream()
                .flatMap(option -> option.getValues().stream())
                .collect(Collectors.toMap(ProductOptionValue::getId, Function.identity()));

        for (SkuCreateRequest request : requests) {
            if (skuRepository.findBySkuCode(request.skuCode()).isPresent()) {
                throw new BadRequestException("SKU code already exists: " + request.skuCode());
            }

            Sku sku = new Sku();
            sku.setProduct(product);
            sku.setSkuCode(request.skuCode());
            sku.setPrice(request.price());
            sku.setStock(request.stock());
            sku.setWeight(request.weight());

            Set<SkuOptionValue> optionValues = new LinkedHashSet<>();
            if (request.optionValues() != null) {
                for (var optionValueRequest : request.optionValues()) {
                    ProductOptionValue productOptionValue = optionValuesById.get(optionValueRequest.productOptionValueId());
                    if (productOptionValue == null) {
                        throw new BadRequestException("Invalid product option value for SKU: " + optionValueRequest.productOptionValueId());
                    }

                    SkuOptionValue skuOptionValue = new SkuOptionValue();
                    skuOptionValue.setSku(sku);
                    skuOptionValue.setOptionValue(productOptionValue);
                    optionValues.add(skuOptionValue);
                }
            }

            sku.setOptionValues(optionValues);
            skus.add(sku);
        }

        product.setSkus(skus);
        productRepository.save(product);
        return productMapper.mapToResponse(loadProduct(productId));
    }

    @Transactional
    public SkuResponse updateInventory(UUID skuId, AdminInventoryUpdateRequest request) {
        Sku sku = skuRepository.findById(skuId)
                .orElseThrow(() -> new ResourceNotFoundException(Sku.class, skuId));
        sku.setStock(request.stock());
        skuRepository.save(sku);
        return skuMapper.mapToResponse(sku);
    }

    private Product loadProduct(UUID productId) {
        return productRepository.findByIdWithRelations(productId)
                .orElseThrow(() -> new ResourceNotFoundException(Product.class, productId));
    }

    private Set<ProductImage> buildImages(Product product, List<String> imageUrls) {
        Set<ProductImage> images = new LinkedHashSet<>();
        if (imageUrls == null) {
            return images;
        }

        for (int i = 0; i < imageUrls.size(); i++) {
            String imageUrl = imageUrls.get(i);
            if (imageUrl == null || imageUrl.isBlank()) {
                continue;
            }

            ProductImage image = new ProductImage();
            image.setProduct(product);
            image.setUrl(imageUrl);
            image.setPosition(i);
            images.add(image);
        }
        return images;
    }

    private Set<ProductTag> buildTags(Product product, List<String> tags) {
        Set<ProductTag> productTags = new LinkedHashSet<>();
        if (tags == null) {
            return productTags;
        }

        for (String tagName : tags) {
            if (tagName == null || tagName.isBlank()) {
                continue;
            }

            ProductTag tag = new ProductTag();
            tag.setProduct(product);
            tag.setName(tagName.trim());
            productTags.add(tag);
        }
        return productTags;
    }

    private Set<ProductOptionValue> buildOptionValues(ProductOption option, List<String> values) {
        Set<ProductOptionValue> optionValues = new LinkedHashSet<>();
        if (values == null || values.isEmpty()) {
            throw new BadRequestException("Option values are required");
        }

        for (String value : values) {
            if (value == null || value.isBlank()) {
                continue;
            }

            ProductOptionValue optionValue = new ProductOptionValue();
            optionValue.setOption(option);
            optionValue.setValue(value.trim());
            optionValues.add(optionValue);
        }

        if (optionValues.isEmpty()) {
            throw new BadRequestException("Option values are required");
        }

        return optionValues;
    }
}
