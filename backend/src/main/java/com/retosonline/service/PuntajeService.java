// PuntajeService.java (nuevo)
package com.retosonline.service;

import com.retosonline.dto.RankingDTO;
import com.retosonline.entity.Puntaje;
import com.retosonline.entity.Sala;
import com.retosonline.entity.Usuario;
import com.retosonline.repository.ParticipanteSalaRepository;
import com.retosonline.repository.PuntajeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

@Service
@RequiredArgsConstructor
public class PuntajeService {

    private final PuntajeRepository puntajeRepository;
    private final ParticipanteSalaRepository participanteSalaRepository;

    @Transactional
    public void sumarPuntos(Usuario usuario, Sala sala, int puntos) {
        Puntaje puntaje = puntajeRepository.findByUsuarioAndSala(usuario, sala)
                .orElseGet(() -> Puntaje.builder().usuario(usuario).sala(sala).puntos(0).build());
        puntaje.setPuntos(puntaje.getPuntos() + puntos);
        puntajeRepository.save(puntaje);
    }

    public List<RankingDTO> obtenerRanking(Sala sala) {
        List<Puntaje> puntajes = puntajeRepository.findBySalaOrderByPuntosDesc(sala);
        return IntStream.range(0, puntajes.size())
                .mapToObj(i -> {
                    Puntaje p = puntajes.get(i);
                    String avatarId = p.getUsuario().getAvatarId();
                    return RankingDTO.builder()
                            .username(p.getUsuario().getNombre())
                            .avatar(avatarId != null ? avatarId : "gato")
                            .puntos(p.getPuntos()).posicion(i + 1).build();
                })
                .collect(Collectors.toList());
    }
}