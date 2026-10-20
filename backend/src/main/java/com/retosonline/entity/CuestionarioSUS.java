package com.retosonline.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "cuestionarios_sus")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CuestionarioSUS {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "codigo_anonimo", nullable = false)
    private String codigoAnonimo;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "estudiante_id", nullable = false)
    private Usuario estudiante;

    // Los 10 ítems estándar del SUS, cada uno 1-5
    @Column(name = "item_1", nullable = false) private Integer item1; // Me gustaría usar este sistema frecuentemente
    @Column(name = "item_2", nullable = false) private Integer item2; // Encontré el sistema innecesariamente complejo
    @Column(name = "item_3", nullable = false) private Integer item3; // Pensé que el sistema era fácil de usar
    @Column(name = "item_4", nullable = false) private Integer item4; // Necesitaría ayuda de soporte técnico
    @Column(name = "item_5", nullable = false) private Integer item5; // Las funciones estaban bien integradas
    @Column(name = "item_6", nullable = false) private Integer item6; // Había demasiada inconsistencia
    @Column(name = "item_7", nullable = false) private Integer item7; // La mayoría aprendería a usarlo rápido
    @Column(name = "item_8", nullable = false) private Integer item8; // Encontré el sistema incómodo de usar
    @Column(name = "item_9", nullable = false) private Integer item9; // Me sentí muy confiado usando el sistema
    @Column(name = "item_10", nullable = false) private Integer item10; // Necesité aprender muchas cosas antes de usarlo

    @Column(name = "puntaje_total")
    private Float puntajeTotal; // 0-100, calculado

    @Column(nullable = false, updatable = false)
    private LocalDateTime fechaEvaluacion;

    @PrePersist
    public void prePersist() {
        this.fechaEvaluacion = LocalDateTime.now();
        this.puntajeTotal = calcularPuntaje();
    }

    // Fórmula estándar SUS: ítems impares (1,3,5,7,9) restan 1; ítems pares (2,4,6,8,10) se restan de 5; suma x 2.5
    private float calcularPuntaje() {
        int suma =
                (item1 - 1) + (5 - item2) + (item3 - 1) + (5 - item4) + (item5 - 1) +
                        (5 - item6) + (item7 - 1) + (5 - item8) + (item9 - 1) + (5 - item10);
        return suma * 2.5f;
    }
}