package com.retosonline.repository;

import com.retosonline.entity.ReporteSala;
import com.retosonline.entity.Sala;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface ReporteSalaRepository extends JpaRepository<ReporteSala, Long> {
    Optional<ReporteSala> findBySala(Sala sala);
}