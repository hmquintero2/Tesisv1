package com.retosonline.service;

import com.retosonline.entity.*;
import com.retosonline.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MatrizComparativaService {

    private final BenchmarkPreguntaRepository       preguntaRepository;
    private final BenchmarkAnonimizacionRepository  anonimizacionRepository;
    private final EvaluacionEstudianteRepository    evaluacionRepository;
    private final CuestionarioSUSRepository         susRepository;

    public Map<String, Object> generar() {
        List<BenchmarkPregunta> preguntas = preguntaRepository.findAll();
        List<BenchmarkAnonimizacion> anonimizaciones = anonimizacionRepository.findAll();
        List<EvaluacionEstudiante> evaluaciones = evaluacionRepository.findAll();
        List<CuestionarioSUS> cuestionarios = susRepository.findAll();

        // Mapa: código anónimo → condición real
        Map<String, String> codigoACondicion = anonimizaciones.stream()
                .collect(Collectors.toMap(
                        BenchmarkAnonimizacion::getCodigoAnonimo,
                        BenchmarkAnonimizacion::getModeloOriginal,
                        (a, b) -> a));

        Map<String, Object> resultado = new LinkedHashMap<>();

        for (String condicion : Set.of("CERRADO_API", "LOCAL_SIN_FT", "LOCAL_CON_FT")) {

            // ── Técnicas + rúbrica de expertos (de BenchmarkPregunta) ──
            List<BenchmarkPregunta> deEstaCondicion = preguntas.stream()
                    .filter(p -> condicion.equals(p.getModelo()))
                    .collect(Collectors.toList());

            Map<String, Object> tecnicas = new LinkedHashMap<>();
            tecnicas.put("latenciaPromedioMs", promedio(deEstaCondicion, BenchmarkPregunta::getLatencyMs));
            tecnicas.put("tokensPorSegundoPromedio", promedio(deEstaCondicion, BenchmarkPregunta::getTokensPerSecond));
            tecnicas.put("memoriaPromedioMb", promedioInt(deEstaCondicion, BenchmarkPregunta::getMemoryUsageMb));
            tecnicas.put("totalEjecuciones", deEstaCondicion.size());

            Map<String, Object> rubricaExperta = new LinkedHashMap<>();
            rubricaExperta.put("exactitud",            promedioInt(deEstaCondicion, BenchmarkPregunta::getScoreCorrecccion));
            rubricaExperta.put("pertinenciaCurricular", promedioInt(deEstaCondicion, BenchmarkPregunta::getScorePertinencia));
            rubricaExperta.put("complejidad",           promedioInt(deEstaCondicion, BenchmarkPregunta::getScoreComplejidad));
            rubricaExperta.put("calidadDistractores",   promedioInt(deEstaCondicion, BenchmarkPregunta::getScoreDistractores));
            rubricaExperta.put("coherenciaPedagogica",  promedioInt(deEstaCondicion, BenchmarkPregunta::getScoreCoherenciaPedagogica));
            rubricaExperta.put("coberturaTema",         promedioInt(deEstaCondicion, BenchmarkPregunta::getScoreCobertura));
            rubricaExperta.put("scoreTotal",            promedioInt(deEstaCondicion, BenchmarkPregunta::getScoreTotal));

            // ── Códigos anónimos que pertenecen a esta condición ──
            Set<String> codigosDeCondicion = codigoACondicion.entrySet().stream()
                    .filter(e -> condicion.equals(e.getValue()))
                    .map(Map.Entry::getKey)
                    .collect(Collectors.toSet());

            // ── Percepción estudiantil ──
            List<EvaluacionEstudiante> evalsCondicion = evaluaciones.stream()
                    .filter(e -> codigosDeCondicion.contains(e.getCodigoAnonimo()))
                    .collect(Collectors.toList());

            Map<String, Object> percepcion = new LinkedHashMap<>();
            percepcion.put("claridad",            promedioIntObj(evalsCondicion, EvaluacionEstudiante::getClaridad));
            percepcion.put("comprension",         promedioIntObj(evalsCondicion, EvaluacionEstudiante::getComprension));
            percepcion.put("dificultadPercibida", promedioIntObj(evalsCondicion, EvaluacionEstudiante::getDificultadPercibida));
            percepcion.put("experienciaUso",      promedioIntObj(evalsCondicion, EvaluacionEstudiante::getExperienciaUso));
            percepcion.put("totalEvaluaciones",   evalsCondicion.size());

            // ── SUS ──
            List<CuestionarioSUS> susCondicion = cuestionarios.stream()
                    .filter(s -> codigosDeCondicion.contains(s.getCodigoAnonimo()))
                    .collect(Collectors.toList());

            Map<String, Object> sus = new LinkedHashMap<>();
            sus.put("puntajePromedio", susCondicion.stream()
                    .filter(s -> s.getPuntajeTotal() != null)
                    .mapToDouble(CuestionarioSUS::getPuntajeTotal)
                    .average().orElse(0));
            sus.put("totalRespuestas", susCondicion.size());

            Map<String, Object> filaCondicion = new LinkedHashMap<>();
            filaCondicion.put("tecnicas", tecnicas);
            filaCondicion.put("rubricaExperta", rubricaExperta);
            filaCondicion.put("percepcionEstudiantil", percepcion);
            filaCondicion.put("usabilidadSUS", sus);

            resultado.put(condicion, filaCondicion);
        }

        return resultado;
    }

    private Double promedio(List<BenchmarkPregunta> lista, java.util.function.Function<BenchmarkPregunta, Float> campo) {
        return lista.stream()
                .map(campo).filter(Objects::nonNull)
                .mapToDouble(Float::doubleValue).average().orElse(0);
    }

    private Double promedioInt(List<BenchmarkPregunta> lista, java.util.function.Function<BenchmarkPregunta, Integer> campo) {
        return lista.stream()
                .map(campo).filter(Objects::nonNull)
                .mapToInt(Integer::intValue).average().orElse(0);
    }

    private Double promedioIntObj(List<EvaluacionEstudiante> lista, java.util.function.Function<EvaluacionEstudiante, Integer> campo) {
        return lista.stream()
                .map(campo).filter(Objects::nonNull)
                .mapToInt(Integer::intValue).average().orElse(0);
    }
}