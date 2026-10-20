package com.retosonline.repository;

import com.retosonline.entity.ParticipanteSala;
import com.retosonline.entity.Sala;
import com.retosonline.entity.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface ParticipanteSalaRepository extends JpaRepository<ParticipanteSala, Long> {
    List<ParticipanteSala> findBySalaAndActivoTrue(Sala sala);
    List<ParticipanteSala> findBySala(Sala sala);          // ← NUEVO
    Optional<ParticipanteSala> findByUsuarioAndSalaAndActivoTrue(Usuario usuario, Sala sala);
    boolean existsByUsuarioAndSalaAndActivoTrue(Usuario usuario, Sala sala);
}