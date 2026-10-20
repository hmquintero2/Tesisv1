package com.retosonline.service;

import com.retosonline.dto.*;
import com.retosonline.entity.*;
import com.retosonline.enums.Dificultad;
import com.retosonline.enums.EstadoSala;
import com.retosonline.enums.ModoSala;
import com.retosonline.exception.*;
import com.retosonline.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class SalaService {

    private final SalaRepository             salaRepository;
    private final UsuarioRepository          usuarioRepository;
    private final ParticipanteSalaRepository participanteRepository;
    private final MensajeChatRepository      mensajeChatRepository;
    private final IaPreguntasService         iaPreguntasService;

    private static final String CARACTERES =
            "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    private static final SecureRandom random = new SecureRandom();

    // Límites fijos únicos (ya no hay distinción plan gratuito/pro)
    private static final int LIMITE_JUGADORES = 20;
    private static final int LIMITE_PREGUNTAS = 30;
    private static final int LIMITE_TIEMPO    = 120;

    // ── Crear sala ────────────────────────────────────────────

    @Transactional
    public SalaResponse crearSala(SalaRequest request, String emailUsuario) {
        Usuario creador = usuarioRepository.findByEmail(emailUsuario)
                .orElseThrow(() -> new UserNotFoundException(
                        "Usuario no encontrado"));

        if (request.getMaxJugadores() > LIMITE_JUGADORES) {
            throw new RuntimeException(
                    "El máximo es " + LIMITE_JUGADORES + " jugadores.");
        }
        if (request.getCantidadPreguntas() > LIMITE_PREGUNTAS) {
            throw new RuntimeException(
                    "El máximo es " + LIMITE_PREGUNTAS + " preguntas.");
        }
        if (request.getTiempoPorPregunta() > LIMITE_TIEMPO) {
            throw new RuntimeException(
                    "El máximo es " + LIMITE_TIEMPO + "s.");
        }

        // Validar fuente de preguntas
        String fuente    = request.getFuentePreguntas() != null
                ? request.getFuentePreguntas() : "TEMA";
        String contenido = request.getContenidoArchivo() != null
                && !request.getContenidoArchivo().isBlank()
                ? request.getContenidoArchivo()
                : request.getPromptPreguntas();

        if (contenido == null || contenido.isBlank()) {
            throw new RuntimeException(
                    "Debes proporcionar un tema, PDF o cuestionario " +
                            "para generar las preguntas.");
        }

        String codigo = generarCodigoUnico();

        Sala sala = Sala.builder()
                .codigo(codigo)
                .nombre(request.getNombre())
                .creador(creador)
                .estado(EstadoSala.ESPERANDO)
                .maxJugadores(request.getMaxJugadores() > 0
                        ? request.getMaxJugadores() : 5)
                .modo(ModoSala.valueOf(request.getModo()))
                .dificultad(Dificultad.valueOf(request.getDificultad()))
                .cantidadPreguntas(request.getCantidadPreguntas())
                .tiempoPorPregunta(request.getTiempoPorPregunta())
                .build();

        salaRepository.save(sala);

        // Generar preguntas con IA para esta sala
        try {
            iaPreguntasService.generarYGuardarParaSala(
                    sala, fuente, contenido, emailUsuario);
        } catch (Exception e) {
            salaRepository.delete(sala);
            throw new RuntimeException(
                    "No se pudieron generar las preguntas: "
                            + e.getMessage());
        }

        if (sala.getModo() == ModoSala.COMPETENCIA) {
            ParticipanteSala participante = ParticipanteSala.builder()
                    .usuario(creador)
                    .sala(sala)
                    .activo(true)
                    .build();
            participanteRepository.save(participante);
        }

        log.info("Sala creada con IA: {} por {} ({}/{})",
                codigo, emailUsuario, sala.getModo(),
                sala.getDificultad());

        return buildSalaResponse(sala);
    }

    // ── Unirse a sala ─────────────────────────────────────────

    @Transactional
    public SalaResponse unirseASala(String codigo, String emailUsuario) {
        Sala sala = salaRepository.findByCodigo(codigo)
                .orElseThrow(() -> new RoomNotFoundException(
                        "Sala no encontrada: " + codigo));

        if (!sala.getEstado().equals(EstadoSala.ESPERANDO)) {
            throw new InvalidRoomCodeException(
                    "La sala no está disponible para unirse");
        }

        Usuario usuario = usuarioRepository.findByEmail(emailUsuario)
                .orElseThrow(() -> new UserNotFoundException(
                        "Usuario no encontrado"));

        if (sala.getModo() == ModoSala.PRUEBA
                && sala.getCreador().getEmail().equals(emailUsuario)) {
            return buildSalaResponse(sala);
        }

        List<ParticipanteSala> activos =
                participanteRepository.findBySalaAndActivoTrue(sala);

        boolean yaEstaAdentro = participanteRepository
                .existsByUsuarioAndSalaAndActivoTrue(usuario, sala);

        if (!yaEstaAdentro) {
            if (activos.size() >= sala.getMaxJugadores()) {
                throw new RuntimeException("La sala está llena");
            }
            ParticipanteSala participante = ParticipanteSala.builder()
                    .usuario(usuario)
                    .sala(sala)
                    .activo(true)
                    .build();
            participanteRepository.save(participante);
            log.info("Usuario {} se unió a sala {}",
                    emailUsuario, codigo);
        }

        return buildSalaResponse(sala);
    }

    // ── Obtener sala ──────────────────────────────────────────

    public SalaResponse obtenerSala(String codigo) {
        Sala sala = salaRepository.findByCodigo(codigo)
                .orElseThrow(() -> new RoomNotFoundException(
                        "Sala no encontrada: " + codigo));
        return buildSalaResponse(sala);
    }

    // ── Salir de sala ─────────────────────────────────────────

    @Transactional
    public void salirDeSala(String codigo, String emailUsuario) {
        Sala sala = salaRepository.findByCodigo(codigo)
                .orElseThrow(() -> new RoomNotFoundException(
                        "Sala no encontrada: " + codigo));

        Usuario usuario = usuarioRepository.findByEmail(emailUsuario)
                .orElseThrow(() -> new UserNotFoundException(
                        "Usuario no encontrado"));

        participanteRepository
                .findByUsuarioAndSalaAndActivoTrue(usuario, sala)
                .ifPresent(p -> {
                    p.setActivo(false);
                    participanteRepository.save(p);
                    log.info("Usuario {} salió de sala {}",
                            emailUsuario, codigo);
                });
    }

    // ── Marcar listo ──────────────────────────────────────────

    @Transactional
    public void marcarListo(String codigo, String emailUsuario) {
        Sala sala = salaRepository.findByCodigo(codigo)
                .orElseThrow(() -> new RoomNotFoundException(
                        "Sala no encontrada: " + codigo));
        Usuario usuario = usuarioRepository.findByEmail(emailUsuario)
                .orElseThrow(() -> new UserNotFoundException(
                        "Usuario no encontrado"));

        participanteRepository
                .findByUsuarioAndSalaAndActivoTrue(usuario, sala)
                .ifPresent(p -> {
                    p.setListo(true);
                    participanteRepository.save(p);
                });
    }

    // ── Listar salas disponibles ──────────────────────────────

    public List<SalaResponse> listarSalasDisponibles(
            String dificultad, String modo, String estado) {
        return salaRepository.findAll().stream()
                .filter(s -> {
                    if (estado == null || estado.isBlank()) {
                        return s.getEstado() == EstadoSala.ESPERANDO
                                || s.getEstado() == EstadoSala.EN_JUEGO;
                    }
                    return s.getEstado().name().equalsIgnoreCase(estado);
                })
                .filter(s -> dificultad == null || dificultad.isBlank()
                        || s.getDificultad().name()
                        .equalsIgnoreCase(dificultad))
                .filter(s -> modo == null || modo.isBlank()
                        || s.getModo().name().equalsIgnoreCase(modo))
                .map(this::buildSalaResponse)
                .collect(Collectors.toList());
    }

    // ── Helper ────────────────────────────────────────────────

    private SalaResponse buildSalaResponse(Sala sala) {
        List<ParticipanteSala> activos =
                participanteRepository.findBySalaAndActivoTrue(sala);
        List<ParticipanteDTO> detalle = activos.stream()
                .map(p -> ParticipanteDTO.builder()
                        .nombre(p.getUsuario().getNombre())
                        .listo(p.isListo())
                        .estadoConexion(p.getEstadoConexion().name())
                        .build())
                .collect(Collectors.toList());

        return SalaResponse.builder()
                .id(sala.getId())
                .codigo(sala.getCodigo())
                .nombre(sala.getNombre())
                .creador(sala.getCreador().getNombre())
                .creadorEmail(sala.getCreador().getEmail())
                .estado(sala.getEstado().name())
                .modo(sala.getModo().name())
                .dificultad(sala.getDificultad().name())
                .cantidadPreguntas(sala.getCantidadPreguntas())
                .tiempoPorPregunta(sala.getTiempoPorPregunta())
                .maxJugadores(sala.getMaxJugadores())
                .jugadoresConectados(activos.size())
                .participantesDetalle(detalle)
                .fechaCreacion(sala.getFechaCreacion() != null
                        ? sala.getFechaCreacion().toString() : "")
                .build();
    }

    private String generarCodigoUnico() {
        String codigo;
        do {
            StringBuilder sb = new StringBuilder(6);
            for (int i = 0; i < 6; i++) {
                sb.append(CARACTERES.charAt(
                        random.nextInt(CARACTERES.length())));
            }
            codigo = sb.toString();
        } while (salaRepository.existsByCodigo(codigo));
        return codigo;
    }
}