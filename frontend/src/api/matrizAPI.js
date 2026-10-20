import api from './axios'
const wrap = async (fn) => { try { const {data} = await fn(); return data } catch(e) { throw e.response?.data || e } }

export const matrizAPI = {
    obtener: () => wrap(() => api.get('/matriz-comparativa')),
}