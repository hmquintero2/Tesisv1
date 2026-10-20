package com.retosonline.repository;

import com.retosonline.entity.MensajeChat;
import com.retosonline.entity.Sala;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface MensajeChatRepository extends JpaRepository<MensajeChat, Long> {
    List<MensajeChat> findBySalaOrderByFechaEnvioAsc(Sala sala);
}