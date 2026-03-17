package in.vyanix.webservice.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "product_options")
@Getter
@Setter
public class ProductOption {

    @Id
    @GeneratedValue
    private UUID id;

    private String name;

    @ManyToOne
    private Product product;

    @OneToMany(mappedBy = "option")
    private List<ProductOptionValue> values;

}