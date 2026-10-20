package com.retosonline.repository;

import com.retosonline.entity.Diapositiva;
import com.retosonline.entity.Sala;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DiapositivaRepository extends JpaRepository<Diapositiva, Long> {
    List<Diapositiva> findBySalaOrderByOrdenAsc(Sala sala);
    Optional<Diapositiva> findByPreguntaId(Long preguntaId);
}