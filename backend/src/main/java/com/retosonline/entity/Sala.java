package com.retosonline.entity;

import com.retosonline.enums.CondicionExperimental;
import com.retosonline.enums.Dificultad;
import com.retosonline.enums.EstadoSala;
import com.retosonline.enums.ModoSala;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "salas")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Sala {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 6)
    private String codigo;

    @Column(nullable = false, length = 100)
    private String nombre;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "creador_id", nullable = false)
    private Usuario creador;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, columnDefinition = "varchar(20)")
    private EstadoSala estado;

    @Column(name = "max_jugadores")
    private int maxJugadores;

    @Column(name = "fecha_creacion")
    private LocalDateTime fechaCreacion;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, columnDefinition = "varchar(20)")
    private ModoSala modo;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, columnDefinition = "varchar(20)")
    private Dificultad dificultad;

    @Column(name = "cantidad_preguntas", nullable = false)
    private int cantidadPreguntas;

    @Column(name = "tiempo_por_pregunta", nullable = false)
    private int tiempoPorPregunta;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, columnDefinition = "varchar(20)")
    private CondicionExperimental condicion;

    @PrePersist
    public void prePersist() {
        this.fechaCreacion = LocalDateTime.now();
        if (this.estado == null)     this.estado     = EstadoSala.ESPERANDO;
        if (this.maxJugadores == 0)  this.maxJugadores = 5;
        if (this.modo == null)       this.modo       = ModoSala.COMPETENCIA;
        if (this.dificultad == null) this.dificultad = Dificultad.INTERMEDIO;
        if (this.cantidadPreguntas == 0)  this.cantidadPreguntas  = 5;
        if (this.tiempoPorPregunta == 0)  this.tiempoPorPregunta  = 30;
    }

}