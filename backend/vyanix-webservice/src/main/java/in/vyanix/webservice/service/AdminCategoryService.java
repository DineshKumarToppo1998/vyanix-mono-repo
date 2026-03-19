package in.vyanix.webservice.service;

import in.vyanix.webservice.dto.CategoryCreateRequest;
import in.vyanix.webservice.dto.CategoryResponse;
import in.vyanix.webservice.dto.CategoryUpdateRequest;
import in.vyanix.webservice.entity.Category;
import in.vyanix.webservice.mapper.CategoryMapper;
import in.vyanix.webservice.repository.CategoryRepository;
import in.vyanix.webservice.service.exception.BadRequestException;
import in.vyanix.webservice.service.exception.ResourceNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@Transactional
public class AdminCategoryService {

    private final CategoryRepository categoryRepository;
    private final CategoryMapper categoryMapper;

    public AdminCategoryService(
            CategoryRepository categoryRepository,
            CategoryMapper categoryMapper) {
        this.categoryRepository = categoryRepository;
        this.categoryMapper = categoryMapper;
    }

    @Transactional(readOnly = true)
    public List<CategoryResponse> getAllCategories() {
        List<Category> categories = categoryRepository.findAll();
        return categories.stream()
                .map(categoryMapper::mapToResponse)
                .toList();
    }

    public CategoryResponse createCategory(CategoryCreateRequest request) {
        // Check if slug already exists
        if (categoryRepository.findBySlug(request.slug()).isPresent()) {
            throw new BadRequestException("Category slug already exists: " + request.slug());
        }

        Category category = new Category();
        category.setName(request.name());
        category.setSlug(request.slug());

        // Set parent category if provided
        if (request.parentId() != null) {
            Category parent = categoryRepository.findById(request.parentId())
                    .orElseThrow(() -> new ResourceNotFoundException(Category.class, request.parentId()));
            category.setParent(parent);
        }

        Category savedCategory = categoryRepository.save(category);
        return categoryMapper.mapToResponse(savedCategory);
    }

    public CategoryResponse updateCategory(UUID id, CategoryUpdateRequest request) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(Category.class, id));

        // Check if new slug conflicts with another category
        categoryRepository.findBySlug(request.slug())
                .filter(existing -> !existing.getId().equals(id))
                .ifPresent(existing -> {
                    throw new BadRequestException("Category slug already exists: " + request.slug());
                });

        category.setName(request.name());
        category.setSlug(request.slug());

        // Update parent category
        if (request.parentId() != null) {
            // Prevent self-parenting
            if (request.parentId().equals(id)) {
                throw new BadRequestException("Category cannot be its own parent");
            }

            // Prevent circular reference (cannot set parent to a descendant)
            if (isDescendant(category, request.parentId())) {
                throw new BadRequestException("Cannot set parent to a descendant category (circular reference)");
            }

            Category parent = categoryRepository.findById(request.parentId())
                    .orElseThrow(() -> new ResourceNotFoundException(Category.class, request.parentId()));
            category.setParent(parent);
        } else {
            category.setParent(null);
        }

        Category updatedCategory = categoryRepository.save(category);
        return categoryMapper.mapToResponse(updatedCategory);
    }

    public void deleteCategory(UUID id) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(Category.class, id));

        // Check if category has children
        if (category.getChildren() != null && !category.getChildren().isEmpty()) {
            throw new BadRequestException("Cannot delete category with subcategories. Delete or move subcategories first.");
        }

        categoryRepository.delete(category);
    }

    /**
     * Check if a category is a descendant of another category
     */
    private boolean isDescendant(Category category, UUID potentialAncestorId) {
        Category current = category.getParent();
        while (current != null) {
            if (current.getId().equals(potentialAncestorId)) {
                return true;
            }
            current = current.getParent();
        }
        return false;
    }
}
