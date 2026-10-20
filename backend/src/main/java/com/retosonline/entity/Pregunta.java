package com.retosonline.entity;

import com.retosonline.enums.Dificultad;
import com.retosonline.enums.TipoPregunta;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "preguntas")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Pregunta {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String enunciado;

    @Column(name = "opciones_json", nullable = false,
            columnDefinition = "TEXT")
    private String opcionesJson;

    @Column(name = "respuesta_correcta", nullable = false)
    private String respuestaCorrecta;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, columnDefinition = "varchar(20)")
    private Dificultad dificultad;

    @Column(nullable = false, length = 100)
    private String tema;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, columnDefinition = "varchar(20)")
    private TipoPregunta tipo;

    // ── Relación con sala ─────────────────────────────────────
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sala_id")
    private Sala sala;
}