package com.retosonline.dto;

import lombok.*;
import java.util.List;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class PresentacionEstadoDTO {
    private String tipo; // PRES_DIAPOSITIVA, PRES_TIEMPO_AGOTADO, PRES_PROGRESO, PRES_FIN
    private String codigoSala;
    private String tituloDiapositiva;
    private String teoriaDiapositiva;
    private PreguntaDTO pregunta;
    private int totalRespondieron;
    private int totalJugadores;
    private List<ReporteAlumnoDTO> reporte; // solo en PRES_FIN
}