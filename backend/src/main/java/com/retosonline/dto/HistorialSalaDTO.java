package com.retosonline.dto;

import lombok.*;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HistorialSalaDTO {

    private int     pagina;
    private int     tamano;
    private long    totalElementos;
    private int     totalPaginas;
    private boolean primera;
    private boolean ultima;
    private List<ItemHistorialDTO> items;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ItemHistorialDTO {
        private Long   salaId;
        private String codigoSala;
        private String nombreSala;
        private String modo;
        private String dificultad;
        private String fechaCreacion;
        private String fechaFin;
        private int    cantidadPreguntas;
        private int    totalParticipantes;
        private String creador;
        private String creadorEmail;
        private double promedio;
        private double porcentajeAciertos;
        private int    puntajeMasAlto;
        private String ganador;
    }
}