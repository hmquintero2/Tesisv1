package com.retosonline.dto;

import com.retosonline.entity.BenchmarkPregunta;

public class BenchmarkResponseDTO {
    private Long id;
    private String modelo;
    private String tema;
    private String enunciado;
    private String respuestaCorrecta;

    // Métricas de Latencia
    private Float latencyMs;
    private Float ollamaTotalMs;
    private Float loadMs;
    private Float promptEvaluationMs;
    private Float generationMs;

    // Tokens
    private Integer inputTokens;
    private Integer outputTokens;
    private Float tokensPerSecond;

    // Sistema
    private Integer memoryUsageMb;

    // Evaluación
    private Integer scoreCorrecccion;
    private Integer scoreDistractores;
    private Integer scoreClaridad;
    private Integer scoreAlineacion;
    private Integer scoreTotal;

    public BenchmarkResponseDTO(BenchmarkPregunta pregunta) {
        this.id = pregunta.getId();
        this.modelo = pregunta.getModelo();
        this.tema = pregunta.getTema();
        this.enunciado = pregunta.getEnunciado();
        this.respuestaCorrecta = pregunta.getRespuestaCorrecta();

        this.latencyMs = pregunta.getLatencyMs();
        this.ollamaTotalMs = pregunta.getOllamaTotalMs();
        this.loadMs = pregunta.getLoadMs();
        this.promptEvaluationMs = pregunta.getPromptEvaluationMs();
        this.generationMs = pregunta.getGenerationMs();

        this.inputTokens = pregunta.getInputTokens();
        this.outputTokens = pregunta.getOutputTokens();
        this.tokensPerSecond = pregunta.getTokensPerSecond();

        this.memoryUsageMb = pregunta.getMemoryUsageMb();

        this.scoreCorrecccion = pregunta.getScoreCorrecccion();
        this.scoreDistractores = pregunta.getScoreDistractores();
        this.scoreClaridad = pregunta.getScoreClaridad();
        this.scoreAlineacion = pregunta.getScoreAlineacion();
        this.scoreTotal = pregunta.getScoreTotal();
    }

    // GETTERS
    public Long getId() { return id; }
    public String getModelo() { return modelo; }
    public String getTema() { return tema; }
    public String getEnunciado() { return enunciado; }
    public String getRespuestaCorrecta() { return respuestaCorrecta; }
    public Float getLatencyMs() { return latencyMs; }
    public Float getOllamaTotalMs() { return ollamaTotalMs; }
    public Float getLoadMs() { return loadMs; }
    public Float getPromptEvaluationMs() { return promptEvaluationMs; }
    public Float getGenerationMs() { return generationMs; }
    public Integer getInputTokens() { return inputTokens; }
    public Integer getOutputTokens() { return outputTokens; }
    public Float getTokensPerSecond() { return tokensPerSecond; }
    public Integer getMemoryUsageMb() { return memoryUsageMb; }
    public Integer getScoreCorrecccion() { return scoreCorrecccion; }
    public Integer getScoreDistractores() { return scoreDistractores; }
    public Integer getScoreClaridad() { return scoreClaridad; }
    public Integer getScoreAlineacion() { return scoreAlineacion; }
    public Integer getScoreTotal() { return scoreTotal; }
}