package com.retosonline.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "benchmark_preguntas")
public class BenchmarkPregunta {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String modelo;

    @Column(nullable = false)
    private String tema;

    @Column(nullable = false)
    private Integer repeticion;

    @Column(nullable = false)
    private Integer seed;

    @Column(columnDefinition = "LONGTEXT", nullable = false)
    private String enunciado;

    @Column(name = "respuesta_correcta", nullable = false)
    private String respuestaCorrecta;

    @Column(columnDefinition = "JSON", nullable = false)
    private String distractoresJson;

    @Column(name = "prompt_hash")
    private String promptHash;

    @Column(name = "latency_ms", nullable = false)
    private Float latencyMs;

    @Column(name = "ollama_total_ms", nullable = false)
    private Float ollamaTotalMs;

    @Column(name = "load_ms", nullable = false)
    private Float loadMs;

    @Column(name = "prompt_evaluation_ms", nullable = false)
    private Float promptEvaluationMs;

    @Column(name = "generation_ms", nullable = false)
    private Float generationMs;

    @Column(name = "input_tokens", nullable = false)
    private Integer inputTokens;

    @Column(name = "output_tokens", nullable = false)
    private Integer outputTokens;

    @Column(name = "tokens_per_second", nullable = false)
    private Float tokensPerSecond;

    @Column(name = "memory_usage_mb")
    private Integer memoryUsageMb;

    @Column(name = "p50_latency_ms")
    private Float p50LatencyMs;

    @Column(name = "p95_latency_ms")
    private Float p95LatencyMs;

    @Column(name = "score_correcccion")
    private Integer scoreCorrecccion;

    @Column(name = "score_distractores")
    private Integer scoreDistractores;

    @Column(name = "score_claridad")
    private Integer scoreClaridad;

    @Column(name = "score_alineacion")
    private Integer scoreAlineacion;

    @Column(name = "score_nivel_cognitivo")
    private Integer scoreNivelCognitivo;

    @Column(name = "score_total")
    private Integer scoreTotal;

    @Column(name = "evaluado_en")
    private LocalDateTime evaluadoEn;

    @Column(columnDefinition = "TEXT", name = "evaluador_notas")
    private String evaluadorNotas;

    @Column(nullable = false, updatable = false, name = "generado_en")
    private LocalDateTime generadoEn = LocalDateTime.now();

    // GETTERS Y SETTERS
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getModelo() { return modelo; }
    public void setModelo(String modelo) { this.modelo = modelo; }

    public String getTema() { return tema; }
    public void setTema(String tema) { this.tema = tema; }

    public Integer getRepeticion() { return repeticion; }
    public void setRepeticion(Integer repeticion) { this.repeticion = repeticion; }

    public Integer getSeed() { return seed; }
    public void setSeed(Integer seed) { this.seed = seed; }

    public String getEnunciado() { return enunciado; }
    public void setEnunciado(String enunciado) { this.enunciado = enunciado; }

    public String getRespuestaCorrecta() { return respuestaCorrecta; }
    public void setRespuestaCorrecta(String respuestaCorrecta) { this.respuestaCorrecta = respuestaCorrecta; }

    public String getDistractoresJson() { return distractoresJson; }
    public void setDistractoresJson(String distractoresJson) { this.distractoresJson = distractoresJson; }

    public String getPromptHash() { return promptHash; }
    public void setPromptHash(String promptHash) { this.promptHash = promptHash; }

    public Float getLatencyMs() { return latencyMs; }
    public void setLatencyMs(Float latencyMs) { this.latencyMs = latencyMs; }

    public Float getOllamaTotalMs() { return ollamaTotalMs; }
    public void setOllamaTotalMs(Float ollamaTotalMs) { this.ollamaTotalMs = ollamaTotalMs; }

    public Float getLoadMs() { return loadMs; }
    public void setLoadMs(Float loadMs) { this.loadMs = loadMs; }

    public Float getPromptEvaluationMs() { return promptEvaluationMs; }
    public void setPromptEvaluationMs(Float promptEvaluationMs) { this.promptEvaluationMs = promptEvaluationMs; }

    public Float getGenerationMs() { return generationMs; }
    public void setGenerationMs(Float generationMs) { this.generationMs = generationMs; }

    public Integer getInputTokens() { return inputTokens; }
    public void setInputTokens(Integer inputTokens) { this.inputTokens = inputTokens; }

    public Integer getOutputTokens() { return outputTokens; }
    public void setOutputTokens(Integer outputTokens) { this.outputTokens = outputTokens; }

    public Float getTokensPerSecond() { return tokensPerSecond; }
    public void setTokensPerSecond(Float tokensPerSecond) { this.tokensPerSecond = tokensPerSecond; }

    public Integer getMemoryUsageMb() { return memoryUsageMb; }
    public void setMemoryUsageMb(Integer memoryUsageMb) { this.memoryUsageMb = memoryUsageMb; }

    public Float getP50LatencyMs() { return p50LatencyMs; }
    public void setP50LatencyMs(Float p50LatencyMs) { this.p50LatencyMs = p50LatencyMs; }

    public Float getP95LatencyMs() { return p95LatencyMs; }
    public void setP95LatencyMs(Float p95LatencyMs) { this.p95LatencyMs = p95LatencyMs; }

    public Integer getScoreCorrecccion() { return scoreCorrecccion; }
    public void setScoreCorrecccion(Integer scoreCorrecccion) { this.scoreCorrecccion = scoreCorrecccion; }

    public Integer getScoreDistractores() { return scoreDistractores; }
    public void setScoreDistractores(Integer scoreDistractores) { this.scoreDistractores = scoreDistractores; }

    public Integer getScoreClaridad() { return scoreClaridad; }
    public void setScoreClaridad(Integer scoreClaridad) { this.scoreClaridad = scoreClaridad; }

    public Integer getScoreAlineacion() { return scoreAlineacion; }
    public void setScoreAlineacion(Integer scoreAlineacion) { this.scoreAlineacion = scoreAlineacion; }

    public Integer getScoreNivelCognitivo() { return scoreNivelCognitivo; }
    public void setScoreNivelCognitivo(Integer scoreNivelCognitivo) { this.scoreNivelCognitivo = scoreNivelCognitivo; }

    public Integer getScoreTotal() { return scoreTotal; }
    public void setScoreTotal(Integer scoreTotal) { this.scoreTotal = scoreTotal; }

    public LocalDateTime getEvaluadoEn() { return evaluadoEn; }
    public void setEvaluadoEn(LocalDateTime evaluadoEn) { this.evaluadoEn = evaluadoEn; }

    public String getEvaluadorNotas() { return evaluadorNotas; }
    public void setEvaluadorNotas(String evaluadorNotas) { this.evaluadorNotas = evaluadorNotas; }

    public LocalDateTime getGeneradoEn() { return generadoEn; }
    public void setGeneradoEn(LocalDateTime generadoEn) { this.generadoEn = generadoEn; }
    @Column(name = "score_pertinencia")
    private Integer scorePertinencia;

    @Column(name = "score_complejidad")
    private Integer scoreComplejidad;

    @Column(name = "score_coherencia_pedagogica")
    private Integer scoreCoherenciaPedagogica;

    @Column(name = "score_cobertura")
    private Integer scoreCobertura;

    // Getters y Setters
    public Integer getScorePertinencia() { return scorePertinencia; }
    public void setScorePertinencia(Integer scorePertinencia) { this.scorePertinencia = scorePertinencia; }

    public Integer getScoreComplejidad() { return scoreComplejidad; }
    public void setScoreComplejidad(Integer scoreComplejidad) { this.scoreComplejidad = scoreComplejidad; }

    public Integer getScoreCoherenciaPedagogica() { return scoreCoherenciaPedagogica; }
    public void setScoreCoherenciaPedagogica(Integer scoreCoherenciaPedagogica) { this.scoreCoherenciaPedagogica = scoreCoherenciaPedagogica; }

    public Integer getScoreCobertura() { return scoreCobertura; }
    public void setScoreCobertura(Integer scoreCobertura) { this.scoreCobertura = scoreCobertura; }

}