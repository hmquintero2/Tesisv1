package com.retosonline.repository;

import com.retosonline.entity.BenchmarkPregunta;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Map;

@Repository
public interface BenchmarkPreguntaRepository extends JpaRepository<BenchmarkPregunta, Long> {

    List<BenchmarkPregunta> findByModelo(String modelo);
    List<BenchmarkPregunta> findByTema(String tema);
    List<BenchmarkPregunta> findByModeloAndTema(String modelo, String tema);
    List<BenchmarkPregunta> findByScoreTotalIsNull();

    @Query("SELECT bp FROM BenchmarkPregunta bp WHERE bp.scoreTotal IS NOT NULL")
    List<BenchmarkPregunta> findEvaluadas();

    // NUEVAS QUERIES PARA ANÁLISIS
    @Query("SELECT bp FROM BenchmarkPregunta bp WHERE bp.modelo = :modelo ORDER BY bp.latencyMs ASC")
    List<BenchmarkPregunta> findByModeloOrderByLatencia(@Param("modelo") String modelo);

    @Query("SELECT bp FROM BenchmarkPregunta bp WHERE bp.tema = :tema ORDER BY bp.generadoEn DESC")
    List<BenchmarkPregunta> findByTemaOrderByFecha(@Param("tema") String tema);

    @Query("SELECT AVG(bp.latencyMs) FROM BenchmarkPregunta bp WHERE bp.modelo = :modelo")
    Double obtenerLatenciaPromedioPorModelo(@Param("modelo") String modelo);

    @Query("SELECT AVG(bp.tokensPerSecond) FROM BenchmarkPregunta bp WHERE bp.modelo = :modelo")
    Double obtenerVelocidadPromedioPorModelo(@Param("modelo") String modelo);

    @Query("SELECT AVG(bp.memoryUsageMb) FROM BenchmarkPregunta bp WHERE bp.modelo = :modelo")
    Double obtenerMemoriaPromedioPorModelo(@Param("modelo") String modelo);

    @Query("SELECT bp.modelo, AVG(bp.latencyMs) as latenciaPromedio, AVG(bp.tokensPerSecond) as velocidadPromedio " +
            "FROM BenchmarkPregunta bp GROUP BY bp.modelo")
    List<?> obtenerComparativaModelos();

    @Query("SELECT bp FROM BenchmarkPregunta bp WHERE bp.modelo = :modelo AND bp.tema = :tema")
    List<BenchmarkPregunta> findByModeloYTema(@Param("modelo") String modelo, @Param("tema") String tema);

    @Query("SELECT COUNT(bp) FROM BenchmarkPregunta bp WHERE bp.scoreTotal IS NOT NULL")
    Long contarEvaluadas();

    @Query("SELECT AVG(bp.scoreTotal) FROM BenchmarkPregunta bp WHERE bp.modelo = :modelo")
    Double obtenerPuntuacionPromedioPorModelo(@Param("modelo") String modelo);
}