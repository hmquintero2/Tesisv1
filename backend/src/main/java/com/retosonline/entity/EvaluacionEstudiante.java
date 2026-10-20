package com.retosonline.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "evaluaciones_estudiante")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EvaluacionEstudiante {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Referencia al código anónimo que vio el estudiante (Modelo 1/2/3)
    @Column(name = "codigo_anonimo", nullable = false)
    private String codigoAnonimo;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "estudiante_id", nullable = false)
    private Usuario estudiante;

    @Column(nullable = false)
    private Integer claridad;           // 1-5

    @Column(nullable = false)
    private Integer comprension;        // 1-5

    @Column(name = "dificultad_percibida", nullable = false)
    private Integer dificultadPercibida; // 1-5

    @Column(name = "experiencia_uso", nullable = false)
    private Integer experienciaUso;     // 1-5

    @Column(nullable = false, updatable = false)
    private LocalDateTime fechaEvaluacion;

    @PrePersist
    public void prePersist() {
        this.fechaEvaluacion = LocalDateTime.now();
    }
}