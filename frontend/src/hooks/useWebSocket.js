import { useEffect, useRef, useCallback, useState } from 'react'
import { Client } from '@stomp/stompjs'
import SockJS from 'sockjs-client/dist/sockjs'

export function useWebSocket(codigoSala, onMessage, onParticipants, onConnect, onTyping, onJuego, onRanking) {
    const clientRef = useRef(null)
    const connectedRef = useRef(false)
    const [connectionStatus, setConnectionStatus] = useState('disconnected')

    const onMessageRef = useRef(onMessage)
    const onParticipantsRef = useRef(onParticipants)
    const onConnectRef = useRef(onConnect)
    const onTypingRef = useRef(onTyping)
    const onJuegoRef = useRef(onJuego)
    const onRankingRef = useRef(onRanking)

    useEffect(() => { onMessageRef.current = onMessage }, [onMessage])
    useEffect(() => { onParticipantsRef.current = onParticipants }, [onParticipants])
    useEffect(() => { onConnectRef.current = onConnect }, [onConnect])
    useEffect(() => { onTypingRef.current = onTyping }, [onTyping])
    useEffect(() => { onJuegoRef.current = onJuego }, [onJuego])
    useEffect(() => { onRankingRef.current = onRanking }, [onRanking])

    useEffect(() => {
        if (!codigoSala) return

        const token = localStorage.getItem('token')
        let reconnectAttempts = 0
        const MAX_RECONNECT_ATTEMPTS = 5

        const client = new Client({
            webSocketFactory: () => new SockJS('http://192.168.100.23:8080/ws'),
            reconnectDelay: 3000,
            connectHeaders: {
                Authorization: token ? `Bearer ${token}` : '',
            },
            onConnect: () => {
                connectedRef.current = true
                reconnectAttempts = 0
                setConnectionStatus('connected')

                client.subscribe(`/topic/sala/${codigoSala}`, (msg) => {
                    onMessageRef.current(JSON.parse(msg.body))
                })

                client.subscribe(`/topic/sala/${codigoSala}/participantes`, (msg) => {
                    onParticipantsRef.current(JSON.parse(msg.body))
                })

                client.subscribe(`/topic/sala/${codigoSala}/typing`, (msg) => {
                    if (onTypingRef.current) onTypingRef.current(JSON.parse(msg.body))
                })

                client.subscribe(`/topic/sala/${codigoSala}/juego`, (msg) => {
                    if (onJuegoRef.current) onJuegoRef.current(JSON.parse(msg.body))
                })

                client.subscribe(`/topic/sala/${codigoSala}/ranking`, (msg) => {
                    if (onRankingRef.current) onRankingRef.current(JSON.parse(msg.body))
                })

                if (onConnectRef.current) onConnectRef.current()
            },
            onDisconnect: () => {
                connectedRef.current = false
                setConnectionStatus('reconnecting')
            },
            onStompError: (frame) => {
                console.error('STOMP error:', frame)
                reconnectAttempts++
                if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
                    setConnectionStatus('disconnected')
                    client.deactivate()
                }
            },
            onWebSocketClose: () => {
                if (connectedRef.current) setConnectionStatus('reconnecting')
            },
        })

        client.activate()
        clientRef.current = client

        return () => {
            connectedRef.current = false
            client.deactivate()
        }
    }, [codigoSala])

    const sendMessage = useCallback((destination, body) => {
        if (clientRef.current?.connected) {
            clientRef.current.publish({ destination, body: JSON.stringify(body) })
        } else {
            console.warn('WebSocket no conectado, no se pudo enviar:', destination)
        }
    }, [])

    const isConnected = useCallback(() => connectedRef.current, [])

    return { sendMessage, isConnected, connectionStatus }
}