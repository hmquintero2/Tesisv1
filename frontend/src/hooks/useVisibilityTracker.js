import { useEffect } from 'react'

export function useVisibilityTracker(sendMessage, codigo, user, activo) {
    useEffect(() => {
        if (!activo) return

        const handleVisibility = () => {
            const escondida = document.hidden
            sendMessage(`/app/sala/${codigo}/abandono-pestana`, {
                tipo: 'ESTADO_CONEXION',
                remitente: user?.email,
                mensaje: escondida ? 'true' : 'false',
                codigoSala: codigo,
            })
        }

        document.addEventListener('visibilitychange', handleVisibility)
        return () => document.removeEventListener('visibilitychange', handleVisibility)
    }, [sendMessage, codigo, user, activo])
}