package in.vyanix.webservice.controller;

import in.vyanix.webservice.dto.*;
import in.vyanix.webservice.service.AddressService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1")
public class AddressController {

    @Autowired
    private AddressService addressService;

    @GetMapping("/addresses")
    public ResponseEntity<ApiResponse<List<AddressResponse>>> getUserAddresses(@RequestParam UUID userId) {
        List<AddressResponse> addresses = addressService.getUserAddresses(userId);
        ApiResponse<List<AddressResponse>> response = ApiResponse.<List<AddressResponse>>builder()
                .requestId(UUID.randomUUID())
                .statusCode(HttpStatus.OK.value())
                .message("Addresses retrieved successfully")
                .data(addresses)
                .build();
        return ResponseEntity.ok(response);
    }

    @PostMapping("/addresses")
    public ResponseEntity<ApiResponse<AddressResponse>> addAddress(
            @RequestParam UUID userId,
            @Valid @RequestBody AddressCreateRequest request) {
        in.vyanix.webservice.entity.Address address = new in.vyanix.webservice.entity.Address();
        address.setLine1(request.line1());
        address.setLine2(request.line2());
        address.setCity(request.city());
        address.setState(request.state());
        address.setCountry(request.country());
        address.setPostalCode(request.postalCode());

        AddressResponse savedAddress = addressService.addAddress(userId, address);
        ApiResponse<AddressResponse> response = ApiResponse.<AddressResponse>builder()
                .requestId(UUID.randomUUID())
                .statusCode(HttpStatus.CREATED.value())
                .message("Address added successfully")
                .data(savedAddress)
                .build();
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PutMapping("/addresses/{addressId}")
    public ResponseEntity<ApiResponse<AddressResponse>> updateAddress(
            @PathVariable UUID addressId,
            @Valid @RequestBody AddressUpdateRequest request) {
        in.vyanix.webservice.entity.Address address = new in.vyanix.webservice.entity.Address();
        address.setLine1(request.line1());
        address.setLine2(request.line2());
        address.setCity(request.city());
        address.setState(request.state());
        address.setCountry(request.country());
        address.setPostalCode(request.postalCode());

        AddressResponse updatedAddress = addressService.updateAddress(addressId, address);
        ApiResponse<AddressResponse> response = ApiResponse.<AddressResponse>builder()
                .requestId(UUID.randomUUID())
                .statusCode(HttpStatus.OK.value())
                .message("Address updated successfully")
                .data(updatedAddress)
                .build();
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/addresses/{addressId}")
    public ResponseEntity<ApiResponse<Void>> deleteAddress(@PathVariable UUID addressId) {
        addressService.deleteAddress(addressId);
        ApiResponse<Void> response = ApiResponse.<Void>builder()
                .requestId(UUID.randomUUID())
                .statusCode(HttpStatus.NO_CONTENT.value())
                .message("Address deleted successfully")
                .build();
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/addresses/{addressId}/default")
    public ResponseEntity<ApiResponse<AddressResponse>> setDefaultAddress(@PathVariable UUID addressId) {
        AddressResponse updatedAddress = addressService.setDefaultAddress(addressId);
        ApiResponse<AddressResponse> response = ApiResponse.<AddressResponse>builder()
                .requestId(UUID.randomUUID())
                .statusCode(HttpStatus.OK.value())
                .message("Default address updated successfully")
                .data(updatedAddress)
                .build();
        return ResponseEntity.ok(response);
    }
}
