import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { useWebSocket } from '../hooks/useWebSocket'
import api from '../api/axios'

export default function WaitingRoom() {
    const { codigo } = useParams()
    const { user } = useAuth()
    const { isDark } = useTheme()
    const navigate = useNavigate()

    const [sala, setSala] = useState(null)
    const [mensajes, setMensajes] = useState([])
    const [inputChat, setInputChat] = useState('')
    const [participantes, setParticipantes] = useState([])
    const [notificaciones, setNotificaciones] = useState([])
    const [writingUsers, setWritingUsers] = useState([])
    const chatEndRef = useRef(null)
    const notifIdRef = useRef(0)
    const salidaEnviadaRef = useRef(false)
    const typingTimerRef = useRef(null)
    const isTypingRef = useRef(false)

    const addNotificacion = useCallback((texto) => {
        const id = ++notifIdRef.current
        setNotificaciones(prev => [...prev, { id, texto }])
        setTimeout(() => setNotificaciones(prev => prev.filter(n => n.id !== id)), 4000)
    }, [])

    // ✅ cargarSala PRIMERO antes de usarse en onParticipants
    const cargarSala = useCallback(async () => {
        try {
            const { data } = await api.get(`/salas/${codigo}`)
            setSala(data)
            setParticipantes(data.participantesDetalle || [])
        } catch {
            navigate('/lobby')
        }
    }, [codigo, navigate])

    const onMessage = useCallback((msg) => {
        if (msg.tipo === 'CHAT_MESSAGE') {
            setMensajes(prev => [...prev, msg])
        }
    }, [])

    // ✅ onParticipants DESPUÉS de cargarSala
    const onParticipants = useCallback((msg) => {
        if (msg.tipo === 'PLAYER_JOINED') {
            addNotificacion(`🟢 ${msg.mensaje}`)
            cargarSala()
        } else if (msg.tipo === 'PLAYER_LEFT') {
            addNotificacion(`🔴 ${msg.mensaje}`)
            cargarSala()
        } else if (msg.tipo === 'ROOM_UPDATED') {
            cargarSala()
        }
    }, [addNotificacion, cargarSala])

    const onTyping = useCallback((msg) => {
        if (msg.tipo !== 'TYPING' || msg.remitente === user?.email) return
        const isWriting = msg.mensaje === 'true'
        setWritingUsers(prev => {
            if (isWriting) {
                if (prev.find(u => u.email === msg.remitente)) return prev
                return [...prev, { email: msg.remitente, nombre: msg.remitente.split('@')[0] }]
            } else {
                return prev.filter(u => u.email !== msg.remitente)
            }
        })
    }, [user])

    const onConnect = useCallback(() => {
        salidaEnviadaRef.current = false
        sendMessage(`/app/sala/${codigo}/unirse`, {
            tipo: 'PLAYER_JOINED',
            remitente: user?.email,
            mensaje: `${user?.nombre} ingresó a la sala.`,
            codigoSala: codigo,
        })
    }, [codigo, user])

    const onJuego = useCallback((msg) => {
        if (sala?.creadorEmail === user?.email) return // el anfitrión ya navegó al hacer clic en "Iniciar"

        if (msg.tipo === 'INICIO_CUENTA_REGRESIVA' || msg.tipo === 'NUEVA_PREGUNTA') {
            navigate(`/juego/${codigo}`)
        } else if (msg.tipo === 'PRES_DIAPOSITIVA') {
            navigate(`/presentacion/${codigo}`)
        }
    }, [navigate, codigo, sala, user])

    const { sendMessage, connectionStatus } = useWebSocket(codigo, onMessage, onParticipants, onConnect, onTyping, onJuego)

    useEffect(() => {
        cargarSala()
        return () => {
            if (!salidaEnviadaRef.current) {
                salidaEnviadaRef.current = true
                sendMessage(`/app/sala/${codigo}/salir`, {
                    tipo: 'PLAYER_LEFT',
                    remitente: user?.email,
                    mensaje: `${user?.nombre} salió de la sala.`,
                    codigoSala: codigo,
                })
                api.post(`/salas/${codigo}/salir`).catch(() => {})
            }
        }
    }, [codigo, cargarSala])

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [mensajes])

    const sendTyping = useCallback((isWriting) => {
        sendMessage(`/app/sala/${codigo}/typing`, {
            tipo: 'TYPING',
            remitente: user?.email,
            mensaje: isWriting ? 'true' : 'false',
            codigoSala: codigo,
        })
    }, [sendMessage, codigo, user])

    const handleInputChange = (e) => {
        setInputChat(e.target.value)
        if (!isTypingRef.current) {
            isTypingRef.current = true
            sendTyping(true)
        }
        clearTimeout(typingTimerRef.current)
        typingTimerRef.current = setTimeout(() => {
            isTypingRef.current = false
            sendTyping(false)
        }, 2000)
    }

    const enviarMensaje = () => {
        if (!inputChat.trim()) return
        clearTimeout(typingTimerRef.current)
        isTypingRef.current = false
        sendTyping(false)
        sendMessage(`/app/sala/${codigo}/chat`, {
            tipo: 'CHAT_MESSAGE',
            remitente: user?.email,
            mensaje: inputChat.trim(),
            codigoSala: codigo,
        })
        setInputChat('')
    }

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            enviarMensaje()
        }
    }

    const copiarCodigo = () => {
        navigator.clipboard.writeText(codigo)
        addNotificacion('📋 Código copiado al portapapeles')
    }

    if (!sala) {
        return (
            <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-game-darker' : 'bg-gray-100'}`}>
                <div className="text-game-cyan font-game text-xl animate-pulse">CARGANDO SALA...</div>
            </div>
        )
    }

    const esCreador = sala.creadorEmail === user?.email

    return (
        <div className={`flex-1 flex flex-col overflow-hidden ${isDark ? 'bg-game-darker' : 'bg-gray-100'}`}>

            {connectionStatus === 'reconnecting' && (
                <div className="w-full bg-yellow-500/90 text-black text-center text-sm font-semibold py-2 px-4 flex items-center justify-center gap-2">
                    <span className="animate-spin">⟳</span>
                    Conexión perdida — reconectando...
                </div>
            )}
            {connectionStatus === 'disconnected' && (
                <div className="w-full bg-red-600/90 text-white text-center text-sm font-semibold py-2 px-4">
                    ⚠ Sin conexión — recarga la página si el problema persiste
                </div>
            )}

            <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 items-center pointer-events-none">
                {notificaciones.map(n => (
                    <div key={n.id}
                         className="px-5 py-2.5 rounded-full text-sm font-semibold text-white
                                    bg-game-dark/90 border border-game-border backdrop-blur-sm
                                    animate-bounce shadow-lg">
                        {n.texto}
                    </div>
                ))}
            </div>

            <div className="flex flex-1 overflow-hidden">

                <div className={`w-72 flex-shrink-0 border-r flex flex-col
                                 ${isDark ? 'bg-game-card border-game-border' : 'bg-white border-gray-200'}`}>

                    <div className={`p-5 border-b ${isDark ? 'border-game-border' : 'border-gray-100'}`}>
                        <p className={`text-xs font-semibold uppercase tracking-widest mb-2
                                       ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                            Código de sala
                        </p>
                        <button onClick={copiarCodigo}
                                className={`w-full py-3 px-4 rounded-xl font-game font-black text-3xl tracking-[0.3em]
                                            border-2 transition-all hover:scale-105
                                            ${isDark
                                    ? 'bg-game-dark border-game-purple/50 text-game-cyan hover:border-game-purple glow-cyan'
                                    : 'bg-purple-50 border-purple-300 text-purple-700 hover:border-purple-500'}`}>
                            {codigo}
                        </button>
                        <p className={`text-center text-xs mt-2 ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                            Click para copiar
                        </p>
                    </div>

                    <div className="p-5 flex-1 overflow-y-auto">
                        <div className="flex items-center justify-between mb-4">
                            <p className={`text-xs font-semibold uppercase tracking-widest
                                           ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                Jugadores
                            </p>
                            <span className={`text-xs px-2 py-1 rounded-full font-game font-bold
                                             ${isDark ? 'bg-game-purple/20 text-game-purple-light' : 'bg-purple-100 text-purple-600'}`}>
                                {participantes.length}/{sala.maxJugadores}
                            </span>
                        </div>

                        <div className={`w-full h-2 rounded-full mb-5 overflow-hidden
                                         ${isDark ? 'bg-game-dark' : 'bg-gray-200'}`}>
                            <div className="h-full rounded-full bg-gradient-to-r from-game-purple to-game-cyan transition-all duration-500"
                                 style={{ width: `${(participantes.length / sala.maxJugadores) * 100}%` }} />
                        </div>

                        <div className="space-y-2">
                            {participantes.map((p, i) => (
                                <div key={i}
                                     className={`flex items-center gap-3 p-3 rounded-xl
                     ${isDark ? 'bg-game-dark' : 'bg-gray-50'}`}>
                                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold
                        bg-gradient-to-br from-game-purple to-game-cyan text-white flex-shrink-0">
                                        {p.nombre.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className={`font-semibold text-sm truncate
                           ${isDark ? 'text-white' : 'text-gray-800'}`}>
                                            {p.nombre}
                                        </p>
                                        {p.nombre === sala.creador && (
                                            <p className="text-xs text-game-cyan">⭐ Creador</p>
                                        )}
                                    </div>
                                    <div className={`w-2 h-2 rounded-full flex-shrink-0
                         ${p.estadoConexion === 'CONECTADO' ? 'bg-green-400' : 'bg-gray-500'}`} />
                                </div>
                            ))}
                        </div>
                    </div>

                    {esCreador && (
                        <div className={`p-5 border-t ${isDark ? 'border-game-border' : 'border-gray-100'}`}>
                            <button
                                onClick={() => {
                                    sendMessage(`/app/sala/${codigo}/iniciar`, {
                                        tipo: 'INICIAR',
                                        remitente: user?.email,
                                        codigoSala: codigo,
                                    })
                                    sala?.modo === 'PRUEBA'
                                        ? navigate(`/sala/${codigo}/panel-host`)
                                        : sala?.modo === 'PRESENTACIONES'
                                            ? navigate(`/presentacion/${codigo}`)
                                            : navigate(`/juego/${codigo}`)
                                }}
                                className="w-full py-3 rounded-xl font-game font-bold tracking-wider uppercase
                       bg-gradient-to-r from-game-purple to-game-cyan text-white
                       hover:opacity-90 transition-all glow-purple text-sm">
                                ⚡ INICIAR PARTIDA
                            </button>
                            <p className={`text-center text-xs mt-2 ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                                Solo visible para el creador
                            </p>
                        </div>
                    )}
                </div>

                <div className="flex-1 flex flex-col overflow-hidden">

                    <div className={`px-6 py-4 border-b flex-shrink-0
                                     ${isDark ? 'bg-game-card/50 border-game-border' : 'bg-white border-gray-100'}`}>
                        <div className="flex items-center gap-2">
                            <span className="text-lg">💬</span>
                            <h3 className={`font-game font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>
                                CHAT DE SALA — {sala.nombre}
                            </h3>
                        </div>
                    </div>

                    <div className="overflow-y-auto p-6 space-y-4" style={{ maxHeight: '420px' }}>
                        {mensajes.length === 0 && (
                            <div className="flex flex-col items-center justify-center h-full text-center">
                                <div className="text-5xl mb-4">💬</div>
                                <p className={`font-game text-lg ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                                    Nadie ha escrito aún
                                </p>
                                <p className={`text-sm mt-1 ${isDark ? 'text-gray-700' : 'text-gray-300'}`}>
                                    ¡Sé el primero en saludar!
                                </p>
                            </div>
                        )}

                        {mensajes.map((msg, i) => {
                            const esMio = msg.remitente === user?.email
                            return (
                                <div key={i} className={`flex ${esMio ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-xs lg:max-w-md ${esMio ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                                        {!esMio && (
                                            <span className={`text-xs font-semibold px-1
                                                             ${isDark ? 'text-game-purple-light' : 'text-purple-600'}`}>
                                                {msg.remitente}
                                            </span>
                                        )}
                                        <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed
                                                         ${esMio
                                            ? 'bg-gradient-to-br from-game-purple to-game-cyan text-white rounded-tr-sm'
                                            : isDark
                                                ? 'bg-game-card border border-game-border text-gray-200 rounded-tl-sm'
                                                : 'bg-white border border-gray-200 text-gray-700 rounded-tl-sm shadow-sm'}`}>
                                            {msg.mensaje}
                                        </div>
                                        {msg.fechaEnvio && (
                                            <span className={`text-xs px-1 ${isDark ? 'text-gray-700' : 'text-gray-400'}`}>
                                                {new Date(msg.fechaEnvio).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            )
                        })}

                        {writingUsers.length > 0 && (
                            <div className="flex justify-start">
                                <div className={`px-4 py-2.5 rounded-2xl rounded-tl-sm text-sm flex items-center gap-2
                                                ${isDark ? 'bg-game-card border border-game-border text-gray-400' : 'bg-white border border-gray-200 text-gray-500 shadow-sm'}`}>
                                    <span className="text-xs">
                                        {writingUsers.length === 1
                                            ? `${writingUsers[0].nombre} está escribiendo`
                                            : `${writingUsers.map(u => u.nombre).join(', ')} están escribiendo`}
                                    </span>
                                    <span className="flex gap-0.5">
                                        <span className="w-1.5 h-1.5 rounded-full bg-current animate-bounce" style={{ animationDelay: '0ms' }} />
                                        <span className="w-1.5 h-1.5 rounded-full bg-current animate-bounce" style={{ animationDelay: '150ms' }} />
                                        <span className="w-1.5 h-1.5 rounded-full bg-current animate-bounce" style={{ animationDelay: '300ms' }} />
                                    </span>
                                </div>
                            </div>
                        )}

                        <div ref={chatEndRef} />
                    </div>

                    <div className={`px-6 py-4 border-t flex-shrink-0
                                     ${isDark ? 'bg-game-card/50 border-game-border' : 'bg-white border-gray-100'}`}>
                        <div className="flex gap-3">
                            <input
                                type="text"
                                value={inputChat}
                                onChange={handleInputChange}
                                onKeyDown={handleKeyDown}
                                placeholder="Escribe un mensaje... (Enter para enviar)"
                                maxLength={500}
                                className={`flex-1 px-4 py-3 rounded-xl border text-sm transition-all
                                            focus:outline-none focus:ring-2 focus:ring-game-purple
                                            ${isDark
                                    ? 'bg-game-dark border-game-border text-white placeholder-gray-600'
                                    : 'bg-gray-50 border-gray-200 text-gray-800 placeholder-gray-400'}`}
                            />
                            <button
                                onClick={enviarMensaje}
                                disabled={!inputChat.trim()}
                                className="px-5 py-3 rounded-xl font-game font-bold text-sm
                                           bg-gradient-to-r from-game-purple to-game-cyan text-white
                                           hover:opacity-90 transition-all glow-purple
                                           disabled:opacity-30 disabled:cursor-not-allowed">
                                ➤
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}