package com.retosonline.entity;

import com.retosonline.enums.AccountStatus;
import com.retosonline.enums.ProveedorAuth;
import com.retosonline.enums.RolEnum;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "usuarios")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Usuario {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String nombre;

    @Column(nullable = false, unique = true, length = 150)
    private String email;

    @Column(nullable = true)
    private String password;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, columnDefinition = "varchar(20)")
    private RolEnum rol;

    @Column(name = "fecha_registro")
    private LocalDateTime fechaRegistro;

    @Column(name = "google_id", unique = true, length = 255)
    private String googleId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, columnDefinition = "varchar(20)")
    private ProveedorAuth proveedor;

    // ── Verificación OTP ──────────────────────────────────────
    @Column(name = "verification_code", length = 6)
    private String verificationCode;

    @Column(name = "verification_expires_at")
    private LocalDateTime verificationExpiresAt;

    @Column(name = "verification_attempts")
    private int verificationAttempts;

    @Enumerated(EnumType.STRING)
    @Column(name = "account_status", nullable = false,
            columnDefinition = "varchar(20)")
    private AccountStatus accountStatus;

    // ── Recuperación de contraseña ────────────────────────────
    @Column(name = "reset_token", length = 100)
    private String resetToken;

    @Column(name = "reset_token_expires_at")
    private LocalDateTime resetTokenExpiresAt;
    @Column(name = "avatar_id", length = 30)
    private String avatarId;

    @PrePersist
    public void prePersist() {
        this.fechaRegistro = LocalDateTime.now();
        if (this.rol == null)           this.rol           = RolEnum.JUGADOR;
        if (this.proveedor == null)     this.proveedor     = ProveedorAuth.LOCAL;
        if (this.accountStatus == null) this.accountStatus = AccountStatus.INACTIVE;
    }
}