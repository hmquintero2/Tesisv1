package com.retosonline.websocket;

import com.retosonline.dto.ChatMessageDTO;
import com.retosonline.dto.RespuestaRequest;
import com.retosonline.entity.Usuario;
import com.retosonline.repository.UsuarioRepository;
import com.retosonline.service.PresentacionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.stereotype.Controller;

@Controller
@RequiredArgsConstructor
@Slf4j
public class PresentacionWebSocketController {

    private final PresentacionService presentacionService;
    private final UsuarioRepository usuarioRepository;

    @MessageMapping("/sala/{codigo}/iniciar-presentacion")
    public void iniciar(@DestinationVariable String codigo, ChatMessageDTO message) {
        presentacionService.iniciarPresentacion(codigo, message.getRemitente());
    }

    @MessageMapping("/sala/{codigo}/siguiente-diapositiva")
    public void siguiente(@DestinationVariable String codigo, ChatMessageDTO message) {
        presentacionService.avanzarDiapositiva(codigo, message.getRemitente());
    }

    @MessageMapping("/sala/{codigo}/responder-presentacion")
    public void responder(@DestinationVariable String codigo, RespuestaRequest request) {
        Usuario usuario = usuarioRepository.findByEmail(request.getRemitente())
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
        presentacionService.responder(codigo, usuario, request.getPreguntaId(), request.getRespuestaSeleccionada());
    }
}