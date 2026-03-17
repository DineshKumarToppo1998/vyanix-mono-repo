package in.vyanix.webservice.controller;

import in.vyanix.webservice.dto.*;
import in.vyanix.webservice.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    @Autowired
    private AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<UserResponse>> register(
            @Valid @RequestBody UserRegisterRequest request) {
        UserResponse user = authService.register(request.email(), request.password(),
                request.firstName(), request.lastName(), request.phone());
        ApiResponse<UserResponse> response = ApiResponse.<UserResponse>builder()
                .requestId(UUID.randomUUID())
                .statusCode(HttpStatus.CREATED.value())
                .message("User registered successfully")
                .data(user)
                .build();
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<LoginResponse>> login(
            @RequestParam String email,
            @RequestParam String password) {
        LoginResponse result = authService.login(email, password);
        ApiResponse<LoginResponse> response = ApiResponse.<LoginResponse>builder()
                .requestId(UUID.randomUUID())
                .statusCode(HttpStatus.OK.value())
                .message("Login successful")
                .data(result)
                .build();
        return ResponseEntity.ok(response);
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<UserResponse>> getCurrentUser(@RequestParam UUID userId) {
        UserResponse user = authService.getCurrentUser(userId);
        ApiResponse<UserResponse> response = ApiResponse.<UserResponse>builder()
                .requestId(UUID.randomUUID())
                .statusCode(HttpStatus.OK.value())
                .message("User retrieved successfully")
                .data(user)
                .build();
        return ResponseEntity.ok(response);
    }
}
