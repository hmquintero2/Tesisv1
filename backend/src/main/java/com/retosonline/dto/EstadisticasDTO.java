package com.retosonline.dto;

import lombok.*;
import java.util.List;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class EstadisticasDTO {
    private double promedio;
    private double porcentajeAciertos;
    private int puntajeMasAlto;
    private String ganador; // null si es modo PRUEBA

    // Detalle por alumno para el reporte del host
    private List<AlumnoDetalleDTO> detalleAlumnos;

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class AlumnoDetalleDTO {
        private String nombre;
        private String email;
        private int puntos;
        private int correctas;
        private int incorrectas;
        private double tiempoPromedioMs;
        private int vecesAbandonoPestana;
    }
}