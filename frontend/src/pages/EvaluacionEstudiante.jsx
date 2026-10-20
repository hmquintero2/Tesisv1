import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTheme } from '../context/ThemeContext'
import { evaluacionAPI } from '../api/evaluacionAPI'

const PERCEPCION = [
    { key: 'claridad',             label: 'Claridad', pregunta: '¿El contenido se entendió con facilidad?' },
    { key: 'comprension',          label: 'Comprensión', pregunta: '¿Lograste comprender el tema?' },
    { key: 'dificultadPercibida',  label: 'Dificultad percibida', pregunta: '¿Qué tan difíciles fueron las preguntas? (1=fácil, 5=difícil)' },
    { key: 'experienciaUso',       label: 'Experiencia de uso', pregunta: '¿Qué tan agradable fue usar el software?' },
]

const SUS_ITEMS = [
    'Me gustaría usar este sistema frecuentemente',
    'Encontré el sistema innecesariamente complejo',
    'Pensé que el sistema era fácil de usar',
    'Necesitaría ayuda de soporte técnico para usarlo',
    'Las funciones estaban bien integradas',
    'Había demasiada inconsistencia en el sistema',
    'La mayoría aprendería a usarlo rápidamente',
    'Encontré el sistema incómodo de usar',
    'Me sentí muy confiado usando el sistema',
    'Necesité aprender muchas cosas antes de poder usarlo',
]

export default function EvaluacionEstudiante() {
    const { codigoAnonimo } = useParams()
    const navigate = useNavigate()
    const { isDark } = useTheme()
    const [percepcion, setPercepcion] = useState({})
    const [sus, setSus]               = useState({})
    const [enviando, setEnviando]     = useState(false)
    const [mensaje, setMensaje]       = useState('')

    const enviar = async () => {
        const faltanP = PERCEPCION.filter(p => !percepcion[p.key])
        const faltanS = SUS_ITEMS.filter((_, i) => !sus[`item${i+1}`])
        if (faltanP.length || faltanS.length)
            return setMensaje('Completa todas las preguntas antes de enviar')

        setEnviando(true); setMensaje('')
        try {
            await evaluacionAPI.evaluarEstudiante({ codigoAnonimo, ...percepcion })
            await evaluacionAPI.evaluarSUS({ codigoAnonimo, ...sus })
            setMensaje('✓ ¡Gracias! Tu evaluación fue registrada.')
            setTimeout(() => navigate('/lobby'), 2000)
        } catch (e) {
            setMensaje(e.error || 'Error al enviar')
        } finally { setEnviando(false) }
    }

    const c  = (x='') => `p-4 rounded-xl border ${isDark?'bg-game-card border-game-border':'bg-white border-gray-200 shadow'} ${x}`
    const tx = (x='') => `${isDark?'text-white':'text-gray-800'} ${x}`
    const tx2 = `text-xs ${isDark?'text-gray-400':'text-gray-500'}`

    const Escala = ({ valor, onChange }) => (
        <div className="flex gap-2 mt-1">
            {[1,2,3,4,5].map(n => (
                <button key={n} onClick={() => onChange(n)}
                        className={`w-10 h-10 rounded-lg font-bold text-sm border-2 transition-all
                        ${valor===n ? 'border-game-cyan bg-game-cyan text-white'
                            : isDark?'border-game-border text-gray-400':'border-gray-200 text-gray-500'}`}>
                    {n}
                </button>
            ))}
        </div>
    )

    return (
        <div className={`flex-1 ${isDark?'bg-game-darker':'bg-gray-100'} p-6`}>
            <div className="max-w-3xl mx-auto space-y-5">
                <div>
                    <h1 className={`font-game text-2xl font-black ${tx()}`}>📝 TU OPINIÓN — {codigoAnonimo}</h1>
                    <p className={tx2}>Escala: 1 (totalmente en desacuerdo) a 5 (totalmente de acuerdo)</p>
                </div>

                <div className={c()}>
                    <h2 className={`font-game font-bold mb-4 ${tx()}`}>Percepción del contenido</h2>
                    <div className="space-y-4">
                        {PERCEPCION.map(p => (
                            <div key={p.key}>
                                <p className={tx('text-sm font-semibold')}>{p.label}</p>
                                <p className={tx2}>{p.pregunta}</p>
                                <Escala valor={percepcion[p.key]} onChange={v => setPercepcion({...percepcion, [p.key]: v})} />
                            </div>
                        ))}
                    </div>
                </div>

                <div className={c()}>
                    <h2 className={`font-game font-bold mb-4 ${tx()}`}>Usabilidad del software (SUS)</h2>
                    <div className="space-y-4">
                        {SUS_ITEMS.map((texto, i) => (
                            <div key={i}>
                                <p className={tx('text-sm font-semibold')}>{i+1}. {texto}</p>
                                <Escala valor={sus[`item${i+1}`]} onChange={v => setSus({...sus, [`item${i+1}`]: v})} />
                            </div>
                        ))}
                    </div>
                </div>

                {mensaje && <p className={`text-sm ${mensaje.startsWith('✓')?'text-green-400':'text-red-400'}`}>{mensaje}</p>}

                <button onClick={enviar} disabled={enviando}
                        className="w-full px-8 py-3 rounded-xl font-game font-bold bg-game-cyan text-white hover:bg-game-cyan/80 disabled:opacity-50">
                    {enviando ? 'Enviando...' : 'ENVIAR EVALUACIÓN'}
                </button>
            </div>
        </div>
    )
}