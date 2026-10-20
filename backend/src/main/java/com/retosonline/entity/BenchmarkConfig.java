package com.retosonline.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "benchmark_config")
public class BenchmarkConfig {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Float temperatura;

    @Column(nullable = false)
    private Integer seedBase;

    @Column(nullable = false)
    private Integer cantidadRepeticiones;

    @Column(nullable = false)
    private Integer cantidadPreguntas;

    @Column(length = 5, nullable = false)
    private String idioma = "ES";

    @Column(columnDefinition = "JSON", nullable = false)
    private String modelosJson;

    @Column(columnDefinition = "JSON", nullable = false)
    private String temasJson;

    @Column(length = 20, nullable = false)
    private String estado = "CREADA";

    @Column(columnDefinition = "TEXT")
    private String descripcion;

    @Column(nullable = false, updatable = false)
    private LocalDateTime creadaEn = LocalDateTime.now();

    private LocalDateTime iniciadaEn;
    private LocalDateTime completadaEn;

    // Getters y Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Float getTemperatura() { return temperatura; }
    public void setTemperatura(Float temperatura) { this.temperatura = temperatura; }

    public Integer getSeedBase() { return seedBase; }
    public void setSeedBase(Integer seedBase) { this.seedBase = seedBase; }

    public Integer getCantidadRepeticiones() { return cantidadRepeticiones; }
    public void setCantidadRepeticiones(Integer cantidadRepeticiones) { this.cantidadRepeticiones = cantidadRepeticiones; }

    public Integer getCantidadPreguntas() { return cantidadPreguntas; }
    public void setCantidadPreguntas(Integer cantidadPreguntas) { this.cantidadPreguntas = cantidadPreguntas; }

    public String getIdiomaJson() { return temasJson; }
    public void setIdiomaJson(String temasJson) { this.temasJson = temasJson; }

    public String getModelosJson() { return modelosJson; }
    public void setModelosJson(String modelosJson) { this.modelosJson = modelosJson; }

    public String getTemasJson() { return temasJson; }
    public void setTemasJson(String temasJson) { this.temasJson = temasJson; }

    public String getEstado() { return estado; }
    public void setEstado(String estado) { this.estado = estado; }

    public String getDescripcion() { return descripcion; }
    public void setDescripcion(String descripcion) { this.descripcion = descripcion; }

    public LocalDateTime getCreadaEn() { return creadaEn; }
    public LocalDateTime getIniciadaEn() { return iniciadaEn; }
    public void setIniciadaEn(LocalDateTime iniciadaEn) { this.iniciadaEn = iniciadaEn; }

    public LocalDateTime getCompletadaEn() { return completadaEn; }
    public void setCompletadaEn(LocalDateTime completadaEn) { this.completadaEn = completadaEn; }
}