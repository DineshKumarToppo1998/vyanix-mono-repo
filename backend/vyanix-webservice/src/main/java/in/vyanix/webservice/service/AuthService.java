package in.vyanix.webservice.service;

import in.vyanix.webservice.dto.UserResponse;
import in.vyanix.webservice.dto.LoginResponse;
import in.vyanix.webservice.dto.AuthLoginResponse;
import in.vyanix.webservice.entity.RefreshToken;
import in.vyanix.webservice.entity.User;
import in.vyanix.webservice.entity.UserRole;
import in.vyanix.webservice.mapper.UserMapper;
import in.vyanix.webservice.repository.UserRepository;
import in.vyanix.webservice.service.exception.BadRequestException;
import in.vyanix.webservice.service.exception.ResourceNotFoundException;
import in.vyanix.webservice.service.exception.UnauthorizedException;
import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Authentication service with refresh token support.
 * Handles login, registration, and token management.
 */
@Service
public class AuthService {

    private static final Logger log = LoggerFactory.getLogger(AuthService.class);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final UserMapper userMapper;
    private final RefreshTokenService refreshTokenService;

    public AuthService(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            JwtTokenProvider jwtTokenProvider,
            UserMapper userMapper,
            RefreshTokenService refreshTokenService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtTokenProvider = jwtTokenProvider;
        this.userMapper = userMapper;
        this.refreshTokenService = refreshTokenService;
    }

    /**
     * Register a new user
     */
    @Transactional
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
        user.setRole(UserRole.USER);
        user.setTokenVersion(1);
        user.setEnabled(true);

        user = userRepository.save(user);

        log.info("User registered userId={} email={}", user.getId(), email);
        return userMapper.mapToResponse(user);
    }

    /**
     * Login with email and password
     * Returns access token and creates refresh token
     */
    @Transactional
    public AuthLoginResponse login(String email, String password, HttpServletRequest request) {
        log.info("Login attempt email={}", email);

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException(User.class, email));

        if (!passwordEncoder.matches(password, user.getPassword())) {
            log.warn("Login failed email={} reason=invalid_credentials", email);
            throw new UnauthorizedException("Invalid credentials", "INVALID_CREDENTIALS");
        }

        if (!user.isEnabled()) {
            log.warn("Login failed email={} reason=account_disabled", email);
            throw new UnauthorizedException("Account is disabled", "ACCOUNT_DISABLED");
        }

        // Generate access token
        String accessToken = jwtTokenProvider.generateAccessToken(user);

        // Create refresh token with device tracking
        String ipAddress = getClientIp(request);
        String userAgent = request.getHeader("User-Agent");
        RefreshToken refreshToken = refreshTokenService.createRefreshToken(
                user, ipAddress, userAgent, null);

        log.info("Login succeeded userId={} email={}", user.getId(), email);
        
        return AuthLoginResponse.builder()
                .accessToken(accessToken)
                .tokenType("Bearer")
                .expiresIn(jwtTokenProvider.getJwtExpirationMs() / 1000)
                .user(userMapper.mapToResponse(user))
                .refreshToken(refreshToken.getRawToken())  // For initial login only
                .build();
    }

    /**
     * Get current user by ID
     */
    public UserResponse getCurrentUser(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException(User.class, userId));

        return userMapper.mapToResponse(user);
    }

    /**
     * Get user by ID (for internal use)
     */
    public User getUserById(UUID userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException(User.class, userId));
    }

    /**
     * Authenticate user (for security filter)
     */
    public User authenticate(String email, String password) {
        log.info("Authentication attempt email={}", email);

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UnauthorizedException("Invalid credentials", "INVALID_CREDENTIALS"));

        if (!passwordEncoder.matches(password, user.getPassword())) {
            log.warn("Authentication failed email={} reason=invalid_credentials", email);
            throw new UnauthorizedException("Invalid credentials", "INVALID_CREDENTIALS");
        }

        if (!user.isEnabled()) {
            log.warn("Authentication failed email={} reason=account_disabled", email);
            throw new UnauthorizedException("Account is disabled", "ACCOUNT_DISABLED");
        }

        return user;
    }

    /**
     * Extract client IP address from request
     */
    private String getClientIp(HttpServletRequest request) {
        String ip = request.getHeader("X-Forwarded-For");
        if (ip == null || ip.isBlank() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeader("X-Real-IP");
        }
        if (ip == null || ip.isBlank() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getRemoteAddr();
        }
        if (ip != null && ip.contains(",")) {
            ip = ip.split(",")[0].trim();
        }
        return ip;
    }
}
