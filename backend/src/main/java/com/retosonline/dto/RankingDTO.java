package com.retosonline.dto;


import lombok.*;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class RankingDTO {
    private String username;
    private String avatar;
    private int puntos;
    private int posicion;
}
