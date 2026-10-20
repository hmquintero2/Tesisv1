import { useState, useEffect } from 'react'
import { useTheme } from '../context/ThemeContext'
import { matrizAPI } from '../api/matrizAPI'

const NOMBRES = {
    CERRADO_API:  { label: '☁️ Cerrado (API)',        color: 'game-purple' },
    LOCAL_SIN_FT: { label: '💻 Local sin ajuste',      color: 'game-cyan' },
    LOCAL_CON_FT: { label: '🎯 Local con ajuste',      color: 'game-purple' },
}

const fmt = (v, dec=1) => v != null ? Number(v).toFixed(dec) : '—'

export default function MatrizComparativa() {
    const { isDark } = useTheme()
    const [matriz, setMatriz] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        matrizAPI.obtener().then(setMatriz).finally(() => setLoading(false))
    }, [])

    const c  = (x='') => `p-4 rounded-xl border ${isDark?'bg-game-card border-game-border':'bg-white border-gray-200 shadow'} ${x}`
    const tx = (x='') => `${isDark?'text-white':'text-gray-800'} ${x}`
    const tx2 = `text-xs ${isDark?'text-gray-400':'text-gray-500'}`

    if (loading) {
        return (
            <div className={`flex-1 ${isDark?'bg-game-darker':'bg-gray-100'} p-6 flex items-center justify-center`}>
                <p className={tx()}>Cargando matriz comparativa...</p>
            </div>
        )
    }

    const condiciones = Object.keys(matriz || {})

    return (
        <div className={`flex-1 ${isDark?'bg-game-darker':'bg-gray-100'} p-6`}>
            <div className="max-w-6xl mx-auto space-y-5">
                <div>
                    <h1 className={`font-game text-2xl font-black ${tx()}`}>📊 MATRIZ COMPARATIVA</h1>
                    <p className={tx2}>Resultados consolidados por condición experimental</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {condiciones.map(cond => {
                        const d = matriz[cond]
                        const info = NOMBRES[cond] || { label: cond }
                        return (
                            <div key={cond} className={c()}>
                                <h2 className={`font-game font-bold mb-3 ${tx()}`}>{info.label}</h2>

                                <div className="space-y-3">
                                    <div>
                                        <p className="text-xs font-semibold text-game-purple-light mb-1">⚙️ Técnicas</p>
                                        <div className="grid grid-cols-2 gap-1 text-xs">
                                            <div className={tx2}>Latencia</div><div className={tx()}>{fmt(d.tecnicas.latenciaPromedioMs)} ms</div>
                                            <div className={tx2}>Tokens/s</div><div className={tx()}>{fmt(d.tecnicas.tokensPorSegundoPromedio)}</div>
                                            <div className={tx2}>Ejecuciones</div><div className={tx()}>{d.tecnicas.totalEjecuciones}</div>
                                        </div>
                                    </div>

                                    <div>
                                        <p className="text-xs font-semibold text-game-purple-light mb-1">🧑‍🏫 Rúbrica experta (1-5)</p>
                                        <div className="grid grid-cols-2 gap-1 text-xs">
                                            <div className={tx2}>Exactitud</div><div className={tx()}>{fmt(d.rubricaExperta.exactitud)}</div>
                                            <div className={tx2}>Pertinencia</div><div className={tx()}>{fmt(d.rubricaExperta.pertinenciaCurricular)}</div>
                                            <div className={tx2}>Complejidad</div><div className={tx()}>{fmt(d.rubricaExperta.complejidad)}</div>
                                            <div className={tx2}>Distractores</div><div className={tx()}>{fmt(d.rubricaExperta.calidadDistractores)}</div>
                                            <div className={tx2}>Coherencia</div><div className={tx()}>{fmt(d.rubricaExperta.coherenciaPedagogica)}</div>
                                            <div className={tx2}>Cobertura</div><div className={tx()}>{fmt(d.rubricaExperta.coberturaTema)}</div>
                                            <div className={`${tx2} font-bold`}>Total</div><div className="text-game-cyan font-bold">{fmt(d.rubricaExperta.scoreTotal)}</div>
                                        </div>
                                    </div>

                                    <div>
                                        <p className="text-xs font-semibold text-game-purple-light mb-1">📝 Percepción estudiantil (1-5)</p>
                                        <div className="grid grid-cols-2 gap-1 text-xs">
                                            <div className={tx2}>Claridad</div><div className={tx()}>{fmt(d.percepcionEstudiantil.claridad)}</div>
                                            <div className={tx2}>Comprensión</div><div className={tx()}>{fmt(d.percepcionEstudiantil.comprension)}</div>
                                            <div className={tx2}>Dificultad</div><div className={tx()}>{fmt(d.percepcionEstudiantil.dificultadPercibida)}</div>
                                            <div className={tx2}>Exp. de uso</div><div className={tx()}>{fmt(d.percepcionEstudiantil.experienciaUso)}</div>
                                        </div>
                                    </div>

                                    <div>
                                        <p className="text-xs font-semibold text-game-purple-light mb-1">📱 Usabilidad (SUS)</p>
                                        <p className="text-game-cyan font-bold text-lg">{fmt(d.usabilidadSUS.puntajePromedio, 1)} / 100</p>
                                        <p className={tx2}>{d.usabilidadSUS.totalRespuestas} respuestas</p>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}