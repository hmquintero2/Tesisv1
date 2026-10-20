package com.retosonline.controller;

import com.retosonline.entity.Usuario;
import com.retosonline.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/usuario")
@RequiredArgsConstructor
public class UsuarioController {

    private final UsuarioRepository usuarioRepository;

    @GetMapping("/perfil")
    public ResponseEntity<?> obtenerPerfil(@AuthenticationPrincipal UserDetails userDetails) {
        Usuario usuario = usuarioRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
        return ResponseEntity.ok(Map.of(
                "nombre", usuario.getNombre(),
                "email", usuario.getEmail(),
                "avatarId", usuario.getAvatarId() != null ? usuario.getAvatarId() : "gato"
        ));
    }

    @PutMapping("/avatar")
    public ResponseEntity<?> actualizarAvatar(
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal UserDetails userDetails) {
        Usuario usuario = usuarioRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
        usuario.setAvatarId(body.get("avatarId"));
        usuarioRepository.save(usuario);
        return ResponseEntity.ok(Map.of("mensaje", "Avatar actualizado", "avatarId", usuario.getAvatarId()));
    }
}