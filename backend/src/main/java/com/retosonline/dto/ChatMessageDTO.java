package com.retosonline.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ChatMessageDTO {
    private String tipo;      // CHAT_MESSAGE, PLAYER_JOINED, PLAYER_LEFT, ROOM_UPDATED
    private String remitente;
    private String mensaje;
    private String codigoSala;
    private String fechaEnvio;
}
