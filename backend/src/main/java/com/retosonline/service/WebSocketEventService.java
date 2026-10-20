package com.retosonline.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class WebSocketEventService {

    private final SimpMessagingTemplate messagingTemplate;

    /**
     * Notifica a todos los suscriptores de una sala sobre un cambio de estado.
     * @param codigoSala código único de la sala
     * @param payload    objeto a enviar como mensaje
     */
    public void notificarSala(String codigoSala, Object payload) {
        String destino = "/topic/sala/" + codigoSala;
        log.debug("Notificando sala {} → {}", codigoSala, destino);
        messagingTemplate.convertAndSend(destino, payload);
    }

    /**
     * Envía un mensaje privado a un usuario específico.
     * @param email   email del usuario destinatario
     * @param payload objeto a enviar
     */
    public void notificarUsuario(String email, Object payload) {
        log.debug("Notificando usuario {}", email);
        messagingTemplate.convertAndSendToUser(email, "/queue/notificaciones", payload);
    }

    /**
     * Notifica a todos los suscriptores del lobby general.
     * @param payload objeto a enviar
     */
    public void notificarLobby(Object payload) {
        log.debug("Notificando lobby global");
        messagingTemplate.convertAndSend("/topic/lobby", payload);
    }
}
