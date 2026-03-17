package in.vyanix.webservice.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.util.UUID;

@Entity
@Table(name = "product_option_values")
@Getter
@Setter
public class ProductOptionValue {

    @Id
    @GeneratedValue
    private UUID id;

    private String value;

    @ManyToOne
    private ProductOption option;

}