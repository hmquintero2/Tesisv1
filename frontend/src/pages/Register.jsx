import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTheme } from '../context/ThemeContext'
import ThemeToggle from '../components/ThemeToggle'
import api from '../api/axios'

export default function Register() {
    const [form, setForm]       = useState({ nombre: '', email: '', password: '' })
    const [error, setError]     = useState('')
    const [loading, setLoading] = useState(false)
    const [registrado, setRegistrado] = useState(false)
    const [emailRegistrado, setEmailRegistrado] = useState('')
    const navigate              = useNavigate()
    const { isDark }            = useTheme()

    const handleChange = (e) =>
        setForm({ ...form, [e.target.name]: e.target.value })

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        setError('')
        try {
            const { data } = await api.post('/auth/register', form)
            // El registro ahora devuelve mensaje, NO token
            // La cuenta queda INACTIVE hasta verificar OTP
            setEmailRegistrado(form.email)
            setRegistrado(true)
        } catch (err) {
            setError(err.response?.data?.error || 'Error al registrarse')
        } finally {
            setLoading(false)
        }
    }

    // ── Pantalla de éxito: pedir que vaya a verificar OTP ─────────
    if (registrado) return (
        <div className={`min-h-screen flex items-center justify-center
            ${isDark ? 'bg-game-darker' : 'bg-gray-100'}`}>
            <div className={`w-full max-w-md mx-4 p-8 rounded-2xl border
                text-center
                ${isDark
                ? 'bg-game-card border-game-purple/40 backdrop-blur-sm'
                : 'bg-white border-purple-200 shadow-2xl'}`}>

                <div className="text-6xl mb-4">📧</div>
                <h2 className={`font-game text-2xl font-black mb-3
                    ${isDark ? 'text-white' : 'text-gray-800'}`}>
                    ¡CUENTA CREADA!
                </h2>
                <p className={`text-sm mb-2
                    ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                    Te enviamos un código de verificación a:
                </p>
                <p className="font-bold text-game-cyan mb-4">
                    {emailRegistrado}
                </p>
                <p className={`text-sm mb-6
                    ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    Revisa tu bandeja de entrada e ingresa el código
                    de 6 dígitos para activar tu cuenta.
                    Puede tardar hasta 30 segundos en llegar.
                </p>

                <button
                    onClick={() => navigate('/verificar-otp',
                        { state: { email: emailRegistrado } })}
                    className="w-full py-3 rounded-xl font-game
                        font-bold text-lg tracking-widest uppercase
                        bg-gradient-to-r from-game-purple to-game-cyan
                        text-white hover:opacity-90 transition-all
                        glow-purple mb-3">
                    VERIFICAR CÓDIGO OTP
                </button>

                <p className={`text-sm
                    ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                    <Link to="/login"
                          className="text-game-cyan
                            hover:text-game-purple-light
                            font-semibold transition-colors">
                        ← Volver al login
                    </Link>
                </p>
            </div>
        </div>
    )

    // ── Formulario de registro ────────────────────────────────────
    return (
        <div className={`min-h-screen flex items-center justify-center
            relative overflow-hidden
            ${isDark ? 'bg-game-darker' : 'bg-gray-100'}
            transition-colors duration-300`}>

            {isDark && (
                <div className="absolute inset-0 overflow-hidden
                                pointer-events-none">
                    <div className="absolute -top-40 -right-40 w-96 h-96
                        bg-game-pink/20 rounded-full blur-3xl
                        animate-pulse-slow" />
                    <div className="absolute -bottom-40 -left-40 w-96 h-96
                        bg-game-purple/20 rounded-full blur-3xl
                        animate-pulse-slow" />
                </div>
            )}

            <div className="absolute top-4 right-4">
                <ThemeToggle />
            </div>

            <div className={`relative z-10 w-full max-w-md mx-4 p-8
                rounded-2xl border
                ${isDark
                ? 'bg-game-card/80 border-game-pink/40 backdrop-blur-sm'
                : 'bg-white border-pink-200 shadow-2xl'}`}>

                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center
                        w-20 h-20 rounded-2xl mb-4
                        bg-gradient-to-br from-game-pink to-game-purple
                        glow-purple">
                        <span className="text-4xl">🛡️</span>
                    </div>
                    <h1 className={`font-game text-3xl font-black
                        tracking-wider
                        ${isDark ? 'text-white' : 'text-gray-800'}`}>
                        CREAR <span className="text-game-pink">CUENTA</span>
                    </h1>
                    <p className={`mt-1 text-sm
                        ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        Únete a la batalla
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    {[
                        { field: 'nombre',   label: 'Nombre',      type: 'text',     ph: 'Tu nombre' },
                        { field: 'email',    label: 'Correo',      type: 'email',    ph: 'tu@correo.com' },
                        { field: 'password', label: 'Contraseña',  type: 'password', ph: '••••••••' },
                    ].map(({ field, label, type, ph }) => (
                        <div key={field}>
                            <label className={`block text-sm font-semibold
                                mb-2 uppercase tracking-widest
                                ${isDark
                                ? 'text-game-purple-light'
                                : 'text-purple-600'}`}>
                                {label}
                            </label>
                            <input
                                type={type}
                                name={field}
                                value={form[field]}
                                onChange={handleChange}
                                placeholder={ph}
                                required
                                minLength={field === 'password' ? 6 : undefined}
                                className={`w-full px-4 py-3 rounded-xl
                                    border text-base transition-all
                                    duration-200 focus:outline-none
                                    focus:ring-2 focus:ring-game-pink
                                    ${isDark
                                    ? 'bg-game-dark border-game-border text-white placeholder-gray-600'
                                    : 'bg-gray-50 border-gray-200 text-gray-800 placeholder-gray-400'}`}
                            />
                        </div>
                    ))}

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
                            bg-gradient-to-r from-game-pink
                            to-game-purple text-white hover:opacity-90
                            transition-all duration-200
                            disabled:opacity-50
                            disabled:cursor-not-allowed uppercase">
                        {loading ? 'CREANDO...' : 'CREAR CUENTA'}
                    </button>
                </form>

                <p className={`mt-6 text-center text-sm
                    ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                    ¿Ya tienes cuenta?{' '}
                    <Link to="/login"
                          className="text-game-cyan
                            hover:text-game-purple-light
                            font-semibold transition-colors">
                        Inicia sesión
                    </Link>
                </p>
            </div>
        </div>
    )
}