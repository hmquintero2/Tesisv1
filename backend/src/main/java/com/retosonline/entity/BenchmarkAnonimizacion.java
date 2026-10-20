package com.retosonline.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "benchmark_anonimizaciones")
public class BenchmarkAnonimizacion {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long preguntaId;

    @Column(unique = true, nullable = false)
    private String codigoAnonimo;

    @Column(nullable = false)
    private String modeloOriginal;

    @Column(nullable = false)
    private String temaOriginal;

    @Column(nullable = false)
    private Integer ordenEnLista;

    @Column(nullable = false, updatable = false)
    private LocalDateTime fechaAnonimizacion = LocalDateTime.now();

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getPreguntaId() { return preguntaId; }
    public void setPreguntaId(Long preguntaId) { this.preguntaId = preguntaId; }

    public String getCodigoAnonimo() { return codigoAnonimo; }
    public void setCodigoAnonimo(String codigoAnonimo) { this.codigoAnonimo = codigoAnonimo; }

    public String getModeloOriginal() { return modeloOriginal; }
    public void setModeloOriginal(String modeloOriginal) { this.modeloOriginal = modeloOriginal; }

    public String getTemaOriginal() { return temaOriginal; }
    public void setTemaOriginal(String temaOriginal) { this.temaOriginal = temaOriginal; }

    public Integer getOrdenEnLista() { return ordenEnLista; }
    public void setOrdenEnLista(Integer ordenEnLista) { this.ordenEnLista = ordenEnLista; }

    public LocalDateTime getFechaAnonimizacion() { return fechaAnonimizacion; }
}