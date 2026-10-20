package com.retosonline.dto;

import lombok.Builder;
import lombok.Data;
import java.util.List;

@Data
@Builder
public class SalaResponse {
    private Long id;
    private String codigo;
    private String nombre;
    private String creador;
    private String estado;
    private String creadorEmail;
    private int maxJugadores;
    private int jugadoresConectados;
    private String fechaCreacion;
    private String modo;
    private String dificultad;
    private int cantidadPreguntas;
    private int tiempoPorPregunta;
    private List<ParticipanteDTO> participantesDetalle;
    private String condicion;
}