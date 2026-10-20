import { useMemo } from 'react'
import avatar from 'animal-avatar-generator'
import { OPCIONES_AVATAR } from '../data/avataresAnimales'

export default function AvatarCirculo({ seed, size = 40 }) {
    const svg = useMemo(() => avatar(seed || 'default', {
        size,
        round: true,
        ...OPCIONES_AVATAR,
    }), [seed, size])

    return (
        <div
            className="rounded-full overflow-hidden flex-shrink-0 animate-scale-in"
            style={{ width: size, height: size }}
            dangerouslySetInnerHTML={{ __html: svg }}
        />
    )
}