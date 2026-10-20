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
public class ApiCerradaService {

    @Value("${gemini.api.key:}")
    private String apiKey;

    @Value("${gemini.model:gemini-2.5-flash}")
    private String modelo;

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(30))
            .build();

    public ContenidoGeneradoDTO generarContenido(
            String tema, int cantidadPreguntas, String dificultad) {

        String prompt = PromptEstandarizado.construir(
                tema, cantidadPreguntas, dificultad);

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("contents", List.of(
                Map.of("parts", List.of(Map.of("text", prompt)))
        ));
        body.put("generationConfig", Map.of(
                "temperature", 0.3,
                "topP", 0.9
        ));

        String url = "https://generativelanguage.googleapis.com/v1beta/models/"
                + modelo + ":generateContent?key=" + apiKey;

        try {
            long inicio = System.currentTimeMillis();

            String jsonBody = objectMapper.writeValueAsString(body);
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .header("Content-Type", "application/json")
                    .timeout(Duration.ofMinutes(2))
                    .POST(HttpRequest.BodyPublishers.ofString(jsonBody))
                    .build();

            HttpResponse<String> response = httpClient.send(
                    request, HttpResponse.BodyHandlers.ofString());

            long latencyMs = System.currentTimeMillis() - inicio;

            if (response.statusCode() != 200) {
                throw new RuntimeException(
                        "API Gemini respondió con status "
                                + response.statusCode() + ": " + response.body());
            }

            JsonNode root = objectMapper.readTree(response.body());

            String contenidoTexto = root
                    .get("candidates").get(0)
                    .get("content").get("parts").get(0)
                    .get("text").asText();

            JsonNode usage = root.get("usageMetadata");
            int inputTokens  = usage != null && usage.has("promptTokenCount")
                    ? usage.get("promptTokenCount").asInt() : 0;
            int outputTokens = usage != null && usage.has("candidatesTokenCount")
                    ? usage.get("candidatesTokenCount").asInt() : 0;
            float tokensPerSecond = latencyMs > 0
                    ? (outputTokens / (latencyMs / 1000f)) : 0;

            List<Map<String, Object>> diapositivas =
                    PromptEstandarizado.parsear(contenidoTexto, objectMapper);

            log.info("[GEMINI] latencyMs={} tokensPerSecond={} diapositivas={}",
                    latencyMs, tokensPerSecond, diapositivas.size());

            return ContenidoGeneradoDTO.builder()
                    .diapositivas(diapositivas)
                    .latencyMs(latencyMs)
                    .inputTokens(inputTokens)
                    .outputTokens(outputTokens)
                    .tokensPerSecond(tokensPerSecond)
                    .memoryUsageMb(null)
                    .build();

        } catch (Exception e) {
            log.error("[GEMINI] Error: {}", e.getMessage());
            throw new RuntimeException(
                    "No se pudo generar contenido con Gemini: "
                            + e.getMessage());
        }
    }
}