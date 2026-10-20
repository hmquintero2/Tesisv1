package com.retosonline.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class RespuestaRequest {
    @NotBlank private String codigoSala;
    private Long preguntaId;
    private String respuestaSeleccionada;
    private int tiempoRespuestaMs;
    private String remitente; // email
}