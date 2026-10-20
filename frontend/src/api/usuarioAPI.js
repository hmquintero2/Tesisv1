import api from './axios'
const wrap = async (fn) => { try { const {data} = await fn(); return data } catch(e) { throw e.response?.data || e } }

export const usuarioAPI = {
    perfil:            ()       => wrap(() => api.get('/usuario/perfil')),
    actualizarAvatar:  (avatarId) => wrap(() => api.put('/usuario/avatar', { avatarId })),
}