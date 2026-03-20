package in.vyanix.webservice.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "users")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class User {

    @Id
    @GeneratedValue
    private UUID id;

    @Column(unique = true)
    private String email;

    private String password;

    private String firstName;

    private String lastName;

    private String phone;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private UserRole role;

    @Column(name = "created_at", nullable = false, updatable = false)
    @CreationTimestamp
    private LocalDateTime createdAt;

    /**
     * Token version for bulk invalidation
     * Incremented on:
     * - Password change
     * - Role/permission change
     * - Account disable
     * - Token theft detected
     * All JWT tokens include this version; tokens with old versions are rejected
     */
    @Column(name = "token_version", nullable = false)
    @Builder.Default
    private Integer tokenVersion = 1;

    /**
     * Timestamp of last password change
     * Used for audit and security monitoring
     */
    @Column(name = "last_password_change_at")
    private LocalDateTime lastPasswordChangeAt;

    /**
     * Timestamp of last role change
     * Used to trigger token invalidation when permissions change
     */
    @Column(name = "last_role_change_at")
    private LocalDateTime lastRoleChangeAt;

    /**
     * Account enabled flag
     * When false, all tokens are invalidated
     */
    @Column(name = "enabled", nullable = false)
    @Builder.Default
    private boolean enabled = true;

}
