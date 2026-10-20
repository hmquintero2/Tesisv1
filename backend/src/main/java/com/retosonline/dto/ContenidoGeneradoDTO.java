package com.retosonline.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ContenidoGeneradoDTO {
    private List<Map<String, Object>> diapositivas; // cada item: titulo, teoria, pregunta, opciones, respuestaCorrecta

    // Métricas técnicas (para Benchmark)
    private float latencyMs;
    private int inputTokens;
    private int outputTokens;
    private float tokensPerSecond;
    private Integer memoryUsageMb; // null si es API (no aplica)
}