package com.retosonline.repository;

import com.retosonline.entity.CuestionarioSUS;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface CuestionarioSUSRepository extends JpaRepository<CuestionarioSUS, Long> {
    List<CuestionarioSUS> findByCodigoAnonimo(String codigoAnonimo);
}