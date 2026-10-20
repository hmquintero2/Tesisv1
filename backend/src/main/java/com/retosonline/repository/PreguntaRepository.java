package com.retosonline.repository;

import com.retosonline.entity.Pregunta;
import com.retosonline.entity.Sala;
import com.retosonline.enums.Dificultad;
import com.retosonline.enums.TipoPregunta;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface PreguntaRepository extends JpaRepository<Pregunta, Long> {

    // Preguntas de una sala específica
    List<Pregunta> findBySala(Sala sala);

    // Para compatibilidad — ya no se usa pero evita errores de compilación
    List<Pregunta> findByDificultadAndTipo(
            Dificultad dificultad, TipoPregunta tipo);
}