import AvatarCirculo from './AvatarCirculo'

export default function RankingList({ ranking, titulo = 'Ranking en vivo', isDark = true }) {
    return (
        <div className="space-y-2">
            <p className={`text-xs font-semibold uppercase tracking-widest mb-2 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                {titulo}
            </p>
            {ranking.map((r) => (
                <div key={r.username}
                     className={`flex items-center gap-3 p-3 rounded-xl border animate-fade-in
                         ${isDark ? 'bg-game-card border-game-border' : 'bg-white border-gray-200 shadow-sm'}`}>
                    <span className="font-game font-black w-6 text-center text-game-cyan">{r.posicion}</span>
                    <AvatarCirculo seed={r.avatar} size={32} />
                    <span className={`flex-1 font-semibold truncate ${isDark ? 'text-white' : 'text-gray-800'}`}>
                        {r.username}
                    </span>
                    <span className="font-game font-bold text-game-purple-light">{r.puntos} pts</span>
                </div>
            ))}
        </div>
    )
}