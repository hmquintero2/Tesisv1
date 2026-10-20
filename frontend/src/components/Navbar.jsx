import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import ThemeToggle from './ThemeToggle'
import AvatarCirculo from './AvatarCirculo'
import { usuarioAPI } from '../api/usuarioAPI'

export default function Navbar() {
    const { user, logout } = useAuth()
    const { isDark } = useTheme()
    const navigate = useNavigate()
    const location = useLocation()
    const [avatarId, setAvatarId] = useState(null)

    useEffect(() => {
        if (user) {
            usuarioAPI.perfil().then(data => setAvatarId(data.avatarId)).catch(() => {})
        }
    }, [user, location.pathname]) // se refresca al volver de /perfil

    const handleLogout = () => {
        logout()
        navigate('/login')
    }

    const isActive = (path) => location.pathname === path

    return (
        <nav className={`border-b px-6 py-4 flex items-center justify-between z-40
            ${isDark
            ? 'bg-game-card border-game-border'
            : 'bg-white border-gray-200 shadow-sm'}`}>

            {/* Logo */}
            <div
                onClick={() => navigate('/lobby')}
                className="flex items-center gap-3 cursor-pointer group">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center
                    bg-gradient-to-br from-game-purple to-game-cyan
                    group-hover:scale-110 transition-transform">
                    <span className="text-xl">⚔️</span>
                </div>
                <div>
                    <h1 className={`font-game font-black text-xl leading-none
                        ${isDark ? 'text-white' : 'text-gray-800'}`}>
                        CODE<span className="text-game-cyan">BATTLE</span>
                    </h1>
                    <p className={`text-xs leading-none mt-0.5
                        ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                        v1.0
                    </p>
                </div>
            </div>

            {/* Links centrales */}
            <div className="hidden md:flex items-center gap-1">
                <NavLink
                    label="🏠 Lobby"
                    active={isActive('/lobby')}
                    onClick={() => navigate('/lobby')}
                    isDark={isDark}
                />
                <NavLink
                    label="📋 Historial"
                    active={isActive('/historial')}
                    onClick={() => navigate('/historial')}
                    isDark={isDark}
                />
                <NavLink
                    label="👤 Perfil"
                    active={isActive('/perfil')}
                    onClick={() => navigate('/perfil')}
                    isDark={isDark}
                />
                <NavLink
                    label="📊 Benchmark"
                    active={isActive('/benchmark')}
                    onClick={() => navigate('/benchmark')}
                    isDark={isDark}
                />

            </div>

            {/* Derecha */}
            <div className="flex items-center gap-3">
                {user && (
                    <div className={`hidden sm:flex items-center gap-2 px-3 py-2
                        rounded-xl
                        ${isDark
                        ? 'bg-game-dark border border-game-border'
                        : 'bg-gray-100 border border-gray-200'}`}>
                        <AvatarCirculo seed={avatarId} size={28} />
                        <div className="leading-tight">
                            <p className={`text-sm font-semibold leading-none
                                ${isDark ? 'text-white' : 'text-gray-800'}`}>
                                {user.nombre}
                            </p>
                            <span className={`text-xs font-game
                                ${user.rol === 'ADMIN'
                                ? 'text-game-pink'
                                : 'text-game-purple-light'}`}>
                                {user.rol}
                            </span>
                        </div>
                        <div className="w-2 h-2 rounded-full bg-green-400
                                        animate-pulse ml-1" />
                    </div>
                )}

                <ThemeToggle />

                {user && (
                    <button
                        onClick={handleLogout}
                        className={`px-4 py-2 rounded-xl text-sm font-semibold
                            border transition-all hover:scale-105 active:scale-95
                            ${isDark
                            ? 'border-red-500/40 text-red-400 hover:bg-red-500/10'
                            : 'border-red-300 text-red-500 hover:bg-red-50'}`}>
                        Salir
                    </button>
                )}
            </div>
        </nav>
    )
}

function NavLink({ label, active, onClick, isDark }) {
    return (
        <button
            onClick={onClick}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all
                ${active
                ? isDark
                    ? 'bg-game-purple/20 text-game-purple-light border border-game-purple/40'
                    : 'bg-purple-100 text-purple-700 border border-purple-200'
                : isDark
                    ? 'text-gray-400 hover:text-white hover:bg-game-dark'
                    : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100'}`}>
            {label}
        </button>
    )
}