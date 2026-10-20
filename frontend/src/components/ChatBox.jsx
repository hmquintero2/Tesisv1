import { useState, useRef, useEffect } from 'react'
import { useTheme } from '../context/ThemeContext'

const RESPUESTAS = [
    // ── Saludo ────────────────────────────────────────────────
    {
        palabras: ['hola', 'buenos', 'buenas', 'saludos', 'hey', 'hi'],
        respuesta: '¡Hola! 👋 Soy el asistente de CodeBattle. Puedo ayudarte con:\n\n• Crear salas\n• Unirse a salas\n• Verificación OTP\n• Recuperar contraseña\n• Ranking en partida\n\n¿En qué te puedo ayudar?'
    },

    // ── Registro ──────────────────────────────────────────────
    {
        palabras: ['registr', 'crear cuenta', 'nueva cuenta', 'sign up'],
        respuesta: '📝 Para registrarte:\n\n1. Ve a la página de registro\n2. Ingresa tu nombre, correo y contraseña\n3. Haz clic en "Crear cuenta"\n4. Revisa tu correo — te llegará un código OTP de 6 dígitos\n5. Ingresa el código para activar tu cuenta\n6. ¡Listo! Ya puedes iniciar sesión'
    },

    // ── OTP ───────────────────────────────────────────────────
    {
        palabras: ['otp', 'código', 'codigo', 'verificar', 'activar cuenta', 'activación'],
        respuesta: '🔐 Verificación OTP:\n\nAl registrarte recibes un código de 6 dígitos en tu correo. Tienes 5 minutos para ingresarlo.\n\n• Si no llegó, usa el botón "Reenviar código"\n• Si expiró, solicita uno nuevo\n• Después de verificar, tu cuenta queda ACTIVE y puedes ingresar'
    },

    // ── Login ─────────────────────────────────────────────────
    {
        palabras: ['login', 'ingresar', 'iniciar sesión', 'entrar', 'acceder', 'credenciales'],
        respuesta: '🔑 Para iniciar sesión:\n\n• Con correo y contraseña: ingresa tus datos en el login\n• Con Google: usa el botón "Continuar con Google"'
    },

    // ── Recuperar contraseña ──────────────────────────────────
    {
        palabras: ['contraseña', 'password', 'olvidé', 'olvide', 'recuperar', 'restablecer'],
        respuesta: '🔒 Para recuperar tu contraseña:\n\n1. En el login haz clic en "¿Olvidaste tu contraseña?"\n2. Ingresa tu correo registrado\n3. Revisa tu correo — llegará un botón "Recuperar mi cuenta"\n4. Haz clic en el botón (válido por 15 minutos)\n5. Ingresa tu nueva contraseña\n6. ¡Listo!'
    },

    // ── Crear sala ────────────────────────────────────────────
    {
        palabras: ['crear sala', 'nueva sala', 'crear partida', 'crear juego'],
        respuesta: '🏰 Para crear una sala:\n\n1. Ve al Lobby\n2. Haz clic en "CREAR SALA"\n3. Configura:\n   • Nombre de la sala\n   • Modo: Competencia o Prueba\n   • Condición de generación (IA)\n   • Dificultad: Fácil, Intermedio, Difícil\n   • Cantidad de preguntas\n   • Tiempo por pregunta\n   • Máximo de jugadores\n4. Elige la fuente de preguntas con IA:\n   • ✏️ Prompt: escribe el tema\n   • 📄 PDF: sube un archivo PDF\n   • 📋 Cuestionario: sube PDF, TXT o DOCX\n5. Haz clic en "🤖 CREAR SALA CON IA"\n\n⚠️ Ollama debe estar corriendo para generar las preguntas'
    },

    // ── IA preguntas ──────────────────────────────────────────
    {
        palabras: ['ia', 'inteligencia artificial', 'ollama', 'preguntas ia', 'generar preguntas', 'qwen'],
        respuesta: '🤖 Generación de preguntas con IA:\n\nLa IA genera diapositivas (teoría) y preguntas automáticamente, según la condición seleccionada (modelo cerrado vía API, o modelo local con/sin ajuste). Hay 3 formas:\n\n✏️ PROMPT: Escribe el tema directamente\nEj: "Estructuras de control y bucles"\n\n📄 PDF: Sube un PDF con teoría y la IA genera preguntas basadas en el contenido\n\n📋 CUESTIONARIO: Sube un archivo con preguntas existentes (PDF, TXT o DOCX) con formato:\n1. ¿Pregunta?\nA) Opción\nB) Opción\nC) Opción\nD) Opción\n\nTodas las preguntas son de opción múltiple y están alineadas al sílabo de Programación Básica'
    },

    // ── Unirse a sala ─────────────────────────────────────────
    {
        palabras: ['unirse', 'unirme', 'entrar sala', 'código sala', 'ingresar sala'],
        respuesta: '🚀 Para unirse a una sala:\n\n1. Ve al Lobby\n2. Haz clic en "UNIRSE A SALA"\n3. Ingresa el código de 6 caracteres\n4. O busca la sala en la lista y haz clic en "Acceder"\n5. Ingresa el código cuando se pida\n\n💡 El código lo comparte el creador de la sala'
    },

    // ── Modo prueba ───────────────────────────────────────────
    {
        palabras: ['modo prueba', 'prueba', 'examen', 'docente', 'host'],
        respuesta: '📋 Modo PRUEBA:\n\n• El docente/creador configura y supervisa\n• El creador NO juega, solo observa\n• Los estudiantes responden las preguntas\n• Al finalizar se genera un reporte con estadísticas de cada alumno\n• El reporte se envía por correo a todos los participantes'
    },

    // ── Modo competencia ──────────────────────────────────────
    {
        palabras: ['competencia', 'competir', 'versus', 'batalla', 'jugar'],
        respuesta: '⚔️ Modo COMPETENCIA:\n\n• Todos los jugadores compiten incluyendo el creador\n• Los puntos se calculan por velocidad y acierto\n• El ranking se actualiza en tiempo real\n• Al finalizar hay un ganador\n• El reporte se envía por correo a todos'
    },

    // ── Reporte ───────────────────────────────────────────────
    {
        palabras: ['reporte', 'informe', 'resultado', 'estadística', 'estadisticas'],
        respuesta: '📊 Reportes:\n\nAl finalizar cada partida:\n• Se genera un reporte TXT automáticamente\n• Se guarda en la base de datos\n• Se envía por correo a TODOS los participantes con el archivo adjunto\n• Incluye: ranking, estadísticas, porcentaje de aciertos, tiempo promedio\n\nPara descargar reportes anteriores:\n• Ve a "📋 Historial" en el navbar\n• Filtra por fecha, usuario o actividad\n• Haz clic en "📥 Reporte" de la sala que quieras'
    },

    // ── Historial ─────────────────────────────────────────────
    {
        palabras: ['historial', 'partidas anteriores', 'sesiones', 'anteriores'],
        respuesta: '📋 Historial de sesiones:\n\n• Ve a "📋 Historial" en el navbar\n• Muestra todas las salas finalizadas\n• Filtros disponibles:\n  - Por fecha (desde/hasta)\n  - Por usuario (email)\n  - Por nombre de actividad\n• Puedes descargar el reporte TXT de cada sala\n• Los reportes se guardan permanentemente'
    },

    // ── Ranking en partida ────────────────────────────────────
    {
        palabras: ['líderes', 'lideres', 'ranking', 'tabla', 'puntos', 'global'],
        respuesta: '🏆 Ranking:\n\n• Se muestra en tiempo real durante el modo Competencia\n• Ordenado por puntos obtenidos en la partida actual\n• Los puntos se calculan por velocidad y acierto'
    },

    // ── Correo ────────────────────────────────────────────────
    {
        palabras: ['correo', 'email', 'gmail', 'no llega', 'no recibo'],
        respuesta: '📧 Sobre los correos:\n\nLos correos se envían de forma asíncrona (cola interna). Pueden tardar hasta 30 segundos en llegar.\n\nSi no llega el correo:\n• Revisa la carpeta de SPAM\n• Espera 1-2 minutos\n• Para el OTP: usa el botón "Reenviar código"\n• Para recuperación: vuelve a solicitar el enlace\n\nSe envían correos para:\n• Activación de cuenta (OTP)\n• Recuperación de contraseña\n• Reporte al finalizar partida'
    },

    // ── Modos de juego ────────────────────────────────────────
    {
        palabras: ['modo', 'modos', 'tipos de juego', 'diferencia'],
        respuesta: '🎮 Modos de juego:\n\n📋 PRUEBA:\n• El docente supervisa, no juega\n• Ideal para exámenes y evaluaciones\n• Ve estadísticas de cada alumno\n\n⚔️ COMPETENCIA:\n• Todos compiten incluyendo el creador\n• Hay ranking en tiempo real\n• Hay un ganador al final'
    },

    // ── Dificultad ────────────────────────────────────────────
    {
        palabras: ['dificultad', 'fácil', 'facil', 'intermedio', 'difícil', 'dificil'],
        respuesta: '🎯 Niveles de dificultad:\n\n🟢 FÁCIL: Preguntas básicas y conceptuales\n🟡 INTERMEDIO: Preguntas de aplicación práctica\n🔴 DIFÍCIL: Preguntas de análisis y casos complejos\n\nLa dificultad se configura al crear la sala y afecta el tipo de preguntas que genera la IA'
    },

    // ── Timer / tiempo ────────────────────────────────────────
    {
        palabras: ['tiempo', 'timer', 'temporizador', 'segundos', 'velocidad'],
        respuesta: '⏱ Sistema de tiempo:\n\n• Cada pregunta tiene un temporizador\n• La barra cambia de color: verde → amarillo → rojo\n• Los puntos se calculan por velocidad: responder más rápido da más puntos\n• Cuando TODOS los jugadores responden, la pregunta avanza de inmediato (sin esperar el timer)\n• Después de que todos responden, hay 5 segundos para ver el resultado antes de pasar a la siguiente pregunta\n• Máximo 120s por pregunta'
    },

    // ── Puntos ────────────────────────────────────────────────
    {
        palabras: ['puntos', 'puntaje', 'puntuar', 'cómo se calculan', 'score'],
        respuesta: '💯 Sistema de puntos:\n\n• Respuesta correcta = hasta 1000 puntos\n• Los puntos disminuyen según el tiempo que tardas\n• Si respondes en el primer segundo → máximo puntos\n• Si respondes al final → mínimo puntos\n• Respuesta incorrecta = 0 puntos'
    },

    // ── Ayuda general ─────────────────────────────────────────
    {
        palabras: ['ayuda', 'help', 'qué puedes', 'que puedes', 'opciones', 'funciones'],
        respuesta: '🤖 Puedo ayudarte con:\n\n📝 Cuenta: registro, OTP, contraseña\n🏰 Salas: crear, unirse, modos de juego\n🤖 IA: cómo generar preguntas con PDF o prompt, y las condiciones disponibles\n📊 Reportes e historial\n🏆 Ranking en partida\n⏱ Sistema de puntos y tiempo\n\nEscribe tu pregunta y te ayudo'
    },

    // ── Ollama no disponible ──────────────────────────────────
    {
        palabras: ['ollama', 'ollama serve', 'no funciona ia', 'ia no disponible'],
        respuesta: '🔧 Si Ollama no está disponible:\n\n1. Abre el CMD o terminal\n2. Ejecuta: ollama serve\n3. Déjalo abierto\n4. O verifica en http://localhost:11434\n\nSi ves "Ollama is running" ya está listo.\n\nSi ya está corriendo y aparece error, es porque ya hay una instancia activa (eso es bueno ✅)'
    },

    // ── Fallback ──────────────────────────────────────────────
    {
        palabras: [],
        respuesta: '🤔 No entendí tu pregunta. Prueba preguntando sobre:\n\n• "cómo crear una sala"\n• "cómo usar la IA"\n• "verificación OTP"\n• "ranking"\n• "cómo recuperar mi contraseña"'
    },

    // ── Sílabo ──────────────────────────────────────────────
    {
        palabras: ['temas', 'sílabo', 'silabo', 'qué temas', 'que temas',
            'materias', 'contenido', 'sobre qué', 'sobre que'],
        respuesta: '📚 La IA solo genera preguntas sobre los temas del sílabo de Programación Básica:\n\n• Variables y tipos de dato\n• Operadores aritméticos y lógicos\n• Estructuras condicionales (if, else, switch)\n• Bucles (for, while, do-while)\n• Funciones y parámetros\n• Arreglos, vectores y matrices\n• Cadenas de texto\n• Entrada y salida de datos\n• Algoritmos y pseudocódigo\n• Recursividad\n\n⚠️ Si el tema no está en esta lista, la IA lo rechazará.'
    },
    {
        palabras: ['no permitido', 'tema incorrecto', 'no acepta', 'rechaza'],
        respuesta: '⚠️ La IA solo acepta temas del sílabo de Programación Básica.\n\nEjemplos de prompts válidos:\n• "Variables y tipos de dato"\n• "Estructuras condicionales"\n• "Bucles for y while"\n• "Funciones y parámetros"\n• "Arreglos y vectores"\n\nEjemplos NO válidos:\n• "Preguntas de matemáticas"\n• "Historia del arte"\n• "Recetas de cocina"'
    }
]

function obtenerRespuesta(mensaje) {
    const texto = mensaje.toLowerCase().trim()
    for (const item of RESPUESTAS) {
        if (item.palabras.length === 0) continue
        if (item.palabras.some(p => texto.includes(p))) {
            return item.respuesta
        }
    }
    return RESPUESTAS[RESPUESTAS.length - 1].respuesta
}

export default function Chatbot() {
    const { isDark } = useTheme()
    const [abierto, setAbierto]   = useState(false)
    const [mensaje, setMensaje]   = useState('')
    const [mensajes, setMensajes] = useState([
        {
            tipo: 'bot',
            texto: '¡Hola! 👋 Soy el asistente de CodeBattle.\n\n¿En qué te puedo ayudar? Puedes preguntarme sobre cómo crear salas, usar la IA, y más.'
        }
    ])
    const bottomRef = useRef(null)

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [mensajes, abierto])

    const enviar = () => {
        if (!mensaje.trim()) return

        const nuevo = { tipo: 'user', texto: mensaje }
        const respuesta = {
            tipo: 'bot',
            texto: obtenerRespuesta(mensaje)
        }

        setMensajes(prev => [...prev, nuevo, respuesta])
        setMensaje('')
    }

    const handleKey = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            enviar()
        }
    }

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col
                        items-end gap-3">

            {/* Ventana del chat */}
            {abierto && (
                <div className={`w-80 sm:w-96 rounded-2xl border
                    shadow-2xl flex flex-col overflow-hidden
                    ${isDark
                    ? 'bg-game-card border-game-border'
                    : 'bg-white border-gray-200'}`}
                     style={{ height: '480px' }}>

                    {/* Header */}
                    <div className="flex items-center justify-between
                        px-4 py-3 bg-gradient-to-r from-game-purple
                        to-game-cyan flex-shrink-0">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full
                                bg-white/20 flex items-center
                                justify-center text-lg">
                                🤖
                            </div>
                            <div>
                                <p className="text-white font-game
                                    font-bold text-sm">
                                    Asistente CodeBattle
                                </p>
                                <p className="text-white/70 text-xs">
                                    Siempre disponible
                                </p>
                            </div>
                        </div>
                        <button onClick={() => setAbierto(false)}
                                className="text-white/80 hover:text-white
                                text-xl leading-none transition-colors">
                            ✕
                        </button>
                    </div>

                    {/* Mensajes */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                        {mensajes.map((m, i) => (
                            <div key={i}
                                 className={`flex
                                    ${m.tipo === 'user'
                                     ? 'justify-end'
                                     : 'justify-start'}`}>
                                {m.tipo === 'bot' && (
                                    <div className="w-7 h-7 rounded-full
                                        bg-gradient-to-br from-game-purple
                                        to-game-cyan flex items-center
                                        justify-center text-sm
                                        flex-shrink-0 mr-2 mt-1">
                                        🤖
                                    </div>
                                )}
                                <div className={`max-w-xs px-3 py-2
                                    rounded-2xl text-sm whitespace-pre-line
                                    leading-relaxed
                                    ${m.tipo === 'user'
                                    ? 'bg-gradient-to-r from-game-purple to-game-cyan text-white rounded-br-sm'
                                    : isDark
                                        ? 'bg-game-dark text-gray-200 rounded-bl-sm'
                                        : 'bg-gray-100 text-gray-800 rounded-bl-sm'}`}>
                                    {m.texto}
                                </div>
                            </div>
                        ))}
                        <div ref={bottomRef} />
                    </div>

                    {/* Sugerencias rápidas */}
                    <div className={`px-3 py-2 flex gap-2 overflow-x-auto
                        flex-shrink-0 border-t
                        ${isDark
                        ? 'border-game-border'
                        : 'border-gray-100'}`}>
                        {[
                            'Crear sala',
                            'Usar IA',
                            'Modos de juego',
                            'OTP'
                        ].map(s => (
                            <button key={s}
                                    onClick={() => {
                                        setMensaje(s)
                                        setTimeout(() => {
                                            const resp = obtenerRespuesta(s)
                                            setMensajes(prev => [...prev,
                                                { tipo: 'user', texto: s },
                                                { tipo: 'bot', texto: resp }
                                            ])
                                            setMensaje('')
                                        }, 0)
                                    }}
                                    className={`flex-shrink-0 px-3 py-1
                                    rounded-full text-xs font-semibold
                                    border transition-all
                                    ${isDark
                                        ? 'border-game-border text-gray-400 hover:bg-game-dark hover:text-white'
                                        : 'border-gray-200 text-gray-500 hover:bg-gray-100'}`}>
                                {s}
                            </button>
                        ))}
                    </div>

                    {/* Input */}
                    <div className={`flex gap-2 p-3 border-t flex-shrink-0
                        ${isDark
                        ? 'border-game-border'
                        : 'border-gray-100'}`}>
                        <input
                            type="text"
                            value={mensaje}
                            onChange={e => setMensaje(e.target.value)}
                            onKeyDown={handleKey}
                            placeholder="Escribe tu pregunta..."
                            className={`flex-1 px-3 py-2 rounded-xl
                                border text-sm focus:outline-none
                                focus:ring-2 focus:ring-game-purple
                                ${isDark
                                ? 'bg-game-dark border-game-border text-white placeholder-gray-600'
                                : 'bg-gray-50 border-gray-200 text-gray-800'}`}
                        />
                        <button onClick={enviar}
                                disabled={!mensaje.trim()}
                                className="px-3 py-2 rounded-xl
                                bg-gradient-to-r from-game-purple
                                to-game-cyan text-white font-bold
                                text-sm hover:opacity-90 transition-all
                                disabled:opacity-40
                                disabled:cursor-not-allowed">
                            ➤
                        </button>
                    </div>
                </div>
            )}

            {/* Botón flotante */}
            <button
                onClick={() => setAbierto(!abierto)}
                className={`w-14 h-14 rounded-full shadow-lg
                    flex items-center justify-center text-2xl
                    transition-all duration-300 hover:scale-110
                    bg-gradient-to-br from-game-purple to-game-cyan
                    glow-purple
                    ${abierto ? 'rotate-0' : 'animate-bounce-slow'}`}>
                {abierto ? '✕' : '🤖'}
            </button>

            {/* Notificación */}
            {!abierto && (
                <div className={`absolute bottom-16 right-0
                    px-3 py-1.5 rounded-xl text-xs font-semibold
                    whitespace-nowrap shadow-lg pointer-events-none
                    ${isDark
                    ? 'bg-game-card border border-game-border text-gray-300'
                    : 'bg-white border border-gray-200 text-gray-600 shadow'}`}>
                    ¿Necesitas ayuda? 🤖
                </div>
            )}
        </div>
    )
}