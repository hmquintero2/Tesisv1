import api from './axios'
const wrap = async (fn) => { try { const {data} = await fn(); return data } catch(e) { throw e.response?.data || e } }

export const benchmarkAPI = {
    ejecutar:      (condicion, tema, cantidad=5, repeticion=1) => wrap(() => api.post('/benchmark/ejecutar', {condicion, tema, cantidad, repeticion})),
    ejecutarCompleto: (tema, cantidad=5, repeticiones=3)       => wrap(() => api.post('/benchmark/ejecutar-completo', {tema, cantidad, repeticiones})),
    resultados:    ()        => wrap(() => api.get('/benchmark/resultados')),
    comparativa:   ()        => wrap(() => api.get('/benchmark/comparativa-condiciones')),
    estadisticas:  ()        => wrap(() => api.get('/benchmark/estadisticas')),
    sinEvaluar:    ()        => wrap(() => api.get('/benchmark/sin-evaluar')),
    condiciones:   ()        => wrap(() => api.get('/benchmark/condiciones')),
    temas:         ()        => wrap(() => api.get('/benchmark/temas')),
    anonimizar:    (tema)    => wrap(() => api.get(`/benchmark/anonimizar/${tema}`)),
    eliminar:      (id)      => wrap(() => api.delete(`/benchmark/${id}`)),
}