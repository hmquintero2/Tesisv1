package com.retosonline.service;

import com.retosonline.dto.EstadisticasDTO;
import com.retosonline.dto.RankingDTO;
import com.retosonline.entity.Sala;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import jakarta.mail.internet.MimeMessage;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.IntStream;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;

    // ─────────────────────────────────────────────────────────────
    //  MÉTODO BASE — envía cualquier correo HTML
    // ─────────────────────────────────────────────────────────────

    public void enviarHtml(String destinatario, String asunto, String htmlBody) {
        try {
            MimeMessage mensaje = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mensaje, true, "UTF-8");
            helper.setTo(destinatario);
            helper.setSubject(asunto);
            helper.setText(htmlBody, true);
            mailSender.send(mensaje);
            log.info("[EMAIL] Enviado a {} — {}", destinatario, asunto);
        } catch (Exception e) {
            log.error("[EMAIL] Error enviando a {}: {}", destinatario, e.getMessage());
            throw new RuntimeException("No se pudo enviar el correo: " + e.getMessage());
        }
    }

    /**
     * Envía un correo con PDF adjunto como byte[].
     * Usado para enviar el reporte de sala a cada participante.
     */
    public void enviarConAdjunto(String destinatario, String asunto,
                                 String htmlBody, byte[] adjunto,
                                 String nombreArchivo) {
        try {
            MimeMessage mensaje = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mensaje, true, "UTF-8");
            helper.setTo(destinatario);
            helper.setSubject(asunto);
            helper.setText(htmlBody, true);
            helper.addAttachment(nombreArchivo,
                    new org.springframework.core.io.ByteArrayResource(adjunto),
                    "text/plain");
            mailSender.send(mensaje);
            log.info("[EMAIL-ADJUNTO] Enviado a {} con archivo {}", destinatario, nombreArchivo);
        } catch (Exception e) {
            log.error("[EMAIL-ADJUNTO] Error enviando a {}: {}", destinatario, e.getMessage());
            throw new RuntimeException("No se pudo enviar el correo con adjunto: " + e.getMessage());
        }
    }

    // ─────────────────────────────────────────────────────────────
    //  PLANTILLAS HTML
    // ─────────────────────────────────────────────────────────────

    public String plantillaOtp(String nombre, String codigo, int minutosExpiracion) {
        return """
            <div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;
                        border:1px solid #e0e0e0;border-radius:12px;overflow:hidden">
              <div style="background:linear-gradient(135deg,#7c3aed,#06b6d4);
                          padding:24px;text-align:center">
                <h1 style="color:white;margin:0;font-size:24px;letter-spacing:2px">
                  ⚔️ CODEBATTLE
                </h1>
                <p style="color:#e0e0e0;margin:6px 0 0;font-size:14px">
                  Activación de cuenta
                </p>
              </div>
              <div style="padding:32px;background:#fff">
                <p style="font-size:16px;color:#374151">
                  Hola <strong>%s</strong>,
                </p>
                <p style="color:#6b7280;font-size:15px">
                  Tu código de verificación es:
                </p>
                <div style="background:#f3f4f6;border-radius:10px;padding:24px;
                            text-align:center;font-size:42px;font-weight:bold;
                            letter-spacing:10px;color:#7c3aed;margin:20px 0">
                  %s
                </div>
                <p style="color:#9ca3af;font-size:13px;text-align:center">
                  ⏱ Este código expira en <strong>%d minutos</strong>.
                  No lo compartas con nadie.
                </p>
              </div>
              <div style="background:#f9fafb;padding:16px;text-align:center;
                          font-size:12px;color:#9ca3af">
                CodeBattle — Aplicaciones Distribuidas
              </div>
            </div>
            """.formatted(nombre, codigo, minutosExpiracion);
    }

    public String plantillaRecuperacion(String nombre, String enlace, int minutosExpiracion) {
        return """
            <div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;
                        border:1px solid #e0e0e0;border-radius:12px;overflow:hidden">
              <div style="background:linear-gradient(135deg,#7c3aed,#06b6d4);
                          padding:24px;text-align:center">
                <h1 style="color:white;margin:0;font-size:24px;letter-spacing:2px">
                  ⚔️ CODEBATTLE
                </h1>
                <p style="color:#e0e0e0;margin:6px 0 0;font-size:14px">
                  Recuperación de cuenta
                </p>
              </div>
              <div style="padding:32px;background:#fff">
                <p style="font-size:16px;color:#374151">
                  Hola <strong>%s</strong>,
                </p>
                <p style="color:#6b7280;font-size:15px">
                  Recibimos una solicitud para restablecer tu contraseña.
                  Haz clic en el botón para continuar:
                </p>
                <div style="text-align:center;margin:28px 0">
                  <a href="%s"
                     style="background:linear-gradient(135deg,#7c3aed,#06b6d4);
                            color:white;padding:14px 32px;border-radius:10px;
                            text-decoration:none;font-weight:bold;font-size:16px;
                            display:inline-block">
                    🔑 Recuperar mi cuenta
                  </a>
                </div>
                <p style="color:#9ca3af;font-size:13px;text-align:center">
                  ⏱ Este enlace vence en <strong>%d minutos</strong>.<br>
                  Si no solicitaste esto, ignora este correo.
                </p>
              </div>
              <div style="background:#f9fafb;padding:16px;text-align:center;
                          font-size:12px;color:#9ca3af">
                CodeBattle — Aplicaciones Distribuidas
              </div>
            </div>
            """.formatted(nombre, enlace, minutosExpiracion);
    }

    /**
     * Plantilla HTML del correo que acompaña el reporte de sala.
     * Se envía a CADA participante cuando la partida termina.
     */
    public String plantillaReporteSala(String nombreJugador, Sala sala,
                                       EstadisticasDTO stats,
                                       List<RankingDTO> ranking,
                                       int posicion) {
        String fecha = sala.getFechaCreacion() != null
                ? sala.getFechaCreacion().format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm"))
                : "—";

        String modo = sala.getModo().name().equals("PRUEBA") ? "📋 Prueba" : "⚔️ Competencia";

        // Construir filas del ranking
        StringBuilder filasRanking = new StringBuilder();
        IntStream.range(0, ranking.size()).forEach(i -> {
            RankingDTO r = ranking.get(i);
            String medal = i == 0 ? "🥇" : i == 1 ? "🥈" : i == 2 ? "🥉"
                                                         : (i + 1) + ".";
            String bgFila = i % 2 == 0 ? "#f9fafb" : "#ffffff";
            // Resaltar la fila del propio jugador
            boolean esTu = r.getUsername().equals(nombreJugador);
            String estiloFila = esTu
                    ? "background:#ede9fe;font-weight:bold;"
                    : "background:" + bgFila + ";";
            filasRanking.append("""
                <tr style="%s">
                  <td style="padding:10px 16px;text-align:center">%s</td>
                  <td style="padding:10px 16px">%s %s</td>
                  <td style="padding:10px 16px;text-align:right;
                              color:#7c3aed;font-weight:bold">%d pts</td>
                </tr>
                """.formatted(estiloFila, medal,
                    esTu ? "→" : "", r.getUsername(), r.getPuntos()));
        });

        String ganadorBloque = "";
        if (stats.getGanador() != null) {
            ganadorBloque = """
                <div style="text-align:center;margin:16px 0;padding:12px;
                            background:#fef3c7;border-radius:8px;
                            font-size:16px;color:#92400e">
                  🏆 Ganador: <strong>%s</strong>
                </div>
                """.formatted(stats.getGanador());
        }

        return """
            <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;
                        border:1px solid #e0e0e0;border-radius:12px;overflow:hidden">

              <!-- Header -->
              <div style="background:linear-gradient(135deg,#7c3aed,#06b6d4);
                          padding:28px;text-align:center">
                <h1 style="color:white;margin:0;font-size:26px;letter-spacing:2px">
                  ⚔️ CODEBATTLE
                </h1>
                <p style="color:#e0e0e0;margin:6px 0 0;font-size:15px">
                  Reporte de partida finalizada
                </p>
              </div>

              <div style="padding:32px;background:#fff">

                <!-- Saludo -->
                <p style="font-size:16px;color:#374151">
                  Hola <strong>%s</strong>,
                </p>
                <p style="color:#6b7280;font-size:15px">
                  La sala <strong>%s</strong> (%s) ha finalizado.
                  Tu posición final fue <strong>#%d</strong>.
                  Adjunto encontrarás el reporte completo en formato TXT.
                </p>

                <!-- Info sala -->
                <div style="background:#f3f4f6;border-radius:10px;
                            padding:16px;margin:20px 0">
                  <table style="width:100%%;font-size:14px;color:#374151">
                    <tr>
                      <td><strong>Sala:</strong></td>
                      <td>%s — %s</td>
                    </tr>
                    <tr>
                      <td><strong>Modo:</strong></td>
                      <td>%s</td>
                    </tr>
                    <tr>
                      <td><strong>Fecha:</strong></td>
                      <td>%s</td>
                    </tr>
                  </table>
                </div>

                <!-- Estadísticas generales -->
                <h3 style="color:#374151;border-bottom:2px solid #e0e0e0;
                           padding-bottom:8px">
                  📊 Estadísticas generales
                </h3>
                <div style="display:flex;gap:12px;margin-bottom:24px">
                  <div style="flex:1;background:#f3f4f6;border-radius:8px;
                              padding:16px;text-align:center">
                    <p style="font-size:24px;font-weight:bold;color:#7c3aed;margin:0">
                      %.1f%%
                    </p>
                    <p style="font-size:12px;color:#9ca3af;margin:4px 0 0">
                      Aciertos
                    </p>
                  </div>
                  <div style="flex:1;background:#f3f4f6;border-radius:8px;
                              padding:16px;text-align:center">
                    <p style="font-size:24px;font-weight:bold;color:#06b6d4;margin:0">
                      %.0f pts
                    </p>
                    <p style="font-size:12px;color:#9ca3af;margin:4px 0 0">
                      Promedio
                    </p>
                  </div>
                  <div style="flex:1;background:#f3f4f6;border-radius:8px;
                              padding:16px;text-align:center">
                    <p style="font-size:24px;font-weight:bold;color:#10b981;margin:0">
                      %d pts
                    </p>
                    <p style="font-size:12px;color:#9ca3af;margin:4px 0 0">
                      Top score
                    </p>
                  </div>
                </div>

                %s

                <!-- Ranking -->
                <h3 style="color:#374151;border-bottom:2px solid #e0e0e0;
                           padding-bottom:8px">
                  🏅 Ranking final
                </h3>
                <table style="width:100%%;border-collapse:collapse;font-size:14px">
                  <thead>
                    <tr style="background:#7c3aed;color:white">
                      <th style="padding:10px 16px;text-align:center">#</th>
                      <th style="padding:10px 16px;text-align:left">Jugador</th>
                      <th style="padding:10px 16px;text-align:right">Puntos</th>
                    </tr>
                  </thead>
                  <tbody>
                    %s
                  </tbody>
                </table>

                <p style="color:#9ca3af;font-size:13px;margin-top:24px;text-align:center">
                  El reporte completo está adjunto como archivo TXT.
                </p>
              </div>

              <div style="background:#f9fafb;padding:16px;text-align:center;
                          font-size:12px;color:#9ca3af">
                CodeBattle — Aplicaciones Distribuidas
              </div>
            </div>
            """.formatted(
                nombreJugador,
                sala.getCodigo(), sala.getNombre(), posicion,
                sala.getCodigo(), sala.getNombre(),
                modo, fecha,
                stats.getPorcentajeAciertos(),
                stats.getPromedio(),
                stats.getPuntajeMasAlto(),
                ganadorBloque,
                filasRanking.toString()
        );
    }
}