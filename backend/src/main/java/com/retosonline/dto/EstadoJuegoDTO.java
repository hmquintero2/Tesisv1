package com.retosonline.dto;

import lombok.*;
import java.util.List;
import java.util.Map;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class EstadoJuegoDTO {
    private String tipo; // INICIO_CUENTA_REGRESIVA, NUEVA_DIAPOSITIVA, TIEMPO_AGOTADO, FIN_JUEGO, PROGRESO_RESPUESTA
    private String codigoSala;
    private int segundosRestantes;
    private PreguntaDTO pregunta;
    private List<RankingDTO> ranking;
    private EstadisticasDTO estadisticas;

    private String tituloDiapositiva;
    private String teoriaDiapositiva;

    private String modoSala;

    private int totalRespondieron;
    private int totalJugadores;
    private String emailRespondio;
    private String nombreRespondio;
}