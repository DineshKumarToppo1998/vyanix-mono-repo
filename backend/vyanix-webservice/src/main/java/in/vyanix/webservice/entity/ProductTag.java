package in.vyanix.webservice.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.util.UUID;

@Entity
@Table(name = "product_tags")
@Getter
@Setter
public class ProductTag {

    @Id
    @GeneratedValue
    private UUID id;

    private String name;

    @ManyToOne
    private Product product;

}