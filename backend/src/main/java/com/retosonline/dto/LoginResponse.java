package com.retosonline.dto;

import lombok.*;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class LoginResponse {
    private String token;
    private String tipo;
    private Long   id;
    private String nombre;
    private String email;
    private String rol;
    private String mensaje;
}