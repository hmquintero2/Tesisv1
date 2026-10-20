package com.retosonline.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "reportes_sala")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReporteSala {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sala_id", nullable = false, unique = true)
    private Sala sala;

    @Column(columnDefinition = "LONGTEXT", nullable = false)
    private String contenido;

    @Column(name = "generado_en", nullable = false)
    private LocalDateTime generadoEn;

    @PrePersist
    public void prePersist() {
        this.generadoEn = LocalDateTime.now();
    }
}