import { useTheme } from '../context/ThemeContext'

export default function ThemeToggle() {
    const { isDark, toggleTheme } = useTheme()

    return (
        <button
            onClick={toggleTheme}
            className="relative w-14 h-7 rounded-full transition-colors duration-300
                 bg-game-border dark:bg-game-purple border border-game-purple
                 focus:outline-none"
            title="Cambiar tema"
        >
      <span className={`absolute top-0.5 left-0.5 w-6 h-6 rounded-full transition-transform duration-300
                        flex items-center justify-center text-sm
                        ${isDark ? 'translate-x-7 bg-game-purple' : 'translate-x-0 bg-yellow-400'}`}>
        {isDark ? '🌙' : '☀️'}
      </span>
        </button>
    )
}