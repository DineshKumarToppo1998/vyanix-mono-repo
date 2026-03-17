package in.vyanix.webservice.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.util.UUID;

@Entity
@Table(name = "cart_items")
@Getter
@Setter
public class CartItem {

    @Id
    @GeneratedValue
    private UUID id;

    @ManyToOne
    private Cart cart;

    @ManyToOne
    private Sku sku;

    private Integer quantity;

}