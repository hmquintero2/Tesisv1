package com.retosonline.service;

import com.retosonline.dto.ContenidoGeneradoDTO;
import com.retosonline.entity.BenchmarkAnonimizacion;
import com.retosonline.entity.BenchmarkPregunta;
import com.retosonline.enums.CondicionExperimental;
import com.retosonline.repository.BenchmarkAnonimizacionRepository;
import com.retosonline.repository.BenchmarkPreguntaRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class BenchmarkService {

    private final BenchmarkPreguntaRepository       preguntaRepository;
    private final BenchmarkAnonimizacionRepository  anonimizacionRepository;
    private final OllamaService                     ollamaService;
    private final ApiCerradaService                 apiCerradaService;

    private static final String MODELO_LOCAL_SIN_FT = "qwen3:4b";
    private static final String MODELO_LOCAL_CON_FT = "qwen3:4b-ft";

    private static final List<String> TEMAS = Arrays.asList(
            "Variables y tipos de dato",
            "Estructuras condicionales",
            "Bucles y ciclos",
            "Funciones y parámetros",
            "Arreglos y vectores"
    );

    // ── Ejecutar las 3 condiciones para UN tema ───────────────

    public Map<String, Object> ejecutarBenchmarkCompleto(String tema, int cantidad, int repeticiones) {
        if (!TEMAS.contains(tema)) {
            throw new RuntimeException("Tema no válido: " + tema);
        }

        Map<String, Object> respuesta = new HashMap<>();
        List<Map<String, Object>> resultados = new ArrayList<>();

        for (CondicionExperimental condicion : CondicionExperimental.values()) {
            for (int rep = 1; rep <= repeticiones; rep++) {
                try {
                    BenchmarkPregunta resultado =
                            ejecutarParaCondicion(condicion, tema, cantidad, rep);
                    preguntaRepository.save(resultado);
                    resultados.add(Map.of(
                            "condicion", condicion.name(),
                            "repeticion", rep,
                            "latencyMs", resultado.getLatencyMs(),
                            "tokensPerSecond", resultado.getTokensPerSecond(),
                            "memoryUsageMb", resultado.getMemoryUsageMb() != null
                                    ? resultado.getMemoryUsageMb() : 0
                    ));
                    log.info("✓ {} (rep {}) - {}", condicion, rep, tema);
                } catch (Exception e) {
                    log.error("✗ {} (rep {}) - {}: {}", condicion, rep, tema, e.getMessage());
                    resultados.add(Map.of(
                            "condicion", condicion.name(),
                            "repeticion", rep,
                            "error", e.getMessage()
                    ));
                }
            }
        }

        respuesta.put("tema", tema);
        respuesta.put("resultados", resultados);
        return respuesta;
    }

    // ── Ejecutar UNA condición específica ─────────────────────

    public BenchmarkPregunta ejecutarParaCondicion(
            CondicionExperimental condicion, String tema, int cantidad, int repeticion) {

        ContenidoGeneradoDTO resultado = switch (condicion) {
            case CERRADO_API -> apiCerradaService.generarContenido(
                    tema, cantidad, "INTERMEDIO");
            case LOCAL_SIN_FT -> ollamaService.generarContenido(
                    tema, cantidad, "INTERMEDIO", MODELO_LOCAL_SIN_FT);
            case LOCAL_CON_FT -> ollamaService.generarContenido(
                    tema, cantidad, "INTERMEDIO", MODELO_LOCAL_CON_FT);
        };

        Map<String, Object> primerBloque = resultado.getDiapositivas().isEmpty()
                ? Map.of() : resultado.getDiapositivas().get(0);

        BenchmarkPregunta pregunta = new BenchmarkPregunta();
        pregunta.setModelo(condicion.name());
        pregunta.setTema(tema);
        pregunta.setRepeticion(repeticion);
        pregunta.setSeed(12345);
        pregunta.setEnunciado(String.valueOf(primerBloque.getOrDefault("enunciado", "")));
        pregunta.setRespuestaCorrecta(String.valueOf(primerBloque.getOrDefault("respuestaCorrecta", "")));
        pregunta.setDistractoresJson(
                primerBloque.containsKey("opciones") ? primerBloque.get("opciones").toString() : "[]");
        pregunta.setLatencyMs(resultado.getLatencyMs());
        pregunta.setOllamaTotalMs(resultado.getLatencyMs());
        pregunta.setLoadMs(0f);
        pregunta.setPromptEvaluationMs(0f);
        pregunta.setGenerationMs(resultado.getLatencyMs());
        pregunta.setInputTokens(resultado.getInputTokens());
        pregunta.setOutputTokens(resultado.getOutputTokens());
        pregunta.setTokensPerSecond(resultado.getTokensPerSecond());
        pregunta.setMemoryUsageMb(resultado.getMemoryUsageMb());
        pregunta.setGeneradoEn(LocalDateTime.now());

        log.info("Condición={} | LatencyMs={} | Tokens/s={}",
                condicion, resultado.getLatencyMs(), resultado.getTokensPerSecond());

        return pregunta;
    }

    // ── Anonimización (etiquetas neutras Modelo 1/2/3) ────────

    public List<BenchmarkAnonimizacion> anonimizarParaTema(String tema) {
        List<BenchmarkPregunta> preguntas = preguntaRepository.findByTema(tema);

        // Orden aleatorio para que no siempre "Modelo 1" sea la misma condición
        List<BenchmarkPregunta> mezcladas = new ArrayList<>(preguntas);
        Collections.shuffle(mezcladas);

        List<BenchmarkAnonimizacion> resultado = new ArrayList<>();
        int orden = 1;
        for (BenchmarkPregunta p : mezcladas) {
            Optional<BenchmarkAnonimizacion> existente =
                    anonimizacionRepository.findByPreguntaId(p.getId());
            if (existente.isPresent()) {
                resultado.add(existente.get());
                continue;
            }

            BenchmarkAnonimizacion anon = new BenchmarkAnonimizacion();
            anon.setPreguntaId(p.getId());
            anon.setCodigoAnonimo("MODELO_" + orden + "_" + p.getId());
            anon.setModeloOriginal(p.getModelo());
            anon.setTemaOriginal(p.getTema());
            anon.setOrdenEnLista(orden);
            resultado.add(anonimizacionRepository.save(anon));
            orden++;
        }
        return resultado;
    }

    // ── Guardar evaluación manual (rúbrica de expertos) ───────

    public BenchmarkPregunta guardarEvaluacion(Long id, Integer scoreCorreccion,
                                               Integer scoreDistractores, Integer scoreClaridad,
                                               Integer scoreAlineacion, String notas) throws Exception {

        BenchmarkPregunta p = preguntaRepository.findById(id)
                .orElseThrow(() -> new Exception("No encontrado: " + id));

        if (scoreCorreccion  != null) p.setScoreCorrecccion(scoreCorreccion);
        if (scoreDistractores != null) p.setScoreDistractores(scoreDistractores);
        if (scoreClaridad    != null) p.setScoreClaridad(scoreClaridad);
        if (scoreAlineacion  != null) p.setScoreAlineacion(scoreAlineacion);
        if (notas            != null) p.setEvaluadorNotas(notas);

        if (scoreCorreccion != null && scoreDistractores != null &&
                scoreClaridad   != null && scoreAlineacion  != null) {
            p.setScoreTotal((scoreCorreccion + scoreDistractores + scoreClaridad + scoreAlineacion) / 4);
        }

        p.setEvaluadoEn(LocalDateTime.now());
        return preguntaRepository.save(p);
    }

    public List<BenchmarkPregunta> obtenerTodas() { return preguntaRepository.findAll(); }
    public Optional<BenchmarkPregunta> obtenerPorId(Long id) { return preguntaRepository.findById(id); }
    public void eliminar(Long id) throws Exception {
        if (!preguntaRepository.existsById(id)) throw new Exception("No encontrado");
        preguntaRepository.deleteById(id);
    }

    public Map<String, Object> obtenerEstadisticas() {
        long total = preguntaRepository.count();
        long evaluadas = preguntaRepository.contarEvaluadas();
        return Map.of(
                "totalPreguntas", total,
                "preguntasEvaluadas", evaluadas,
                "pendientes", total - evaluadas,
                "porcentajeEvaluacion", total > 0 ? (evaluadas * 100.0) / total : 0
        );
    }

    public List<String> obtenerTemas() { return TEMAS; }
    public List<String> obtenerCondiciones() {
        return Arrays.stream(CondicionExperimental.values())
                .map(Enum::name).collect(Collectors.toList());
    }
}