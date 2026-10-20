package com.retosonline.controller;

import com.retosonline.dto.HistorialSalaDTO;
import com.retosonline.service.HistorialService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;

@RestController
@RequestMapping("/api/historial")
@RequiredArgsConstructor
@Tag(name = "Historial",
        description = "Historial paginado y descarga de reportes")
@SecurityRequirement(name = "bearerAuth")
public class HistorialController {

    private final HistorialService historialService;

    @GetMapping
    @Operation(summary = "Historial paginado de salas finalizadas del usuario")
    public ResponseEntity<HistorialSalaDTO> historial(
            @RequestParam(defaultValue = "0")  int pagina,
            @RequestParam(defaultValue = "10") int tamano,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
            LocalDateTime desde,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
            LocalDateTime hasta,
            @RequestParam(required = false) String actividad,
            @AuthenticationPrincipal UserDetails userDetails) {

        // Siempre filtra por el email del usuario autenticado
        String emailUsuario = userDetails.getUsername();

        return ResponseEntity.ok(
                historialService.obtenerHistorial(
                        pagina, tamano, desde, hasta,
                        emailUsuario, actividad));
    }

    @GetMapping("/{codigoSala}/reporte")
    @Operation(summary = "Descargar reporte persistido de una sala")
    public ResponseEntity<byte[]> descargarReporte(
            @PathVariable String codigoSala) {

        byte[] bytes = historialService
                .obtenerContenidoReporte(codigoSala)
                .getBytes(StandardCharsets.UTF_8);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"reporte-"
                                + codigoSala + ".txt\"")
                .contentType(MediaType.TEXT_PLAIN)
                .contentLength(bytes.length)
                .body(bytes);
    }
}