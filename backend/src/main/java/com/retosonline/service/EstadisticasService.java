package com.retosonline.service;

import com.retosonline.dto.EstadisticasDTO;
import com.retosonline.entity.Puntaje;
import com.retosonline.entity.RespuestaSala;
import com.retosonline.entity.Sala;
import com.retosonline.enums.ModoSala;
import com.retosonline.repository.ParticipanteSalaRepository;
import com.retosonline.repository.PuntajeRepository;
import com.retosonline.repository.RespuestaSalaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class EstadisticasService {

    private final RespuestaSalaRepository respuestaSalaRepository;
    private final PuntajeRepository puntajeRepository;
    private final ParticipanteSalaRepository participanteSalaRepository;

    public EstadisticasDTO calcular(Sala sala) {
        List<RespuestaSala> respuestas = respuestaSalaRepository.findBySala(sala);
        List<Puntaje> puntajes = puntajeRepository.findBySalaOrderByPuntosDesc(sala);

        double promedio = puntajes.stream().mapToInt(Puntaje::getPuntos).average().orElse(0);
        long correctas = respuestaSalaRepository.countBySalaAndCorrectaTrue(sala);
        double porcentajeAciertos = respuestas.isEmpty() ? 0 : (correctas * 100.0 / respuestas.size());
        int puntajeMasAlto = puntajes.isEmpty() ? 0 : puntajes.get(0).getPuntos();
        String ganador = (sala.getModo() == ModoSala.COMPETENCIA && !puntajes.isEmpty())
                ? puntajes.get(0).getUsuario().getNombre() : null;

        // Detalle por alumno
        List<EstadisticasDTO.AlumnoDetalleDTO> detalleAlumnos = puntajes.stream().map(p -> {
            List<RespuestaSala> respAlumno = respuestaSalaRepository
                    .findBySalaAndUsuario(sala, p.getUsuario());
            long corr = respAlumno.stream().filter(RespuestaSala::isCorrecta).count();
            long incorr = respAlumno.size() - corr;
            double tiempoPromedio = respAlumno.stream()
                    .mapToInt(RespuestaSala::getTiempoRespuestaMs).average().orElse(0);

            // Contar abandonos de pestaña desde ParticipanteSala
            int abandonos = participanteSalaRepository
                    .findByUsuarioAndSalaAndActivoTrue(p.getUsuario(), sala)
                    .map(ps -> ps.getVecesAbandonoPestana())
                    .orElse(0);

            return EstadisticasDTO.AlumnoDetalleDTO.builder()
                    .nombre(p.getUsuario().getNombre())
                    .email(p.getUsuario().getEmail())
                    .puntos(p.getPuntos())
                    .correctas((int) corr)
                    .incorrectas((int) incorr)
                    .tiempoPromedioMs(tiempoPromedio)
                    .vecesAbandonoPestana(abandonos)
                    .build();
        }).collect(Collectors.toList());

        return EstadisticasDTO.builder()
                .promedio(promedio)
                .porcentajeAciertos(porcentajeAciertos)
                .puntajeMasAlto(puntajeMasAlto)
                .ganador(ganador)
                .detalleAlumnos(detalleAlumnos)
                .build();
    }
}