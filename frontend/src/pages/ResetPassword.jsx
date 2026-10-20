import { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useTheme } from '../context/ThemeContext'
import api from '../api/axios'

export default function ResetPassword() {
    const { isDark }                    = useTheme()
    const navigate                      = useNavigate()
    const [searchParams]                = useSearchParams()
    const [password, setPassword]       = useState('')
    const [confirmar, setConfirmar]     = useState('')
    const [loading, setLoading]         = useState(false)
    const [mensaje, setMensaje]         = useState('')
    const [error, setError]             = useState('')
    const [tokenValido, setTokenValido] = useState(true)

    const token = searchParams.get('token')
    const email = searchParams.get('email')

    useEffect(() => {
        if (!token || !email) {
            setTokenValido(false)
            setError('El enlace no es válido o está incompleto.')
        }
    }, [token, email])

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (password !== confirmar) {
            setError('Las contraseñas no coinciden.')
            return
        }
        if (password.length < 6) {
            setError('La contraseña debe tener al menos 6 caracteres.')
            return
        }
        setLoading(true)
        setError('')
        try {
            const { data } = await api.post('/auth/reset-password', {
                email,
                token,
                password
            })
            setMensaje(data.mensaje)
            setTimeout(() => navigate('/login'), 3000)
        } catch (err) {
            setError(err.response?.data?.error
                || 'El enlace expiró o no es válido.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className={`min-h-screen flex items-center justify-center
            ${isDark ? 'bg-game-darker' : 'bg-gray-100'}`}>
            <div className={`w-full max-w-md mx-4 p-8 rounded-2xl border
                ${isDark
                ? 'bg-game-card border-game-purple/40 backdrop-blur-sm'
                : 'bg-white border-purple-200 shadow-2xl'}`}>

                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center
                        w-20 h-20 rounded-2xl mb-4
                        bg-gradient-to-br from-game-purple to-game-cyan
                        glow-purple">
                        <span className="text-4xl">🔒</span>
                    </div>
                    <h1 className={`font-game text-2xl font-black
                        tracking-wider
                        ${isDark ? 'text-white' : 'text-gray-800'}`}>
                        NUEVA CONTRASEÑA
                    </h1>
                    <p className={`mt-2 text-sm
                        ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        Ingresa tu nueva contraseña para
                        restablecer el acceso.
                    </p>
                </div>

                {mensaje ? (
                    <div className="space-y-4">
                        <div className="p-4 rounded-xl bg-green-500/10
                            border border-green-500/30 text-green-400
                            text-sm text-center">
                            ✅ {mensaje}
                        </div>
                        <p className={`text-xs text-center
                            ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                            Redirigiendo al login en 3 segundos...
                        </p>
                        <Link to="/login"
                              className="block w-full py-3 rounded-xl
                                font-game font-bold text-sm uppercase
                                tracking-widest text-center
                                bg-gradient-to-r from-game-purple
                                to-game-cyan text-white hover:opacity-90">
                            IR AL LOGIN
                        </Link>
                    </div>
                ) : !tokenValido ? (
                    <div className="space-y-4">
                        <div className="p-4 rounded-xl bg-red-500/10
                            border border-red-500/30 text-red-400
                            text-sm text-center">
                            ⚠️ {error}
                        </div>
                        <Link to="/recuperar-password"
                              className="block w-full py-3 rounded-xl
                                font-game font-bold text-sm uppercase
                                tracking-widest text-center border-2
                                transition-all border-game-purple
                                text-game-purple-light
                                hover:bg-game-purple/10">
                            Solicitar nuevo enlace
                        </Link>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-5">

                        {/* Email solo lectura para contexto */}
                        <div>
                            <label className={`block text-sm font-semibold
                                mb-2 uppercase tracking-widest
                                ${isDark
                                ? 'text-game-purple-light'
                                : 'text-purple-600'}`}>
                                Correo
                            </label>
                            <input
                                type="email"
                                value={email || ''}
                                readOnly
                                className={`w-full px-4 py-3 rounded-xl
                                    border text-base opacity-60
                                    cursor-not-allowed
                                    ${isDark
                                    ? 'bg-game-dark border-game-border text-white'
                                    : 'bg-gray-100 border-gray-200 text-gray-600'}`}
                            />
                        </div>

                        <div>
                            <label className={`block text-sm font-semibold
                                mb-2 uppercase tracking-widest
                                ${isDark
                                ? 'text-game-purple-light'
                                : 'text-purple-600'}`}>
                                Nueva contraseña
                            </label>
                            <input
                                type="password"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                                className={`w-full px-4 py-3 rounded-xl
                                    border text-base transition-all
                                    focus:outline-none focus:ring-2
                                    focus:ring-game-purple
                                    ${isDark
                                    ? 'bg-game-dark border-game-border text-white placeholder-gray-600'
                                    : 'bg-gray-50 border-gray-200 text-gray-800 placeholder-gray-400'}`}
                            />
                        </div>

                        <div>
                            <label className={`block text-sm font-semibold
                                mb-2 uppercase tracking-widest
                                ${isDark
                                ? 'text-game-purple-light'
                                : 'text-purple-600'}`}>
                                Confirmar contraseña
                            </label>
                            <input
                                type="password"
                                value={confirmar}
                                onChange={e => setConfirmar(e.target.value)}
                                placeholder="••••••••"
                                required
                                className={`w-full px-4 py-3 rounded-xl
                                    border text-base transition-all
                                    focus:outline-none focus:ring-2
                                    focus:ring-game-purple
                                    ${isDark
                                    ? 'bg-game-dark border-game-border text-white placeholder-gray-600'
                                    : 'bg-gray-50 border-gray-200 text-gray-800 placeholder-gray-400'}`}
                            />
                            {confirmar && password !== confirmar && (
                                <p className="text-red-400 text-xs mt-1">
                                    Las contraseñas no coinciden
                                </p>
                            )}
                            {confirmar && password === confirmar
                                && confirmar.length >= 6 && (
                                    <p className="text-green-400 text-xs mt-1">
                                        ✓ Las contraseñas coinciden
                                    </p>
                                )}
                        </div>

                        {error && (
                            <div className="p-3 rounded-xl bg-red-500/10
                                border border-red-500/30 text-red-400
                                text-sm text-center">
                                ⚠️ {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading || password !== confirmar
                                || password.length < 6}
                            className="w-full py-3 rounded-xl font-game
                                font-bold text-lg tracking-widest
                                bg-gradient-to-r from-game-purple
                                to-game-cyan text-white hover:opacity-90
                                transition-all glow-purple
                                disabled:opacity-50
                                disabled:cursor-not-allowed uppercase">
                            {loading
                                ? 'GUARDANDO...'
                                : 'RESTABLECER CONTRASEÑA'}
                        </button>

                        <p className={`text-center text-sm
                            ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                            <Link to="/login"
                                  className="text-game-cyan
                                    hover:text-game-purple-light
                                    font-semibold transition-colors">
                                ← Volver al login
                            </Link>
                        </p>
                    </form>
                )}
            </div>
        </div>
    )
}