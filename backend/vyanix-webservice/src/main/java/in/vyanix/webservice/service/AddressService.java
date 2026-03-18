package in.vyanix.webservice.service;

import in.vyanix.webservice.dto.AddressResponse;
import in.vyanix.webservice.entity.Address;
import in.vyanix.webservice.entity.User;
import in.vyanix.webservice.mapper.AddressMapper;
import in.vyanix.webservice.repository.AddressRepository;
import in.vyanix.webservice.repository.UserRepository;
import in.vyanix.webservice.service.exception.ResourceNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class AddressService {

    @Autowired
    private AddressRepository addressRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private AddressMapper addressMapper;

    public List<AddressResponse> getUserAddresses(UUID userId) {
        List<Address> addresses = addressRepository.findByUserId(userId);
        return addresses.stream()
                .map(addressMapper::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public AddressResponse addAddress(UUID userId, Address address) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException(User.class, userId));

        address.setUser(user);
        address.setIsDefault(false); // Default to not default

        // If this is the first address, set it as default
        List<Address> existingAddresses = addressRepository.findByUserId(userId);
        if (existingAddresses.isEmpty()) {
            address.setIsDefault(true);
        }

        address = addressRepository.save(address);
        return addressMapper.mapToResponse(address);
    }

    @Transactional
    public AddressResponse updateAddress(UUID userId, UUID addressId, Address addressUpdates) {
        Address address = addressRepository.findByIdAndUserId(addressId, userId)
                .orElseThrow(() -> new ResourceNotFoundException(Address.class, addressId));

        address.setLine1(addressUpdates.getLine1());
        address.setLine2(addressUpdates.getLine2());
        address.setCity(addressUpdates.getCity());
        address.setState(addressUpdates.getState());
        address.setCountry(addressUpdates.getCountry());
        address.setPostalCode(addressUpdates.getPostalCode());

        return addressMapper.mapToResponse(address);
    }

    @Transactional
    public void deleteAddress(UUID userId, UUID addressId) {
        Address address = addressRepository.findByIdAndUserId(addressId, userId)
                .orElseThrow(() -> new ResourceNotFoundException(Address.class, addressId));
        addressRepository.delete(address);
    }

    @Transactional
    public AddressResponse setDefaultAddress(UUID userId, UUID addressId) {
        Address address = addressRepository.findByIdAndUserId(addressId, userId)
                .orElseThrow(() -> new ResourceNotFoundException(Address.class, addressId));

        // Remove default from all other addresses
        List<Address> userAddresses = addressRepository.findByUserId(userId);
        userAddresses.forEach(a -> a.setIsDefault(false));

        address.setIsDefault(true);
        addressRepository.save(address);

        return addressMapper.mapToResponse(address);
    }
}
