package com.retosonline.controller;

import com.retosonline.entity.CuestionarioSUS;
import com.retosonline.entity.EvaluacionEstudiante;
import com.retosonline.entity.Usuario;
import com.retosonline.repository.CuestionarioSUSRepository;
import com.retosonline.repository.EvaluacionEstudianteRepository;
import com.retosonline.repository.UsuarioRepository;
import com.retosonline.service.BenchmarkService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Map;

@RestController
@RequestMapping("/api/evaluacion")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class EvaluacionController {

    private final EvaluacionEstudianteRepository evaluacionRepository;
    private final CuestionarioSUSRepository      susRepository;
    private final UsuarioRepository              usuarioRepository;
    private final BenchmarkService                benchmarkService;

    // ── Rúbrica de expertos (6 dimensiones) ───────────────────
    @PutMapping("/experto/{id}")
    public ResponseEntity<?> evaluarExperto(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        try {
            Integer exactitud    = num(body.get("scoreCorrecccion"));
            Integer pertinencia  = num(body.get("scorePertinencia"));
            Integer complejidad  = num(body.get("scoreComplejidad"));
            Integer distractores = num(body.get("scoreDistractores"));
            Integer coherencia   = num(body.get("scoreCoherenciaPedagogica"));
            Integer cobertura    = num(body.get("scoreCobertura"));
            String  notas        = (String) body.get("evaluadorNotas");

            var pregunta = benchmarkService.obtenerPorId(id)
                    .orElseThrow(() -> new RuntimeException("No encontrado"));

            if (exactitud    != null) pregunta.setScoreCorrecccion(exactitud);
            if (pertinencia  != null) pregunta.setScorePertinencia(pertinencia);
            if (complejidad  != null) pregunta.setScoreComplejidad(complejidad);
            if (distractores != null) pregunta.setScoreDistractores(distractores);
            if (coherencia   != null) pregunta.setScoreCoherenciaPedagogica(coherencia);
            if (cobertura    != null) pregunta.setScoreCobertura(cobertura);
            if (notas        != null) pregunta.setEvaluadorNotas(notas);

            if (exactitud != null && pertinencia != null && complejidad != null
                    && distractores != null && coherencia != null && cobertura != null) {
                pregunta.setScoreTotal(
                        (exactitud + pertinencia + complejidad + distractores + coherencia + cobertura) / 6);
            }

            return ResponseEntity.ok(benchmarkService.guardarEvaluacion(
                    id, exactitud, distractores, null, null, notas));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // ── Percepción estudiantil (4 dimensiones) ────────────────
    @PostMapping("/estudiante")
    public ResponseEntity<?> evaluarEstudiante(@RequestBody Map<String, Object> body,
                                               @AuthenticationPrincipal UserDetails userDetails) {
        try {
            Usuario estudiante = usuarioRepository.findByEmail(userDetails.getUsername())
                    .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

            EvaluacionEstudiante evaluacion = EvaluacionEstudiante.builder()
                    .codigoAnonimo((String) body.get("codigoAnonimo"))
                    .estudiante(estudiante)
                    .claridad(num(body.get("claridad")))
                    .comprension(num(body.get("comprension")))
                    .dificultadPercibida(num(body.get("dificultadPercibida")))
                    .experienciaUso(num(body.get("experienciaUso")))
                    .build();

            return ResponseEntity.ok(evaluacionRepository.save(evaluacion));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // ── Cuestionario SUS ───────────────────────────────────────
    @PostMapping("/sus")
    public ResponseEntity<?> evaluarSUS(@RequestBody Map<String, Object> body,
                                        @AuthenticationPrincipal UserDetails userDetails) {
        try {
            Usuario estudiante = usuarioRepository.findByEmail(userDetails.getUsername())
                    .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

            CuestionarioSUS sus = CuestionarioSUS.builder()
                    .codigoAnonimo((String) body.get("codigoAnonimo"))
                    .estudiante(estudiante)
                    .item1(num(body.get("item1")))   .item2(num(body.get("item2")))
                    .item3(num(body.get("item3")))   .item4(num(body.get("item4")))
                    .item5(num(body.get("item5")))   .item6(num(body.get("item6")))
                    .item7(num(body.get("item7")))   .item8(num(body.get("item8")))
                    .item9(num(body.get("item9")))   .item10(num(body.get("item10")))
                    .build();

            return ResponseEntity.ok(susRepository.save(sus));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
    private Integer num(Object o) {
        return o != null ? ((Number) o).intValue() : null;
    }
}