package com.retosonline.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "diapositivas")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Diapositiva {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 150)
    private String titulo;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String teoria;

    @Column(name = "orden", nullable = false)
    private int orden;

    // ── Relación con sala ─────────────────────────────────────
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sala_id")
    private Sala sala;

    // ── Relación 1 a 1 con su pregunta asociada ───────────────
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "pregunta_id")
    private Pregunta pregunta;
}