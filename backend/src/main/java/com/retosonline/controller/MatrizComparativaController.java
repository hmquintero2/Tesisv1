package com.retosonline.controller;

import com.retosonline.service.MatrizComparativaService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/matriz-comparativa")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class MatrizComparativaController {

    private final MatrizComparativaService matrizService;

    @GetMapping
    public ResponseEntity<Map<String, Object>> obtener() {
        return ResponseEntity.ok(matrizService.generar());
    }
}