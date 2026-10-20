package com.retosonline.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "archivos_ia")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ArchivoIa {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 255)
    private String nombre;

    @Column(nullable = false, length = 20)
    private String tipo;

    @Column(columnDefinition = "LONGTEXT", nullable = false)
    private String contenido;

    @Column(name = "usuario_email", nullable = false, length = 150)
    private String usuarioEmail;

    @Column(name = "creado_en", nullable = false)
    private LocalDateTime creadoEn;

    @PrePersist
    public void prePersist() {
        this.creadoEn = LocalDateTime.now();
    }
}