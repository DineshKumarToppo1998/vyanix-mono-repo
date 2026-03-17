package in.vyanix.webservice.mapper;

import in.vyanix.webservice.dto.AddressResponse;
import in.vyanix.webservice.entity.Address;
import org.springframework.stereotype.Component;

@Component
public class AddressMapper {

    public AddressResponse mapToResponse(Address address) {
        if (address == null) {
            return null;
        }

        String fullName = address.getUser() != null ?
                address.getUser().getFirstName() + " " + address.getUser().getLastName() : "";

        return AddressResponse.builder()
                .id(address.getId())
                .userId(address.getUser() != null ? address.getUser().getId() : null)
                .line1(address.getLine1())
                .line2(address.getLine2())
                .city(address.getCity())
                .state(address.getState())
                .country(address.getCountry())
                .postalCode(address.getPostalCode())
                .fullName(fullName)
                .phone(address.getUser() != null ? address.getUser().getPhone() : "")
                .isDefault(address.getIsDefault())
                .build();
    }
}
