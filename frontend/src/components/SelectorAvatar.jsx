import avatar from 'animal-avatar-generator'
import { SEMILLAS_AVATAR, OPCIONES_AVATAR } from '../data/avataresAnimales'
import { useTheme } from '../context/ThemeContext'

export default function SelectorAvatar({ seleccionado, onSeleccionar }) {
    const { isDark } = useTheme()

    return (
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
            {SEMILLAS_AVATAR.map(seed => {
                const svg = avatar(seed, { size: 64, round: true, ...OPCIONES_AVATAR })
                return (
                    <button
                        key={seed}
                        type="button"
                        onClick={() => onSeleccionar(seed)}
                        className={`flex items-center justify-center p-2 rounded-xl border-2 transition-all
                            ${seleccionado === seed
                            ? 'border-game-purple bg-game-purple/10 scale-105'
                            : isDark ? 'border-game-border' : 'border-gray-200'}`}
                    >
                        <div
                            className="w-14 h-14 rounded-full overflow-hidden"
                            dangerouslySetInnerHTML={{ __html: svg }}
                        />
                    </button>
                )
            })}
        </div>
    )
}