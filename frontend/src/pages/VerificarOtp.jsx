import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useTheme } from '../context/ThemeContext'
import api from '../api/axios'

export default function VerificarOtp() {
    const { isDark }            = useTheme()
    const navigate              = useNavigate()
    const location              = useLocation()

    // El email puede venir del state de navegación o el usuario lo escribe
    const emailInicial = location.state?.email || ''

    const [email, setEmail]     = useState(emailInicial)
    const [codigo, setCodigo]   = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError]     = useState('')
    const [mensaje, setMensaje] = useState('')
    const [reenvioOk, setReenvioOk] = useState(false)

    const handleVerificar = async (e) => {
        e.preventDefault()
        setLoading(true)
        setError('')
        setMensaje('')
        try {
            const { data } = await api.post('/auth/verificar-otp', {
                email, codigo
            })
            setMensaje(data.mensaje)
            setTimeout(() => navigate('/login'), 2500)
        } catch (err) {
            setError(err.response?.data?.error || 'Código incorrecto')
        } finally {
            setLoading(false)
        }
    }

    const handleReenviar = async () => {
        if (!email) { setError('Ingresa tu correo primero'); return }
        setLoading(true)
        setError('')
        setReenvioOk(false)
        try {
            await api.post('/auth/reenviar-otp', { email })
            setReenvioOk(true)
        } catch (err) {
            setError(err.response?.data?.error
                || 'No se pudo reenviar el código')
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
                        <span className="text-4xl">📧</span>
                    </div>
                    <h1 className={`font-game text-2xl font-black
                        tracking-wider
                        ${isDark ? 'text-white' : 'text-gray-800'}`}>
                        VERIFICAR CUENTA
                    </h1>
                    <p className={`mt-2 text-sm
                        ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        Ingresa el código de 6 dígitos que
                        enviamos a tu correo.
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
                            Redirigiendo al login...
                        </p>
                    </div>
                ) : (
                    <form onSubmit={handleVerificar} className="space-y-5">

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

                        <div>
                            <label className={`block text-sm font-semibold
                                mb-2 uppercase tracking-widest
                                ${isDark
                                ? 'text-game-purple-light'
                                : 'text-purple-600'}`}>
                                Código de verificación
                            </label>
                            <input
                                type="text"
                                value={codigo}
                                onChange={e => setCodigo(
                                    e.target.value.replace(/\D/g, '')
                                        .slice(0, 6))}
                                placeholder="000000"
                                maxLength={6}
                                required
                                className={`w-full px-4 py-3 rounded-xl
                                    border text-center text-3xl font-game
                                    tracking-[0.5em] font-bold
                                    focus:outline-none focus:ring-2
                                    focus:ring-game-purple transition-all
                                    ${isDark
                                    ? 'bg-game-dark border-game-border text-white placeholder-gray-600'
                                    : 'bg-gray-50 border-gray-200 text-gray-800 placeholder-gray-300'}`}
                            />
                            <p className={`text-xs mt-1
                                ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                                {codigo.length}/6 dígitos
                            </p>
                        </div>

                        {error && (
                            <div className="p-3 rounded-xl bg-red-500/10
                                border border-red-500/30 text-red-400
                                text-sm text-center">
                                ⚠️ {error}
                            </div>
                        )}

                        {reenvioOk && (
                            <div className="p-3 rounded-xl bg-blue-500/10
                                border border-blue-500/30 text-blue-400
                                text-sm text-center">
                                📨 Nuevo código enviado. Revisa tu correo.
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading || codigo.length !== 6}
                            className="w-full py-3 rounded-xl font-game
                                font-bold text-lg tracking-widest
                                bg-gradient-to-r from-game-purple
                                to-game-cyan text-white hover:opacity-90
                                transition-all glow-purple
                                disabled:opacity-50
                                disabled:cursor-not-allowed uppercase">
                            {loading ? 'VERIFICANDO...' : 'ACTIVAR CUENTA'}
                        </button>

                        <button
                            type="button"
                            onClick={handleReenviar}
                            disabled={loading}
                            className={`w-full py-3 rounded-xl font-game
                                font-bold text-sm tracking-widest
                                uppercase border-2 transition-all
                                disabled:opacity-50
                                disabled:cursor-not-allowed
                                ${isDark
                                ? 'border-game-border text-gray-400 hover:bg-game-dark'
                                : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}>
                            🔄 REENVIAR CÓDIGO
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