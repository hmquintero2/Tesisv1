import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import ThemeToggle from '../components/ThemeToggle'
import api from '../api/axios'

const GOOGLE_CLIENT_ID =
    '675904211346-9meeq92kc6a4v8v0cf8auaaeq4og7nbt.apps.googleusercontent.com'

export default function Login() {
    const [form, setForm]       = useState({ email: '', password: '' })
    const [error, setError]     = useState('')
    const [loading, setLoading] = useState(false)
    const { login }             = useAuth()
    const navigate              = useNavigate()
    const { isDark }            = useTheme()
    const googleBtnRef          = useRef(null)

    const handleChange = (e) =>
        setForm({ ...form, [e.target.name]: e.target.value })

    // Agregar estado al inicio del componente:
    const [requieresTotp, setRequieresTotp] = useState(false)
    const [emailTotp, setEmailTotp]         = useState('')
    const [codigoTotp, setCodigoTotp]       = useState('')
    const [loadingTotp, setLoadingTotp]     = useState(false)
    const [errorTotp, setErrorTotp]         = useState('')

// Reemplazar handleSubmit:
    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        setError('')
        try {
            const { data } = await api.post('/auth/login', form)

            // Si requiere TOTP, mostrar formulario de código
            if (data.requieresTotp) {
                setEmailTotp(form.email)
                setRequieresTotp(true)
                setLoading(false)
                return
            }

            login({
                id: data.id, nombre: data.nombre,
                email: data.email, rol: data.rol
            }, data.token)
            navigate('/lobby')
        } catch (err) {
            const msg = err.response?.data?.error || ''
            if (msg.includes('no está activa')) {
                navigate('/verificar-otp', { state: { email: form.email } })
            } else {
                setError(msg || 'Credenciales incorrectas')
            }
        } finally {
            setLoading(false)
        }
    }

// Agregar método para validar TOTP:
    const handleTotpSubmit = async (e) => {
        e.preventDefault()
        setLoadingTotp(true)
        setErrorTotp('')
        try {
            // Validar código TOTP
            const { data: totpData } = await api.post('/totp/validar-login', {
                email: emailTotp, codigo: codigoTotp
            })
            if (!totpData.ok) {
                setErrorTotp('Código incorrecto o vencido')
                return
            }
            // Código válido — hacer login completo
            const { data } = await api.post('/auth/login-totp', {
                email: emailTotp
            })
            login({
                id: data.id, nombre: data.nombre,
                email: data.email, rol: data.rol
            }, data.token)
            navigate('/lobby')
        } catch {
            setErrorTotp('Código incorrecto o vencido')
        } finally {
            setLoadingTotp(false)
        }
    }

    const handleGoogleResponse = async (response) => {
        setError('')
        try {
            const { data } = await api.post('/auth/google', {
                idToken: response.credential
            })
            login({
                id: data.id, nombre: data.nombre,
                email: data.email, rol: data.rol
            }, data.token)
            navigate('/lobby')
        } catch {
            setError('No se pudo iniciar sesión con Google')
        }
    }

    useEffect(() => {
        if (!window.google || !googleBtnRef.current) return
        window.google.accounts.id.initialize({
            client_id: GOOGLE_CLIENT_ID,
            callback: handleGoogleResponse,
        })
        window.google.accounts.id.renderButton(googleBtnRef.current, {
            theme: isDark ? 'filled_black' : 'outline',
            size: 'large',
            width: 320,
            text: 'continue_with',
        })
    }, [isDark])
    // Si requiere TOTP mostrar este formulario en lugar del login normal:
    if (requieresTotp) return (
        <div className={`min-h-screen flex items-center justify-center
        ${isDark ? 'bg-game-darker' : 'bg-gray-100'}`}>
            <div className={`w-full max-w-md mx-4 p-8 rounded-2xl border
            ${isDark
                ? 'bg-game-card border-game-purple/40'
                : 'bg-white border-purple-200 shadow-2xl'}`}>
                <div className="text-center mb-8">
                    <div className="text-5xl mb-4">🔐</div>
                    <h1 className={`font-game text-2xl font-black
                    ${isDark ? 'text-white' : 'text-gray-800'}`}>
                        VERIFICACIÓN EN 2 PASOS
                    </h1>
                    <p className={`mt-2 text-sm
                    ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        Ingresa el código de Google Authenticator
                    </p>
                </div>
                <form onSubmit={handleTotpSubmit} className="space-y-5">
                    <input type="text" value={codigoTotp}
                           onChange={e => setCodigoTotp(
                               e.target.value.replace(/\D/g, '').slice(0, 6))}
                           placeholder="000000"
                           maxLength={6}
                           className={`w-full px-4 py-3 rounded-xl border
                        text-center text-3xl font-game tracking-[0.5em]
                        font-bold focus:outline-none focus:ring-2
                        focus:ring-game-purple
                        ${isDark
                               ? 'bg-game-dark border-game-border text-white'
                               : 'bg-gray-50 border-gray-200 text-gray-800'}`}
                    />
                    <p className={`text-xs text-center
                    ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                        {codigoTotp.length}/6 dígitos
                    </p>
                    {errorTotp && (
                        <div className="p-3 rounded-xl bg-red-500/10
                        border border-red-500/30 text-red-400 text-sm
                        text-center">
                            ⚠️ {errorTotp}
                        </div>
                    )}
                    <button type="submit"
                            disabled={loadingTotp || codigoTotp.length !== 6}
                            className="w-full py-3 rounded-xl font-game font-bold
                        text-lg tracking-widest uppercase
                        bg-gradient-to-r from-game-purple to-game-cyan
                        text-white hover:opacity-90 transition-all
                        disabled:opacity-50 disabled:cursor-not-allowed">
                        {loadingTotp ? 'VERIFICANDO...' : 'VERIFICAR'}
                    </button>
                    <button type="button"
                            onClick={() => setRequieresTotp(false)}
                            className={`w-full py-2 rounded-xl text-sm
                        font-semibold border transition-all
                        ${isDark
                                ? 'border-game-border text-gray-400 hover:bg-game-dark'
                                : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}>
                        ← Volver al login
                    </button>
                </form>
            </div>
        </div>
    )

    return (
        <div className={`min-h-screen flex items-center justify-center
            relative overflow-hidden
            ${isDark ? 'bg-game-darker' : 'bg-gray-100'}
            transition-colors duration-300`}>

            {isDark && (
                <div className="absolute inset-0 overflow-hidden
                                pointer-events-none">
                    <div className="absolute -top-40 -left-40 w-96 h-96
                        bg-game-purple/20 rounded-full blur-3xl
                        animate-pulse-slow" />
                    <div className="absolute -bottom-40 -right-40 w-96 h-96
                        bg-game-cyan/20 rounded-full blur-3xl
                        animate-pulse-slow"
                         style={{ animationDelay: '1s' }} />
                    <div className="absolute top-1/2 left-1/2
                        -translate-x-1/2 -translate-y-1/2 w-64 h-64
                        bg-game-pink/10 rounded-full blur-3xl" />
                </div>
            )}

            <div className="absolute top-4 right-4">
                <ThemeToggle />
            </div>

            <div className={`relative z-10 w-full max-w-md mx-4 p-8
                rounded-2xl border
                ${isDark
                ? 'bg-game-card/80 border-game-purple/40 backdrop-blur-sm'
                : 'bg-white border-purple-200 shadow-2xl'}`}>

                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center
                        w-20 h-20 rounded-2xl mb-4
                        bg-gradient-to-br from-game-purple to-game-cyan
                        glow-purple">
                        <span className="text-4xl">⚔️</span>
                    </div>
                    <h1 className={`font-game text-3xl font-black
                        tracking-wider
                        ${isDark ? 'text-white' : 'text-gray-800'}`}>
                        CODE<span className="text-game-cyan">BATTLE</span>
                    </h1>
                    <p className={`mt-1 text-sm
                        ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        Compite. Programa. Vence.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
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
                            name="email"
                            value={form.email}
                            onChange={handleChange}
                            placeholder="tu@correo.com"
                            required
                            className={`w-full px-4 py-3 rounded-xl border
                                text-base transition-all duration-200
                                focus:outline-none focus:ring-2
                                focus:ring-game-purple
                                ${isDark
                                ? 'bg-game-dark border-game-border text-white placeholder-gray-600'
                                : 'bg-gray-50 border-gray-200 text-gray-800 placeholder-gray-400'}`}
                        />
                    </div>

                    <div>
                        <div className="flex items-center
                                        justify-between mb-2">
                            <label className={`text-sm font-semibold
                                uppercase tracking-widest
                                ${isDark
                                ? 'text-game-purple-light'
                                : 'text-purple-600'}`}>
                                Contraseña
                            </label>
                            {/* ── Enlace recuperar contraseña ── */}
                            <Link to="/recuperar-password"
                                  className={`text-xs font-semibold
                                    transition-colors
                                    ${isDark
                                      ? 'text-gray-400 hover:text-game-cyan'
                                      : 'text-gray-400 hover:text-purple-600'}`}>
                                ¿Olvidaste tu contraseña?
                            </Link>
                        </div>
                        <input
                            type="password"
                            name="password"
                            value={form.password}
                            onChange={handleChange}
                            placeholder="••••••••"
                            required
                            className={`w-full px-4 py-3 rounded-xl border
                                text-base transition-all duration-200
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
                            transition-all duration-200 glow-purple
                            disabled:opacity-50
                            disabled:cursor-not-allowed uppercase">
                        {loading ? 'CARGANDO...' : 'INGRESAR'}
                    </button>
                </form>

                <div className={`flex items-center gap-3 my-5`}>
                    <div className={`flex-1 h-px
                        ${isDark ? 'bg-game-border' : 'bg-gray-200'}`} />
                    <span className={`text-xs uppercase
                        ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                        o
                    </span>
                    <div className={`flex-1 h-px
                        ${isDark ? 'bg-game-border' : 'bg-gray-200'}`} />
                </div>

                <div ref={googleBtnRef} className="flex justify-center" />

                <div className="mt-6 space-y-2 text-center">
                    <p className={`text-sm
                        ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                        ¿No tienes cuenta?{' '}
                        <Link to="/register"
                              className="text-game-cyan
                                hover:text-game-purple-light
                                font-semibold transition-colors">
                            Regístrate
                        </Link>
                    </p>
                    <p className={`text-sm
                        ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                        ¿Cuenta sin verificar?{' '}
                        <Link to="/verificar-otp"
                              className="text-game-cyan
                                hover:text-game-purple-light
                                font-semibold transition-colors">
                            Verificar código OTP
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    )
}