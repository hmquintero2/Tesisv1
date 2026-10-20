package com.retosonline.dto;

import lombok.*;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class ParticipanteDTO {
    private String nombre;
    private String avatar;
    private boolean listo;
    private String estadoConexion;
}
