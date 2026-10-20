import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTheme } from '../context/ThemeContext'
import api from '../api/axios'

const LIMITE_JUGADORES = 20
const LIMITE_PREGUNTAS = 30
const LIMITE_TIEMPO    = 120

const CONDICIONES = [
    { id: 'CERRADO_API',  icono: '☁️', label: 'Cerrado (API)',       desc: 'Modelo propietario vía API' },
    { id: 'LOCAL_SIN_FT', icono: '💻', label: 'Local sin ajuste',    desc: 'Modelo local, sin fine-tuning' },
    { id: 'LOCAL_CON_FT', icono: '🎯', label: 'Local con ajuste',    desc: 'Modelo local, con fine-tuning' },
]

export default function Lobby() {
    const [vista, setVista]                         = useState(null)
    const [nombreSala, setNombreSala]               = useState('')
    const [maxJugadores, setMaxJugadores]           = useState(5)
    const [modoJuego, setModoJuego]                 = useState('COMPETENCIA')
    const [dificultad, setDificultad]               = useState('INTERMEDIO')
    const [cantidadPreguntas, setCantidadPreguntas] = useState(5)
    const [tiempoPorPregunta, setfTiempoPorPregunta] = useState(30)
    const [condicion, setCondicion]                 = useState('CERRADO_API')
    const [error, setError]                         = useState('')
    const [loading, setLoading]                     = useState(false)

    // ── IA ────────────────────────────────────────────────────
    const [fuentePreguntas, setFuentePreguntas]     = useState('TEMA')
    const [promptPreguntas, setPromptPreguntas]     = useState('')
    const [extrayendo, setExtrayendo]               = useState(false)
    const [contenidoArchivo, setContenidoArchivo]   = useState('')
    const [nombreArchivo, setNombreArchivo]         = useState('')
    const [estadoOllama, setEstadoOllama]           = useState(null)

    // ── Salas ─────────────────────────────────────────────────
    const [salasDisponibles, setSalasDisponibles]   = useState([])
    const [filtroDificultad, setFiltroDificultad]   = useState('')
    const [filtroModo, setFiltroModo]               = useState('')
    const [filtroEstado, setFiltroEstado]           = useState('')

    // ── Modal ─────────────────────────────────────────────────
    const [modalSala, setModalSala]     = useState(null)
    const [codigoModal, setCodigoModal] = useState('')
    const [errorModal, setErrorModal]   = useState('')

    const { isDark } = useTheme()
    const navigate   = useNavigate()

    // ── Effects ───────────────────────────────────────────────

    useEffect(() => {
        api.get('/ia/estado')
            .then(({ data }) => setEstadoOllama(data))
            .catch(() => {})
    }, [])

    useEffect(() => {
        if (!vista) cargarSalas()
    }, [vista, filtroDificultad, filtroModo, filtroEstado])

    useEffect(() => {
        if (vista) return
        const interval = setInterval(cargarSalas, 10000)
        return () => clearInterval(interval)
    }, [vista, filtroDificultad, filtroModo, filtroEstado])

    // ── Cargar salas ──────────────────────────────────────────

    const cargarSalas = async () => {
        try {
            const params = {}
            if (filtroDificultad) params.dificultad = filtroDificultad
            if (filtroModo)       params.modo       = filtroModo
            if (filtroEstado)     params.estado     = filtroEstado
            const { data } = await api.get('/salas/disponibles', { params })
            setSalasDisponibles(data)
        } catch {
            setSalasDisponibles([])
        }
    }

    // ── Extraer texto de archivo ──────────────────────────────

    const handleArchivoIA = async (e) => {
        const file = e.target.files[0]
        if (!file) return
        setExtrayendo(true)
        setError('')
        try {
            const form = new FormData()
            form.append('archivo', file)
            const { data } = await api.post('/ia/extraer-texto', form, {
                headers: { 'Content-Type': 'multipart/form-data' }
            })
            setContenidoArchivo(data.texto)
            setNombreArchivo(data.nombre)
        } catch {
            setError('No se pudo leer el archivo')
        } finally {
            setExtrayendo(false)
        }
    }

    // ── Crear sala ────────────────────────────────────────────

    const crearSala = async () => {
        if (!nombreSala.trim()) {
            setError('Ingresa un nombre para la sala')
            return
        }

        // Validar fuente de preguntas
        if (fuentePreguntas === 'TEMA' && !promptPreguntas.trim()) {
            setError('Escribe el tema o prompt para generar las preguntas')
            return
        }
        if ((fuentePreguntas === 'PDF' || fuentePreguntas === 'CUESTIONARIO')
            && !contenidoArchivo) {
            setError('Sube un archivo para generar las preguntas')
            return
        }

        if (maxJugadores > LIMITE_JUGADORES) {
            setError(`El máximo es ${LIMITE_JUGADORES} jugadores`)
            return
        }
        if (cantidadPreguntas > LIMITE_PREGUNTAS) {
            setError(`El máximo es ${LIMITE_PREGUNTAS} preguntas`)
            return
        }
        if (tiempoPorPregunta > LIMITE_TIEMPO) {
            setError(`El máximo es ${LIMITE_TIEMPO}s por pregunta`)
            return
        }

        setLoading(true)
        setError('')
        try {
            const { data } = await api.post('/salas', {
                nombre:            nombreSala,
                maxJugadores,
                modo:              modoJuego,
                dificultad,
                cantidadPreguntas,
                tiempoPorPregunta,
                condicion,
                fuentePreguntas,
                promptPreguntas:   fuentePreguntas === 'TEMA'
                    ? promptPreguntas : '',
                contenidoArchivo:  fuentePreguntas !== 'TEMA'
                    ? contenidoArchivo : '',
                nombreArchivo,
            })
            navigate(`/sala/${data.codigo}`)
        } catch (err) {
            setError(err.response?.data?.error || 'Error al crear la sala')
        } finally {
            setLoading(false)
        }
    }

    // ── Modal ─────────────────────────────────────────────────

    const abrirModal = (sala) => {
        setModalSala(sala)
        setCodigoModal('')
        setErrorModal('')
    }

    const cerrarModal = () => {
        setModalSala(null)
        setCodigoModal('')
        setErrorModal('')
    }

    const confirmarIngreso = async () => {
        if (!codigoModal.trim()) {
            setErrorModal('Ingresa el código de la sala')
            return
        }
        if (codigoModal.toUpperCase() !== modalSala.codigo) {
            setErrorModal('Código incorrecto')
            return
        }
        setLoading(true)
        setErrorModal('')
        try {
            const { data } = await api.post(
                `/salas/unirse/${codigoModal.toUpperCase()}`)
            navigate(`/sala/${data.codigo}`)
        } catch (err) {
            setErrorModal(
                err.response?.data?.error || 'No se pudo unir a la sala')
        } finally {
            setLoading(false)
        }
    }

    // ── Helpers ───────────────────────────────────────────────

    const estadoLabel = (estado) => {
        if (estado === 'ESPERANDO')
            return { texto: 'Esperando',
                color: 'text-green-400',
                bg:    'bg-green-400/10 border-green-400/30' }
        if (estado === 'EN_JUEGO')
            return { texto: 'En juego',
                color: 'text-yellow-400',
                bg:    'bg-yellow-400/10 border-yellow-400/30' }
        if (estado === 'FINALIZADA')
            return { texto: 'Finalizada',
                color: 'text-red-400',
                bg:    'bg-red-400/10 border-red-400/30' }
        return { texto: estado,
            color: 'text-gray-400',
            bg:    'bg-gray-400/10 border-gray-400/30' }
    }

    const puedeUnirse = (sala) =>
        sala.estado === 'ESPERANDO' &&
        sala.jugadoresConectados < sala.maxJugadores

    const inp = `w-full px-4 py-3 rounded-xl border text-base
        focus:outline-none focus:ring-2 focus:ring-game-purple
        ${isDark
        ? 'bg-game-dark border-game-border text-white placeholder-gray-600'
        : 'bg-gray-50 border-gray-200 text-gray-800'}`

    // ── Render ────────────────────────────────────────────────

    return (
        <div className={`flex-1
            ${isDark ? 'bg-game-darker' : 'bg-gray-100'}
            transition-colors duration-300`}>

            {/* Modal código */}
            {modalSala && (
                <div className="fixed inset-0 z-50 flex items-center
                    justify-center bg-black/60 backdrop-blur-sm">
                    <div className={`w-full max-w-sm mx-4 p-6 rounded-2xl
                        border shadow-2xl
                        ${isDark
                        ? 'bg-game-card border-game-border'
                        : 'bg-white border-gray-200'}`}>
                        <h3 className={`font-game text-xl font-bold mb-1
                            ${isDark ? 'text-white' : 'text-gray-800'}`}>
                            🔐 Código de acceso
                        </h3>
                        <p className={`text-sm mb-4
                            ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                            Ingresa el código para entrar a{' '}
                            <span className="font-semibold">
                                {modalSala.nombre}
                            </span>
                        </p>
                        <input
                            type="text"
                            value={codigoModal}
                            onChange={e =>
                                setCodigoModal(e.target.value.toUpperCase())}
                            placeholder="XXXXXX"
                            maxLength={6}
                            className={`w-full px-4 py-3 rounded-xl border
                                text-center text-2xl font-game
                                tracking-[0.5em] font-bold
                                focus:outline-none focus:ring-2
                                focus:ring-game-cyan mb-3
                                ${isDark
                                ? 'bg-game-dark border-game-border text-white placeholder-gray-600'
                                : 'bg-gray-50 border-gray-200 text-gray-800'}`}
                        />
                        {errorModal && (
                            <p className="text-red-400 text-sm text-center
                                bg-red-500/10 border border-red-500/30
                                p-2 rounded-xl mb-3">
                                ⚠️ {errorModal}
                            </p>
                        )}
                        <div className="flex gap-3">
                            <button onClick={cerrarModal}
                                    className={`flex-1 py-2.5 rounded-xl
                                    font-semibold text-sm border
                                    ${isDark
                                        ? 'border-game-border text-gray-400 hover:bg-game-dark'
                                        : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}>
                                Cancelar
                            </button>
                            <button onClick={confirmarIngreso}
                                    disabled={loading}
                                    className="flex-1 py-2.5 rounded-xl
                                    font-game font-bold text-sm
                                    bg-gradient-to-r from-game-cyan
                                    to-game-purple text-white
                                    hover:opacity-90 transition-all
                                    disabled:opacity-50">
                                {loading ? 'Entrando...' : 'Entrar'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="max-w-5xl mx-auto px-6 py-12">

                {/* Título */}
                <div className="text-center mb-12">
                    <h2 className={`font-game text-5xl font-black mb-4
                        ${isDark ? 'text-white' : 'text-gray-800'}`}>
                        SALA DE{' '}
                        <span className="text-transparent bg-clip-text
                            bg-gradient-to-r from-game-purple to-game-cyan">
                            BATALLA
                        </span>
                    </h2>
                    <p className={`text-lg
                        ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        Crea una sala o únete a una existente
                    </p>
                </div>

                {!vista ? (
                    <>
                        {/* Botones crear / unirse */}
                        <div className="grid grid-cols-1 md:grid-cols-2
                            gap-6 mb-12">
                            <button onClick={() => setVista('crear')}
                                    className={`group p-8 rounded-2xl border-2
                                    text-left transition-all duration-300
                                    hover:scale-105 hover:glow-purple
                                    ${isDark
                                        ? 'bg-game-card border-game-purple/40 hover:border-game-purple'
                                        : 'bg-white border-purple-200 hover:border-purple-400 shadow-lg'}`}>
                                <div className="text-6xl mb-4
                                    group-hover:scale-110 transition-transform">
                                    🏰
                                </div>
                                <h3 className={`font-game text-2xl font-bold mb-2
                                    ${isDark
                                    ? 'text-game-purple-light'
                                    : 'text-purple-600'}`}>
                                    CREAR SALA
                                </h3>
                                <p className={`text-sm
                                    ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                    Crea tu propia sala y comparte
                                    el código con tus amigos
                                </p>
                            </button>

                            <button onClick={() => setVista('unirse')}
                                    className={`group p-8 rounded-2xl border-2
                                    text-left transition-all duration-300
                                    hover:scale-105 hover:glow-cyan
                                    ${isDark
                                        ? 'bg-game-card border-game-cyan/40 hover:border-game-cyan'
                                        : 'bg-white border-cyan-200 hover:border-cyan-400 shadow-lg'}`}>
                                <div className="text-6xl mb-4
                                    group-hover:scale-110 transition-transform">
                                    🚀
                                </div>
                                <h3 className={`font-game text-2xl font-bold mb-2
                                    ${isDark
                                    ? 'text-game-cyan-light'
                                    : 'text-cyan-600'}`}>
                                    UNIRSE A SALA
                                </h3>
                                <p className={`text-sm
                                    ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                    Ingresa el código de la sala
                                    a la que fuiste invitado
                                </p>
                            </button>
                        </div>

                        {/* Lista salas */}
                        <div className={`p-6 rounded-2xl border
                            ${isDark
                            ? 'bg-game-card border-game-border'
                            : 'bg-white border-gray-200 shadow-lg'}`}>
                            <div className="flex flex-wrap items-center
                                justify-between gap-3 mb-4">
                                <h3 className={`font-game text-xl font-bold
                                    ${isDark ? 'text-white' : 'text-gray-800'}`}>
                                    🌐 Salas disponibles
                                </h3>
                                <div className="flex flex-wrap gap-2">
                                    {[
                                        {
                                            value: filtroModo,
                                            setter: setFiltroModo,
                                            options: [
                                                { v: '', l: 'Todos los modos' },
                                                { v: 'COMPETENCIA', l: 'Competencia' },
                                                { v: 'PRUEBA', l: 'Prueba' },
                                            ]
                                        },
                                        {
                                            value: filtroDificultad,
                                            setter: setFiltroDificultad,
                                            options: [
                                                { v: '', l: 'Toda dificultad' },
                                                { v: 'FACIL', l: 'Fácil' },
                                                { v: 'INTERMEDIO', l: 'Intermedio' },
                                                { v: 'DIFICIL', l: 'Difícil' },
                                            ]
                                        },
                                        {
                                            value: filtroEstado,
                                            setter: setFiltroEstado,
                                            options: [
                                                { v: '', l: 'Todos los estados' },
                                                { v: 'ESPERANDO', l: 'Esperando' },
                                                { v: 'EN_JUEGO', l: 'En juego' },
                                                { v: 'FINALIZADA', l: 'Finalizada' },
                                            ]
                                        },
                                    ].map((sel, i) => (
                                        <select key={i}
                                                value={sel.value}
                                                onChange={e =>
                                                    sel.setter(e.target.value)}
                                                className={`px-3 py-2 rounded-lg
                                                text-sm border
                                                ${isDark
                                                    ? 'bg-game-dark border-game-border text-white'
                                                    : 'bg-gray-50 border-gray-200 text-gray-700'}`}>
                                            {sel.options.map(o => (
                                                <option key={o.v} value={o.v}>
                                                    {o.l}
                                                </option>
                                            ))}
                                        </select>
                                    ))}
                                </div>
                            </div>

                            {salasDisponibles.length === 0 ? (
                                <p className={`text-sm text-center py-6
                                    ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                                    No hay salas con ese filtro ahora mismo.
                                </p>
                            ) : (
                                <div className="space-y-2">
                                    {salasDisponibles.map(s => {
                                        const est      = estadoLabel(s.estado)
                                        const disponible = puedeUnirse(s)
                                        return (
                                            <div key={s.id}
                                                 className={`flex items-center
                                                    justify-between p-4
                                                    rounded-xl
                                                    ${isDark
                                                     ? 'bg-game-dark'
                                                     : 'bg-gray-50'}`}>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex
                                                        items-center gap-2
                                                        flex-wrap">
                                                        <p className={`font-semibold
                                                            text-sm
                                                            ${isDark
                                                            ? 'text-white'
                                                            : 'text-gray-800'}`}>
                                                            {s.nombre}
                                                        </p>
                                                        <span className={`text-xs
                                                            px-2 py-0.5
                                                            rounded-full border
                                                            font-semibold
                                                            ${est.color}
                                                            ${est.bg}`}>
                                                            {est.texto}
                                                        </span>
                                                    </div>
                                                    <p className="text-xs
                                                        text-gray-500 mt-0.5">
                                                        {s.modo === 'PRUEBA'
                                                            ? '📋 Prueba'
                                                            : '⚔️ Competencia'
                                                        } · {s.dificultad} ·{' '}
                                                        {s.jugadoresConectados}/
                                                        {s.maxJugadores} jugadores
                                                    </p>
                                                </div>
                                                {disponible ? (
                                                    <button
                                                        onClick={() => abrirModal(s)}
                                                        className="ml-3 px-4 py-2
                                                            rounded-lg text-sm
                                                            font-game font-bold
                                                            uppercase
                                                            bg-gradient-to-r
                                                            from-game-cyan
                                                            to-game-purple
                                                            text-white
                                                            hover:opacity-90
                                                            transition-all
                                                            flex-shrink-0">
                                                        Acceder
                                                    </button>
                                                ) : (
                                                    <span className={`ml-3 px-3
                                                        py-2 rounded-lg text-xs
                                                        font-semibold
                                                        flex-shrink-0
                                                        ${est.color}
                                                        ${isDark
                                                        ? 'bg-game-card'
                                                        : 'bg-gray-100'}`}>
                                                        {s.estado === 'FINALIZADA'
                                                            ? 'Finalizada'
                                                            : s.jugadoresConectados >= s.maxJugadores
                                                                ? 'Sala llena'
                                                                : 'No disponible'}
                                                    </span>
                                                )}
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                        </div>
                    </>
                ) : (
                    /* Formulario crear / unirse */
                    <div className={`max-w-lg mx-auto p-8 rounded-2xl border
                        ${isDark
                        ? 'bg-game-card border-game-border'
                        : 'bg-white border-gray-200 shadow-xl'}`}>

                        <div className="flex items-center gap-3 mb-6">
                            <button
                                onClick={() => {
                                    setVista(null)
                                    setError('')
                                    setFuentePreguntas('TEMA')
                                    setPromptPreguntas('')
                                    setContenidoArchivo('')
                                    setNombreArchivo('')
                                }}
                                className={`p-2 rounded-lg transition-colors
                                    ${isDark
                                    ? 'hover:bg-game-dark text-gray-400'
                                    : 'hover:bg-gray-100 text-gray-500'}`}>
                                ← Volver
                            </button>
                            <h3 className={`font-game text-xl font-bold
                                ${isDark ? 'text-white' : 'text-gray-800'}`}>
                                {vista === 'crear'
                                    ? '🏰 CREAR SALA'
                                    : '🚀 UNIRSE A SALA'}
                            </h3>
                        </div>

                        {vista === 'crear' ? (
                            <div className="space-y-4">

                                {/* Nombre */}
                                <div>
                                    <label className={`block text-sm
                                        font-semibold mb-2 uppercase
                                        tracking-widest
                                        ${isDark
                                        ? 'text-game-purple-light'
                                        : 'text-purple-600'}`}>
                                        Nombre de la sala
                                    </label>
                                    <input type="text"
                                           value={nombreSala}
                                           onChange={e =>
                                               setNombreSala(e.target.value)}
                                           placeholder="Mi sala épica"
                                           className={inp} />
                                </div>

                                {/* Modo juego */}
                                <div>
                                    <label className={`block text-sm
                                        font-semibold mb-2 uppercase
                                        tracking-widest
                                        ${isDark
                                        ? 'text-game-purple-light'
                                        : 'text-purple-600'}`}>
                                        Modo de juego
                                    </label>
                                    <div className="grid grid-cols-3 gap-3">
                                        {['COMPETENCIA', 'PRUEBA', 'PRESENTACIONES'].map(m => (
                                            <button key={m} type="button"
                                                    onClick={() => setModoJuego(m)}
                                                    className={`py-3 rounded-xl
                                                    font-semibold text-sm
                                                    border-2 transition-all
                                                    ${modoJuego === m
                                                        ? 'border-game-purple bg-game-purple/10 text-game-purple-light'
                                                        : isDark ? 'border-game-border text-gray-400' : 'border-gray-200 text-gray-500'}`}>
                                                {m === 'COMPETENCIA'
                                                    ? '⚔️ Competencia'
                                                    : m === 'PRUEBA'
                                                        ? '📋 Prueba'
                                                        : '🖥️ Presentación'}
                                            </button>
                                        ))}
                                    </div>
                                    <p className={`text-xs mt-1 ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                                        {modoJuego === 'PRUEBA'
                                            ? 'Tú configuras y supervisas; los demás responden.'
                                            : modoJuego === 'PRESENTACIONES'
                                                ? 'Tú controlas el avance de las diapositivas; los demás ven y responden en pantalla.'
                                                : 'Todos compiten, incluido tú.'}
                                    </p>
                                </div>

                                {/* Condición experimental */}
                                <div>
                                    <label className={`block text-sm
                                        font-semibold mb-2 uppercase
                                        tracking-widest
                                        ${isDark
                                        ? 'text-game-purple-light'
                                        : 'text-purple-600'}`}>
                                        Condición de generación (IA)
                                    </label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {CONDICIONES.map(cnd => (
                                            <button key={cnd.id} type="button"
                                                    onClick={() => setCondicion(cnd.id)}
                                                    className={`py-3 rounded-xl
                                                    text-xs font-semibold
                                                    border-2 transition-all
                                                    ${condicion === cnd.id
                                                        ? 'border-game-cyan bg-game-cyan/10 text-game-cyan'
                                                        : isDark ? 'border-game-border text-gray-400' : 'border-gray-200 text-gray-500'}`}>
                                                <div>{cnd.icono}</div>
                                                <div>{cnd.label}</div>
                                            </button>
                                        ))}
                                    </div>
                                    <p className={`text-xs mt-1
                                        ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                                        {CONDICIONES.find(c => c.id === condicion)?.desc}
                                    </p>
                                </div>

                                {/* Dificultad */}
                                <div>
                                    <label className={`block text-sm
                                        font-semibold mb-2 uppercase
                                        tracking-widest
                                        ${isDark
                                        ? 'text-game-purple-light'
                                        : 'text-purple-600'}`}>
                                        Dificultad
                                    </label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {['FACIL','INTERMEDIO','DIFICIL'].map(d => (
                                            <button key={d} type="button"
                                                    onClick={() => setDificultad(d)}
                                                    className={`py-2 rounded-xl
                                                    text-xs font-semibold
                                                    border-2 transition-all
                                                    ${dificultad === d
                                                        ? 'border-game-purple bg-game-purple/10 text-game-purple-light'
                                                        : isDark ? 'border-game-border text-gray-400' : 'border-gray-200 text-gray-500'}`}>
                                                {d === 'FACIL' ? 'Fácil'
                                                    : d === 'INTERMEDIO'
                                                        ? 'Intermedio'
                                                        : 'Difícil'}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Cantidad preguntas */}
                                <div>
                                    <label className={`block text-sm
                                        font-semibold mb-2 uppercase
                                        tracking-widest
                                        ${isDark
                                        ? 'text-game-purple-light'
                                        : 'text-purple-600'}`}>
                                        Cantidad de preguntas: {cantidadPreguntas}
                                    </label>
                                    <input type="range" min="3"
                                           max={LIMITE_PREGUNTAS}
                                           value={cantidadPreguntas}
                                           onChange={e =>
                                               setCantidadPreguntas(Number(e.target.value))}
                                           className="w-full accent-game-purple" />
                                    <div className="flex justify-between
                                        text-xs text-gray-500 mt-1">
                                        <span>3</span>
                                        <span>{LIMITE_PREGUNTAS}</span>
                                    </div>
                                </div>

                                {/* Tiempo por pregunta */}
                                <div>
                                    <label className={`block text-sm
                                        font-semibold mb-2 uppercase
                                        tracking-widest
                                        ${isDark
                                        ? 'text-game-purple-light'
                                        : 'text-purple-600'}`}>
                                        Tiempo por pregunta: {tiempoPorPregunta}s
                                    </label>
                                    <input type="range" min="10"
                                           max={LIMITE_TIEMPO}
                                           step="5"
                                           value={tiempoPorPregunta}
                                           onChange={e =>
                                               setTiempoPorPregunta(Number(e.target.value))}
                                           className="w-full accent-game-purple" />
                                    <div className="flex justify-between
                                        text-xs text-gray-500 mt-1">
                                        <span>10s</span>
                                        <span>{LIMITE_TIEMPO}s</span>
                                    </div>
                                </div>

                                {/* Max jugadores */}
                                <div>
                                    <label className={`block text-sm
                                        font-semibold mb-2 uppercase
                                        tracking-widest
                                        ${isDark
                                        ? 'text-game-purple-light'
                                        : 'text-purple-600'}`}>
                                        Máximo de jugadores: {maxJugadores}
                                    </label>
                                    <input type="range" min="2"
                                           max={LIMITE_JUGADORES}
                                           value={maxJugadores}
                                           onChange={e =>
                                               setMaxJugadores(Number(e.target.value))}
                                           className="w-full accent-game-purple" />
                                    <div className="flex justify-between
                                        text-xs text-gray-500 mt-1">
                                        <span>2</span>
                                        <span>{LIMITE_JUGADORES}</span>
                                    </div>
                                </div>

                                {/* ── Sección IA ── */}
                                <div className={`p-4 rounded-xl border
                                    ${isDark
                                    ? 'bg-game-dark/50 border-game-border'
                                    : 'bg-purple-50 border-purple-200'}`}>

                                    <label className={`block text-sm
                                        font-semibold mb-3 uppercase
                                        tracking-widest
                                        ${isDark
                                        ? 'text-game-purple-light'
                                        : 'text-purple-600'}`}>
                                        🤖 Fuente de preguntas (IA)
                                    </label>

                                    {/* Estado Ollama */}
                                    {estadoOllama && (
                                        <div className={`text-xs mb-3 px-3
                                            py-2 rounded-lg
                                            ${estadoOllama.disponible
                                            ? 'bg-green-500/10 text-green-400'
                                            : 'bg-red-500/10 text-red-400'}`}>
                                            {estadoOllama.disponible
                                                ? '✅ IA disponible'
                                                : '❌ IA no disponible — ejecuta: ollama serve'}
                                        </div>
                                    )}

                                    {/* Selector fuente */}
                                    <div className="grid grid-cols-3 gap-2 mb-3">
                                        {[
                                            { id: 'TEMA',         icono: '✏️', label: 'Prompt' },
                                            { id: 'PDF',          icono: '📄', label: 'PDF' },
                                            { id: 'CUESTIONARIO', icono: '📋', label: 'Cuestionario' },
                                        ].map(f => (
                                            <button key={f.id} type="button"
                                                    onClick={() => {
                                                        setFuentePreguntas(f.id)
                                                        setContenidoArchivo('')
                                                        setNombreArchivo('')
                                                    }}
                                                    className={`py-2 rounded-xl
                                                    text-xs font-semibold
                                                    border-2 transition-all
                                                    ${fuentePreguntas === f.id
                                                        ? 'border-game-purple bg-game-purple/10 text-game-purple-light'
                                                        : isDark ? 'border-game-border text-gray-400' : 'border-gray-200 text-gray-500'}`}>
                                                {f.icono} {f.label}
                                            </button>
                                        ))}
                                    </div>

                                    {/* Prompt */}
                                    {fuentePreguntas === 'TEMA' && (
                                        <textarea
                                            value={promptPreguntas}
                                            onChange={e =>
                                                setPromptPreguntas(e.target.value)}
                                            placeholder="Ej: variables y tipos de dato, bucles for..."
                                            rows={4}
                                            className={`w-full px-4 py-3
                                                rounded-xl border text-sm
                                                focus:outline-none
                                                focus:ring-2
                                                focus:ring-game-purple
                                                resize-none
                                                ${isDark
                                                ? 'bg-game-dark border-game-border text-white placeholder-gray-600'
                                                : 'bg-white border-gray-200 text-gray-800'}`}
                                        />
                                    )}

                                    {/* Subir archivo */}
                                    {(fuentePreguntas === 'PDF' ||
                                        fuentePreguntas === 'CUESTIONARIO') && (
                                        <div>
                                            <input type="file"
                                                   accept={fuentePreguntas === 'PDF'
                                                       ? '.pdf'
                                                       : '.pdf,.txt,.docx'}
                                                   onChange={handleArchivoIA}
                                                   className={`w-full px-4 py-3
                                                    rounded-xl border text-sm
                                                    cursor-pointer
                                                    ${isDark
                                                       ? 'bg-game-dark border-game-border text-white'
                                                       : 'bg-white border-gray-200 text-gray-800'}`}
                                            />
                                            {extrayendo && (
                                                <p className="text-xs
                                                    text-game-cyan mt-1
                                                    animate-pulse">
                                                    ⏳ Leyendo archivo...
                                                </p>
                                            )}
                                            {contenidoArchivo && !extrayendo && (
                                                <p className="text-xs
                                                    text-green-400 mt-1">
                                                    ✓ {nombreArchivo} —{' '}
                                                    {contenidoArchivo.length}{' '}
                                                    caracteres extraídos
                                                </p>
                                            )}
                                            {fuentePreguntas === 'CUESTIONARIO' && (
                                                <p className={`text-xs mt-1
                                                    ${isDark
                                                    ? 'text-gray-600'
                                                    : 'text-gray-400'}`}>
                                                    Formato: numera las preguntas
                                                    (1. 2. 3.) con opciones
                                                    A) B) C) D)
                                                </p>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {error && (
                                    <p className="text-red-400 text-sm
                                        text-center bg-red-500/10 border
                                        border-red-500/30 p-3 rounded-xl">
                                        ⚠️ {error}
                                    </p>
                                )}

                                <button onClick={crearSala}
                                        disabled={loading
                                            || !estadoOllama?.disponible}
                                        className="w-full py-3 rounded-xl
                                        font-game font-bold tracking-widest
                                        uppercase bg-gradient-to-r
                                        from-game-purple to-game-cyan
                                        text-white hover:opacity-90
                                        transition-all glow-purple
                                        disabled:opacity-50
                                        disabled:cursor-not-allowed">
                                    {loading
                                        ? (
                                            <span className="flex items-center
                                                justify-center gap-2">
                                                <span className="w-4 h-4
                                                    rounded-full border-2
                                                    border-white
                                                    border-t-transparent
                                                    animate-spin" />
                                                Generando preguntas con IA...
                                            </span>
                                        )
                                        : '🤖 CREAR SALA CON IA'}
                                </button>

                                {!estadoOllama?.disponible && (
                                    <p className="text-xs text-center
                                        text-red-400">
                                        Ollama debe estar corriendo.
                                        Ejecuta: <code>ollama serve</code>
                                    </p>
                                )}
                            </div>
                        ) : (
                            /* Unirse */
                            <div className="space-y-4">
                                <div>
                                    <label className={`block text-sm
                                        font-semibold mb-2 uppercase
                                        tracking-widest
                                        ${isDark
                                        ? 'text-game-cyan-light'
                                        : 'text-cyan-600'}`}>
                                        Código de sala
                                    </label>
                                    <input type="text"
                                           value={codigoModal}
                                           onChange={e =>
                                               setCodigoModal(
                                                   e.target.value.toUpperCase())}
                                           placeholder="A7X92K"
                                           maxLength={6}
                                           className={`w-full px-4 py-3
                                            rounded-xl border text-center
                                            text-2xl font-game
                                            tracking-[0.5em] font-bold
                                            focus:outline-none focus:ring-2
                                            focus:ring-game-cyan
                                            ${isDark
                                               ? 'bg-game-dark border-game-border text-white placeholder-gray-600'
                                               : 'bg-gray-50 border-gray-200 text-gray-800'}`}
                                    />
                                </div>
                                {error && (
                                    <p className="text-red-400 text-sm
                                        text-center bg-red-500/10 border
                                        border-red-500/30 p-3 rounded-xl">
                                        ⚠️ {error}
                                    </p>
                                )}
                                <button
                                    onClick={() => {
                                        setModalSala({
                                            codigo: codigoModal,
                                            nombre: 'sala'
                                        })
                                        confirmarIngreso()
                                    }}
                                    disabled={loading}
                                    className="w-full py-3 rounded-xl
                                        font-game font-bold tracking-widest
                                        uppercase bg-gradient-to-r
                                        from-game-cyan to-game-purple
                                        text-white hover:opacity-90
                                        transition-all glow-cyan
                                        disabled:opacity-50
                                        disabled:cursor-not-allowed">
                                    {loading ? 'BUSCANDO...' : 'UNIRSE'}
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}