package in.vyanix.webservice.service;

import in.vyanix.webservice.dto.UserResponse;
import in.vyanix.webservice.dto.LoginResponse;
import in.vyanix.webservice.entity.User;
import in.vyanix.webservice.mapper.UserMapper;
import in.vyanix.webservice.repository.UserRepository;
import in.vyanix.webservice.service.exception.BadRequestException;
import in.vyanix.webservice.service.exception.ResourceNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
public class AuthService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    @Autowired
    private UserMapper userMapper;

    public UserResponse register(String email, String password, String firstName, String lastName, String phone) {
        if (userRepository.findByEmail(email).isPresent()) {
            throw new BadRequestException("Email already registered");
        }

        User user = new User();
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode(password));
        user.setFirstName(firstName);
        user.setLastName(lastName);
        user.setPhone(phone);
        user.setCreatedAt(LocalDateTime.now());

        user = userRepository.save(user);

        return userMapper.mapToResponse(user);
    }

    public LoginResponse login(String email, String password) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException(User.class, email));

        if (!passwordEncoder.matches(password, user.getPassword())) {
            throw new BadRequestException("Invalid credentials");
        }

        String token = jwtTokenProvider.generateToken(user);
        return LoginResponse.builder()
                .userId(user.getId())
                .token(token)
                .build();
    }

    public UserResponse getCurrentUser(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException(User.class, userId));

        return userMapper.mapToResponse(user);
    }
}
