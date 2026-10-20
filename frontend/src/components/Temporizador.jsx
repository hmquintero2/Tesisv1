export default function Temporizador({
                                         tiempoRestante,
                                         segundosTotal,
                                         mostrarLabel = false
                                     }) {
    const porcentaje = segundosTotal > 0
        ? (tiempoRestante / segundosTotal) * 100
        : 0
    const critico = tiempoRestante <= 5 && tiempoRestante > 0
    const agotado = tiempoRestante <= 0

    const colorBarra = agotado
        ? 'bg-gray-500'
        : critico
            ? 'bg-red-500 animate-pulse'
            : porcentaje > 50
                ? 'bg-gradient-to-r from-game-purple to-game-cyan'
                : 'bg-gradient-to-r from-yellow-500 to-orange-500'

    return (
        <div className="flex flex-col gap-1 w-full">
            {mostrarLabel && (
                <span className="text-xs uppercase tracking-widest
                                 text-gray-500 font-semibold">
                    Tiempo
                </span>
            )}
            <div className="flex items-center gap-3">
                <div className="flex-1 h-2.5 rounded-full
                                bg-game-dark/50 overflow-hidden">
                    <div
                        className={`h-full rounded-full
                            transition-all duration-500 ease-linear
                            ${colorBarra}`}
                        style={{ width: `${Math.max(0, porcentaje)}%` }}
                    />
                </div>
                <span className={`font-game font-bold text-sm w-10
                    text-right tabular-nums
                    ${agotado  ? 'text-gray-500'
                    : critico  ? 'text-red-400 animate-pulse'
                        :            'text-game-cyan'}`}>
                    {agotado ? '0s' : `${tiempoRestante}s`}
                </span>
            </div>
        </div>
    )
}