package in.vyanix.webservice.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.util.UUID;

@Entity
@Table(name = "sku_option_values")
@Getter
@Setter
public class SkuOptionValue {

    @Id
    @GeneratedValue
    private UUID id;

    @ManyToOne
    private Sku sku;

    @ManyToOne
    private ProductOptionValue optionValue;

}