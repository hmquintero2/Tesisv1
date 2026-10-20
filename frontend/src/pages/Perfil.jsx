import { useState, useEffect } from 'react'
import { useTheme } from '../context/ThemeContext'
import { usuarioAPI } from '../api/usuarioAPI'
import SelectorAvatar from '../components/SelectorAvatar'
import AvatarCirculo from '../components/AvatarCirculo'

export default function Perfil() {
    const { isDark } = useTheme()
    const [perfil, setPerfil]       = useState(null)
    const [avatarId, setAvatarId]   = useState('gato')
    const [guardando, setGuardando] = useState(false)
    const [mensaje, setMensaje]     = useState('')

    useEffect(() => {
        usuarioAPI.perfil().then(data => {
            setPerfil(data)
            setAvatarId(data.avatarId)
        })
    }, [])

    const guardar = async () => {
        setGuardando(true); setMensaje('')
        try {
            await usuarioAPI.actualizarAvatar(avatarId)
            setMensaje('✓ Avatar actualizado')
            setPerfil(prev => ({ ...prev, avatarId }))
        } catch (e) {
            setMensaje(e.error || 'Error al guardar')
        } finally { setGuardando(false) }
    }

    const c  = (x='') => `p-6 rounded-2xl border ${isDark?'bg-game-card border-game-border':'bg-white border-gray-200 shadow'} ${x}`
    const tx = (x='') => `${isDark?'text-white':'text-gray-800'} ${x}`
    const tx2 = `text-xs ${isDark?'text-gray-400':'text-gray-500'}`

    if (!perfil) {
        return (
            <div className={`flex-1 ${isDark?'bg-game-darker':'bg-gray-100'} p-6 flex items-center justify-center`}>
                <p className={tx()}>Cargando perfil...</p>
            </div>
        )
    }

    return (
        <div className={`flex-1 ${isDark?'bg-game-darker':'bg-gray-100'} p-6`}>
            <div className="max-w-2xl mx-auto space-y-5 animate-fade-in">
                <div>
                    <h1 className={`font-game text-2xl font-black ${tx()}`}>👤 MI PERFIL</h1>
                    <p className={tx2}>Elige tu avatar — se guarda hasta que lo cambies</p>
                </div>

                <div className={c()}>
                    <div className="flex items-center gap-4 mb-6">
                        <AvatarCirculo seed={avatarId} size={72} />
                        <div>
                            <p className={tx('text-lg font-bold')}>{perfil.nombre}</p>
                            <p className={tx2}>{perfil.email}</p>
                        </div>
                    </div>

                    <h2 className={`font-game font-bold mb-3 text-sm ${tx()}`}>Elige tu avatar</h2>
                    <SelectorAvatar seleccionado={avatarId} onSeleccionar={setAvatarId} />

                    {mensaje && (
                        <p className={`text-sm mt-4 ${mensaje.startsWith('✓')?'text-green-400':'text-red-400'}`}>
                            {mensaje}
                        </p>
                    )}

                    <button onClick={guardar} disabled={guardando || avatarId === perfil.avatarId}
                            className="mt-4 px-8 py-3 rounded-xl font-game font-bold bg-game-purple text-white hover:bg-game-purple/80 disabled:opacity-50 transition-all">
                        {guardando ? 'Guardando...' : 'GUARDAR AVATAR'}
                    </button>
                </div>
            </div>
        </div>
    )
}