package in.vyanix.webservice.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.util.UUID;

@Entity
@Table(name = "addresses")
@Getter
@Setter
public class Address {

    @Id
    @GeneratedValue
    private UUID id;

    @ManyToOne
    private User user;

    private String line1;
    private String line2;

    private String city;
    private String state;

    private String country;

    private String postalCode;

    private Boolean isDefault;

}