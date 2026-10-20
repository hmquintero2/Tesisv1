package com.retosonline.service;

import com.retosonline.dto.EstadisticasDTO;
import com.retosonline.dto.HistorialSalaDTO;
import com.retosonline.dto.RankingDTO;
import com.retosonline.entity.ReporteSala;
import com.retosonline.entity.Sala;
import com.retosonline.enums.ModoSala;
import com.retosonline.exception.RoomNotFoundException;
import com.retosonline.repository.ParticipanteSalaRepository;
import com.retosonline.repository.ReporteSalaRepository;
import com.retosonline.repository.SalaRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

@Service
@RequiredArgsConstructor
@Slf4j
public class HistorialService {

    private final SalaRepository             salaRepository;
    private final ReporteSalaRepository      reporteRepository;
    private final ParticipanteSalaRepository participanteRepository;
    private final EstadisticasService        estadisticasService;

    private static final DateTimeFormatter ISO =
            DateTimeFormatter.ISO_LOCAL_DATE_TIME;

    // ── Historial paginado ────────────────────────────────────────

    @Transactional(readOnly = true)
    public HistorialSalaDTO obtenerHistorial(
            int pagina, int tamano,
            LocalDateTime desde, LocalDateTime hasta,
            String emailUsuario, String actividad) {

        int tam = Math.min(tamano, 50);
        Pageable pageable = PageRequest.of(
                pagina, tam, Sort.by("fechaCreacion").descending());

        Page<Sala> page = salaRepository.findHistorialFiltrado(
                desde, hasta,
                (emailUsuario != null && !emailUsuario.isBlank()) ? emailUsuario : null,
                (actividad    != null && !actividad.isBlank())    ? actividad    : null,
                pageable);

        List<HistorialSalaDTO.ItemHistorialDTO> items = page.getContent()
                .stream()
                .map(this::toItemDTO)
                .collect(Collectors.toList());

        return HistorialSalaDTO.builder()
                .pagina(page.getNumber())
                .tamano(page.getSize())
                .totalElementos(page.getTotalElements())
                .totalPaginas(page.getTotalPages())
                .primera(page.isFirst())
                .ultima(page.isLast())
                .items(items)
                .build();
    }

    private HistorialSalaDTO.ItemHistorialDTO toItemDTO(Sala sala) {
        EstadisticasDTO stats = estadisticasService.calcular(sala);
        int participantes = participanteRepository
                .findBySalaAndActivoTrue(sala).size();
        String fechaFin = reporteRepository.findBySala(sala)
                .map(r -> r.getGeneradoEn().format(ISO))
                .orElse(null);

        return HistorialSalaDTO.ItemHistorialDTO.builder()
                .salaId(sala.getId())
                .codigoSala(sala.getCodigo())
                .nombreSala(sala.getNombre())
                .modo(sala.getModo().name())
                .dificultad(sala.getDificultad().name())
                .fechaCreacion(sala.getFechaCreacion() != null
                        ? sala.getFechaCreacion().format(ISO) : null)
                .fechaFin(fechaFin)
                .cantidadPreguntas(sala.getCantidadPreguntas())
                .totalParticipantes(participantes)
                .creador(sala.getCreador().getNombre())
                .creadorEmail(sala.getCreador().getEmail())
                .promedio(stats.getPromedio())
                .porcentajeAciertos(stats.getPorcentajeAciertos())
                .puntajeMasAlto(stats.getPuntajeMasAlto())
                .ganador(stats.getGanador())
                .build();
    }

    // ── Persistir reporte ─────────────────────────────────────────

    @Transactional
    public ReporteSala generarYPersistirReporte(Sala sala,
                                                EstadisticasDTO estadisticas,
                                                List<RankingDTO> ranking) {
        ReporteSala reporte = reporteRepository.findBySala(sala)
                .orElseGet(() -> ReporteSala.builder().sala(sala).build());

        reporte.setContenido(construirTxt(sala, estadisticas, ranking));
        reporte.setGeneradoEn(LocalDateTime.now());
        reporteRepository.save(reporte);

        log.info("Reporte persistido para sala {}", sala.getCodigo());
        return reporte;
    }

    // ── Obtener reporte persistido ────────────────────────────────

    @Transactional(readOnly = true)
    public String obtenerContenidoReporte(String codigoSala) {
        Sala sala = salaRepository.findByCodigo(codigoSala)
                .orElseThrow(() -> new RoomNotFoundException(
                        "Sala no encontrada: " + codigoSala));

        return reporteRepository.findBySala(sala)
                .map(ReporteSala::getContenido)
                .orElseThrow(() -> new RuntimeException(
                        "El reporte de la sala " + codigoSala
                                + " aún no fue generado."));
    }

    // ── Construir TXT ─────────────────────────────────────────────

    private String construirTxt(Sala sala,
                                EstadisticasDTO est,
                                List<RankingDTO> ranking) {
        boolean prueba = sala.getModo() == ModoSala.PRUEBA;
        String fecha = LocalDateTime.now()
                .format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm"));

        StringBuilder sb = new StringBuilder();
        sb.append("╔══════════════════════════════════════════════╗\n");
        sb.append(prueba
                ? "║         REPORTE DE PRUEBA - CODEBATTLE       ║\n"
                : "║       REPORTE DE COMPETENCIA - CODEBATTLE     ║\n");
        sb.append("╚══════════════════════════════════════════════╝\n\n");

        sb.append(String.format("Sala:    %s — %s%n",
                sala.getCodigo(), sala.getNombre()));
        sb.append(String.format("Modo:    %s%n", sala.getModo().name()));
        sb.append(String.format("Dific.:  %s%n", sala.getDificultad().name()));
        sb.append(String.format("Fecha:   %s%n%n", fecha));

        sb.append("══════════════════════════════════════════════\n");
        sb.append("  ESTADÍSTICAS GENERALES\n");
        sb.append("══════════════════════════════════════════════\n");
        sb.append(String.format("  Promedio:          %.0f pts%n",
                est.getPromedio()));
        sb.append(String.format("  Aciertos:          %.1f%%%n",
                est.getPorcentajeAciertos()));
        sb.append(String.format("  Puntaje más alto:  %d pts%n",
                est.getPuntajeMasAlto()));
        if (!prueba && est.getGanador() != null) {
            sb.append(String.format("  Ganador:           %s%n",
                    est.getGanador()));
        }

        if (est.getDetalleAlumnos() != null
                && !est.getDetalleAlumnos().isEmpty()) {
            sb.append("\n══════════════════════════════════════════════\n");
            sb.append("  DETALLE POR ALUMNO\n");
            sb.append("══════════════════════════════════════════════\n");
            int idx = 1;
            for (EstadisticasDTO.AlumnoDetalleDTO a : est.getDetalleAlumnos()) {
                sb.append(String.format("%n  %d. %s (%s)%n",
                        idx++, a.getNombre(), a.getEmail()));
                sb.append(String.format("     Puntos:       %d pts%n",
                        a.getPuntos()));
                sb.append(String.format("     Correctas:    %d%n",
                        a.getCorrectas()));
                sb.append(String.format("     Incorrectas:  %d%n",
                        a.getIncorrectas()));
                sb.append(String.format("     T. promedio:  %.1fs%n",
                        a.getTiempoPromedioMs() / 1000.0));
                sb.append(String.format("     Abandonos:    %d %s%n",
                        a.getVecesAbandonoPestana(),
                        a.getVecesAbandonoPestana() > 0 ? "⚠" : "✓"));
            }
        }

        if (ranking != null && !ranking.isEmpty()) {
            sb.append("\n══════════════════════════════════════════════\n");
            sb.append("  RANKING FINAL\n");
            sb.append("══════════════════════════════════════════════\n");
            IntStream.range(0, ranking.size()).forEach(i -> {
                RankingDTO r = ranking.get(i);
                sb.append(String.format("  %d. %-22s %d pts%n",
                        i + 1, r.getUsername(), r.getPuntos()));
            });
        }

        sb.append(String.format("%n  Generado: %s%n", fecha));
        return sb.toString();
    }
}