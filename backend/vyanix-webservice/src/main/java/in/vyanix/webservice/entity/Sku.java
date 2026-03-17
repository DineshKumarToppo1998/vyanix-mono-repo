package in.vyanix.webservice.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "skus")
@Getter
@Setter
public class Sku {

    @Id
    @GeneratedValue
    private UUID id;

    @Column(unique = true)
    private String skuCode;

    private BigDecimal price;

    private Integer stock;

    private Double weight;

    @ManyToOne
    private Product product;

    @OneToMany(mappedBy = "sku", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<SkuOptionValue> optionValues;

}