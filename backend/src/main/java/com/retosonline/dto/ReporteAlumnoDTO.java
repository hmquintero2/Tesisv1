package com.retosonline.dto;

import lombok.*;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class ReporteAlumnoDTO {
    private String nombre;
    private String email;
    private int correctas;
    private int incorrectas;
}