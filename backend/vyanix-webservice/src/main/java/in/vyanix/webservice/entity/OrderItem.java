package in.vyanix.webservice.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.UUID;

@Entity
@Table(name = "order_items")
@Getter
@Setter
public class OrderItem {

    @Id
    @GeneratedValue
    private UUID id;

    @ManyToOne
    private Order order;

    @ManyToOne
    private Sku sku;

    private String productName;

    private BigDecimal price;

    private Integer quantity;

}