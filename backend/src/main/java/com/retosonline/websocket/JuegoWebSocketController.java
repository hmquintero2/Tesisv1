package com.retosonline.websocket;

import com.retosonline.dto.ChatMessageDTO;
import com.retosonline.dto.RespuestaRequest;
import com.retosonline.entity.Sala;
import com.retosonline.entity.Usuario;
import com.retosonline.enums.EstadoConexion;
import com.retosonline.repository.ParticipanteSalaRepository;
import com.retosonline.repository.SalaRepository;
import com.retosonline.repository.UsuarioRepository;
import com.retosonline.service.JuegoService;
import com.retosonline.service.SalaService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;
import java.time.LocalDateTime;

@Controller
@RequiredArgsConstructor
@Slf4j
public class JuegoWebSocketController {

    private final SalaService salaService;
    private final JuegoService juegoService;
    private final SalaRepository salaRepository;
    private final UsuarioRepository usuarioRepository;
    private final ParticipanteSalaRepository participanteRepository;
    private final SimpMessagingTemplate messagingTemplate;

    @MessageMapping("/sala/{codigo}/listo")
    public void marcarListo(@DestinationVariable String codigo, ChatMessageDTO message) {
        salaService.marcarListo(codigo, message.getRemitente());
        messagingTemplate.convertAndSend("/topic/sala/" + codigo + "/participantes",
                ChatMessageDTO.builder().tipo("PARTICIPANTE_LISTO")
                        .remitente(message.getRemitente()).codigoSala(codigo)
                        .fechaEnvio(LocalDateTime.now().toString()).build());
    }

    @MessageMapping("/sala/{codigo}/iniciar")
    public void iniciar(@DestinationVariable String codigo, ChatMessageDTO message) {
        Sala sala = salaRepository.findByCodigo(codigo)
                .orElseThrow(() -> new RuntimeException("Sala no encontrada"));
        if (!sala.getCreador().getEmail().equals(message.getRemitente())) {
            log.warn("{} intentó iniciar sala {} sin ser el creador", message.getRemitente(), codigo);
            return;
        }
        juegoService.iniciarPartida(codigo);
    }

    @MessageMapping("/sala/{codigo}/responder")
    public void responder(@DestinationVariable String codigo, RespuestaRequest request) {
        Usuario usuario = usuarioRepository.findByEmail(request.getRemitente())
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
        juegoService.responder(codigo, usuario, request.getPreguntaId(),
                request.getRespuestaSeleccionada(), request.getTiempoRespuestaMs());
    }

    @MessageMapping("/sala/{codigo}/abandono-pestana")
    public void abandonoPestana(@DestinationVariable String codigo, ChatMessageDTO message) {
        Sala sala = salaRepository.findByCodigo(codigo)
                .orElseThrow(() -> new RuntimeException("Sala no encontrada"));
        Usuario usuario = usuarioRepository.findByEmail(message.getRemitente())
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        participanteRepository.findByUsuarioAndSalaAndActivoTrue(usuario, sala)
                .ifPresent(p -> {
                    boolean salio = "true".equalsIgnoreCase(message.getMensaje());
                    p.setEstadoConexion(salio ? EstadoConexion.ABANDONO_PESTANA : EstadoConexion.CONECTADO);
                    if (salio) {
                        p.setVecesAbandonoPestana(p.getVecesAbandonoPestana() + 1); // ← incrementar
                    }
                    participanteRepository.save(p);
                });

        messagingTemplate.convertAndSend("/topic/sala/" + codigo + "/participantes",
                ChatMessageDTO.builder().tipo("ESTADO_CONEXION")
                        .remitente(message.getRemitente()).mensaje(message.getMensaje())
                        .codigoSala(codigo).fechaEnvio(LocalDateTime.now().toString()).build());
    }

}