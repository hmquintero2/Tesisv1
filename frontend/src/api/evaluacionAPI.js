import api from './axios'
const wrap = async (fn) => { try { const {data} = await fn(); return data } catch(e) { throw e.response?.data || e } }

export const evaluacionAPI = {
    evaluarExperto:    (id, vals)   => wrap(() => api.put(`/evaluacion/experto/${id}`, vals)),
    evaluarEstudiante: (vals)       => wrap(() => api.post('/evaluacion/estudiante', vals)),
    evaluarSUS:        (vals)       => wrap(() => api.post('/evaluacion/sus', vals)),
}