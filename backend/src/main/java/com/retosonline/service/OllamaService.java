package com.retosonline.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.retosonline.dto.ContenidoGeneradoDTO;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.*;

@Service
@Slf4j
public class OllamaService {

    @Value("${ollama.url:http://localhost:11434}")
    private String ollamaUrl;

    @Value("${ollama.model:qwen3:4b}")
    private String modelo;

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(30))
            .build();

    // ── Generar contenido (diapositiva + pregunta) ────────────

    public ContenidoGeneradoDTO generarContenido(
            String contexto, int cantidad, String dificultad, String nombreModelo) {

        String prompt = construirPrompt(contexto, cantidad, dificultad);

        try {
            Map<String, Object> respuestaCruda =
                    llamarOllamaConMetricas(prompt, nombreModelo);

            String textoRespuesta = (String) respuestaCruda.get("texto");
            List<Map<String, Object>> diapositivas =
                    parsearContenido(textoRespuesta);

            long evalDurationNs  = (long) respuestaCruda.get("evalDuration");
            int  evalCount       = (int)  respuestaCruda.get("evalCount");
            int  promptEvalCount = (int)  respuestaCruda.get("promptEvalCount");
            long totalDurationNs = (long) respuestaCruda.get("totalDuration");

            float latencyMs = totalDurationNs / 1_000_000f;
            float tokensPerSecond = evalDurationNs > 0
                    ? evalCount / (evalDurationNs / 1_000_000_000f) : 0;

            log.info("[OLLAMA] modelo={} latencyMs={} tokensPerSecond={} diapositivas={}",
                    nombreModelo != null ? nombreModelo : modelo,
                    latencyMs, tokensPerSecond, diapositivas.size());

            return ContenidoGeneradoDTO.builder()
                    .diapositivas(diapositivas)
                    .latencyMs(latencyMs)
                    .inputTokens(promptEvalCount)
                    .outputTokens(evalCount)
                    .tokensPerSecond(tokensPerSecond)
                    .memoryUsageMb(null)
                    .build();

        } catch (Exception e) {
            log.error("[OLLAMA] Error generando contenido: {}", e.getMessage());
            throw new RuntimeException(
                    "No se pudo generar contenido: " + e.getMessage());
        }
    }

    // ── Construir prompt (protocolo reproducible, mismo para las 3 condiciones) ──

    private String construirPrompt(String contexto, int cantidad, String dificultad) {
        return """
            /no_think
            Eres un generador de contenido educativo ÚNICAMENTE para el área \
            de Programación Básica (1er y 2do nivel universitario).

            TEMAS PERMITIDOS DEL SÍLABO:
            - Variables y tipos de dato
            - Operadores aritméticos y lógicos
            - Estructuras condicionales (if, else, switch)
            - Bucles (for, while, do-while)
            - Funciones y parámetros
            - Arreglos, vectores y matrices
            - Cadenas de texto (strings)
            - Entrada y salida de datos
            - Algoritmos y pseudocódigo
            - Recursividad

            TEMA SOLICITADO: %s

            Si el tema solicitado NO está relacionado con ninguno de los \
            temas del sílabo, responde EXACTAMENTE con este JSON:
            [{"error": "tema_no_permitido", "mensaje": "El tema no pertenece al sílabo de Programación Básica"}]

            Si el tema SÍ pertenece al sílabo, genera %d bloques de contenido. \
            Dificultad: %s.
            Cada bloque debe tener:
            - "titulo": título breve del bloque
            - "teoria": explicación teórica corta (máximo 100 palabras)
            - "enunciado": una pregunta de opción múltiple sobre esa teoría
            - "opciones": 4 opciones de respuesta
            - "respuestaCorrecta": el texto exacto de la opción correcta

            Responde SOLO con array JSON. Sin texto extra. Sin markdown.
            Formato:
            [{"titulo":"texto","teoria":"texto","enunciado":"texto","opciones":["A","B","C","D"],"respuestaCorrecta":"texto exacto"}]
            """.formatted(contexto, cantidad, dificultad);
    }

    // ── Llamar a Ollama capturando métricas ───────────────────

    private Map<String, Object> llamarOllamaConMetricas(
            String prompt, String nombreModelo) throws Exception {

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("model",  nombreModelo != null ? nombreModelo : modelo);
        body.put("prompt", prompt);
        body.put("stream", false);
        body.put("think",  false);
        body.put("options", Map.of(
                "temperature", 0.3,
                "top_p",       0.9,
                "num_predict", 3000
        ));

        String jsonBody = objectMapper.writeValueAsString(body);

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(ollamaUrl + "/api/generate"))
                .header("Content-Type", "application/json")
                .timeout(Duration.ofMinutes(10))
                .POST(HttpRequest.BodyPublishers.ofString(jsonBody))
                .build();

        HttpResponse<String> response = httpClient.send(
                request, HttpResponse.BodyHandlers.ofString());

        if (response.statusCode() != 200) {
            throw new RuntimeException(
                    "Ollama respondió con status " + response.statusCode());
        }

        JsonNode node = objectMapper.readTree(response.body());

        Map<String, Object> resultado = new HashMap<>();
        resultado.put("texto", node.get("response").asText());
        resultado.put("totalDuration",
                node.has("total_duration") ? node.get("total_duration").asLong() : 0L);
        resultado.put("evalDuration",
                node.has("eval_duration") ? node.get("eval_duration").asLong() : 0L);
        resultado.put("evalCount",
                node.has("eval_count") ? node.get("eval_count").asInt() : 0);
        resultado.put("promptEvalCount",
                node.has("prompt_eval_count") ? node.get("prompt_eval_count").asInt() : 0);

        log.info("[OLLAMA] Respuesta recibida ({} chars)",
                resultado.get("texto").toString().length());

        return resultado;
    }

    // ── Parsear respuesta (diapositiva + pregunta) ────────────

    @SuppressWarnings("unchecked")
    private List<Map<String, Object>> parsearContenido(String respuesta) {
        try {
            String limpia = respuesta
                    .replaceAll("(?s)<think>.*?</think>", "")
                    .replaceAll("(?s)\\[THINK\\].*?\\[/THINK\\]", "")
                    .replaceAll("(?s)Okay.*?\n\n", "")
                    .replaceAll("(?s)Sure.*?\n\n", "")
                    .replaceAll("(?s)```json\\s*", "")
                    .replaceAll("(?s)```\\s*", "")
                    .trim();

            int inicio = limpia.indexOf('[');
            int fin    = limpia.lastIndexOf(']');
            if (inicio == -1 || fin == -1)
                throw new RuntimeException("No se encontró JSON array");

            limpia = limpia.substring(inicio, fin + 1);

            // Corregir JSON malformado — agregar comas faltantes entre objetos
            limpia = limpia
                    .replaceAll("}\\s*\\[\\s*\\{", "}, {")
                    .replaceAll("}\\s*\\{", "}, {")
                    .replaceAll("]\\s*\\[", "], [");

            List<Object> raw;
            try {
                raw = objectMapper.readValue(limpia, List.class);
            } catch (Exception e) {
                raw = extraerObjetosJSON(limpia);
            }

            // Detectar error de tema no permitido
            if (!raw.isEmpty() && raw.get(0) instanceof Map) {
                Map<String, Object> primero = (Map<String, Object>) raw.get(0);
                if ("tema_no_permitido".equals(primero.get("error"))) {
                    throw new RuntimeException(
                            "TEMA_NO_PERMITIDO: El tema no pertenece al " +
                                    "sílabo de Programación Básica. " +
                                    "Temas válidos: variables, tipos de dato, " +
                                    "estructuras de control, bucles, funciones, " +
                                    "arreglos, cadenas, algoritmos, recursividad.");
                }
            }

            List<Map<String, Object>> validos = new ArrayList<>();

            for (Object item : raw) {
                try {
                    Map<String, Object> p = null;

                    if (item instanceof Map) {
                        p = (Map<String, Object>) item;
                    } else if (item instanceof String) {
                        try {
                            p = objectMapper.readValue((String) item, Map.class);
                        } catch (Exception ex) { continue; }
                    }

                    if (p == null) continue;

                    if (!p.containsKey("titulo")
                            || !p.containsKey("teoria")
                            || !p.containsKey("enunciado")
                            || !p.containsKey("opciones")
                            || !p.containsKey("respuestaCorrecta")) continue;

                    Object correcta = p.get("respuestaCorrecta");
                    Object opciones = p.get("opciones");

                    if (opciones instanceof String) {
                        try {
                            opciones = objectMapper.readValue(
                                    (String) opciones, List.class);
                            p.put("opciones", opciones);
                        } catch (Exception ex) { continue; }
                    }

                    // Si respuesta es solo letra A/B/C/D, convertir al texto de la opción
                    if (correcta instanceof String) {
                        String corr = ((String) correcta).trim();
                        if (corr.matches("[A-Da-d][).]?") && opciones instanceof List) {
                            List<String> ops = (List<String>) opciones;
                            int idx = "AaBbCcDd".indexOf(corr.charAt(0)) / 2;
                            if (idx >= 0 && idx < ops.size()) {
                                p.put("respuestaCorrecta", ops.get(idx));
                            }
                        }
                    }

                    mezclarOpciones(p);
                    validos.add(p);

                } catch (Exception e) {
                    log.warn("[OLLAMA] Error procesando item: {}", e.getMessage());
                }
            }

            log.info("[OLLAMA] {} bloques válidos generados", validos.size());
            return validos;

        } catch (RuntimeException e) {
            throw e;
        } catch (Exception e) {
            log.error("[OLLAMA] Error parseando JSON: {}", e.getMessage());
            throw new RuntimeException(
                    "Error procesando respuesta de la IA: " + e.getMessage());
        }
    }

    // Extraer objetos JSON uno por uno cuando el array está malformado
    @SuppressWarnings("unchecked")
    private List<Object> extraerObjetosJSON(String texto) {
        List<Object> resultado = new ArrayList<>();
        int i = 0;
        while (i < texto.length()) {
            if (texto.charAt(i) == '{') {
                int nivel = 0;
                int inicio = i;
                while (i < texto.length()) {
                    char c = texto.charAt(i);
                    if (c == '{') nivel++;
                    else if (c == '}') {
                        nivel--;
                        if (nivel == 0) {
                            String obj = texto.substring(inicio, i + 1);
                            try {
                                resultado.add(objectMapper.readValue(
                                        obj, Map.class));
                            } catch (Exception e) {
                                log.warn("[OLLAMA] Objeto JSON inválido omitido");
                            }
                            break;
                        }
                    }
                    i++;
                }
            }
            i++;
        }
        return resultado;
    }

    // ── Mezclar opciones ──────────────────────────────────────

    @SuppressWarnings("unchecked")
    private void mezclarOpciones(Map<String, Object> pregunta) {
        List<String> opciones =
                (List<String>) pregunta.get("opciones");
        String correcta =
                (String) pregunta.get("respuestaCorrecta");
        if (opciones == null || opciones.isEmpty()) return;
        Collections.shuffle(opciones);
        pregunta.put("opciones",          opciones);
        pregunta.put("respuestaCorrecta", correcta);
    }

    // ── Verificar disponibilidad ──────────────────────────────

    public boolean estaDisponible() {
        try {
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(ollamaUrl + "/api/tags"))
                    .timeout(Duration.ofSeconds(5))
                    .GET()
                    .build();
            HttpResponse<String> response = httpClient.send(
                    request, HttpResponse.BodyHandlers.ofString());
            return response.statusCode() == 200;
        } catch (Exception e) {
            return false;
        }
    }
}