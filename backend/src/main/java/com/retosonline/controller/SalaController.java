package com.retosonline.controller;

import com.retosonline.dto.*;
import com.retosonline.service.SalaService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/salas")
@RequiredArgsConstructor
@Tag(name = "Salas", description = "Gestión de salas de juego")
@SecurityRequirement(name = "bearerAuth")
public class SalaController {

    private final SalaService salaService;

    @PostMapping
    @Operation(summary = "Crear sala")
    public ResponseEntity<SalaResponse> crearSala(
            @Valid @RequestBody SalaRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(salaService.crearSala(request, userDetails.getUsername()));
    }

    @PostMapping("/unirse/{codigo}")
    @Operation(summary = "Unirse a sala por código")
    public ResponseEntity<SalaResponse> unirse(
            @PathVariable String codigo,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(salaService.unirseASala(codigo, userDetails.getUsername()));
    }

    @GetMapping("/{codigo}")
    @Operation(summary = "Obtener información de sala")
    public ResponseEntity<SalaResponse> obtenerSala(@PathVariable String codigo) {
        return ResponseEntity.ok(salaService.obtenerSala(codigo));
    }

    @PostMapping("/{codigo}/salir")
    @Operation(summary = "Salir de sala")
    public ResponseEntity<Void> salir(
            @PathVariable String codigo,
            @AuthenticationPrincipal UserDetails userDetails) {
        salaService.salirDeSala(codigo, userDetails.getUsername());
        return ResponseEntity.ok().build();
    }

    @GetMapping("/disponibles")
    @Operation(summary = "Listar salas disponibles por dificultad, modo y estado")
    public ResponseEntity<List<SalaResponse>> salasDisponibles(
            @RequestParam(required = false) String dificultad,
            @RequestParam(required = false) String modo,
            @RequestParam(required = false) String estado) {
        return ResponseEntity.ok(salaService.listarSalasDisponibles(dificultad, modo, estado));
    }
}