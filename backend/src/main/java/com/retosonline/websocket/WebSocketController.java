package com.retosonline.websocket;


import com.retosonline.dto.ChatMessageDTO;
import com.retosonline.entity.MensajeChat;
import com.retosonline.repository.MensajeChatRepository;
import com.retosonline.repository.SalaRepository;
import com.retosonline.repository.UsuarioRepository;
import com.retosonline.service.SalaService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.*;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.time.LocalDateTime;

@Controller
@RequiredArgsConstructor
@Slf4j
public class WebSocketController {

    private final MensajeChatRepository mensajeChatRepository;
    private final SalaRepository salaRepository;
    private final UsuarioRepository usuarioRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private final SalaService salaService;

    /**
     * Maneja mensajes de chat.
     * Destino: /app/sala/{codigo}/chat → /topic/sala/{codigo}
     */
    @MessageMapping("/sala/{codigo}/chat")
    @SendTo("/topic/sala/{codigo}")
    public ChatMessageDTO sendMessage(@DestinationVariable String codigo,
                                      ChatMessageDTO message) {
        log.info("Chat en sala {}: [{}] {}", codigo, message.getRemitente(), message.getMensaje());

        salaRepository.findByCodigo(codigo).ifPresent(sala ->
                usuarioRepository.findByEmail(message.getRemitente()).ifPresent(usuario -> {
                    MensajeChat mensajeChat = MensajeChat.builder()
                            .usuario(usuario)
                            .sala(sala)
                            .mensaje(message.getMensaje())
                            .build();
                    mensajeChatRepository.save(mensajeChat);
                })
        );

        message.setTipo("CHAT_MESSAGE");
        message.setFechaEnvio(LocalDateTime.now().toString());
        return message;
    }

    /**
     * Indicador de escritura.
     * Destino: /app/sala/{codigo}/typing → /topic/sala/{codigo}/typing
     * El campo "mensaje" lleva "true" (escribiendo) o "false" (dejó de escribir).
     */
    @MessageMapping("/sala/{codigo}/typing")
    @SendTo("/topic/sala/{codigo}/typing")
    public ChatMessageDTO typingIndicator(@DestinationVariable String codigo,
                                          ChatMessageDTO message) {
        message.setTipo("TYPING");
        return message;
    }

    /**
     * Jugador se une a la sala.
     * Destino: /app/sala/{codigo}/unirse → /topic/sala/{codigo}/participantes
     */
    @MessageMapping("/sala/{codigo}/unirse")
    public void playerJoined(@DestinationVariable String codigo,
                             ChatMessageDTO message) {
        log.info("PLAYER_JOINED en sala {}: {}", codigo, message.getRemitente());

        try {
            salaService.unirseASala(codigo, message.getRemitente());
        } catch (Exception e) {
            log.warn("unirseASala WS: {}", e.getMessage());
        }

        ChatMessageDTO evento = ChatMessageDTO.builder()
                .tipo("PLAYER_JOINED")
                .remitente(message.getRemitente())
                .mensaje(message.getMensaje())
                .codigoSala(codigo)
                .fechaEnvio(LocalDateTime.now().toString())
                .build();

        messagingTemplate.convertAndSend("/topic/sala/" + codigo + "/participantes", evento);
    }

    /**
     * Jugador sale de la sala.
     * Destino: /app/sala/{codigo}/salir → /topic/sala/{codigo}/participantes
     */
    @MessageMapping("/sala/{codigo}/salir")
    public void playerLeft(@DestinationVariable String codigo,
                           ChatMessageDTO message) {
        log.info("PLAYER_LEFT en sala {}: {}", codigo, message.getRemitente());

        try {
            salaService.salirDeSala(codigo, message.getRemitente());
        } catch (Exception e) {
            log.warn("salirDeSala WS: {}", e.getMessage());
        }

        ChatMessageDTO evento = ChatMessageDTO.builder()
                .tipo("PLAYER_LEFT")
                .remitente(message.getRemitente())
                .mensaje(message.getMensaje())
                .codigoSala(codigo)
                .fechaEnvio(LocalDateTime.now().toString())
                .build();

        messagingTemplate.convertAndSend("/topic/sala/" + codigo + "/participantes", evento);
    }
}