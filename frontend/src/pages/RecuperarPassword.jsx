import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTheme } from '../context/ThemeContext'
import api from '../api/axios'

export default function RecuperarPassword() {
    const { isDark } = useTheme()
    const [email, setEmail]     = useState('')
    const [loading, setLoading] = useState(false)
    const [mensaje, setMensaje] = useState('')
    const [error, setError]     = useState('')

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        setMensaje('')
        setError('')
        try {
            const { data } = await api.post('/auth/recuperar-password', { email })
            setMensaje(data.mensaje)
        } catch (err) {
            setError(err.response?.data?.error || 'No se pudo enviar el enlace')
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
                        <span className="text-4xl">🔑</span>
                    </div>
                    <h1 className={`font-game text-2xl font-black
                        tracking-wider
                        ${isDark ? 'text-white' : 'text-gray-800'}`}>
                        RECUPERAR CUENTA
                    </h1>
                    <p className={`mt-2 text-sm
                        ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        Ingresa tu correo y te enviaremos un enlace
                        para restablecer tu contraseña.
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
                            Revisa tu bandeja de entrada y haz clic
                            en el botón del correo.
                        </p>
                        <Link to="/login"
                              className="block w-full py-3 rounded-xl
                                font-game font-bold text-sm uppercase
                                tracking-widest text-center border-2
                                transition-all border-game-cyan
                                text-game-cyan hover:bg-game-cyan/10">
                            Volver al login
                        </Link>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className={`block text-sm font-semibold
                                mb-2 uppercase tracking-widest
                                ${isDark
                                ? 'text-game-purple-light'
                                : 'text-purple-600'}`}>
                                Correo registrado
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                placeholder="tu@correo.com"
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

                        {error && (
                            <div className="p-3 rounded-xl bg-red-500/10
                                border border-red-500/30 text-red-400
                                text-sm text-center">
                                ⚠️ {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 rounded-xl font-game
                                font-bold text-lg tracking-widest
                                bg-gradient-to-r from-game-purple
                                to-game-cyan text-white hover:opacity-90
                                transition-all glow-purple
                                disabled:opacity-50
                                disabled:cursor-not-allowed uppercase">
                            {loading ? 'ENVIANDO...' : 'ENVIAR ENLACE'}
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