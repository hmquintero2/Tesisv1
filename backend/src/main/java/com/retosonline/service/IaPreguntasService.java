package com.retosonline.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.retosonline.dto.ContenidoGeneradoDTO;
import com.retosonline.entity.*;
import com.retosonline.enums.CondicionExperimental;
import com.retosonline.enums.Dificultad;
import com.retosonline.enums.TipoPregunta;
import com.retosonline.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class IaPreguntasService {

    private final OllamaService              ollamaService;
    private final ApiCerradaService           apiCerradaService;
    private final PreguntaRepository          preguntaRepository;
    private final DiapositivaRepository       diapositivaRepository;
    private final ArchivoIaRepository         archivoIaRepository;
    private final BenchmarkPreguntaRepository benchmarkPreguntaRepository;
    private final ObjectMapper                objectMapper = new ObjectMapper();

    // Nombres exactos de los modelos locales en Ollama (Condición 2 y 3)
    private static final String MODELO_LOCAL_SIN_FT = "qwen3:4b";
    private static final String MODELO_LOCAL_CON_FT = "qwen3:4b-ft";

    // ── Temas válidos del sílabo (Programación Básica) ────────

    private static final List<String> TEMAS_SILABO = List.of(
            "variable", "variables", "tipo de dato", "tipos de datos",
            "operador", "operadores", "aritmetico", "aritmético",
            "condicional", "if", "else", "switch",
            "bucle", "ciclo", "for", "while", "do while",
            "funcion", "función", "funciones", "procedimiento",
            "parametro", "parámetro", "argumento",
            "arreglo", "array", "vector", "matriz",
            "cadena", "string", "texto",
            "entrada", "salida", "input", "output",
            "algoritmo", "pseudocodigo", "pseudocódigo", "diagrama de flujo",
            "recursividad", "recursivo",
            "estructura de control", "estructuras de control",
            "programacion basica", "programación básica",
            "logica de programacion", "lógica de programación"
    );

    // ── Validar que el tema pertenece al sílabo ───────────────

    private void validarTemaSilabo(String contenido) {
        if (contenido == null || contenido.isBlank()) return;
        String lower = contenido.toLowerCase();
        boolean contieneTema = TEMAS_SILABO.stream()
                .anyMatch(lower::contains);
        if (!contieneTema) {
            throw new RuntimeException(
                    "El tema no pertenece al sílabo de Programación Básica. " +
                            "Temas válidos: variables, tipos de dato, " +
                            "estructuras de control, bucles, funciones, " +
                            "arreglos, cadenas, algoritmos, recursividad.");
        }
    }

    // ── Generar y guardar contenido para sala (diapositivas + preguntas) ──

    @Transactional
    public List<Pregunta> generarYGuardarParaSala(
            Sala sala,
            String fuente,
            String contenido,
            String emailUsuario) {

        if ("TEMA".equals(fuente)) {
            validarTemaSilabo(contenido);
        }

        log.info("[IA] Generando {} bloques para sala {} condición: {}",
                sala.getCantidadPreguntas(), sala.getCodigo(), sala.getCondicion());

        ContenidoGeneradoDTO resultado = generarSegunCondicion(sala, contenido);

        List<Pregunta> guardadas =
                guardarContenido(resultado.getDiapositivas(), sala, emailUsuario);

        registrarMetricasBenchmark(sala, contenido, resultado);

        log.info("[IA] {} bloques guardados para sala {}",
                guardadas.size(), sala.getCodigo());

        return guardadas;
    }

    // ── Ruteo por condición experimental ──────────────────────

    private ContenidoGeneradoDTO generarSegunCondicion(Sala sala, String contenido) {
        CondicionExperimental condicion = sala.getCondicion();

        return switch (condicion) {
            case CERRADO_API -> apiCerradaService.generarContenido(
                    contenido, sala.getCantidadPreguntas(), sala.getDificultad().name());

            case LOCAL_SIN_FT -> ollamaService.generarContenido(
                    contenido, sala.getCantidadPreguntas(),
                    sala.getDificultad().name(), MODELO_LOCAL_SIN_FT);

            case LOCAL_CON_FT -> ollamaService.generarContenido(
                    contenido, sala.getCantidadPreguntas(),
                    sala.getDificultad().name(), MODELO_LOCAL_CON_FT);
        };
    }

    // ── Registrar métricas en Benchmark ───────────────────────

    private void registrarMetricasBenchmark(
            Sala sala, String tema, ContenidoGeneradoDTO resultado) {
        try {
            String nombreCondicion = sala.getCondicion().name();

            BenchmarkPregunta registro = new BenchmarkPregunta();
            registro.setModelo(nombreCondicion);
            registro.setTema(tema.length() > 100 ? tema.substring(0, 100) : tema);
            registro.setRepeticion(1);
            registro.setSeed(0);
            registro.setEnunciado("Sala: " + sala.getCodigo());
            registro.setRespuestaCorrecta("N/A");
            registro.setDistractoresJson("[]");
            registro.setLatencyMs(resultado.getLatencyMs());
            registro.setOllamaTotalMs(resultado.getLatencyMs());
            registro.setLoadMs(0f);
            registro.setPromptEvaluationMs(0f);
            registro.setGenerationMs(resultado.getLatencyMs());
            registro.setInputTokens(resultado.getInputTokens());
            registro.setOutputTokens(resultado.getOutputTokens());
            registro.setTokensPerSecond(resultado.getTokensPerSecond());
            registro.setMemoryUsageMb(resultado.getMemoryUsageMb());

            benchmarkPreguntaRepository.save(registro);
        } catch (Exception e) {
            log.warn("[BENCHMARK] No se pudo registrar métricas: {}", e.getMessage());
        }
    }

    // ── Extraer texto de archivo ──────────────────────────────

    public String extraerTexto(MultipartFile archivo) throws IOException {
        String nombre = archivo.getOriginalFilename().toLowerCase();

        if (nombre.endsWith(".pdf")) {
            return extraerTextoPdf(archivo);
        } else if (nombre.endsWith(".txt")) {
            return new String(archivo.getBytes());
        } else if (nombre.endsWith(".docx")) {
            return extraerTextoDocx(archivo);
        } else {
            throw new RuntimeException(
                    "Formato no soportado. Usa PDF, DOCX o TXT.");
        }
    }

    // ── Guardar diapositivas + preguntas en BD ────────────────

    @SuppressWarnings("unchecked")
    private List<Pregunta> guardarContenido(
            List<Map<String, Object>> bloquesIA,
            Sala sala,
            String emailUsuario) {

        Dificultad dif = sala.getDificultad();
        List<Pregunta> guardadas = new ArrayList<>();
        int orden = 0;

        for (Map<String, Object> b : bloquesIA) {
            try {
                String titulo    = (String) b.get("titulo");
                String teoria    = (String) b.get("teoria");
                String enunciado = (String) b.get("enunciado");
                List<String> opciones = (List<String>) b.get("opciones");
                String correcta  = (String) b.get("respuestaCorrecta");

                if (enunciado == null || enunciado.isBlank()
                        || opciones == null || opciones.isEmpty()
                        || correcta == null || correcta.isBlank()) {
                    log.warn("[IA] Bloque inválido omitido: {}", b);
                    continue;
                }

                if (!opciones.contains(correcta)) {
                    correcta = opciones.get(0);
                }

                String opcionesJson = objectMapper.writeValueAsString(opciones);

                Pregunta pregunta = Pregunta.builder()
                        .enunciado(enunciado.length() > 500
                                ? enunciado.substring(0, 500) : enunciado)
                        .opcionesJson(opcionesJson)
                        .respuestaCorrecta(correcta.length() > 255
                                ? correcta.substring(0, 255) : correcta)
                        .dificultad(dif)
                        .tema(sala.getNombre().length() > 100
                                ? sala.getNombre().substring(0, 100) : sala.getNombre())
                        .tipo(TipoPregunta.PREGUNTA)
                        .sala(sala)
                        .build();

                pregunta = preguntaRepository.save(pregunta);
                guardadas.add(pregunta);

                Diapositiva diapositiva = Diapositiva.builder()
                        .titulo(titulo != null ? titulo : "Sin título")
                        .teoria(teoria != null ? teoria : "")
                        .orden(orden++)
                        .sala(sala)
                        .pregunta(pregunta)
                        .build();

                diapositivaRepository.save(diapositiva);

            } catch (Exception e) {
                log.warn("[IA] Error guardando bloque: {}", e.getMessage());
            }
        }

        archivoIaRepository.save(ArchivoIa.builder()
                .nombre("Sala: " + sala.getCodigo())
                .tipo("SALA")
                .contenido("Bloques generados: " + guardadas.size()
                        + " | Condición: " + sala.getCondicion())
                .usuarioEmail(emailUsuario)
                .build());

        if (guardadas.isEmpty()) {
            throw new RuntimeException(
                    "No se pudo guardar ningún bloque válido");
        }

        return guardadas;
    }

    // ── Extraer texto PDF ─────────────────────────────────────

    private String extraerTextoPdf(MultipartFile archivo)
            throws IOException {
        try (PDDocument doc =
                     Loader.loadPDF(archivo.getBytes())) {
            PDFTextStripper stripper = new PDFTextStripper();
            String texto = stripper.getText(doc).trim();
            return texto.length() > 4000
                    ? texto.substring(0, 4000) : texto;
        }
    }

    // ── Extraer texto DOCX ────────────────────────────────────

    private String extraerTextoDocx(MultipartFile archivo)
            throws IOException {
        try (var docx =
                     new org.apache.poi.xwpf.usermodel.XWPFDocument(
                             archivo.getInputStream())) {
            StringBuilder sb = new StringBuilder();
            docx.getParagraphs().forEach(p ->
                    sb.append(p.getText()).append("\n"));
            String texto = sb.toString().trim();
            return texto.length() > 4000
                    ? texto.substring(0, 4000) : texto;
        }
    }

    // ── Estado Ollama ─────────────────────────────────────────

    public Map<String, Object> estadoOllama() {
        boolean ok = ollamaService.estaDisponible();
        return Map.of(
                "disponible", ok,
                "modeloSinFT", MODELO_LOCAL_SIN_FT,
                "modeloConFT", MODELO_LOCAL_CON_FT,
                "mensaje",    ok
                        ? "Ollama listo"
                        : "Ollama no disponible. Ejecuta: ollama serve"
        );
    }
}