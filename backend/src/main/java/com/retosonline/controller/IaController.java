package com.retosonline.controller;

import com.retosonline.service.IaPreguntasService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@RestController
@RequestMapping("/api/ia")
@RequiredArgsConstructor
@Tag(name = "IA", description = "Extracción de texto para generación de preguntas")
@SecurityRequirement(name = "bearerAuth")
public class IaController {

    private final IaPreguntasService iaPreguntasService;

    @GetMapping("/estado")
    @Operation(summary = "Verificar si Ollama está disponible")
    public ResponseEntity<Map<String, Object>> estado() {
        return ResponseEntity.ok(iaPreguntasService.estadoOllama());
    }

    @PostMapping(value = "/extraer-texto",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Extraer texto de PDF, DOCX o TXT para enviar al crear sala")
    public ResponseEntity<Map<String, Object>> extraerTexto(
            @RequestPart("archivo") MultipartFile archivo) {
        try {
            String texto = iaPreguntasService.extraerTexto(archivo);
            return ResponseEntity.ok(Map.of(
                    "texto",  texto,
                    "nombre", archivo.getOriginalFilename(),
                    "chars",  texto.length()
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", e.getMessage()));
        }
    }
}