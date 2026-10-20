package com.retosonline.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.retosonline.dto.PreguntaDTO;
import com.retosonline.entity.Pregunta;
import com.retosonline.entity.Sala;
import com.retosonline.repository.PreguntaRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class PreguntaService {

    private final PreguntaRepository preguntaRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * Obtiene las preguntas de una sala específica.
     * Ya no busca del banco general — cada sala tiene sus propias preguntas.
     */
    public List<Pregunta> obtenerPreguntasParaSala(Sala sala) {
        List<Pregunta> preguntas = preguntaRepository.findBySala(sala);

        if (preguntas.isEmpty()) {
            throw new RuntimeException(
                    "La sala no tiene preguntas generadas. " +
                            "Algo falló al crear la sala con IA.");
        }

        // Mezclar para que no salgan siempre en el mismo orden
        Collections.shuffle(preguntas);

        // Respetar el límite configurado en la sala
        int cantidad = Math.min(sala.getCantidadPreguntas(), preguntas.size());
        return preguntas.subList(0, cantidad);
    }

    public PreguntaDTO toDTO(Pregunta p, int numero, int total,
                             int tiempoLimite) {
        List<String> opciones;
        try {
            opciones = objectMapper.readValue(p.getOpcionesJson(), List.class);
        } catch (Exception e) {
            opciones = new ArrayList<>(
                    List.of(p.getOpcionesJson().split(",")));
        }
        // Mezclar opciones en cada pregunta
        Collections.shuffle(opciones);

        return PreguntaDTO.builder()
                .id(p.getId())
                .enunciado(p.getEnunciado())
                .opciones(opciones)
                .respuestaCorrecta(p.getRespuestaCorrecta())
                .dificultad(p.getDificultad().name())
                .tema(p.getTema())
                .tipo(p.getTipo().name())
                .numero(numero)
                .totalPreguntas(total)
                .tiempoLimite(tiempoLimite)
                .build();
    }
}