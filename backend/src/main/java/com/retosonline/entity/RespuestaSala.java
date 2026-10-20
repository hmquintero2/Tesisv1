package com.retosonline.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "respuestas_sala")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RespuestaSala {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "usuario_id", nullable = false)
    private Usuario usuario;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "sala_id", nullable = false)
    private Sala sala;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "pregunta_id", nullable = false)
    private Pregunta pregunta;

    @Column(nullable = false)
    private boolean correcta;

    @Column(name = "tiempo_respuesta_ms", nullable = false)
    private int tiempoRespuestaMs;

    @Column(name = "puntos_obtenidos", nullable = false)
    private int puntosObtenidos;

    private LocalDateTime fecha;

    @PrePersist
    public void prePersist() {
        this.fecha = LocalDateTime.now();
    }

}