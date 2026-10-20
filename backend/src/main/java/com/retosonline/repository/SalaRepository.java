package com.retosonline.repository;

import com.retosonline.entity.Sala;
import com.retosonline.enums.EstadoSala;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface SalaRepository extends JpaRepository<Sala, Long> {

    Optional<Sala> findByCodigo(String codigo);

    boolean existsByCodigo(String codigo);

    List<Sala> findByEstadoIn(List<EstadoSala> estados);

    // Historial paginado con filtros opcionales
    @Query("""
        SELECT DISTINCT s FROM Sala s
        LEFT JOIN ParticipanteSala p ON p.sala = s
        WHERE s.estado = 'FINALIZADA'
          AND (:desde     IS NULL OR s.fechaCreacion >= :desde)
          AND (:hasta     IS NULL OR s.fechaCreacion <= :hasta)
          AND (:email     IS NULL OR p.usuario.email = :email
                                  OR s.creador.email = :email)
          AND (:actividad IS NULL
                OR LOWER(s.nombre) LIKE LOWER(CONCAT('%', :actividad, '%')))
        ORDER BY s.fechaCreacion DESC
        """)
    Page<Sala> findHistorialFiltrado(
            @Param("desde")     LocalDateTime desde,
            @Param("hasta")     LocalDateTime hasta,
            @Param("email")     String email,
            @Param("actividad") String actividad,
            Pageable pageable
    );
}