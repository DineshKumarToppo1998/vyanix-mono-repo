package in.vyanix.webservice.mapper;

import in.vyanix.webservice.dto.CategoryResponse;
import in.vyanix.webservice.entity.Category;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.stream.Collectors;

@Component
public class CategoryMapper {

    public CategoryResponse mapToResponse(Category category) {
        if (category == null) {
            return null;
        }

        return CategoryResponse.builder()
                .id(category.getId())
                .name(category.getName())
                .slug(category.getSlug())
                .parentId(category.getParent() != null ? category.getParent().getId() : null)
                .children(mapChildren(category.getChildren()))
                .build();
    }

    private List<CategoryResponse> mapChildren(List<Category> children) {
        if (children == null) {
            return List.of();
        }
        return children.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }
}
