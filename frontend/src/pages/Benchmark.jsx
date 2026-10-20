import { useState, useEffect } from 'react'
import { useTheme } from '../context/ThemeContext'
import { benchmarkAPI } from '../api/benchmarkAPI'

const TEMAS = [
    'WebSockets y comunicación en tiempo real',
    'JWT y autenticación OAuth 2.0',
    'Colas de mensajes y patrón productor-consumidor',
    'Principios SOLID aplicados a sistemas distribuidos',
]

const MODELOS = [
    { label: 'Google Gemma 3 4B',         value: 'gemma3:4b' },
    { label: 'Meta Llama 3.2 3B',          value: 'llama3.2:3b' },
    { label: 'Alibaba Qwen 3 4B',          value: 'qwen3:4b' },
    { label: 'Mistral AI Ministral 3 3B',  value: 'mistral:3b' },
    { label: 'IBM Granite 3.1 MoE 3B',    value: 'granite3.1-moe:3b' },
    { label: 'NVIDIA Nemotron Mini 4B',    value: 'nemotron-mini:4b' },
    { label: 'Microsoft Phi-4 Mini 3.8B',  value: 'phi4-mini:3.8b' },
    { label: 'Alibaba Qwen 2.5 1.5B',      value: 'qwen2.5:1.5b' },
]

const fmt = (v, u='') => v != null ? `${typeof v==='number' ? v.toFixed(1):v}${u}` : '—'

export default function Benchmark() {
    const { isDark } = useTheme()
    const [tab, setTab]         = useState('ejecutar')
    const [modelo, setModelo]   = useState('')
    const [tema, setTema]       = useState('')
    const [cantidad, setCantidad] = useState(5)
    const [repeticion, setRepeticion] = useState(1)
    const [loading, setLoading] = useState(false)
    const [error, setError]     = useState('')
    const [ultimo, setUltimo]   = useState(null)
    const [resultados, setResultados]   = useState([])
    const [comparativa, setComparativa] = useState({})
    const [stats, setStats]     = useState(null)
    const [filtroM, setFiltroM] = useState('')
    const [filtroT, setFiltroT] = useState('')

    useEffect(() => { cargar() }, [])

    const cargar = async () => {
        try {
            const [r, c, s] = await Promise.all([
                benchmarkAPI.resultados(),
                benchmarkAPI.comparativa(),
                benchmarkAPI.estadisticas(),
            ])
            setResultados(Array.isArray(r) ? r : [])
            setComparativa(c || {})
            setStats(s)
        } catch {}
    }

    const ejecutar = async () => {
        if (!modelo) return setError('Selecciona un modelo')
        if (!tema)   return setError('Selecciona un tema')
        setLoading(true); setError(''); setUltimo(null)
        try {
            const data = await benchmarkAPI.ejecutar(modelo, tema, cantidad, repeticion)
            setUltimo(data)
            await cargar()
            setTab('resultados')
        } catch(e) { setError(e?.error || 'Error ejecutando') }
        finally { setLoading(false) }
    }

    const evaluar = async (id, vals) => {
        try { await benchmarkAPI.evaluar(id, vals); await cargar() } catch {}
    }

    const exportar = () => {
        const a = document.createElement('a')
        a.href = URL.createObjectURL(new Blob([JSON.stringify(resultados,null,2)],{type:'application/json'}))
        a.download = `benchmark_${Date.now()}.json`; a.click()
    }

    const filtrados = resultados.filter(r =>
        (!filtroM || r.modelo?.includes(filtroM)) &&
        (!filtroT || r.tema?.includes(filtroT))
    )

    const c  = (x='') => `p-4 rounded-xl border ${isDark?'bg-game-card border-game-border':'bg-white border-gray-200 shadow'} ${x}`
    const tx = (x='') => `${isDark?'text-white':'text-gray-800'} ${x}`
    const tx2 = `text-xs ${isDark?'text-gray-400':'text-gray-500'}`
    const inp = `w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-game-purple ${isDark?'bg-game-dark border-game-border text-white':'bg-gray-50 border-gray-200 text-gray-800'}`
    const TABS = [{id:'ejecutar',l:'▶ Ejecutar'},{id:'resultados',l:'📋 Resultados'},{id:'comparativa',l:'📈 Comparativa'},{id:'evaluar',l:'✏️ Evaluar'}]

    return (
        <div className={`flex-1 ${isDark?'bg-game-darker':'bg-gray-100'} p-6`}>
            <div className="max-w-7xl mx-auto space-y-5">

                {/* Header + stats */}
                <div className="flex items-start justify-between flex-wrap gap-3">
                    <div>
                        <h1 className={`font-game text-2xl font-black ${tx()}`}>📊 BENCHMARK IA LOCAL</h1>
                        <p className={tx2}>Ejecución individual por modelo y tema</p>
                    </div>
                    {stats && (
                        <div className="flex gap-2 flex-wrap">
                            {[{l:'Total',v:stats.totalPreguntas},{l:'Evaluadas',v:stats.preguntasEvaluadas},{l:'Pendientes',v:stats.pendientes}].map(s=>(
                                <div key={s.l} className={`${c()} text-center px-5 py-2`}>
                                    <p className={tx2}>{s.l}</p>
                                    <p className="font-game font-bold text-game-cyan text-xl">{s.v}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Tabs */}
                <div className="flex gap-2 flex-wrap">
                    {TABS.map(t=>(
                        <button key={t.id} onClick={()=>setTab(t.id)}
                                className={`px-4 py-2 rounded-xl text-sm font-semibold border-2 transition-all
                            ${tab===t.id?'border-game-purple bg-game-purple/10 text-game-purple-light'
                                    :isDark?'border-game-border text-gray-400':'border-gray-200 text-gray-500'}`}>
                            {t.l}
                        </button>
                    ))}
                </div>

                {/* TAB EJECUTAR */}
                {tab==='ejecutar' && (
                    <div className={c()}>
                        <h2 className={`font-game font-bold mb-4 ${tx()}`}>Ejecutar modelo individual</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">

                            <div>
                                <label className="block text-xs font-semibold mb-1 text-game-purple-light">Modelo</label>
                                <select value={modelo} onChange={e=>setModelo(e.target.value)} className={inp}>
                                    <option value="">— Seleccionar modelo —</option>
                                    {MODELOS.map(m=><option key={m.value} value={m.value}>{m.label}</option>)}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold mb-1 text-game-purple-light">Tema</label>
                                <select value={tema} onChange={e=>setTema(e.target.value)} className={inp}>
                                    <option value="">— Seleccionar tema —</option>
                                    {TEMAS.map(t=><option key={t} value={t}>{t}</option>)}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold mb-1 text-game-purple-light">Cantidad de preguntas</label>
                                <input type="number" min="1" max="10" value={cantidad}
                                       onChange={e=>setCantidad(Number(e.target.value))} className={inp} />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold mb-1 text-game-purple-light">Repetición #</label>
                                <input type="number" min="1" max="10" value={repeticion}
                                       onChange={e=>setRepeticion(Number(e.target.value))} className={inp} />
                            </div>
                        </div>

                        {error && <p className="text-red-400 text-sm mt-3">{error}</p>}

                        <button onClick={ejecutar} disabled={loading}
                                className="mt-4 px-8 py-3 rounded-xl font-game font-bold bg-game-purple text-white hover:bg-game-purple/80 disabled:opacity-50 transition-all">
                            {loading ? '⏳ Generando preguntas...' : '▶ EJECUTAR'}
                        </button>

                        {/* Resultado inmediato */}
                        {ultimo && (
                            <div className={`mt-5 p-4 rounded-xl border ${isDark?'border-game-cyan/30 bg-game-cyan/5':'border-green-200 bg-green-50'}`}>
                                <p className="font-game font-bold text-game-cyan mb-3">✓ Ejecutado: {ultimo.modelo}</p>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
                                    {[
                                        {l:'Latencia',     v:fmt(ultimo.latencyMs,'ms')},
                                        {l:'Ollama Total', v:fmt(ultimo.ollamaTotalMs,'ms')},
                                        {l:'Load',         v:fmt(ultimo.loadMs,'ms')},
                                        {l:'Generation',   v:fmt(ultimo.generationMs,'ms')},
                                        {l:'Prompt Eval',  v:fmt(ultimo.promptEvaluationMs,'ms')},
                                        {l:'Tokens In',    v:fmt(ultimo.inputTokens)},
                                        {l:'Tokens Out',   v:fmt(ultimo.outputTokens)},
                                        {l:'Tok/s',        v:fmt(ultimo.tokensPerSecond)},
                                        {l:'RAM',          v:fmt(ultimo.memoryUsageMb,'MB')},
                                    ].map(m=>(
                                        <div key={m.l} className={`p-2 rounded-lg ${isDark?'bg-game-dark':'bg-white'}`}>
                                            <p className={tx2}>{m.l}</p>
                                            <p className="font-bold text-game-cyan text-sm">{m.v}</p>
                                        </div>
                                    ))}
                                </div>
                                {ultimo.enunciado && (
                                    <div className="mt-3">
                                        <p className={`text-xs font-semibold mb-1 ${tx()}`}>Primera pregunta generada:</p>
                                        <p className={`text-sm ${tx()}`}>{ultimo.enunciado}</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* TAB RESULTADOS */}
                {tab==='resultados' && (
                    <div className="space-y-3">
                        <div className={`${c()} flex gap-3 flex-wrap items-center`}>
                            <input placeholder="Filtrar modelo..." value={filtroM}
                                   onChange={e=>setFiltroM(e.target.value)} className={`${inp} max-w-xs`} />
                            <select value={filtroT} onChange={e=>setFiltroT(e.target.value)} className={`${inp} max-w-xs`}>
                                <option value="">Todos los temas</option>
                                {TEMAS.map(t=><option key={t} value={t}>{t}</option>)}
                            </select>
                            <button onClick={exportar}
                                    className="px-4 py-2 rounded-xl text-sm font-semibold bg-game-cyan/20 text-game-cyan border border-game-cyan/30 hover:bg-game-cyan/30">
                                ⬇ Exportar JSON
                            </button>
                            <span className={tx2}>{filtrados.length} registros</span>
                        </div>

                        {filtrados.length === 0
                            ? <div className={`${c()} text-center py-10 ${tx2}`}>Sin resultados. Ejecuta un benchmark primero.</div>
                            : (
                                <div className={`${c()} overflow-x-auto`}>
                                    <table className="w-full text-xs">
                                        <thead>
                                        <tr className={`${tx2} border-b ${isDark?'border-game-border':'border-gray-200'}`}>
                                            {['Modelo','Tema','Latencia','OllamaMs','LoadMs','GenMs','Tok In','Tok Out','Tok/s','RAM','Score'].map(h=>(
                                                <th key={h} className="text-left py-2 px-2 whitespace-nowrap">{h}</th>
                                            ))}
                                        </tr>
                                        </thead>
                                        <tbody>
                                        {filtrados.map(r=>(
                                            <tr key={r.id} className={`border-b ${isDark?'border-game-border/30':'border-gray-100'} hover:bg-game-purple/5`}>
                                                <td className="py-2 px-2 font-semibold text-game-purple-light whitespace-nowrap">{r.modelo}</td>
                                                <td className="py-2 px-2 max-w-[120px] truncate" title={r.tema}>{r.tema?.split(' ').slice(0,2).join(' ')}…</td>
                                                <td className="py-2 px-2 text-game-cyan font-bold">{fmt(r.latencyMs,'ms')}</td>
                                                <td className="py-2 px-2">{fmt(r.ollamaTotalMs,'ms')}</td>
                                                <td className="py-2 px-2">{fmt(r.loadMs,'ms')}</td>
                                                <td className="py-2 px-2">{fmt(r.generationMs,'ms')}</td>
                                                <td className="py-2 px-2">{fmt(r.inputTokens)}</td>
                                                <td className="py-2 px-2">{fmt(r.outputTokens)}</td>
                                                <td className="py-2 px-2 text-green-400 font-bold">{fmt(r.tokensPerSecond)}</td>
                                                <td className="py-2 px-2">{fmt(r.memoryUsageMb,'MB')}</td>
                                                <td className="py-2 px-2">
                                                    <span className={`px-2 py-0.5 rounded-full font-bold text-xs ${r.scoreTotal?'bg-game-cyan/20 text-game-cyan':'bg-gray-500/20 text-gray-400'}`}>
                                                        {r.scoreTotal ?? '—'}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                    </div>
                )}

                {/* TAB COMPARATIVA */}
                {tab==='comparativa' && (
                    <div className={c()}>
                        <h2 className={`font-game font-bold mb-4 ${tx()}`}>Comparativa entre modelos</h2>
                        {Object.keys(comparativa).length === 0
                            ? <p className={`text-center py-8 ${tx2}`}>Sin datos aún.</p>
                            : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-xs">
                                        <thead>
                                        <tr className={`${tx2} border-b ${isDark?'border-game-border':'border-gray-200'}`}>
                                            <th className="text-left py-2 px-2">Métrica</th>
                                            {Object.keys(comparativa).map(m=>(
                                                <th key={m} className="text-center py-2 px-2 text-game-purple-light whitespace-nowrap">{m}</th>
                                            ))}
                                        </tr>
                                        </thead>
                                        <tbody>
                                        {[
                                            {l:'Latencia prom. (ms)', k:'latenciaPromedio'},
                                            {l:'Velocidad (tok/s)',   k:'velocidadPromedia'},
                                            {l:'RAM prom. (MB)',      k:'memoriaPromedia'},
                                            {l:'Puntuación calidad',  k:'puntuacionPromedia'},
                                            {l:'Total preguntas',     k:'totalPreguntas'},
                                            {l:'Evaluadas',           k:'evaluadas'},
                                        ].map(m=>(
                                            <tr key={m.k} className={`border-b ${isDark?'border-game-border/30':'border-gray-100'}`}>
                                                <td className={`py-2 px-2 ${tx()}`}>{m.l}</td>
                                                {Object.values(comparativa).map((v,i)=>(
                                                    <td key={i} className="text-center py-2 px-2 font-bold text-game-cyan">{fmt(v[m.k])}</td>
                                                ))}
                                            </tr>
                                        ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                    </div>
                )}

                {/* TAB EVALUAR */}
                {tab==='evaluar' && (
                    <div className="space-y-4">
                        {resultados.filter(r=>!r.scoreTotal).length === 0
                            ? <div className={`${c()} text-center py-10 ${tx2}`}>✓ Todas evaluadas.</div>
                            : resultados.filter(r=>!r.scoreTotal).map(r=>(
                                <div key={r.id} className={c()}>
                                    <div className="flex justify-between items-start mb-3 flex-wrap gap-2">
                                        <div>
                                            <p className="font-semibold text-game-purple-light">{r.modelo}</p>
                                            <p className={`${tx2}`}>{r.tema}</p>
                                        </div>
                                        <div className="flex gap-3 text-xs">
                                            <span className="text-game-cyan">{fmt(r.latencyMs,'ms')}</span>
                                            <span className="text-green-400">{fmt(r.tokensPerSecond,'tok/s')}</span>
                                            <span className={tx2}>{fmt(r.memoryUsageMb,'MB RAM')}</span>
                                        </div>
                                    </div>
                                    {r.enunciado && <p className={`text-sm mb-3 ${tx()}`}>{r.enunciado}</p>}
                                    <EvaluacionForm id={r.id} isDark={isDark} onGuardar={evaluar} />
                                </div>
                            ))
                        }
                    </div>
                )}
            </div>
        </div>
    )
}

function EvaluacionForm({ id, isDark, onGuardar }) {
    const [v, setV] = useState({scoreCorrecccion:'',scoreDistractores:'',scoreClaridad:'',scoreAlineacion:'',evaluadorNotas:''})
    const [ok, setOk] = useState(false)
    const inp = `w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-game-purple ${isDark?'bg-game-dark border-game-border text-white':'bg-white border-gray-200 text-gray-800'}`

    const guardar = async () => {
        await onGuardar(id, {
            scoreCorrecccion:  Number(v.scoreCorrecccion),
            scoreDistractores: Number(v.scoreDistractores),
            scoreClaridad:     Number(v.scoreClaridad),
            scoreAlineacion:   Number(v.scoreAlineacion),
            evaluadorNotas:    v.evaluadorNotas,
        })
        setOk(true); setTimeout(()=>setOk(false),2000)
    }

    return (
        <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
                {[{k:'scoreCorrecccion',l:'Corrección (1-5)'},{k:'scoreDistractores',l:'Distractores (1-5)'},{k:'scoreClaridad',l:'Claridad (1-5)'},{k:'scoreAlineacion',l:'Alineación (1-5)'}].map(f=>(
                    <div key={f.k}>
                        <label className={`block text-xs mb-1 ${isDark?'text-gray-400':'text-gray-500'}`}>{f.l}</label>
                        <input type="number" min="1" max="5" value={v[f.k]}
                               onChange={e=>setV({...v,[f.k]:e.target.value})} className={inp} />
                    </div>
                ))}
            </div>
            <textarea rows={2} placeholder="Notas..." value={v.evaluadorNotas}
                      onChange={e=>setV({...v,evaluadorNotas:e.target.value})} className={`${inp} resize-none`} />
            <button onClick={guardar}
                    className={`w-full py-2 rounded-xl text-sm font-semibold border transition-all
                ${ok?'bg-green-500/20 text-green-400 border-green-500/30':'bg-game-purple/20 text-game-purple-light border-game-purple/30 hover:bg-game-purple/30'}`}>
                {ok?'✓ Guardado':'Guardar evaluación'}
            </button>
        </div>
    )
}