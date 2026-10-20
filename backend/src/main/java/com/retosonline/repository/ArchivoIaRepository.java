package com.retosonline.repository;

import com.retosonline.entity.ArchivoIa;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ArchivoIaRepository
        extends JpaRepository<ArchivoIa, Long> {

    List<ArchivoIa> findByUsuarioEmailOrderByCreadoEnDesc(
            String usuarioEmail);
}