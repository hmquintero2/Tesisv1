package com.retosonline.dto;

import lombok.*;
import java.util.List;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class PreguntaDTO {
    private Long id;
    private String enunciado;
    private List<String> opciones;
    private String dificultad;
    private String tema;
    private String tipo;
    private String respuestaCorrecta;
    private int numero;
    private int totalPreguntas;
    private int tiempoLimite;

}