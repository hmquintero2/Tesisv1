package com.retosonline.controller;

import com.retosonline.service.ColaService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/cola")
@RequiredArgsConstructor
@Tag(name = "Cola", description = "Monitor de la cola interna de mensajes")
public class ColaController {

    private final ColaService colaService;

    @GetMapping
    @Operation(summary = "Listar todas las tareas de la cola")
    public ResponseEntity<List<ColaService.Tarea>> listar() {
        return ResponseEntity.ok(colaService.listarTodas());
    }

    @GetMapping("/resumen")
    @Operation(summary = "Resumen de estados de la cola")
    public ResponseEntity<Map<String, Long>> resumen() {
        return ResponseEntity.ok(colaService.resumen());
    }

    @PostMapping("/pausar")
    @Operation(summary = "Pausar el worker")
    public ResponseEntity<Map<String, Object>> pausar() {
        colaService.pausar();
        return ResponseEntity.ok(Map.of("pausada", true,
                "mensaje", "Cola pausada. Las tareas quedan en PENDING."));
    }

    @PostMapping("/reanudar")
    @Operation(summary = "Reanudar el worker")
    public ResponseEntity<Map<String, Object>> reanudar() {
        colaService.reanudar();
        return ResponseEntity.ok(Map.of("pausada", false,
                "mensaje", "Cola reanudada. El worker retoma las tareas."));
    }
}