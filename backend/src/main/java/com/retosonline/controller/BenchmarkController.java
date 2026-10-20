package com.retosonline.controller;

import com.retosonline.dto.BenchmarkResponseDTO;
import com.retosonline.entity.BenchmarkAnonimizacion;
import com.retosonline.entity.BenchmarkPregunta;
import com.retosonline.enums.CondicionExperimental;
import com.retosonline.repository.BenchmarkPreguntaRepository;
import com.retosonline.service.BenchmarkService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/benchmark")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class BenchmarkController {

    private final BenchmarkService benchmarkService;
    private final BenchmarkPreguntaRepository preguntaRepository;

    // Ejecutar las 3 condiciones para UN tema
    @PostMapping("/ejecutar-completo")
    public ResponseEntity<?> ejecutarCompleto(@RequestBody Map<String, Object> req) {
        String tema = (String) req.get("tema");
        Integer cantidad = req.get("cantidad") != null ? ((Number) req.get("cantidad")).intValue() : 5;
        Integer repeticiones = req.get("repeticiones") != null ? ((Number) req.get("repeticiones")).intValue() : 3;
        try {
            Map<String, Object> resultado = benchmarkService.ejecutarBenchmarkCompleto(tema, cantidad, repeticiones);
            return ResponseEntity.ok(resultado);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // Ejecutar UNA condición específica + UN tema
    @PostMapping("/ejecutar")
    public ResponseEntity<?> ejecutar(@RequestBody Map<String, Object> req) {
        String condicionStr = (String) req.get("condicion");
        String tema   = (String) req.get("tema");
        Integer cantidad = req.get("cantidad") != null ? ((Number) req.get("cantidad")).intValue() : 5;
        Integer repeticion = req.get("repeticion") != null ? ((Number) req.get("repeticion")).intValue() : 1;
        try {
            CondicionExperimental condicion = CondicionExperimental.valueOf(condicionStr);
            BenchmarkPregunta result = benchmarkService.ejecutarParaCondicion(condicion, tema, cantidad, repeticion);
            preguntaRepository.save(result);
            return ResponseEntity.ok(new BenchmarkResponseDTO(result));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // Listar condiciones y temas disponibles
    @GetMapping("/condiciones")
    public ResponseEntity<?> condiciones() {
        return ResponseEntity.ok(benchmarkService.obtenerCondiciones());
    }

    @GetMapping("/temas")
    public ResponseEntity<?> temas() {
        return ResponseEntity.ok(benchmarkService.obtenerTemas());
    }

    // Resultados
    @GetMapping("/resultados")
    public ResponseEntity<?> resultados() {
        List<BenchmarkResponseDTO> dtos = preguntaRepository.findAll()
                .stream().map(BenchmarkResponseDTO::new).collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }

    @GetMapping("/por-condicion/{condicion}")
    public ResponseEntity<?> porCondicion(@PathVariable String condicion) {
        return ResponseEntity.ok(preguntaRepository.findByModelo(condicion)
                .stream().map(BenchmarkResponseDTO::new).collect(Collectors.toList()));
    }

    @GetMapping("/por-tema/{tema}")
    public ResponseEntity<?> porTema(@PathVariable String tema) {
        return ResponseEntity.ok(preguntaRepository.findByTema(tema)
                .stream().map(BenchmarkResponseDTO::new).collect(Collectors.toList()));
    }

    // Comparativa entre las 3 condiciones
    @GetMapping("/comparativa-condiciones")
    public ResponseEntity<?> comparativa() {
        Map<String, Object> result = new HashMap<>();
        preguntaRepository.findAll().stream()
                .collect(Collectors.groupingBy(BenchmarkPregunta::getModelo))
                .forEach((condicion, lista) -> {
                    Map<String, Object> s = new HashMap<>();
                    s.put("latenciaPromedio",   lista.stream().mapToDouble(p -> p.getLatencyMs()!=null?p.getLatencyMs():0).average().orElse(0));
                    s.put("velocidadPromedia",  lista.stream().mapToDouble(p -> p.getTokensPerSecond()!=null?p.getTokensPerSecond():0).average().orElse(0));
                    s.put("memoriaPromedia",    lista.stream().mapToDouble(p -> p.getMemoryUsageMb()!=null?p.getMemoryUsageMb():0).average().orElse(0));
                    s.put("puntuacionPromedia", lista.stream().filter(p->p.getScoreTotal()!=null).mapToDouble(BenchmarkPregunta::getScoreTotal).average().orElse(0));
                    s.put("totalPreguntas",     lista.size());
                    s.put("evaluadas",          lista.stream().filter(p->p.getScoreTotal()!=null).count());
                    result.put(condicion, s);
                });
        return ResponseEntity.ok(result);
    }

    // Estadísticas generales
    @GetMapping("/estadisticas")
    public ResponseEntity<?> estadisticas() {
        return ResponseEntity.ok(benchmarkService.obtenerEstadisticas());
    }

    // Sin evaluar
    @GetMapping("/sin-evaluar")
    public ResponseEntity<?> sinEvaluar() {
        return ResponseEntity.ok(preguntaRepository.findByScoreTotalIsNull()
                .stream().map(BenchmarkResponseDTO::new).collect(Collectors.toList()));
    }

    // Anonimizar resultados de un tema (etiquetas neutras Modelo 1/2/3)
    @GetMapping("/anonimizar/{tema}")
    public ResponseEntity<?> anonimizar(@PathVariable String tema) {
        List<BenchmarkAnonimizacion> resultado = benchmarkService.anonimizarParaTema(tema);
        return ResponseEntity.ok(resultado);
    }

    // Guardar evaluación manual
    @PutMapping("/{id}/evaluar")
    public ResponseEntity<?> evaluar(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        try {
            Integer sc = body.get("scoreCorrecccion")  != null ? ((Number) body.get("scoreCorrecccion")).intValue()  : null;
            Integer sd = body.get("scoreDistractores") != null ? ((Number) body.get("scoreDistractores")).intValue() : null;
            Integer scl= body.get("scoreClaridad")     != null ? ((Number) body.get("scoreClaridad")).intValue()     : null;
            Integer sa = body.get("scoreAlineacion")   != null ? ((Number) body.get("scoreAlineacion")).intValue()   : null;
            String  n  = (String) body.get("evaluadorNotas");
            return ResponseEntity.ok(new BenchmarkResponseDTO(benchmarkService.guardarEvaluacion(id, sc, sd, scl, sa, n)));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> eliminar(@PathVariable Long id) {
        try { benchmarkService.eliminar(id); return ResponseEntity.ok(Map.of("ok", true)); }
        catch (Exception e) { return ResponseEntity.badRequest().body(Map.of("error", e.getMessage())); }
    }
}