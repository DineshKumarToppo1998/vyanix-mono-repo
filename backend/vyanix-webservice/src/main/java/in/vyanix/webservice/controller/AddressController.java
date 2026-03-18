package in.vyanix.webservice.controller;

import in.vyanix.webservice.dto.*;
import in.vyanix.webservice.security.SecurityUtils;
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

    @Autowired
    private SecurityUtils securityUtils;

    @GetMapping("/addresses")
    public ResponseEntity<ApiResponse<List<AddressResponse>>> getUserAddresses() {
        UUID userId = securityUtils.getCurrentUserId();
        List<AddressResponse> addresses = addressService.getUserAddresses(userId);
        return ResponseEntity.ok(ApiResponse.success(addresses));
    }

    @PostMapping("/addresses")
    public ResponseEntity<ApiResponse<AddressResponse>> addAddress(
            @Valid @RequestBody AddressCreateRequest request) {
        UUID userId = securityUtils.getCurrentUserId();
        in.vyanix.webservice.entity.Address address = new in.vyanix.webservice.entity.Address();
        address.setLine1(request.line1());
        address.setLine2(request.line2());
        address.setCity(request.city());
        address.setState(request.state());
        address.setCountry(request.country());
        address.setPostalCode(request.postalCode());

        AddressResponse savedAddress = addressService.addAddress(userId, address);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(savedAddress));
    }

    @PutMapping("/addresses/{addressId}")
    public ResponseEntity<ApiResponse<AddressResponse>> updateAddress(
            @PathVariable UUID addressId,
            @Valid @RequestBody AddressUpdateRequest request) {
        UUID userId = securityUtils.getCurrentUserId();
        in.vyanix.webservice.entity.Address address = new in.vyanix.webservice.entity.Address();
        address.setLine1(request.line1());
        address.setLine2(request.line2());
        address.setCity(request.city());
        address.setState(request.state());
        address.setCountry(request.country());
        address.setPostalCode(request.postalCode());

        AddressResponse updatedAddress = addressService.updateAddress(userId, addressId, address);
        return ResponseEntity.ok(ApiResponse.success(updatedAddress));
    }

    @DeleteMapping("/addresses/{addressId}")
    public ResponseEntity<ApiResponse<Void>> deleteAddress(@PathVariable UUID addressId) {
        UUID userId = securityUtils.getCurrentUserId();
        addressService.deleteAddress(userId, addressId);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @PatchMapping("/addresses/{addressId}/default")
    public ResponseEntity<ApiResponse<AddressResponse>> setDefaultAddress(@PathVariable UUID addressId) {
        UUID userId = securityUtils.getCurrentUserId();
        AddressResponse updatedAddress = addressService.setDefaultAddress(userId, addressId);
        return ResponseEntity.ok(ApiResponse.success(updatedAddress));
    }
}
