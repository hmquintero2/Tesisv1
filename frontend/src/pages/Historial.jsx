import { useState, useEffect, useCallback } from 'react'
import { useTheme } from '../context/ThemeContext'
import api from '../api/axios'

const PAGE_SIZE = 10

export default function Historial() {
    const { isDark } = useTheme()

    const [filtros, setFiltros] = useState({
        desde: '', hasta: '', usuario: '', actividad: ''
    })
    const [filtrosAplicados, setFiltrosAplicados] = useState({ ...filtros })
    const [pagina, setPagina]       = useState(0)
    const [datos,  setDatos]        = useState(null)
    const [cargando, setCargando]   = useState(false)
    const [error, setError]         = useState('')
    const [descargando, setDescargando] = useState(null)

    const cargar = useCallback(async (p = 0, f = filtrosAplicados) => {
        setCargando(true)
        setError('')
        try {
            const params = { pagina: p, tamano: PAGE_SIZE }
            if (f.desde)     params.desde     = f.desde + ':00'
            if (f.hasta)     params.hasta     = f.hasta + ':00'
            if (f.usuario)   params.usuario   = f.usuario.trim()
            if (f.actividad) params.actividad = f.actividad.trim()
            const { data } = await api.get('/historial', { params })
            setDatos(data)
            setPagina(p)
        } catch {
            setError('No se pudo cargar el historial.')
        } finally {
            setCargando(false)
        }
    }, [filtrosAplicados])

    useEffect(() => { cargar(0) }, [filtrosAplicados])

    const descargarReporte = async (codigoSala) => {
        setDescargando(codigoSala)
        try {
            const res = await api.get(
                `/historial/${codigoSala}/reporte`,
                { responseType: 'blob' })
            const url = URL.createObjectURL(
                new Blob([res.data], { type: 'text/plain' }))
            const a = document.createElement('a')
            a.href = url
            a.download = `reporte-${codigoSala}.txt`
            a.click()
            URL.revokeObjectURL(url)
        } catch {
            alert('El reporte no está disponible para esta sala.')
        } finally {
            setDescargando(null)
        }
    }

    const formatFecha = (iso) => iso
        ? new Date(iso).toLocaleString('es-EC', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        })
        : '—'

    const inp = `w-full px-3 py-2 rounded-xl border text-sm
        focus:outline-none focus:ring-2 focus:ring-game-purple
        ${isDark
        ? 'bg-game-dark border-game-border text-white placeholder-gray-600'
        : 'bg-gray-50 border-gray-200 text-gray-800'}`

    return (
        <div className={`flex-1 ${isDark
            ? 'bg-game-darker' : 'bg-gray-100'} p-6`}>
            <div className="max-w-5xl mx-auto space-y-6">

                {/* Título */}
                <div>
                    <h1 className={`font-game text-3xl font-black
                        ${isDark ? 'text-white' : 'text-gray-800'}`}>
                        📋 HISTORIAL DE SESIONES
                    </h1>
                    <p className={`text-sm mt-1
                        ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        Consulta y descarga reportes de partidas finalizadas.
                    </p>
                </div>

                {/* Filtros */}
                <div className={`p-5 rounded-2xl border
                    ${isDark
                    ? 'bg-game-card border-game-border'
                    : 'bg-white border-gray-200 shadow'}`}>
                    <p className={`font-game font-bold text-sm uppercase
                        tracking-widest mb-4
                        ${isDark ? 'text-game-purple-light' : 'text-purple-600'}`}>
                        🔍 Filtros
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2
                                    lg:grid-cols-4 gap-4">
                        {[
                            { key: 'desde',     label: 'Desde',
                                type: 'datetime-local', ph: '' },
                            { key: 'hasta',     label: 'Hasta',
                                type: 'datetime-local', ph: '' },
                            { key: 'usuario',   label: 'Usuario (email)',
                                type: 'text', ph: 'alumno@ejemplo.com' },
                            { key: 'actividad', label: 'Actividad (nombre)',
                                type: 'text', ph: 'Ej: Examen parcial' },
                        ].map(({ key, label, type, ph }) => (
                            <div key={key}>
                                <label className={`block text-xs
                                    font-semibold mb-1
                                    ${isDark ? 'text-gray-400'
                                    : 'text-gray-500'}`}>
                                    {label}
                                </label>
                                <input
                                    type={type}
                                    placeholder={ph}
                                    value={filtros[key]}
                                    onChange={e => setFiltros(
                                        f => ({ ...f, [key]: e.target.value }))}
                                    className={inp}
                                />
                            </div>
                        ))}
                    </div>
                    <div className="flex gap-3 mt-4">
                        <button
                            onClick={() => setFiltrosAplicados({ ...filtros })}
                            className="px-5 py-2 rounded-xl font-game
                                font-bold text-sm uppercase
                                bg-gradient-to-r from-game-purple
                                to-game-cyan text-white hover:opacity-90">
                            Buscar
                        </button>
                        <button
                            onClick={() => {
                                const v = {
                                    desde:'', hasta:'',
                                    usuario:'', actividad:''
                                }
                                setFiltros(v)
                                setFiltrosAplicados(v)
                            }}
                            className={`px-5 py-2 rounded-xl font-semibold
                                text-sm border
                                ${isDark
                                ? 'border-game-border text-gray-400 hover:bg-game-dark'
                                : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}>
                            Limpiar
                        </button>
                    </div>
                </div>

                {/* Tabla */}
                <div className={`rounded-2xl border
                    ${isDark
                    ? 'bg-game-card border-game-border'
                    : 'bg-white border-gray-200 shadow'}`}>

                    <div className="flex items-center justify-between
                                    px-5 py-4 border-b border-game-border/30">
                        <span className={`font-game font-bold
                            ${isDark ? 'text-white' : 'text-gray-800'}`}>
                            Resultados
                        </span>
                        {datos && (
                            <span className={`text-xs
                                ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                {datos.totalElementos} sesiones encontradas
                            </span>
                        )}
                    </div>

                    {cargando ? (
                        <div className="py-16 text-center">
                            <div className="inline-block w-8 h-8 rounded-full
                                border-4 border-game-cyan
                                border-t-transparent animate-spin mb-3" />
                            <p className={`text-sm
                                ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                Cargando...
                            </p>
                        </div>
                    ) : error ? (
                        <div className="py-12 text-center
                                        text-red-400 text-sm">
                            {error}
                        </div>
                    ) : !datos || datos.items.length === 0 ? (
                        <div className="py-16 text-center">
                            <div className="text-4xl mb-3">🗂️</div>
                            <p className={`text-sm
                                ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                No hay sesiones con esos filtros.
                            </p>
                        </div>
                    ) : (
                        <div className="divide-y divide-game-border/20">
                            {datos.items.map(item => (
                                <div key={item.salaId}
                                     className={`px-5 py-4 flex flex-col
                                         sm:flex-row sm:items-center gap-3
                                         ${isDark
                                         ? 'hover:bg-game-dark/30'
                                         : 'hover:bg-gray-50'}
                                         transition-colors`}>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center
                                            gap-2 flex-wrap mb-1">
                                            <span className={`font-semibold
                                                text-sm
                                                ${isDark ? 'text-white'
                                                : 'text-gray-800'}`}>
                                                {item.nombreSala}
                                            </span>
                                            <span className={`text-xs px-2
                                                py-0.5 rounded-full border
                                                font-semibold
                                                ${item.modo === 'PRUEBA'
                                                ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30'
                                                : 'bg-purple-500/10 text-purple-400 border-purple-500/30'}`}>
                                                {item.modo === 'PRUEBA'
                                                    ? '📋 Prueba'
                                                    : '⚔️ Competencia'}
                                            </span>
                                        </div>
                                        <div className="flex flex-wrap
                                            gap-x-4 text-xs text-gray-500">
                                            <span>🔑 {item.codigoSala}</span>
                                            <span>👤 {item.creador}</span>
                                            <span>🕐 {formatFecha(
                                                item.fechaCreacion)}</span>
                                            <span>👥 {item.totalParticipantes} participantes</span>
                                            {item.ganador && (
                                                <span>🥇 {item.ganador}</span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex gap-4 text-center
                                                    flex-shrink-0">
                                        <div>
                                            <p className="font-game font-bold
                                                text-game-cyan text-sm">
                                                {item.porcentajeAciertos
                                                    ?.toFixed(0)}%
                                            </p>
                                            <p className={`text-xs
                                                ${isDark ? 'text-gray-500'
                                                : 'text-gray-400'}`}>
                                                Aciertos
                                            </p>
                                        </div>
                                        <div>
                                            <p className={`font-game
                                                font-bold text-sm
                                                ${isDark ? 'text-white'
                                                : 'text-gray-700'}`}>
                                                {item.promedio?.toFixed(0)} pts
                                            </p>
                                            <p className={`text-xs
                                                ${isDark ? 'text-gray-500'
                                                : 'text-gray-400'}`}>
                                                Promedio
                                            </p>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => descargarReporte(
                                            item.codigoSala)}
                                        disabled={descargando === item.codigoSala}
                                        className={`flex-shrink-0 px-4 py-2
                                            rounded-xl text-xs font-game
                                            font-bold uppercase border-2
                                            transition-all
                                            ${isDark
                                            ? 'border-game-cyan text-game-cyan hover:bg-game-cyan/10'
                                            : 'border-cyan-500 text-cyan-600 hover:bg-cyan-50'}
                                            disabled:opacity-50
                                            disabled:cursor-not-allowed`}>
                                        {descargando === item.codigoSala
                                            ? '⏳' : '📥 Reporte'}
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Paginación */}
                    {datos && datos.totalPaginas > 1 && (
                        <div className="flex items-center justify-between
                            px-5 py-4 border-t border-game-border/30">
                            <button
                                onClick={() => cargar(pagina - 1)}
                                disabled={datos.primera || cargando}
                                className={`px-4 py-2 rounded-xl text-sm
                                    font-semibold border disabled:opacity-40
                                    ${isDark
                                    ? 'border-game-border text-gray-300 hover:bg-game-dark'
                                    : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                                ← Anterior
                            </button>

                            <div className="flex items-center gap-1">
                                {Array.from(
                                    { length: datos.totalPaginas }, (_, i) => i)
                                    .filter(i => Math.abs(i - pagina) <= 2)
                                    .map(i => (
                                        <button
                                            key={i}
                                            onClick={() => cargar(i)}
                                            disabled={cargando}
                                            className={`w-8 h-8 rounded-lg
                                                text-sm font-game font-bold
                                                transition-all
                                                ${i === pagina
                                                ? 'bg-gradient-to-r from-game-purple to-game-cyan text-white'
                                                : isDark
                                                    ? 'text-gray-400 hover:bg-game-dark'
                                                    : 'text-gray-500 hover:bg-gray-100'}`}>
                                            {i + 1}
                                        </button>
                                    ))}
                            </div>

                            <button
                                onClick={() => cargar(pagina + 1)}
                                disabled={datos.ultima || cargando}
                                className={`px-4 py-2 rounded-xl text-sm
                                    font-semibold border disabled:opacity-40
                                    ${isDark
                                    ? 'border-game-border text-gray-300 hover:bg-game-dark'
                                    : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                                Siguiente →
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}