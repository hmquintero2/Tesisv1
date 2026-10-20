package com.retosonline.service;

import com.retosonline.dto.*;
import com.retosonline.entity.*;
import com.retosonline.enums.EstadoSala;
import com.retosonline.enums.ModoSala;
import com.retosonline.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicBoolean;

@Service
@RequiredArgsConstructor
@Slf4j
public class JuegoService {

    private final SalaRepository             salaRepository;
    private final PreguntaService             preguntaService;
    private final PuntajeService              puntajeService;
    private final EstadisticasService         estadisticasService;
    private final HistorialService            historialService;
    private final ColaService                 colaService;
    private final DiapositivaRepository       diapositivaRepository;
    private final RespuestaSalaRepository     respuestaSalaRepository;
    private final SimpMessagingTemplate       messagingTemplate;
    private final ParticipanteSalaRepository  participanteRepository;

    private static final int PUNTOS_MAXIMOS = 1000;

    private final Map<String, EstadoPartida> partidas  = new ConcurrentHashMap<>();
    private final ScheduledExecutorService   scheduler = Executors.newScheduledThreadPool(4);

    // ── Inicio ────────────────────────────────────────────────────

    public void iniciarPartida(String codigo) {
        Sala sala = salaRepository.findByCodigo(codigo)
                .orElseThrow(() -> new RuntimeException("Sala no encontrada"));
        sala.setEstado(EstadoSala.EN_JUEGO);
        salaRepository.save(sala);

        List<Pregunta> preguntas = preguntaService.obtenerPreguntasParaSala(sala);
        partidas.put(codigo, new EstadoPartida(preguntas, sala.getTiempoPorPregunta()));

        for (int i = 5; i >= 1; i--) {
            final int seg = i;
            scheduler.schedule(
                    () -> messagingTemplate.convertAndSend(
                            "/topic/sala/" + codigo + "/juego",
                            EstadoJuegoDTO.builder()
                                    .tipo("INICIO_CUENTA_REGRESIVA")
                                    .codigoSala(codigo)
                                    .segundosRestantes(seg)
                                    .build()),
                    5 - seg, TimeUnit.SECONDS);
        }
        // Mostrar la primera diapositiva automáticamente al terminar la cuenta regresiva
        scheduler.schedule(() -> avanzarDiapositiva(codigo, null), 5, TimeUnit.SECONDS);
    }

    // ── Avanzar diapositiva (control del anfitrión) ─────────────────

    public synchronized void avanzarDiapositiva(String codigo, String emailSolicitante) {
        Sala sala = salaRepository.findByCodigo(codigo)
                .orElseThrow(() -> new RuntimeException("Sala no encontrada"));

        // Validar que solo el anfitrión avance (emailSolicitante == null solo en el primer envío automático)
        if (emailSolicitante != null && !sala.getCreador().getEmail().equals(emailSolicitante)) {
            log.warn("{} intentó avanzar diapositiva en sala {} sin ser el anfitrión", emailSolicitante, codigo);
            return;
        }

        EstadoPartida estado = partidas.get(codigo);
        if (estado == null) return;

        if (!estado.tieneSiguientePregunta()) {
            finalizarPartida(codigo);
            return;
        }

        Pregunta pregunta = estado.siguientePregunta();

        Optional<Diapositiva> diapositivaOpt =
                diapositivaRepository.findByPreguntaId(pregunta.getId());

        PreguntaDTO dto = preguntaService.toDTO(
                pregunta,
                estado.getIndiceActual(),
                estado.getTotalPreguntas(),
                estado.getTiempoLimiteSegundos());

        messagingTemplate.convertAndSend(
                "/topic/sala/" + codigo + "/juego",
                EstadoJuegoDTO.builder()
                        .tipo("NUEVA_DIAPOSITIVA")
                        .codigoSala(codigo)
                        .tituloDiapositiva(diapositivaOpt.map(Diapositiva::getTitulo).orElse(""))
                        .teoriaDiapositiva(diapositivaOpt.map(Diapositiva::getTeoria).orElse(""))
                        .pregunta(dto)
                        .build());

        log.info("[JUEGO] Diapositiva {}/{} enviada a sala {} — respuesta en {}s",
                estado.getIndiceActual(), estado.getTotalPreguntas(), codigo, estado.getTiempoLimiteSegundos());

        // El temporizador de respuesta (15s configurados en la sala) SOLO cierra
        // la pregunta y muestra resultado — NO avanza a la siguiente diapositiva.
        scheduler.schedule(
                () -> cerrarPreguntaPorTiempo(codigo, pregunta.getId()),
                estado.getTiempoLimiteSegundos(), TimeUnit.SECONDS);
    }

    // ── Cerrar pregunta cuando se acaba el tiempo ────────────────────

    private synchronized void cerrarPreguntaPorTiempo(String codigo, Long preguntaId) {
        EstadoPartida estado = partidas.get(codigo);
        if (estado == null) return;
        if (!preguntaId.equals(estado.getPreguntaActualId())) return; // ya se avanzó
        if (estado.yaSeMostroResultado()) return;

        estado.marcarResultadoMostrado();
        messagingTemplate.convertAndSend(
                "/topic/sala/" + codigo + "/juego",
                EstadoJuegoDTO.builder()
                        .tipo("TIEMPO_AGOTADO")
                        .codigoSala(codigo)
                        .build());
    }

    // ── Respuesta ─────────────────────────────────────────────────

    public void responder(String codigo, Usuario usuario,
                          Long preguntaId, String respuesta, int tiempoMs) {
        EstadoPartida estado = partidas.get(codigo);
        if (estado == null) return;
        if (!estado.getPreguntaActualId().equals(preguntaId)) return;
        if (estado.yaRespondio(usuario.getEmail())) return;
        if (estado.yaSeMostroResultado()) return;

        Pregunta pregunta = estado.getPreguntaActual();
        boolean correcta  = pregunta.getRespuestaCorrecta()
                .equalsIgnoreCase(respuesta);

        int puntos = 0;
        if (correcta) {
            double vps = (double) PUNTOS_MAXIMOS / estado.getTiempoLimiteSegundos();
            puntos = (int) Math.max(0,
                    PUNTOS_MAXIMOS - (tiempoMs / 1000.0) * vps);
        }

        Sala sala = salaRepository.findByCodigo(codigo).orElseThrow();
        respuestaSalaRepository.save(RespuestaSala.builder()
                .usuario(usuario).sala(sala).pregunta(pregunta)
                .correcta(correcta).tiempoRespuestaMs(tiempoMs)
                .puntosObtenidos(puntos).build());

        puntajeService.sumarPuntos(usuario, sala, puntos);

        messagingTemplate.convertAndSend(
                "/topic/sala/" + codigo + "/ranking",
                puntajeService.obtenerRanking(sala));

        estado.registrarRespuesta(usuario.getEmail());

        int totalJugadores = sala.getModo() == ModoSala.PRUEBA
                ? participanteRepository.findBySalaAndActivoTrue(sala).stream()
                  .filter(p -> !p.getUsuario().getEmail()
                                .equals(sala.getCreador().getEmail()))
                  .collect(java.util.stream.Collectors.toList()).size()
                : participanteRepository.findBySalaAndActivoTrue(sala).size();
        int totalRespondieron = estado.getTotalRespondieron();

        log.info("[JUEGO] Sala {} — {}/{} respondieron",
                codigo, totalRespondieron, totalJugadores);

        messagingTemplate.convertAndSend(
                "/topic/sala/" + codigo + "/juego",
                EstadoJuegoDTO.builder()
                        .tipo("PROGRESO_RESPUESTA")
                        .codigoSala(codigo)
                        .totalRespondieron(totalRespondieron)
                        .totalJugadores(totalJugadores)
                        .emailRespondio(usuario.getEmail())
                        .nombreRespondio(usuario.getNombre())
                        .build());

        // Si todos ya respondieron, mostrar resultado de inmediato (sin avanzar)
        if (totalRespondieron >= totalJugadores && !estado.yaSeMostroResultado()) {
            estado.marcarResultadoMostrado();
            messagingTemplate.convertAndSend(
                    "/topic/sala/" + codigo + "/juego",
                    EstadoJuegoDTO.builder()
                            .tipo("TIEMPO_AGOTADO")
                            .codigoSala(codigo)
                            .build());
        }
    }

    // ── Finalización ──────────────────────────────────────────────

    private void finalizarPartida(String codigo) {
        Sala sala = salaRepository.findByCodigo(codigo).orElseThrow();
        sala.setEstado(EstadoSala.FINALIZADA);
        salaRepository.save(sala);

        List<RankingDTO>  ranking      = puntajeService.obtenerRanking(sala);
        EstadisticasDTO   estadisticas = estadisticasService.calcular(sala);

        historialService.generarYPersistirReporte(sala, estadisticas, ranking);

        byte[] reporteBytes = historialService
                .obtenerContenidoReporte(sala.getCodigo())
                .getBytes(StandardCharsets.UTF_8);

        List<ParticipanteSala> participantes =
                participanteRepository.findBySala(sala);

        for (ParticipanteSala p : participantes) {
            int posicion = ranking.stream()
                    .filter(r -> r.getUsername().equals(p.getUsuario().getNombre())
                            || r.getUsername().equals(p.getUsuario().getEmail()))
                    .findFirst()
                    .map(r -> ranking.indexOf(r) + 1)
                    .orElse(0);

            colaService.encolar(
                    ColaService.Tipo.REPORTE_SALA,
                    p.getUsuario().getEmail(),
                    Map.of(
                            "nombreJugador", p.getUsuario().getNombre(),
                            "sala",          sala,
                            "estadisticas",  estadisticas,
                            "ranking",       ranking,
                            "posicion",      posicion,
                            "reporteBytes",  reporteBytes,
                            "codigoSala",    codigo
                    ));
        }

        log.info("Sala {} finalizada — reporte persistido y {} correos encolados",
                codigo, participantes.size());

        messagingTemplate.convertAndSend(
                "/topic/sala/" + codigo + "/juego",
                EstadoJuegoDTO.builder()
                        .tipo("FIN_JUEGO")
                        .codigoSala(codigo)
                        .modoSala(sala.getModo().name())
                        .ranking(ranking)
                        .estadisticas(estadisticas)
                        .build());

        partidas.remove(codigo);
    }

    // ── Estado interno de partida ─────────────────────────────────

    private static class EstadoPartida {
        private final List<Pregunta> preguntas;
        private final int            tiempoLimiteSegundos;
        private int                  indice            = -1;
        private int                  totalRespondieron = 0;

        private final java.util.Set<String> respondieron =
                java.util.Collections.synchronizedSet(new java.util.HashSet<>());
        private final AtomicBoolean resultadoMostrado = new AtomicBoolean(false);

        EstadoPartida(List<Pregunta> p, int t) {
            preguntas = p;
            tiempoLimiteSegundos = t;
        }

        boolean yaSeMostroResultado() { return resultadoMostrado.get(); }
        void marcarResultadoMostrado() { resultadoMostrado.set(true); }

        boolean yaRespondio(String email) {
            return respondieron.contains(email);
        }

        void registrarRespuesta(String email) {
            if (respondieron.add(email)) totalRespondieron++;
        }

        int getTotalRespondieron() { return totalRespondieron; }

        Pregunta siguientePregunta() {
            indice++;
            totalRespondieron = 0;
            respondieron.clear();
            resultadoMostrado.set(false);
            return preguntas.get(indice);
        }

        boolean  tieneSiguientePregunta()  { return indice + 1 < preguntas.size(); }
        Pregunta getPreguntaActual()        { return preguntas.get(indice); }
        Long     getPreguntaActualId()      { return preguntas.get(indice).getId(); }
        int      getIndiceActual()          { return indice + 1; }
        int      getTotalPreguntas()        { return preguntas.size(); }
        int      getTiempoLimiteSegundos()  { return tiempoLimiteSegundos; }
    }
}