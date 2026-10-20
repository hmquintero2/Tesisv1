import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { useWebSocket } from '../hooks/useWebSocket'
import { useVisibilityTracker } from '../hooks/useVisibilityTracker'
import Temporizador from '../components/Temporizador'

export default function Juego() {
    const { codigo } = useParams()
    const { user } = useAuth()
    const { isDark } = useTheme()
    const navigate = useNavigate()

    const [fase, setFase] = useState('esperando')
    const [cuentaRegresiva, setCuentaRegresiva] = useState(5)
    const [pregunta, setPregunta] = useState(null)
    const [seleccion, setSeleccion] = useState(null)
    const [tiempoRestante, setTiempoRestante] = useState(0)
    const [ranking, setRanking] = useState([])
    const [estadisticas, setEstadisticas] = useState(null)
    const [modoSala, setModoSala] = useState('COMPETENCIA')
    const [mostrarResultado, setMostrarResultado] = useState(false)
    const [progreso, setProgreso] = useState({ respondieron: 0, total: 0 })

    const tiempoInicioRef   = useRef(null)
    const timerRef          = useRef(null)
    const resultadoTimerRef = useRef(null)
    const preguntaRef       = useRef(null)
    const seleccionRef      = useRef(null)
    const mostrarResultadoRef = useRef(false)
    const [diapositiva, setDiapositiva] = useState(null)
    const [sala, setSala] = useState(null)
    useEffect(() => { preguntaRef.current       = pregunta        }, [pregunta])
    useEffect(() => { seleccionRef.current      = seleccion       }, [seleccion])
    useEffect(() => { mostrarResultadoRef.current = mostrarResultado }, [mostrarResultado])
    useEffect(() => {
        api.get(`/salas/${codigo}`).then(({ data }) => setSala(data)).catch(() => {})
    }, [codigo])

    // ── Iniciar una pregunta ──────────────────────────────────────
    const iniciarPregunta = useCallback((nuevaPregunta) => {
        setFase('pregunta')
        setPregunta(nuevaPregunta)
        setSeleccion(null)
        setMostrarResultado(false)
        setProgreso({ respondieron: 0, total: 0 })
        clearInterval(timerRef.current)
        clearTimeout(resultadoTimerRef.current)

        const llegadaMs      = Date.now()
        const limiteSegundos = nuevaPregunta.tiempoLimite
        tiempoInicioRef.current = llegadaMs
        setTiempoRestante(limiteSegundos)

        timerRef.current = setInterval(() => {
            const transcurrido = (Date.now() - llegadaMs) / 1000
            const restante = Math.max(0, Math.round(limiteSegundos - transcurrido))
            setTiempoRestante(restante)
            if (restante <= 0) clearInterval(timerRef.current)
        }, 500)
    }, [])

    // ── Mensajes del juego ────────────────────────────────────────
    const onJuego = useCallback((msg) => {

        if (msg.tipo === 'INICIO_CUENTA_REGRESIVA') {
            setFase('cuenta')
            setCuentaRegresiva(msg.segundosRestantes)

        } else if (msg.tipo === 'NUEVA_PREGUNTA') {
            clearInterval(timerRef.current)
            clearTimeout(resultadoTimerRef.current)

            if (preguntaRef.current) {
                // Hay pregunta anterior → mostrar resultado 5s y luego cambiar
                // Solo muestra resultado si el usuario YA respondió
                // Si no respondió, solo muestra la respuesta correcta
                setMostrarResultado(true)
                const siguiente = msg.pregunta
                resultadoTimerRef.current = setTimeout(() => {
                    iniciarPregunta(siguiente)
                }, 5000)
            } else {
                // Primera pregunta → iniciar directo
                iniciarPregunta(msg.pregunta)
            }

        } else if (msg.tipo === 'TIEMPO_AGOTADO') {
            // El tiempo se acabó — mostrar resultado
            clearInterval(timerRef.current)
            setMostrarResultado(true)

        } else if (msg.tipo === 'PROGRESO_RESPUESTA') {
            const respondieron = msg.totalRespondieron || 0
            const total        = msg.totalJugadores    || 0
            setProgreso({ respondieron, total })

            // Solo mostrar resultado cuando TODOS los jugadores respondieron
            // NO activar mostrarResultado si el usuario actual no ha respondido aún
            // El usuario puede seguir respondiendo hasta que se acabe el tiempo
            if (respondieron >= total && total > 0) {
                clearInterval(timerRef.current)
                setMostrarResultado(true)
            }

        } else if (msg.tipo === 'FIN_JUEGO') {
            clearInterval(timerRef.current)
            clearTimeout(resultadoTimerRef.current)
            setFase('fin')
            setRanking(msg.ranking || [])
            setEstadisticas(msg.estadisticas || null)
            setModoSala(msg.modoSala || 'COMPETENCIA')
        }
    }, [iniciarPregunta])

    const onRanking = useCallback((data) => setRanking(data), [])

    const { sendMessage } = useWebSocket(
        codigo, () => {}, () => {}, null, null, onJuego, onRanking)

    useVisibilityTracker(
        sendMessage, codigo, user, fase === 'pregunta' || fase === 'cuenta')

    useEffect(() => () => {
        clearInterval(timerRef.current)
        clearTimeout(resultadoTimerRef.current)
    }, [])


    // ── Responder pregunta ────────────────────────────────────────
    const responder = (opcion) => {
        // Solo bloquear si ya respondió — NO bloquear por mostrarResultado
        // para que el usuario pueda responder hasta el último momento
        if (seleccionRef.current || !preguntaRef.current) return
        // Si ya se muestra resultado no permitir responder
        if (mostrarResultadoRef.current) return

        setSeleccion(opcion)
        const tiempoMs = Date.now() - tiempoInicioRef.current
        sendMessage(`/app/sala/${codigo}/responder`, {
            remitente:             user?.email,
            preguntaId:            preguntaRef.current.id,
            respuestaSeleccionada: opcion,
            tiempoRespuestaMs:     tiempoMs,
        })
    }

    // ── Colores de opciones ───────────────────────────────────────
    const colorOpcion = (opcion) => {
        const base_normal = isDark
            ? 'bg-game-dark border-game-border text-white hover:border-game-purple hover:bg-game-purple/10'
            : 'bg-white border-gray-200 text-gray-800 hover:border-purple-400'
        const base_gris = isDark
            ? 'bg-game-dark border-game-border text-gray-500'
            : 'bg-gray-50 border-gray-200 text-gray-400'

        // No respondió y no hay resultado → normal
        if (!seleccion && !mostrarResultado) return base_normal

        // Respondió pero esperando que los demás → morado en selección
        if (seleccion && !mostrarResultado) {
            if (opcion === seleccion)
                return 'bg-game-purple/20 border-game-purple text-game-purple-light'
            return base_gris
        }

        // Mostrando resultado y el usuario respondió
        if (mostrarResultado && seleccion) {
            if (opcion === pregunta.respuestaCorrecta)
                return 'bg-green-500/20 border-green-500 text-green-400'
            if (opcion === seleccion)
                return 'bg-red-500/20 border-red-500 text-red-400'
            return base_gris
        }

        // Mostrando resultado pero el usuario NO respondió
        // Solo mostrar verde en la correcta, sin rojo
        if (mostrarResultado && !seleccion) {
            if (opcion === pregunta.respuestaCorrecta)
                return 'bg-green-500/20 border-green-500 text-green-400'
            return base_gris
        }

        return base_normal
    }

    // ── Descargar reporte ─────────────────────────────────────────
    const descargarReporte = () => {
        const fecha = new Date().toLocaleDateString('es-EC', {
            year: 'numeric', month: 'long', day: 'numeric',
            hour: '2-digit', minute: '2-digit'
        })
        const lineas = [
            '========================================',
            '         REPORTE DE PARTIDA - CODEBATTLE',
            '========================================',
            `Sala: ${codigo}`,
            `Fecha: ${fecha}`,
            estadisticas?.ganador ? `Ganador: ${estadisticas.ganador}` : '',
            estadisticas ? `Porcentaje de aciertos: ${estadisticas.porcentajeAciertos?.toFixed(1)}%` : '',
            estadisticas ? `Puntaje más alto: ${estadisticas.puntajeMasAlto} pts` : '',
            estadisticas ? `Promedio: ${estadisticas.promedio?.toFixed(0)} pts` : '',
            '',
            '--- RANKING FINAL ---',
            ...ranking.map((r, i) => `${i + 1}. ${r.username} — ${r.puntos} pts`),
            '========================================',
        ].filter(Boolean)

        const blob = new Blob([lineas.join('\n')], { type: 'text/plain;charset=utf-8' })
        const url  = URL.createObjectURL(blob)
        const a    = document.createElement('a')
        a.href     = url
        a.download = `reporte-${codigo}-${Date.now()}.txt`
        a.click()
        URL.revokeObjectURL(url)
    }

    // ═══════════════════════════════════════════════════════════════
    // RENDERS
    // ═══════════════════════════════════════════════════════════════

    if (fase === 'esperando') return (
        <div className={`min-h-screen flex items-center justify-center
        ${isDark ? 'bg-game-darker' : 'bg-gray-100'}`}>
            <div className="text-center animate-fade-in">
                <div className="w-14 h-14 mx-auto mb-5 rounded-full border-4
                border-game-cyan border-t-transparent animate-spin" />
                <div className="text-game-cyan font-game text-2xl mb-2">
                    PREPARANDO PARTIDA
                </div>
                <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                    Espera a que el anfitrión inicie
                </p>
            </div>
        </div>
    )

    if (fase === 'cuenta') return (
        <div className={`min-h-screen flex items-center justify-center
            ${isDark ? 'bg-game-darker' : 'bg-gray-100'}`}>
            <div className="text-center">
                <p className={`font-game text-xl mb-4
                    ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    LA PARTIDA COMIENZA EN
                </p>
                <div key={cuentaRegresiva}
                     className="font-game text-9xl font-black text-transparent
    bg-clip-text bg-gradient-to-br from-game-purple
    to-game-cyan animate-scale-in">
                    {cuentaRegresiva}
                </div>
            </div>
        </div>
    )

    if (fase === 'fin') return (
        <div className={`min-h-screen flex flex-col items-center
            justify-center p-8 ${isDark ? 'bg-game-darker' : 'bg-gray-100'}`}>
            <div className={`w-full max-w-lg p-8 rounded-2xl border
                ${isDark ? 'bg-game-card border-game-border' : 'bg-white border-gray-200 shadow-xl'}`}>
                <div className="text-center mb-6">
                    <div className="text-6xl mb-4">🏆</div>
                    <h2 className={`font-game text-3xl font-black
                        ${isDark ? 'text-white' : 'text-gray-800'}`}>
                        {modoSala === 'PRUEBA' ? '📋 PRUEBA FINALIZADA' : '🏆 FIN DEL JUEGO'}
                    </h2>
                    {modoSala === 'COMPETENCIA' && estadisticas?.ganador && (
                        <p className="text-game-cyan font-semibold mt-2">
                            🥇 Ganador: {estadisticas.ganador}
                        </p>
                    )}
                    {estadisticas && (
                        <div className="mt-4 grid grid-cols-3 gap-3 text-center">
                            {[
                                { val: `${estadisticas.porcentajeAciertos?.toFixed(1)}%`, label: 'Aciertos' },
                                { val: estadisticas.puntajeMasAlto, label: 'Puntaje top' },
                                { val: estadisticas.promedio?.toFixed(0), label: 'Promedio' },
                            ].map(({ val, label }) => (
                                <div key={label} className={`p-3 rounded-xl
                                    ${isDark ? 'bg-game-dark' : 'bg-gray-50'}`}>
                                    <p className="text-game-cyan font-game font-bold text-lg">{val}</p>
                                    <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{label}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="space-y-3 mb-6">
                    {ranking.map((r, i) => (
                        <div key={i} style={{ animationDelay: `${i * 100}ms` }}
                             className={`flex items-center gap-4 p-3 rounded-xl animate-fade-in
        ${isDark ? 'bg-game-dark' : 'bg-gray-50'}`}>
                            <span className="font-game font-black text-2xl w-8 text-center">
                                {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}`}
                            </span>
                            <span className={`flex-1 font-semibold
                                ${isDark ? 'text-white' : 'text-gray-800'}`}>
                                {r.username}
                            </span>
                            <span className="font-game font-bold text-game-cyan">
                                {r.puntos} pts
                            </span>
                        </div>
                    ))}
                </div>

                <div className="space-y-3">
                    <button onClick={descargarReporte}
                            className={`w-full py-3 rounded-xl font-game font-bold
                        tracking-wider uppercase border-2 transition-all
                        ${isDark
                                ? 'border-game-cyan text-game-cyan hover:bg-game-cyan/10'
                                : 'border-cyan-500 text-cyan-600 hover:bg-cyan-50'}`}>
                        📥 DESCARGAR REPORTE
                    </button>
                    <button onClick={() => navigate('/lobby')}
                            className="w-full py-3 rounded-xl font-game font-bold
                        tracking-wider uppercase bg-gradient-to-r
                        from-game-purple to-game-cyan text-white
                        hover:opacity-90 transition-all glow-purple">
                        VOLVER AL LOBBY
                    </button>
                </div>
            </div>
        </div>
    )

    if (fase === 'pregunta' && pregunta) return (
        <div className={`min-h-screen flex flex-col
            ${isDark ? 'bg-game-darker' : 'bg-gray-100'}`}>

            {/* Header */}
            <div className={`px-6 py-4 border-b flex items-center justify-between
                ${isDark ? 'bg-game-card border-game-border' : 'bg-white border-gray-200 shadow-sm'}`}>
                <div className="flex items-center gap-3">
                    <span className={`font-game text-sm
                        ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        Pregunta {pregunta.numero}/{pregunta.totalPreguntas}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded-full
                        ${isDark ? 'bg-game-purple/20 text-game-purple-light' : 'bg-purple-100 text-purple-600'}`}>
                        {pregunta.tema}
                    </span>
                </div>
                <div className="w-40">
                    <Temporizador
                        tiempoRestante={tiempoRestante}
                        segundosTotal={pregunta.tiempoLimite}
                    />
                </div>
            </div>

            {/* Contenido */}
            <div key={pregunta.id}
                 className="flex-1 flex flex-col items-center justify-center p-6 max-w-2xl mx-auto w-full animate-slide-up">

                {/* Enunciado */}
                <div className={`w-full p-6 rounded-2xl border mb-6
        ${isDark ? 'bg-game-card border-game-border' : 'bg-white border-gray-200 shadow-lg'}`}>
                    <p className={`font-semibold text-lg text-center leading-relaxed
                        ${isDark ? 'text-white' : 'text-gray-800'}`}>
                        {pregunta.enunciado}
                    </p>
                </div>

                {/* Opciones */}
                <div className="w-full grid grid-cols-1 gap-3">
                    {pregunta.opciones?.map((opcion, i) => {
                        const esCorrectaYMostrando = mostrarResultado && opcion === pregunta.respuestaCorrecta
                        const esIncorrectaSeleccionada = mostrarResultado && seleccion === opcion && opcion !== pregunta.respuestaCorrecta
                        return (
                            <button key={i}
                                    onClick={() => responder(opcion)}
                                    disabled={!!seleccion || mostrarResultado}
                                    style={{ animationDelay: `${i * 80}ms` }}
                                    className={`w-full p-4 rounded-xl border-2 text-left
                        font-semibold transition-all duration-200 animate-fade-in
                        ${colorOpcion(opcion)}
                        ${esCorrectaYMostrando ? 'animate-correct-pulse' : ''}
                        ${esIncorrectaSeleccionada ? 'animate-incorrect-shake' : ''}
                        disabled:cursor-not-allowed`}>
                <span className="mr-3 font-game">
                    {['A', 'B', 'C', 'D'][i]}.
                </span>
                                {opcion}
                            </button>
                        )
                    })}
                </div>


                {/* Estado: respondió, esperando los demás */}
                {seleccion && !mostrarResultado && (
                    <div className={`mt-4 p-3 rounded-xl text-center font-semibold border
                        ${isDark
                        ? 'bg-game-purple/10 border-game-purple/30 text-game-purple-light'
                        : 'bg-purple-50 border-purple-200 text-purple-600'}`}>
                        ⏳ Esperando que los demás respondan...
                        {progreso.total > 0 && (
                            <span className="ml-2 text-sm opacity-70">
                                ({progreso.respondieron}/{progreso.total})
                            </span>
                        )}
                    </div>
                )}

                {/* Estado: no respondió, otros ya respondieron */}
                {!seleccion && !mostrarResultado && progreso.respondieron > 0 && (
                    <div className={`mt-4 p-3 rounded-xl text-center font-semibold border
                        ${isDark
                        ? 'bg-game-cyan/10 border-game-cyan/30 text-game-cyan'
                        : 'bg-cyan-50 border-cyan-200 text-cyan-600'}`}>
                        ⚡ {progreso.respondieron}/{progreso.total} jugadores respondieron
                    </div>
                )}
                {/* Resultado: respondió correcto */}
                {mostrarResultado && seleccion && seleccion === pregunta.respuestaCorrecta && (
                    <div className="mt-4 p-3 rounded-xl text-center font-semibold animate-scale-in
        bg-green-500/20 text-green-400 border border-green-500/30">
                        ✅ ¡Correcto!
                    </div>
                )}

                {/* Resultado: respondió incorrecto */}
                {mostrarResultado && seleccion && seleccion !== pregunta.respuestaCorrecta && (
                    <div className="mt-4 p-3 rounded-xl text-center font-semibold animate-scale-in
        bg-red-500/20 text-red-400 border border-red-500/30">
                        ❌ La respuesta era: <span className="text-green-400">{pregunta.respuestaCorrecta}</span>
                    </div>
                )}

                {/* Resultado: no respondió a tiempo */}
                {mostrarResultado && !seleccion && (
                    <div className="mt-4 p-3 rounded-xl text-center font-semibold animate-scale-in
        bg-gray-500/20 text-gray-400 border border-gray-500/30">
                        ⏰ Tiempo agotado — La respuesta era:{' '}
                        <span className="text-green-400 font-bold">{pregunta.respuestaCorrecta}</span>
                    </div>
                )}



                {/* Ranking */}
                {ranking.length > 0 && (
                    <div className={`w-full mt-6 p-4 rounded-xl border animate-fade-in
        ${isDark ? 'bg-game-card border-game-border' : 'bg-white border-gray-200'}`}>
                        <p className={`text-xs font-semibold uppercase tracking-widest mb-3
                            ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                            Ranking
                        </p>
                        <div className="space-y-2">
                            {ranking.slice(0, 3).map((r, i) => (
                                <div key={i} className="flex items-center justify-between">
                                    <span className={`text-sm ${isDark ? 'text-white' : 'text-gray-800'}`}>
                                        {i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'} {r.username}
                                    </span>
                                    <span className="text-sm font-game text-game-cyan">
                                        {r.puntos} pts
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )

    return null
}