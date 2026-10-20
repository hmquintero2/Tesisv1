import { useState, useCallback, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { useWebSocket } from '../hooks/useWebSocket'
import api from '../api/axios'

export default function PanelHost() {
    const { codigo } = useParams()
    const { user } = useAuth()
    const { isDark } = useTheme()
    const navigate = useNavigate()

    const [sala, setSala] = useState(null)
    const [fase, setFase] = useState('esperando') // esperando | jugando | fin
    const [preguntaActual, setPreguntaActual] = useState(null)
    const [ranking, setRanking] = useState([])
    const [estadisticas, setEstadisticas] = useState(null)
    const [alertas, setAlertas] = useState([])
    const [jugadoresFuera, setJugadoresFuera] = useState(new Set())
    const [progreso, setProgreso] = useState({ respondieron: 0, total: 0, nombres: [] })
    const [cuentaRegresiva, setCuentaRegresiva] = useState(null)

    useEffect(() => {
        api.get(`/salas/${codigo}`).then(({ data }) => setSala(data)).catch(() => {})
    }, [codigo])

    const onJuego = useCallback((msg) => {
        if (msg.tipo === 'INICIO_CUENTA_REGRESIVA') {
            setFase('jugando')
            setCuentaRegresiva(msg.segundosRestantes)
        } else if (msg.tipo === 'NUEVA_PREGUNTA') {
            setCuentaRegresiva(null)
            setPreguntaActual(msg.pregunta)
            setProgreso({ respondieron: 0, total: 0, nombres: [] })
        } else if (msg.tipo === 'PROGRESO_RESPUESTA') {
            setProgreso(prev => ({
                respondieron: msg.totalRespondieron,
                total: msg.totalJugadores,
                nombres: [...prev.nombres, msg.nombreRespondio]
            }))
        } else if (msg.tipo === 'FIN_JUEGO') {
            setFase('fin')
            setRanking(msg.ranking || [])
            setEstadisticas(msg.estadisticas || null)
        }
    }, [])

    const onRanking = useCallback((data) => {
        setRanking(data)
    }, [])

    const onParticipants = useCallback((msg) => {
        if (msg.tipo === 'ESTADO_CONEXION') {
            const email = msg.remitente
            const salio = msg.mensaje === 'true'
            if (salio) {
                setJugadoresFuera(prev => new Set([...prev, email]))
                setAlertas(prev => [{
                    id: Date.now(), email, tipo: 'salida',
                    hora: new Date().toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
                    pregunta: preguntaActual?.numero
                }, ...prev.slice(0, 99)])
            } else {
                setJugadoresFuera(prev => { const s = new Set(prev); s.delete(email); return s })
                setAlertas(prev => [{
                    id: Date.now(), email, tipo: 'regreso',
                    hora: new Date().toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
                }, ...prev.slice(0, 99)])
            }
        }
    }, [preguntaActual])

    const { sendMessage, connectionStatus } = useWebSocket(
        codigo, () => {}, onParticipants, null, null, onJuego, onRanking
    )

    const generarPDF = () => {
        if (!estadisticas) return

        const fecha = new Date().toLocaleDateString('es-EC', {
            year: 'numeric', month: 'long', day: 'numeric',
            hour: '2-digit', minute: '2-digit'
        })

        const lineas = [
            '╔══════════════════════════════════════════════╗',
            '║         REPORTE DE PRUEBA - CODEBATTLE       ║',
            '╚══════════════════════════════════════════════╝',
            '',
            `Sala:    ${codigo}  ${sala?.nombre ? '— ' + sala.nombre : ''}`,
            `Fecha:   ${fecha}`,
            `Modo:    PRUEBA`,
            '',
            '══════════════════════════════════════════════',
            '  ESTADÍSTICAS GENERALES',
            '══════════════════════════════════════════════',
            `  Promedio de puntos:      ${estadisticas.promedio?.toFixed(0)} pts`,
            `  Porcentaje de aciertos:  ${estadisticas.porcentajeAciertos?.toFixed(1)}%`,
            `  Puntaje más alto:        ${estadisticas.puntajeMasAlto} pts`,
            '',
            '══════════════════════════════════════════════',
            '  DETALLE POR ALUMNO',
            '══════════════════════════════════════════════',
            ...(estadisticas.detalleAlumnos || []).flatMap((a, i) => [
                '',
                `  ${i + 1}. ${a.nombre} (${a.email})`,
                `     Puntos:              ${a.puntos} pts`,
                `     Correctas:           ${a.correctas}`,
                `     Incorrectas:         ${a.incorrectas}`,
                `     Tiempo promedio:     ${(a.tiempoPromedioMs / 1000).toFixed(1)}s por respuesta`,
                `     Abandonos pestaña:   ${a.vecesAbandonoPestana} ${a.vecesAbandonoPestana > 0 ? '⚠️' : '✓'}`,
            ]),
            '',
            '══════════════════════════════════════════════',
            '  RANKING FINAL',
            '══════════════════════════════════════════════',
            ...ranking.map((r, i) =>
                `  ${i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : (i + 1) + '.'} ${r.username.padEnd(20)} ${r.puntos} pts`
            ),
            '',
            '══════════════════════════════════════════════',
            '  REGISTRO DE ALERTAS DE PESTAÑA',
            '══════════════════════════════════════════════',
            ...(alertas.length === 0
                    ? ['  Sin alertas registradas.']
                    : alertas.slice().reverse().map(a =>
                        `  ${a.hora}  ${a.tipo === 'salida' ? '🚨 SALIÓ' : '✅ VOLVIÓ'}  ${a.email}${a.pregunta ? '  (pregunta ' + a.pregunta + ')' : ''}`
                    )
            ),
            '',
            '══════════════════════════════════════════════',
            `  Generado: ${fecha}`,
            '══════════════════════════════════════════════',
        ]

        const contenido = lineas.join('\n')
        const blob = new Blob([contenido], { type: 'text/plain;charset=utf-8' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `reporte-prueba-${codigo}-${Date.now()}.txt`
        a.click()
        URL.revokeObjectURL(url)
    }

    // ── FASE FIN ──────────────────────────────────────────
    if (fase === 'fin') return (
        <div className={`min-h-screen p-6 ${isDark ? 'bg-game-darker' : 'bg-gray-100'}`}>
            <div className="max-w-3xl mx-auto space-y-6">

                <div className={`p-6 rounded-2xl border text-center
                                ${isDark ? 'bg-game-card border-game-border' : 'bg-white border-gray-200 shadow'}`}>
                    <div className="text-6xl mb-3">📊</div>
                    <h1 className={`font-game text-3xl font-black ${isDark ? 'text-white' : 'text-gray-800'}`}>
                        PRUEBA FINALIZADA
                    </h1>
                    {estadisticas && (
                        <div className="mt-4 grid grid-cols-3 gap-3">
                            {[
                                { label: 'Promedio', valor: `${estadisticas.promedio?.toFixed(0)} pts` },
                                { label: 'Aciertos', valor: `${estadisticas.porcentajeAciertos?.toFixed(1)}%` },
                                { label: 'Top', valor: `${estadisticas.puntajeMasAlto} pts` },
                            ].map(({ label, valor }) => (
                                <div key={label} className={`p-3 rounded-xl ${isDark ? 'bg-game-dark' : 'bg-gray-50'}`}>
                                    <p className="text-game-cyan font-game font-bold text-lg">{valor}</p>
                                    <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{label}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Detalle por alumno */}
                {estadisticas?.detalleAlumnos?.length > 0 && (
                    <div className={`p-6 rounded-2xl border ${isDark ? 'bg-game-card border-game-border' : 'bg-white border-gray-200 shadow'}`}>
                        <h2 className={`font-game font-bold text-lg mb-4 ${isDark ? 'text-white' : 'text-gray-800'}`}>
                            👤 Detalle por alumno
                        </h2>
                        <div className="space-y-3">
                            {estadisticas.detalleAlumnos.map((a, i) => (
                                <div key={i} className={`p-4 rounded-xl ${isDark ? 'bg-game-dark' : 'bg-gray-50'}`}>
                                    <div className="flex items-center justify-between mb-2">
                                        <span className={`font-semibold ${isDark ? 'text-white' : 'text-gray-800'}`}>
                                            {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`} {a.nombre}
                                        </span>
                                        <span className="font-game font-bold text-game-cyan">{a.puntos} pts</span>
                                    </div>
                                    <div className="grid grid-cols-4 gap-2 text-xs">
                                        <div className="text-center">
                                            <p className="text-green-400 font-bold">{a.correctas}</p>
                                            <p className={isDark ? 'text-gray-500' : 'text-gray-400'}>Correctas</p>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-red-400 font-bold">{a.incorrectas}</p>
                                            <p className={isDark ? 'text-gray-500' : 'text-gray-400'}>Incorrectas</p>
                                        </div>
                                        <div className="text-center">
                                            <p className={`font-bold ${isDark ? 'text-white' : 'text-gray-700'}`}>
                                                {(a.tiempoPromedioMs / 1000).toFixed(1)}s
                                            </p>
                                            <p className={isDark ? 'text-gray-500' : 'text-gray-400'}>T. promedio</p>
                                        </div>
                                        <div className="text-center">
                                            <p className={`font-bold ${a.vecesAbandonoPestana > 0 ? 'text-yellow-400' : 'text-green-400'}`}>
                                                {a.vecesAbandonoPestana > 0 ? `⚠️ ${a.vecesAbandonoPestana}` : '✓ 0'}
                                            </p>
                                            <p className={isDark ? 'text-gray-500' : 'text-gray-400'}>Abandonos</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Alertas de pestaña */}
                {alertas.length > 0 && (
                    <div className={`p-6 rounded-2xl border ${isDark ? 'bg-game-card border-game-border' : 'bg-white border-gray-200 shadow'}`}>
                        <h2 className={`font-game font-bold text-lg mb-4 ${isDark ? 'text-white' : 'text-gray-800'}`}>
                            🚨 Alertas de pestaña ({alertas.filter(a => a.tipo === 'salida').length} salidas)
                        </h2>
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                            {alertas.slice().reverse().map(a => (
                                <div key={a.id} className={`flex items-center gap-3 p-2 rounded-lg text-sm
                                    ${a.tipo === 'salida'
                                    ? isDark ? 'bg-red-500/10 text-red-400' : 'bg-red-50 text-red-600'
                                    : isDark ? 'bg-green-500/10 text-green-400' : 'bg-green-50 text-green-600'
                                }`}>
                                    <span>{a.tipo === 'salida' ? '🚨' : '✅'}</span>
                                    <span className="flex-1">{a.email}</span>
                                    {a.pregunta && <span className="text-xs opacity-60">P{a.pregunta}</span>}
                                    <span className="font-mono text-xs opacity-60">{a.hora}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                    <button onClick={generarPDF}
                            className={`py-3 rounded-xl font-game font-bold tracking-wider uppercase border-2 transition-all
                                        ${isDark ? 'border-game-cyan text-game-cyan hover:bg-game-cyan/10' : 'border-cyan-500 text-cyan-600 hover:bg-cyan-50'}`}>
                        📥 DESCARGAR REPORTE
                    </button>
                    <button onClick={() => navigate('/lobby')}
                            className="py-3 rounded-xl font-game font-bold tracking-wider uppercase
                                       bg-gradient-to-r from-game-purple to-game-cyan text-white hover:opacity-90">
                        VOLVER AL LOBBY
                    </button>
                </div>
            </div>
        </div>
    )

    // ── FASE JUGANDO ──────────────────────────────────────
    return (
        <div className={`min-h-screen p-6 ${isDark ? 'bg-game-darker' : 'bg-gray-100'}`}>
            <div className="max-w-3xl mx-auto space-y-5">

                {/* Header */}
                <div className={`p-5 rounded-2xl border flex items-center justify-between
                                ${isDark ? 'bg-game-card border-game-border' : 'bg-white border-gray-200 shadow'}`}>
                    <div>
                        <h1 className={`font-game text-xl font-black ${isDark ? 'text-white' : 'text-gray-800'}`}>
                            🎓 PANEL HOST — MODO PRUEBA
                        </h1>
                        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                            Sala: <span className="font-mono font-bold">{codigo}</span>
                            {sala && ` · ${sala.nombre}`}
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${connectionStatus === 'connected' ? 'bg-green-400' : 'bg-yellow-400 animate-pulse'}`} />
                        <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                            {connectionStatus === 'connected' ? 'En vivo' : 'Reconectando...'}
                        </span>
                    </div>
                </div>

                {/* Cuenta regresiva */}
                {cuentaRegresiva && (
                    <div className={`p-6 rounded-2xl border text-center ${isDark ? 'bg-game-card border-game-border' : 'bg-white border-gray-200 shadow'}`}>
                        <p className={`font-game text-sm mb-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>INICIANDO EN</p>
                        <p className="font-game text-7xl font-black text-transparent bg-clip-text bg-gradient-to-br from-game-purple to-game-cyan animate-pulse">
                            {cuentaRegresiva}
                        </p>
                    </div>
                )}

                {/* Pregunta actual + progreso */}
                {preguntaActual && (
                    <div className={`p-5 rounded-2xl border ${isDark ? 'bg-game-card border-game-border' : 'bg-white border-gray-200 shadow'}`}>
                        <div className="flex items-center justify-between mb-3">
                            <span className={`font-game text-sm font-bold ${isDark ? 'text-game-purple-light' : 'text-purple-600'}`}>
                                Pregunta {preguntaActual.numero}/{preguntaActual.totalPreguntas}
                            </span>
                            <span className={`text-xs px-2 py-1 rounded-full ${isDark ? 'bg-game-purple/20 text-game-purple-light' : 'bg-purple-100 text-purple-600'}`}>
                                {preguntaActual.tema}
                            </span>
                        </div>
                        <p className={`font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-800'}`}>
                            {preguntaActual.enunciado}
                        </p>

                        {/* Barra de progreso de respuestas */}
                        <div className="mb-2">
                            <div className="flex justify-between text-xs mb-1">
                                <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>
                                    Han respondido: {progreso.respondieron}{progreso.total > 0 ? `/${progreso.total}` : ''}
                                </span>
                                <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>
                                    {progreso.total > 0 ? Math.round((progreso.respondieron / progreso.total) * 100) : 0}%
                                </span>
                            </div>
                            <div className={`w-full h-2 rounded-full ${isDark ? 'bg-game-dark' : 'bg-gray-200'}`}>
                                <div className="h-full rounded-full bg-gradient-to-r from-game-purple to-game-cyan transition-all duration-500"
                                     style={{ width: `${progreso.total > 0 ? (progreso.respondieron / progreso.total) * 100 : 0}%` }} />
                            </div>
                        </div>

                        {/* Chips de quién respondió */}
                        {progreso.nombres.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-3">
                                {progreso.nombres.map((nombre, i) => (
                                    <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 border border-green-500/30">
                                        ✓ {nombre}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Ranking en vivo */}
                {ranking.length > 0 && (
                    <div className={`p-5 rounded-2xl border ${isDark ? 'bg-game-card border-game-border' : 'bg-white border-gray-200 shadow'}`}>
                        <h2 className={`font-game font-bold mb-3 ${isDark ? 'text-white' : 'text-gray-800'}`}>
                            📊 Ranking en vivo
                        </h2>
                        <div className="space-y-2">
                            {ranking.map((r, i) => (
                                <div key={i} className={`flex items-center gap-3 p-3 rounded-xl ${isDark ? 'bg-game-dark' : 'bg-gray-50'}`}>
                                    <span className="font-game font-black text-lg w-8 text-center">
                                        {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}`}
                                    </span>
                                    <span className={`flex-1 font-semibold text-sm ${isDark ? 'text-white' : 'text-gray-800'}`}>
                                        {r.username}
                                    </span>
                                    <span className="font-game font-bold text-game-cyan text-sm">{r.puntos} pts</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Alertas en vivo */}
                {jugadoresFuera.size > 0 && (
                    <div className="p-4 rounded-2xl border border-red-500/40 bg-red-500/10">
                        <p className="font-game font-bold text-red-400 text-sm mb-2">
                            ⚠️ FUERA DE PESTAÑA AHORA ({jugadoresFuera.size})
                        </p>
                        <div className="flex flex-wrap gap-2">
                            {[...jugadoresFuera].map(email => (
                                <span key={email} className="px-3 py-1 rounded-full text-xs font-semibold bg-red-500/20 text-red-400 border border-red-500/30">
                                    {email}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {fase === 'esperando' && (
                    <div className={`p-6 rounded-2xl border text-center ${isDark ? 'bg-game-card border-game-border' : 'bg-white border-gray-200 shadow'}`}>
                        <div className="text-4xl mb-3 animate-pulse">⏳</div>
                        <p className={`font-game font-bold ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                            Esperando que inicie la partida...
                        </p>
                    </div>
                )}
            </div>
        </div>
    )
}