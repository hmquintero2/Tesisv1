// PuntajeRepository.java
package com.retosonline.repository;
import com.retosonline.entity.Puntaje;
import com.retosonline.entity.Sala;
import com.retosonline.entity.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface PuntajeRepository extends JpaRepository<Puntaje, Long> {
    List<Puntaje> findBySalaOrderByPuntosDesc(Sala sala);
    Optional<Puntaje> findByUsuarioAndSala(Usuario usuario, Sala sala);
}