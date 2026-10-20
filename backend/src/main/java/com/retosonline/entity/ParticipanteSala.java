package com.retosonline.entity;

import com.retosonline.enums.EstadoConexion;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "participantes_sala")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ParticipanteSala {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "veces_abandono_pestana", nullable = false)
    private int vecesAbandonoPestana = 0;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "usuario_id", nullable = false)
    private Usuario usuario;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "sala_id", nullable = false)
    private Sala sala;

    @Column(name = "fecha_ingreso")
    private LocalDateTime fechaIngreso;

    @Column(nullable = false)
    private boolean activo;

    @Column(length = 30)
    private String avatar;

    @Column(nullable = false)
    private boolean listo;

    @Enumerated(EnumType.STRING)
    @Column(name = "estado_conexion", nullable = false, columnDefinition = "varchar(20)")
    private EstadoConexion estadoConexion;

    @PrePersist
    public void prePersist() {
        this.fechaIngreso = LocalDateTime.now();
        this.activo = true;
        this.listo = false;
        if (this.estadoConexion == null) {
            this.estadoConexion = EstadoConexion.CONECTADO;
        }
    }
}