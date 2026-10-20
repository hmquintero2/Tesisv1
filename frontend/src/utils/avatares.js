export const AVATARES_EMOJI = {
    conejo: '🐰',
    tigre: '🐯',
    leon: '🦁',
    zorro: '🦊',
    panda: '🐼',
    lobo: '🐺',
    aguila: '🦅',
    delfin: '🐬',
}

export function emojiAvatar(nombreAvatar) {
    return AVATARES_EMOJI[nombreAvatar] || '🎮'
}