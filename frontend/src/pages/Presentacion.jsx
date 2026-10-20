import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { useWebSocket } from '../hooks/useWebSocket'
import api from '../api/axios'
import Temporizador from '../components/Temporizador'

export default function Presentacion() {
    const { codigo } = useParams()
    const { user } = useAuth()
    const { isDark } = useTheme()
    const navigate = useNavigate()

    const [sala, setSala] = useState(null)
    const [diapositiva, setDiapositiva] = useState(null)
    const [pregunta, setPregunta] = useState(null)
    const [seleccion, setSeleccion] = useState(null)
    const [mostrarResultado, setMostrarResultado] = useState(false)
    const [progreso, setProgreso] = useState({ respondieron: 0, total: 0 })
    const [reporte, setReporte] = useState(null)
    const [fase, setFase] = useState('esperando') // esperando | activa | fin
    const seleccionRef = useRef(null)
    const preguntaRef = useRef(null)

    useEffect(() => { seleccionRef.current = seleccion }, [seleccion])
    useEffect(() => { preguntaRef.current = pregunta }, [pregunta])

    useEffect(() => {
        api.get(`/salas/${codigo}`).then(({ data }) => setSala(data)).catch(() => {})
    }, [codigo])

    const onJuego = useCallback((msg) => {
        if (msg.tipo === 'PRES_DIAPOSITIVA') {
            setFase('activa')
            setDiapositiva({ titulo: msg.tituloDiapositiva, teoria: msg.teoriaDiapositiva })
            setPregunta(msg.pregunta)
            setSeleccion(null)
            setMostrarResultado(false)
            setProgreso({ respondieron: 0, total: 0 })

        } else if (msg.tipo === 'PRES_PROGRESO') {
            setProgreso({ respondieron: msg.totalRespondieron, total: msg.totalJugadores })

        } else if (msg.tipo === 'PRES_TIEMPO_AGOTADO') {
            setMostrarResultado(true)

        } else if (msg.tipo === 'PRES_FIN') {
            setFase('fin')
            setReporte(msg.reporte || [])
        }
    }, [])

    const { sendMessage } = useWebSocket(codigo, () => {}, () => {}, null, null, onJuego, () => {})

    const esAnfitrion = sala?.creadorEmail === user?.email

    const iniciar = () => {
        sendMessage(`/app/sala/${codigo}/iniciar-presentacion`, { remitente: user?.email })
    }

    const siguiente = () => {
        sendMessage(`/app/sala/${codigo}/siguiente-diapositiva`, { remitente: user?.email })
    }

    const responder = (opcion) => {
        if (seleccionRef.current || mostrarResultado || !preguntaRef.current) return
        setSeleccion(opcion)
        sendMessage(`/app/sala/${codigo}/responder-presentacion`, {
            remitente: user?.email,
            preguntaId: preguntaRef.current.id,
            respuestaSeleccionada: opcion,
        })
    }

    const colorOpcion = (opcion) => {
        const normal = isDark
            ? 'bg-game-dark border-game-border text-white hover:border-game-purple hover:bg-game-purple/10'
            : 'bg-white border-gray-200 text-gray-800 hover:border-purple-400'
        const gris = isDark
            ? 'bg-game-dark border-game-border text-gray-500'
            : 'bg-gray-50 border-gray-200 text-gray-400'

        if (!mostrarResultado) {
            if (seleccion === opcion) return 'bg-game-purple/20 border-game-purple text-game-purple-light'
            return normal
        }
        if (opcion === pregunta.respuestaCorrecta) return 'bg-green-500/20 border-green-500 text-green-400'
        if (opcion === seleccion) return 'bg-red-500/20 border-red-500 text-red-400'
        return gris
    }

    const c  = (x='') => `p-6 rounded-2xl border ${isDark?'bg-game-card border-game-border':'bg-white border-gray-200 shadow'} ${x}`
    const tx = (x='') => `${isDark?'text-white':'text-gray-800'} ${x}`
    const tx2 = `text-xs ${isDark?'text-gray-400':'text-gray-500'}`

    // ── Fase: esperando ──────────────────────────────────────
    if (fase === 'esperando') return (
        <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-game-darker' : 'bg-gray-100'}`}>
            <div className={`${c()} text-center max-w-md animate-fade-in`}>
                <div className="text-5xl mb-3">🖥️</div>
                <h1 className={tx('font-game text-xl font-bold mb-2')}>Presentación</h1>
                <p className={tx2}>
                    {esAnfitrion
                        ? 'Presiona iniciar cuando los estudiantes estén listos'
                        : 'Espera a que el anfitrión inicie la presentación'}
                </p>
                {esAnfitrion && (
                    <button onClick={iniciar}
                            className="mt-4 px-8 py-3 rounded-xl font-game font-bold bg-game-purple text-white hover:bg-game-purple/80 transition-all">
                        ▶ INICIAR PRESENTACIÓN
                    </button>
                )}
            </div>
        </div>
    )

    // ── Fase: fin ────────────────────────────────────────────
    if (fase === 'fin') return (
        <div className={`min-h-screen flex flex-col items-center justify-center p-6 ${isDark ? 'bg-game-darker' : 'bg-gray-100'}`}>
            <div className={`${c()} w-full max-w-lg animate-slide-up`}>
                <h1 className={tx('font-game text-2xl font-black text-center mb-4')}>📊 REPORTE FINAL</h1>
                <div className="space-y-2">
                    {reporte?.map((r, i) => (
                        <div key={i} className={`flex items-center justify-between p-3 rounded-xl ${isDark?'bg-game-dark':'bg-gray-50'}`}>
                            <span className={tx('text-sm font-semibold')}>{r.nombre}</span>
                            <span className="text-xs">
                                <span className="text-green-400 font-bold">✓ {r.correctas}</span>{' '}
                                <span className="text-red-400 font-bold">✗ {r.incorrectas}</span>
                            </span>
                        </div>
                    ))}
                </div>
                <button onClick={() => navigate('/lobby')}
                        className="mt-6 w-full py-3 rounded-xl font-game font-bold bg-gradient-to-r from-game-purple to-game-cyan text-white hover:opacity-90 transition-all">
                    VOLVER AL LOBBY
                </button>
            </div>
        </div>
    )

    // ── Fase: activa (diapositiva + pregunta) ───────────────
    if (fase === 'activa' && pregunta) return (
        <div className={`min-h-screen flex flex-col items-center justify-center p-6 ${isDark ? 'bg-game-darker' : 'bg-gray-100'}`}>
            <div key={pregunta.id} className="w-full max-w-2xl animate-slide-up">

                {diapositiva?.titulo && (
                    <div className={`${c()} mb-4`}>
                        <h3 className={tx('font-game text-lg font-bold mb-2')}>{diapositiva.titulo}</h3>
                        <p className={`text-sm leading-relaxed ${isDark?'text-gray-300':'text-gray-600'}`}>{diapositiva.teoria}</p>
                    </div>
                )}

                <div className={`${c()} mb-4`}>
                    <p className={tx('font-semibold text-center')}>{pregunta.enunciado}</p>
                </div>

                <div className="grid grid-cols-1 gap-3">
                    {pregunta.opciones?.map((op, i) => (
                        <button key={i} onClick={() => responder(op)}
                                disabled={!!seleccion || mostrarResultado}
                                style={{ animationDelay: `${i * 80}ms` }}
                                className={`w-full p-4 rounded-xl border-2 text-left font-semibold transition-all animate-fade-in ${colorOpcion(op)} disabled:cursor-not-allowed`}>
                            <span className="mr-3 font-game">{['A','B','C','D'][i]}.</span>{op}
                        </button>
                    ))}
                </div>

                {!mostrarResultado && (
                    <p className={`mt-3 text-center text-sm ${tx2}`}>
                        ⏳ {progreso.respondieron}/{progreso.total} respondieron
                    </p>
                )}

                {esAnfitrion && mostrarResultado && (
                    <button onClick={siguiente}
                            className="mt-4 w-full py-3 rounded-xl font-game font-bold bg-gradient-to-r from-game-purple to-game-cyan text-white hover:opacity-90 transition-all animate-fade-in">
                        SIGUIENTE ▶
                    </button>
                )}
            </div>
        </div>
    )

    return null
}