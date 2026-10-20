package com.retosonline.controller;

import com.retosonline.dto.*;
import com.retosonline.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Tag(name = "Autenticación", description = "Registro, login, OTP y recuperación")
public class AuthController {

    private final AuthService authService;

    @Value("${app.frontend.url:http://localhost:5173}")
    private String frontendUrl;

    @PostMapping("/register")
    @Operation(summary = "Registrar nuevo usuario — devuelve mensaje OTP")
    public ResponseEntity<LoginResponse> register(
            @Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.ok(authService.register(request));
    }

    @PostMapping("/login")
    @Operation(summary = "Iniciar sesión — requiere cuenta ACTIVE")
    public ResponseEntity<LoginResponse> login(
            @Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @PostMapping("/google")
    @Operation(summary = "Login con Google")
    public ResponseEntity<LoginResponse> loginGoogle(
            @Valid @RequestBody GoogleLoginRequest request) {
        return ResponseEntity.ok(authService.loginConGoogle(request.getIdToken()));
    }

    @PostMapping("/verificar-otp")
    @Operation(summary = "Verificar código OTP y activar cuenta")
    public ResponseEntity<Map<String, String>> verificarOtp(
            @RequestBody Map<String, String> body) {
        return ResponseEntity.ok(
                authService.verificarOtp(body.get("email"), body.get("codigo")));
    }

    @PostMapping("/reenviar-otp")
    @Operation(summary = "Reenviar nuevo código OTP")
    public ResponseEntity<Map<String, String>> reenviarOtp(
            @RequestBody Map<String, String> body) {
        return ResponseEntity.ok(
                authService.reenviarOtp(body.get("email")));
    }

    @PostMapping("/recuperar-password")
    @Operation(summary = "Solicitar enlace de recuperación de contraseña")
    public ResponseEntity<Map<String, String>> recuperarPassword(
            @RequestBody Map<String, String> body) {
        return ResponseEntity.ok(
                authService.solicitarRecuperacion(body.get("email"), frontendUrl));
    }

    @PostMapping("/reset-password")
    @Operation(summary = "Restablecer contraseña con token del correo")
    public ResponseEntity<Map<String, String>> resetPassword(
            @RequestBody Map<String, String> body) {
        return ResponseEntity.ok(
                authService.resetPassword(
                        body.get("email"),
                        body.get("token"),
                        body.get("password")));
    }

}