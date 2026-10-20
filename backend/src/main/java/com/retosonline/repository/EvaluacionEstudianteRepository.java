package com.retosonline.repository;

import com.retosonline.entity.EvaluacionEstudiante;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface EvaluacionEstudianteRepository extends JpaRepository<EvaluacionEstudiante, Long> {
    List<EvaluacionEstudiante> findByCodigoAnonimo(String codigoAnonimo);
}