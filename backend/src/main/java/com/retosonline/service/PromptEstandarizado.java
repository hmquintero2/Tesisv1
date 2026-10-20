package com.retosonline.service;

import com.fasterxml.jackson.databind.ObjectMapper;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

public class PromptEstandarizado {

    public static String construir(String tema, int cantidad, String dificultad) {
        return """
            Eres un generador de contenido educativo para estudiantes de \
            programación de nivel inicial (1er y 2do nivel universitario).

            TEMA SOLICITADO: %s

            Genera %d bloques de contenido. Cada bloque debe tener:
            - Un título breve
            - Una explicación teórica corta (máximo 100 palabras)
            - Una pregunta de opción múltiple con 4 opciones y una respuesta correcta

            Dificultad: %s
            Responde SOLO con un array JSON, sin texto extra, sin markdown.
            Formato exacto:
            [{"titulo":"texto","teoria":"texto","enunciado":"texto",\
            "opciones":["A","B","C","D"],"respuestaCorrecta":"texto exacto"}]
            """.formatted(tema, cantidad, dificultad);
    }

    @SuppressWarnings("unchecked")
    public static List<Map<String, Object>> parsear(
            String respuestaTexto, ObjectMapper objectMapper) throws Exception {

        String limpia = respuestaTexto
                .replaceAll("(?s)```json\\s*", "")
                .replaceAll("(?s)```\\s*", "")
                .trim();

        int inicio = limpia.indexOf('[');
        int fin    = limpia.lastIndexOf(']');
        if (inicio == -1 || fin == -1)
            throw new RuntimeException("No se encontró JSON array en la respuesta");

        limpia = limpia.substring(inicio, fin + 1);
        return objectMapper.readValue(limpia, List.class);
    }
}