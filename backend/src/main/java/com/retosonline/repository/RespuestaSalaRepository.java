package com.retosonline.repository;

import com.retosonline.entity.RespuestaSala;
import com.retosonline.entity.Sala;
import com.retosonline.entity.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface RespuestaSalaRepository extends JpaRepository<RespuestaSala, Long> {
    List<RespuestaSala> findBySala(Sala sala);
    List<RespuestaSala> findBySalaAndUsuario(Sala sala, Usuario usuario);
    long countBySalaAndCorrectaTrue(Sala sala);
}