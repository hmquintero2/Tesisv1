package com.retosonline.service;

import com.retosonline.dto.EstadisticasDTO;
import com.retosonline.dto.RankingDTO;
import com.retosonline.entity.Sala;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class WorkerService {

    private final ColaService  colaService;
    private final EmailService emailService;

    @Value("${app.queue.max-attempts:3}")
    private int maxIntentos;

    @Value("${app.otp.ttl-minutes:5}")
    private int otpTtlMinutos;

    @Value("${app.recovery.ttl-minutes:15}")
    private int recoveryTtlMinutos;

    /**
     * Se ejecuta automáticamente cada 5 segundos.
     * Toma la siguiente tarea PENDING y la procesa.
     */
    @Scheduled(fixedDelayString = "${app.queue.interval-ms:5000}")
    public void procesarSiguiente() {
        ColaService.Tarea tarea = colaService.siguientePendiente();
        if (tarea == null) return;

        log.info("[WORKER] Tomando tarea {} ({})", tarea.id, tarea.tipo);
        colaService.actualizarEstado(tarea.id, ColaService.Estado.PROCESSING,
                tarea.intentos, null);

        try {
            ejecutar(tarea);
            colaService.actualizarEstado(tarea.id, ColaService.Estado.SENT,
                    tarea.intentos, null);
            log.info("[WORKER] SENT — tarea {}", tarea.id);

        } catch (Exception e) {
            int intentos = tarea.intentos + 1;
            boolean hayReintentos = intentos < maxIntentos;
            ColaService.Estado siguiente = hayReintentos
                    ? ColaService.Estado.PENDING
                    : ColaService.Estado.FAILED;

            colaService.actualizarEstado(tarea.id, siguiente, intentos, e.getMessage());
            log.warn("[WORKER] {} — tarea {} (intento {}/{}): {}",
                    siguiente, tarea.id, intentos, maxIntentos, e.getMessage());
        }
    }

    // ── Despacho por tipo ────────────────────────────────────────

    @SuppressWarnings("unchecked")
    private void ejecutar(ColaService.Tarea tarea) {
        switch (tarea.tipo) {
            case VERIFICACION_OTP      -> procesarOtp(tarea);
            case RECUPERACION_PASSWORD -> procesarRecuperacion(tarea);
            case REPORTE_SALA          -> procesarReporteSala(tarea);
        }
    }

    private void procesarOtp(ColaService.Tarea t) {
        String nombre = (String) t.payload.get("nombre");
        String codigo = (String) t.payload.get("codigo");
        String html   = emailService.plantillaOtp(nombre, codigo, otpTtlMinutos);
        emailService.enviarHtml(t.destinatario,
                "🔐 Activa tu cuenta — CodeBattle", html);
    }

    private void procesarRecuperacion(ColaService.Tarea t) {
        String nombre = (String) t.payload.get("nombre");
        String enlace = (String) t.payload.get("enlace");
        String html   = emailService.plantillaRecuperacion(nombre, enlace, recoveryTtlMinutos);
        emailService.enviarHtml(t.destinatario,
                "🔑 Recupera tu cuenta — CodeBattle", html);
    }

    @SuppressWarnings("unchecked")
    private void procesarReporteSala(ColaService.Tarea t) {
        String           nombreJugador = (String)            t.payload.get("nombreJugador");
        Sala             sala          = (Sala)              t.payload.get("sala");
        EstadisticasDTO  stats         = (EstadisticasDTO)   t.payload.get("estadisticas");
        List<RankingDTO> ranking       = (List<RankingDTO>)  t.payload.get("ranking");
        int              posicion      = (int)               t.payload.get("posicion");
        byte[]           pdfBytes      = (byte[])            t.payload.get("reporteBytes");
        String           codigoSala    = (String)            t.payload.get("codigoSala");

        String html = emailService.plantillaReporteSala(
                nombreJugador, sala, stats, ranking, posicion);

        emailService.enviarConAdjunto(
                t.destinatario,
                "📊 Reporte de partida — Sala " + codigoSala + " — CodeBattle",
                html,
                pdfBytes,
                "reporte-" + codigoSala + ".txt");
    }
}