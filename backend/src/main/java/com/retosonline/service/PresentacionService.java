package com.retosonline.service;

import com.retosonline.dto.*;
import com.retosonline.entity.*;
import com.retosonline.enums.EstadoSala;
import com.retosonline.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import com.retosonline.dto.EstadisticasDTO;
import com.retosonline.dto.RankingDTO;
import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class PresentacionService {

    private final SalaRepository             salaRepository;
    private final PreguntaService             preguntaService;
    private final DiapositivaRepository       diapositivaRepository;
    private final RespuestaSalaRepository     respuestaSalaRepository;
    private final ParticipanteSalaRepository  participanteRepository;
    private final SimpMessagingTemplate       messagingTemplate;
    private final HistorialService historialService;
    private final EstadisticasService estadisticasService;

    private final Map<String, EstadoPresentacion> presentaciones = new ConcurrentHashMap<>();
    private final ScheduledExecutorService scheduler = Executors.newScheduledThreadPool(2);

    // ── Iniciar presentación ───────────────────────────────────

    public void iniciarPresentacion(String codigo, String emailSolicitante) {
        Sala sala = salaRepository.findByCodigo(codigo)
                .orElseThrow(() -> new RuntimeException("Sala no encontrada"));

        if (!sala.getCreador().getEmail().equals(emailSolicitante)) {
            log.warn("{} intentó iniciar presentación {} sin ser el anfitrión", emailSolicitante, codigo);
            return;
        }

        sala.setEstado(EstadoSala.EN_JUEGO);
        salaRepository.save(sala);

        List<Pregunta> preguntas = diapositivaRepository.findBySalaOrderByOrdenAsc(sala).stream()
                .map(Diapositiva::getPregunta)
                .filter(java.util.Objects::nonNull)
                .collect(java.util.stream.Collectors.toList());

        if (preguntas.isEmpty()) {
            throw new RuntimeException("La sala no tiene diapositivas generadas.");
        }

        presentaciones.put(codigo, new EstadoPresentacion(preguntas, sala.getTiempoPorPregunta()));
        log.info("[PRESENTACION] Iniciada en sala {} por {}", codigo, emailSolicitante);
    }

    // ── Avanzar diapositiva (control del anfitrión) ─────────────

    public synchronized void avanzarDiapositiva(String codigo, String emailSolicitante) {
        Sala sala = salaRepository.findByCodigo(codigo)
                .orElseThrow(() -> new RuntimeException("Sala no encontrada"));

        if (!sala.getCreador().getEmail().equals(emailSolicitante)) {
            log.warn("{} intentó avanzar presentación {} sin ser el anfitrión", emailSolicitante, codigo);
            return;
        }

        EstadoPresentacion estado = presentaciones.get(codigo);
        if (estado == null) return;

        if (!estado.tieneSiguiente()) {
            finalizarPresentacion(codigo);
            return;
        }

        Pregunta pregunta = estado.siguiente();
        Optional<Diapositiva> diapositivaOpt =
                diapositivaRepository.findByPreguntaId(pregunta.getId());

        PreguntaDTO dto = preguntaService.toDTO(
                pregunta, estado.getIndiceActual(), estado.getTotal(), estado.getTiempoLimite());

        messagingTemplate.convertAndSend(
                "/topic/sala/" + codigo + "/juego",
                PresentacionEstadoDTO.builder()
                        .tipo("PRES_DIAPOSITIVA")
                        .codigoSala(codigo)
                        .tituloDiapositiva(diapositivaOpt.map(Diapositiva::getTitulo).orElse(""))
                        .teoriaDiapositiva(diapositivaOpt.map(Diapositiva::getTeoria).orElse(""))
                        .pregunta(dto)
                        .build());

        log.info("[PRESENTACION] Diapositiva {}/{} enviada a sala {}",
                estado.getIndiceActual(), estado.getTotal(), codigo);

        scheduler.schedule(
                () -> cerrarPorTiempo(codigo, pregunta.getId()),
                estado.getTiempoLimite(), TimeUnit.SECONDS);
    }

    private synchronized void cerrarPorTiempo(String codigo, Long preguntaId) {
        EstadoPresentacion estado = presentaciones.get(codigo);
        if (estado == null) return;
        if (!preguntaId.equals(estado.getPreguntaActualId())) return;
        if (estado.yaMostrado()) return;

        estado.marcarMostrado();
        messagingTemplate.convertAndSend(
                "/topic/sala/" + codigo + "/juego",
                PresentacionEstadoDTO.builder()
                        .tipo("PRES_TIEMPO_AGOTADO")
                        .codigoSala(codigo)
                        .build());
    }

    // ── Responder ────────────────────────────────────────────────

    public void responder(String codigo, Usuario usuario, Long preguntaId, String respuesta) {
        EstadoPresentacion estado = presentaciones.get(codigo);
        if (estado == null) return;
        if (!estado.getPreguntaActualId().equals(preguntaId)) return;
        if (estado.yaRespondio(usuario.getEmail())) return;
        if (estado.yaMostrado()) return;

        Pregunta pregunta = estado.getPreguntaActual();
        boolean correcta = pregunta.getRespuestaCorrecta().equalsIgnoreCase(respuesta);

        Sala sala = salaRepository.findByCodigo(codigo).orElseThrow();
        respuestaSalaRepository.save(RespuestaSala.builder()
                .usuario(usuario).sala(sala).pregunta(pregunta)
                .correcta(correcta).tiempoRespuestaMs(0)
                .puntosObtenidos(0).build());

        estado.registrarRespuesta(usuario.getEmail());

        int totalParticipantes = participanteRepository.findBySalaAndActivoTrue(sala).stream()
                .filter(p -> !p.getUsuario().getEmail().equals(sala.getCreador().getEmail()))
                .collect(Collectors.toList()).size();

        messagingTemplate.convertAndSend(
                "/topic/sala/" + codigo + "/juego",
                PresentacionEstadoDTO.builder()
                        .tipo("PRES_PROGRESO")
                        .codigoSala(codigo)
                        .totalRespondieron(estado.getTotalRespondieron())
                        .totalJugadores(totalParticipantes)
                        .build());

        if (estado.getTotalRespondieron() >= totalParticipantes && !estado.yaMostrado()) {
            estado.marcarMostrado();
            messagingTemplate.convertAndSend(
                    "/topic/sala/" + codigo + "/juego",
                    PresentacionEstadoDTO.builder()
                            .tipo("PRES_TIEMPO_AGOTADO")
                            .codigoSala(codigo)
                            .build());
        }
    }

    // ── Finalizar y generar reporte ───────────────────────────────
    private void finalizarPresentacion(String codigo) {
        Sala sala = salaRepository.findByCodigo(codigo).orElseThrow();
        sala.setEstado(EstadoSala.FINALIZADA);
        salaRepository.save(sala);

        List<RespuestaSala> respuestas = respuestaSalaRepository.findBySala(sala);

        Map<Usuario, List<RespuestaSala>> porUsuario = respuestas.stream()
                .collect(Collectors.groupingBy(RespuestaSala::getUsuario));

        List<ReporteAlumnoDTO> reporte = porUsuario.entrySet().stream()
                .map(e -> ReporteAlumnoDTO.builder()
                        .nombre(e.getKey().getNombre())
                        .email(e.getKey().getEmail())
                        .correctas((int) e.getValue().stream().filter(RespuestaSala::isCorrecta).count())
                        .incorrectas((int) e.getValue().stream().filter(r -> !r.isCorrecta()).count())
                        .build())
                .collect(Collectors.toList());

        // ── Persistir en Historial (reutilizando HistorialService, sin tocarlo) ──
        List<EstadisticasDTO.AlumnoDetalleDTO> detalleAlumnos = reporte.stream()
                .map(r -> EstadisticasDTO.AlumnoDetalleDTO.builder()
                        .nombre(r.getNombre())
                        .email(r.getEmail())
                        .puntos(r.getCorrectas())
                        .correctas(r.getCorrectas())
                        .incorrectas(r.getIncorrectas())
                        .tiempoPromedioMs(0)
                        .vecesAbandonoPestana(0)
                        .build())
                .collect(Collectors.toList());

        int totalPreguntas = respuestas.isEmpty() ? 1
                : (int) respuestas.stream().map(RespuestaSala::getPregunta).distinct().count();

        double promedio = reporte.stream().mapToInt(ReporteAlumnoDTO::getCorrectas).average().orElse(0);
        double porcentajeAciertos = respuestas.isEmpty() ? 0
                : (respuestas.stream().filter(RespuestaSala::isCorrecta).count() * 100.0) / respuestas.size();
        int puntajeMasAlto = reporte.stream().mapToInt(ReporteAlumnoDTO::getCorrectas).max().orElse(0);

        EstadisticasDTO estadisticas = EstadisticasDTO.builder()
                .promedio(promedio)
                .porcentajeAciertos(porcentajeAciertos)
                .puntajeMasAlto(puntajeMasAlto)
                .ganador(null) // Presentaciones no tiene "ganador", es evaluativo
                .detalleAlumnos(detalleAlumnos)
                .build();

        List<RankingDTO> rankingParaHistorial = reporte.stream()
                .sorted((a, b) -> b.getCorrectas() - a.getCorrectas())
                .map(r -> RankingDTO.builder()
                        .username(r.getNombre())
                        .puntos(r.getCorrectas())
                        .build())
                .collect(Collectors.toList());

        historialService.generarYPersistirReporte(sala, estadisticas, rankingParaHistorial);

        // ── Enviar al frontend en vivo ──
        messagingTemplate.convertAndSend(
                "/topic/sala/" + codigo + "/juego",
                PresentacionEstadoDTO.builder()
                        .tipo("PRES_FIN")
                        .codigoSala(codigo)
                        .reporte(reporte)
                        .build());

        log.info("[PRESENTACION] Finalizada sala {} — reporte de {} alumnos, persistido en historial", codigo, reporte.size());
        presentaciones.remove(codigo);
    }

    // ── Estado interno ───────────────────────────────────────────

    private static class EstadoPresentacion {
        private final List<Pregunta> preguntas;
        private final int tiempoLimite;
        private int indice = -1;
        private int totalRespondieron = 0;
        private final Set<String> respondieron = Collections.synchronizedSet(new HashSet<>());
        private final AtomicBoolean mostrado = new AtomicBoolean(false);

        EstadoPresentacion(List<Pregunta> p, int t) { preguntas = p; tiempoLimite = t; }

        boolean yaMostrado() { return mostrado.get(); }
        void marcarMostrado() { mostrado.set(true); }
        boolean yaRespondio(String email) { return respondieron.contains(email); }
        void registrarRespuesta(String email) { if (respondieron.add(email)) totalRespondieron++; }
        int getTotalRespondieron() { return totalRespondieron; }

        Pregunta siguiente() {
            indice++;
            totalRespondieron = 0;
            respondieron.clear();
            mostrado.set(false);
            return preguntas.get(indice);
        }

        boolean tieneSiguiente() { return indice + 1 < preguntas.size(); }
        Pregunta getPreguntaActual() { return preguntas.get(indice); }
        Long getPreguntaActualId() { return preguntas.get(indice).getId(); }
        int getIndiceActual() { return indice + 1; }
        int getTotal() { return preguntas.size(); }
        int getTiempoLimite() { return tiempoLimite; }
    }
}