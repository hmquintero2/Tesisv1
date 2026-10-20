package com.retosonline.service;

import com.retosonline.dto.*;
import com.retosonline.entity.Usuario;
import com.retosonline.enums.AccountStatus;
import com.retosonline.enums.ProveedorAuth;
import com.retosonline.enums.RolEnum;
import com.retosonline.exception.UserNotFoundException;
import com.retosonline.repository.UsuarioRepository;
import com.retosonline.security.JwtUtil;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.*;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.Map;
import java.util.Random;

@Service
@Slf4j
public class AuthService {

    private final UsuarioRepository     usuarioRepository;
    private final PasswordEncoder       passwordEncoder;
    private final JwtUtil               jwtUtil;
    private final AuthenticationManager authenticationManager;
    private final UserDetailsService    userDetailsService;
    private final String                googleClientId;
    private final ColaService           colaService;

    @Value("${app.otp.ttl-minutes:5}")
    private int otpTtlMinutos;

    @Value("${app.recovery.ttl-minutes:15}")
    private int recoveryTtlMinutos;

    public AuthService(
            UsuarioRepository usuarioRepository,
            PasswordEncoder passwordEncoder,
            JwtUtil jwtUtil,
            AuthenticationManager authenticationManager,
            UserDetailsService userDetailsService,
            ColaService colaService,
            @Value("${google.client.id}") String googleClientId) {
        this.usuarioRepository     = usuarioRepository;
        this.passwordEncoder       = passwordEncoder;
        this.jwtUtil               = jwtUtil;
        this.authenticationManager = authenticationManager;
        this.userDetailsService    = userDetailsService;
        this.colaService           = colaService;
        this.googleClientId        = googleClientId;
    }

    // ── Registro ──────────────────────────────────────────────

    public LoginResponse register(RegisterRequest request) {
        if (usuarioRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("El email ya está registrado");
        }

        String otp = String.format("%06d", new Random().nextInt(999999));
        LocalDateTime expiracion =
                LocalDateTime.now().plusMinutes(otpTtlMinutos);

        RolEnum rol = request.getRol() != null
                ? request.getRol() : RolEnum.JUGADOR;

        Usuario usuario = Usuario.builder()
                .nombre(request.getNombre())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .rol(rol)
                .proveedor(ProveedorAuth.LOCAL)
                .accountStatus(AccountStatus.INACTIVE)
                .verificationCode(otp)
                .verificationExpiresAt(expiracion)
                .verificationAttempts(0)
                .build();

        usuarioRepository.save(usuario);
        log.info("Usuario registrado INACTIVE: {}", usuario.getEmail());

        colaService.encolar(
                ColaService.Tipo.VERIFICACION_OTP,
                usuario.getEmail(),
                Map.of("nombre", usuario.getNombre(), "codigo", otp));

        return LoginResponse.builder()
                .id(usuario.getId())
                .nombre(usuario.getNombre())
                .email(usuario.getEmail())
                .rol(usuario.getRol().name())
                .mensaje("Cuenta creada. Revisa tu correo para activarla.")
                .build();
    }

    // ── Login ─────────────────────────────────────────────────

    public LoginResponse login(LoginRequest request) {
        Usuario usuario = usuarioRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new UserNotFoundException(
                        "Usuario no encontrado"));

        if (usuario.getProveedor() == ProveedorAuth.GOOGLE) {
            throw new RuntimeException(
                    "Esta cuenta fue creada con Google. Usa el botón 'Continuar con Google'.");
        }

        if (usuario.getAccountStatus() == AccountStatus.INACTIVE) {
            throw new RuntimeException(
                    "Tu cuenta no está activa. Revisa tu correo y valida el código OTP.");
        }

        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            request.getEmail(), request.getPassword()));
        } catch (BadCredentialsException e) {
            throw new RuntimeException("Credenciales incorrectas.");
        }

        log.info("Login exitoso: {} ({})", usuario.getEmail(), usuario.getRol());
        return buildResponse(usuario);
    }

    // ── Verificar OTP ─────────────────────────────────────────

    public Map<String, String> verificarOtp(String email, String codigo) {
        Usuario usuario = usuarioRepository.findByEmail(email)
                .orElseThrow(() -> new UserNotFoundException(
                        "Usuario no encontrado"));

        if (usuario.getAccountStatus() == AccountStatus.ACTIVE) {
            return Map.of("mensaje", "La cuenta ya está activa");
        }
        if (usuario.getVerificationExpiresAt() == null ||
                LocalDateTime.now().isAfter(
                        usuario.getVerificationExpiresAt())) {
            throw new RuntimeException(
                    "El código ha expirado. Solicita uno nuevo.");
        }

        int maxIntentos = 5;
        if (!usuario.getVerificationCode().equals(codigo)) {
            int intentos = usuario.getVerificationAttempts() + 1;
            usuario.setVerificationAttempts(intentos);
            usuarioRepository.save(usuario);
            int restantes = maxIntentos - intentos;
            throw new RuntimeException(
                    "Código incorrecto. Intentos restantes: " + restantes);
        }

        usuario.setAccountStatus(AccountStatus.ACTIVE);
        usuario.setVerificationCode(null);
        usuario.setVerificationExpiresAt(null);
        usuario.setVerificationAttempts(0);
        usuarioRepository.save(usuario);

        log.info("Cuenta activada: {}", email);
        return Map.of("mensaje",
                "Cuenta activada correctamente. Ya puedes iniciar sesión.");
    }

    // ── Reenviar OTP ──────────────────────────────────────────

    public Map<String, String> reenviarOtp(String email) {
        Usuario usuario = usuarioRepository.findByEmail(email)
                .orElseThrow(() -> new UserNotFoundException(
                        "Usuario no encontrado"));

        if (usuario.getAccountStatus() == AccountStatus.ACTIVE) {
            throw new RuntimeException("La cuenta ya está activa.");
        }

        String nuevoOtp =
                String.format("%06d", new Random().nextInt(999999));
        usuario.setVerificationCode(nuevoOtp);
        usuario.setVerificationExpiresAt(
                LocalDateTime.now().plusMinutes(otpTtlMinutos));
        usuario.setVerificationAttempts(0);
        usuarioRepository.save(usuario);

        colaService.encolar(
                ColaService.Tipo.VERIFICACION_OTP,
                email,
                Map.of("nombre", usuario.getNombre(), "codigo", nuevoOtp));

        return Map.of("mensaje", "Nuevo código enviado a tu correo.");
    }

    // ── Recuperación de contraseña ────────────────────────────

    public Map<String, String> solicitarRecuperacion(String email,
                                                     String frontendUrl) {
        Usuario usuario = usuarioRepository.findByEmail(email)
                .orElseThrow(() -> new UserNotFoundException(
                        "Usuario no encontrado"));

        if (usuario.getAccountStatus() != AccountStatus.ACTIVE) {
            throw new RuntimeException("La cuenta no está activa.");
        }

        String token = java.util.UUID.randomUUID()
                .toString().replace("-", "");
        usuario.setResetToken(token);
        usuario.setResetTokenExpiresAt(
                LocalDateTime.now().plusMinutes(recoveryTtlMinutos));
        usuarioRepository.save(usuario);

        String enlace = frontendUrl + "/reset-password?token="
                + token + "&email=" + email;

        colaService.encolar(
                ColaService.Tipo.RECUPERACION_PASSWORD,
                email,
                Map.of("nombre", usuario.getNombre(), "enlace", enlace));

        log.info("Token de recuperación generado para: {}", email);
        log.debug("Token (parcial): {}...", token.substring(0, 8));

        return Map.of("mensaje",
                "Enlace de recuperación enviado a tu correo.");
    }

    public Map<String, String> resetPassword(String email,
                                             String token,
                                             String nuevaPassword) {
        Usuario usuario = usuarioRepository.findByEmail(email)
                .orElseThrow(() -> new UserNotFoundException(
                        "Usuario no encontrado"));

        if (usuario.getResetToken() == null
                || !usuario.getResetToken().equals(token)) {
            throw new RuntimeException(
                    "El enlace de recuperación no es válido.");
        }
        if (LocalDateTime.now().isAfter(usuario.getResetTokenExpiresAt())) {
            throw new RuntimeException(
                    "El enlace de recuperación ha vencido.");
        }

        usuario.setPassword(passwordEncoder.encode(nuevaPassword));
        usuario.setResetToken(null);
        usuario.setResetTokenExpiresAt(null);
        usuarioRepository.save(usuario);

        log.info("Contraseña restablecida para: {}", email);
        return Map.of("mensaje", "Contraseña restablecida correctamente.");
    }

    // ── Login con Google ──────────────────────────────────────

    public LoginResponse loginConGoogle(String idTokenString) {
        try {
            GoogleIdTokenVerifier verifier =
                    new GoogleIdTokenVerifier.Builder(
                            new NetHttpTransport(), new GsonFactory())
                            .setAudience(Collections.singletonList(
                                    googleClientId))
                            .build();

            GoogleIdToken idToken = verifier.verify(idTokenString);
            if (idToken == null) {
                throw new RuntimeException(
                        "Token de Google inválido o expirado.");
            }

            GoogleIdToken.Payload payload = idToken.getPayload();
            String email  = payload.getEmail();
            String nombre = (String) payload.get("name");

            Usuario usuario = usuarioRepository.findByEmail(email)
                    .orElseGet(() -> usuarioRepository.save(
                            Usuario.builder()
                                    .nombre(nombre != null ? nombre : email)
                                    .email(email)
                                    .googleId(payload.getSubject())
                                    .proveedor(ProveedorAuth.GOOGLE)
                                    .accountStatus(AccountStatus.ACTIVE)
                                    .rol(RolEnum.JUGADOR)
                                    .build()));

            if (usuario.getGoogleId() == null) {
                usuario.setGoogleId(payload.getSubject());
                usuario.setProveedor(ProveedorAuth.GOOGLE);
                usuario.setAccountStatus(AccountStatus.ACTIVE);
                usuarioRepository.save(usuario);
            }

            return buildResponse(usuario);

        } catch (RuntimeException e) {
            throw e;
        } catch (Exception e) {
            throw new RuntimeException(
                    "No se pudo verificar el token de Google: "
                            + e.getMessage());
        }
    }

    // ── Helper ────────────────────────────────────────────────

    private LoginResponse buildResponse(Usuario usuario) {
        UserDetails userDetails = userDetailsService
                .loadUserByUsername(usuario.getEmail());
        String token = jwtUtil.generateToken(userDetails);
        return LoginResponse.builder()
                .token(token).tipo("Bearer")
                .id(usuario.getId())
                .nombre(usuario.getNombre())
                .email(usuario.getEmail())
                .rol(usuario.getRol().name())
                .build();
    }
}