package com.retosonline.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.ConcurrentLinkedQueue;

@Service
@Slf4j
public class ColaService {

    // ── Estados de la tarea ──────────────────────────────────────
    public enum Estado { PENDING, PROCESSING, SENT, FAILED }

    // ── Tipos de tarea ───────────────────────────────────────────
    public enum Tipo {
        VERIFICACION_OTP,
        RECUPERACION_PASSWORD,
        REPORTE_SALA          // ← PDF adjunto a participantes
    }

    // ── Modelo de tarea ──────────────────────────────────────────
    public static class Tarea {
        public final String              id           = UUID.randomUUID().toString();
        public final Tipo                tipo;
        public final String              destinatario;
        public final Map<String, Object> payload;
        public Estado                    estado       = Estado.PENDING;
        public int                       intentos     = 0;
        public String                    error        = null;
        public final LocalDateTime       creadaEn     = LocalDateTime.now();
        public LocalDateTime             actualizadaEn = LocalDateTime.now();

        public Tarea(Tipo tipo, String destinatario, Map<String, Object> payload) {
            this.tipo        = tipo;
            this.destinatario = destinatario;
            this.payload     = payload;
        }
    }

    // ── Almacenamiento en memoria ────────────────────────────────
    private final ConcurrentLinkedQueue<Tarea> cola  = new ConcurrentLinkedQueue<>();
    private final Map<String, Tarea>           index = Collections.synchronizedMap(
            new LinkedHashMap<>());
    private volatile boolean pausada = false;

    // ── Operaciones públicas ─────────────────────────────────────

    public Tarea encolar(Tipo tipo, String destinatario, Map<String, Object> payload) {
        Tarea tarea = new Tarea(tipo, destinatario, payload);
        cola.add(tarea);
        index.put(tarea.id, tarea);
        log.info("[COLA] PENDING — {} para {} (id={})", tipo, destinatario, tarea.id);
        return tarea;
    }

    public Tarea siguientePendiente() {
        if (pausada) return null;
        return cola.stream()
                .filter(t -> t.estado == Estado.PENDING)
                .findFirst()
                .orElse(null);
    }

    public void actualizarEstado(String id, Estado nuevoEstado,
                                 int intentos, String error) {
        Tarea t = index.get(id);
        if (t != null) {
            t.estado        = nuevoEstado;
            t.intentos      = intentos;
            t.error         = error;
            t.actualizadaEn = LocalDateTime.now();
        }
    }

    public void pausar()           { pausada = true;  log.info("[COLA] Pausada");   }
    public void reanudar()         { pausada = false; log.info("[COLA] Reanudada"); }
    public boolean esPausada()     { return pausada; }
    public List<Tarea> listarTodas() { return new ArrayList<>(index.values()); }

    public Map<String, Long> resumen() {
        Map<String, Long> r = new LinkedHashMap<>();
        r.put("TOTAL",      (long) index.size());
        r.put("PENDING",    index.values().stream().filter(t -> t.estado == Estado.PENDING).count());
        r.put("PROCESSING", index.values().stream().filter(t -> t.estado == Estado.PROCESSING).count());
        r.put("SENT",       index.values().stream().filter(t -> t.estado == Estado.SENT).count());
        r.put("FAILED",     index.values().stream().filter(t -> t.estado == Estado.FAILED).count());
        return r;
    }
}