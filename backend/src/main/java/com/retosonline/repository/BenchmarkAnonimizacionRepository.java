package com.retosonline.repository;

import com.retosonline.entity.BenchmarkAnonimizacion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface BenchmarkAnonimizacionRepository extends JpaRepository<BenchmarkAnonimizacion, Long> {
    Optional<BenchmarkAnonimizacion> findByCodigoAnonimo(String codigo);
    Optional<BenchmarkAnonimizacion> findByPreguntaId(Long preguntaId);
}