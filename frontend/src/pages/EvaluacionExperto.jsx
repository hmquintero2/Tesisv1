import { useState, useEffect } from 'react'
import { useTheme } from '../context/ThemeContext'
import { benchmarkAPI } from '../api/benchmarkAPI'
import { evaluacionAPI } from '../api/evaluacionAPI'

const DIMENSIONES = [
    { key: 'scoreCorrecccion',          label: 'Exactitud',               desc: 'El contenido es técnicamente correcto, sin errores.' },
    { key: 'scorePertinencia',          label: 'Pertinencia curricular',  desc: 'Corresponde al nivel y alcance de programación básica.' },
    { key: 'scoreComplejidad',          label: 'Complejidad/dificultad',  desc: 'El nivel es adecuado para 1er-2do nivel.' },
    { key: 'scoreDistractores',         label: 'Calidad de distractores', desc: 'Opciones incorrectas plausibles, no obvias.' },
    { key: 'scoreCoherenciaPedagogica', label: 'Coherencia pedagógica',   desc: 'La pregunta evalúa lo explicado en la teoría.' },
    { key: 'scoreCobertura',            label: 'Cobertura del tema',      desc: 'Cubre los aspectos relevantes del subtema.' },
]

export default function EvaluacionExperto() {
    const { isDark } = useTheme()
    const [pendientes, setPendientes] = useState([])
    const [actual, setActual]         = useState(null)
    const [scores, setScores]         = useState({})
    const [notas, setNotas]           = useState('')
    const [enviando, setEnviando]     = useState(false)
    const [mensaje, setMensaje]       = useState('')

    useEffect(() => { cargar() }, [])

    const cargar = async () => {
        try {
            const data = await benchmarkAPI.sinEvaluar()
            setPendientes(Array.isArray(data) ? data : [])
            if (data?.length) setActual(data[0])
        } catch {}
    }

    const enviar = async () => {
        if (!actual) return
        const faltan = DIMENSIONES.filter(d => !scores[d.key])
        if (faltan.length) return setMensaje(`Falta calificar: ${faltan.map(f=>f.label).join(', ')}`)

        setEnviando(true); setMensaje('')
        try {
            await evaluacionAPI.evaluarExperto(actual.id, { ...scores, evaluadorNotas: notas })
            setMensaje('✓ Evaluación guardada')
            setScores({}); setNotas('')
            const restantes = pendientes.filter(p => p.id !== actual.id)
            setPendientes(restantes)
            setActual(restantes[0] || null)
        } catch (e) {
            setMensaje(e.error || 'Error al guardar')
        } finally { setEnviando(false) }
    }

    const c  = (x='') => `p-4 rounded-xl border ${isDark?'bg-game-card border-game-border':'bg-white border-gray-200 shadow'} ${x}`
    const tx = (x='') => `${isDark?'text-white':'text-gray-800'} ${x}`
    const tx2 = `text-xs ${isDark?'text-gray-400':'text-gray-500'}`

    if (!actual) {
        return (
            <div className={`flex-1 ${isDark?'bg-game-darker':'bg-gray-100'} p-6 flex items-center justify-center`}>
                <div className={`${c()} text-center py-10 px-16`}>
                    <p className={tx('text-lg font-bold')}>🎉 No hay contenido pendiente de evaluar</p>
                </div>
            </div>
        )
    }

    return (
        <div className={`flex-1 ${isDark?'bg-game-darker':'bg-gray-100'} p-6`}>
            <div className="max-w-3xl mx-auto space-y-5">
                <div>
                    <h1 className={`font-game text-2xl font-black ${tx()}`}>🧑‍🏫 EVALUACIÓN DE EXPERTO</h1>
                    <p className={tx2}>{pendientes.length} bloques pendientes de evaluar</p>
                </div>

                <div className={c()}>
                    <p className={`text-xs font-semibold mb-2 text-game-purple-light`}>Contenido generado</p>
                    <p className={tx('text-sm mb-1')}><b>Tema:</b> {actual.tema}</p>
                    <p className={tx('text-sm')}><b>Enunciado:</b> {actual.enunciado}</p>
                </div>

                <div className={c()}>
                    <h2 className={`font-game font-bold mb-4 ${tx()}`}>Rúbrica de evaluación (1 a 5)</h2>
                    <div className="space-y-4">
                        {DIMENSIONES.map(d => (
                            <div key={d.key}>
                                <p className={tx('text-sm font-semibold')}>{d.label}</p>
                                <p className={tx2}>{d.desc}</p>
                                <div className="flex gap-2 mt-1">
                                    {[1,2,3,4,5].map(n => (
                                        <button key={n} onClick={() => setScores({...scores, [d.key]: n})}
                                                className={`w-10 h-10 rounded-lg font-bold text-sm border-2 transition-all
                                                ${scores[d.key]===n
                                                    ? 'border-game-purple bg-game-purple text-white'
                                                    : isDark?'border-game-border text-gray-400':'border-gray-200 text-gray-500'}`}>
                                            {n}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-4">
                        <label className={tx('text-sm font-semibold block mb-1')}>Notas (opcional)</label>
                        <textarea value={notas} onChange={e=>setNotas(e.target.value)} rows={3}
                                  className={`w-full px-3 py-2 rounded-lg border text-sm ${isDark?'bg-game-dark border-game-border text-white':'bg-gray-50 border-gray-200'}`} />
                    </div>

                    {mensaje && <p className={`text-sm mt-3 ${mensaje.startsWith('✓')?'text-green-400':'text-red-400'}`}>{mensaje}</p>}

                    <button onClick={enviar} disabled={enviando}
                            className="mt-4 px-8 py-3 rounded-xl font-game font-bold bg-game-purple text-white hover:bg-game-purple/80 disabled:opacity-50">
                        {enviando ? 'Guardando...' : 'GUARDAR Y SIGUIENTE →'}
                    </button>
                </div>
            </div>
        </div>
    )
}