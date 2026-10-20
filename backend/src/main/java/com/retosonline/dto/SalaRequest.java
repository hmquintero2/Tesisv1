package com.retosonline.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class SalaRequest {

    @NotBlank(message = "El nombre de la sala es obligatorio")
    private String nombre;

    private int     maxJugadores      = 5;
    private String  modo              = "COMPETENCIA";
    private String  dificultad        = "INTERMEDIO";
    private int     cantidadPreguntas = 5;
    private int     tiempoPorPregunta = 30;
    private String condicion = "CERRADO_API"; // CERRADO_API, LOCAL_SIN_FT, LOCAL_CON_FT

    // ── Fuente de preguntas IA ────────────────────────────────
    // TEMA, PDF, CUESTIONARIO
    private String fuentePreguntas    = "TEMA";

    // Si fuentePreguntas = TEMA: texto del prompt
    private String promptPreguntas;

    // Si fuentePreguntas = PDF o CUESTIONARIO:
    // el contenido del archivo ya extraído (texto plano)
    private String contenidoArchivo;

    // Nombre del archivo subido (para mostrar en UI)
    private String nombreArchivo;
}