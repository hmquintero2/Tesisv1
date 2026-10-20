import { BrowserRouter, Routes, Route, Navigate, useLocation }
    from 'react-router-dom'
import { AuthProvider }      from './context/AuthContext'
import { ThemeProvider }     from './context/ThemeContext'
import PrivateRoute          from './routes/PrivateRoute'
import Navbar                from './components/Navbar'
import Chatbot               from './components/Chatbot'
import Login                 from './pages/Login'
import Register              from './pages/Register'
import VerificarOtp          from './pages/VerificarOtp'
import RecuperarPassword     from './pages/RecuperarPassword'
import ResetPassword         from './pages/ResetPassword'
import Lobby                 from './pages/Lobby'
import WaitingRoom           from './pages/WaitingRoom'
import Juego                 from './pages/Juego'
import ResultadosFinales     from './pages/ResultadosFinales'
import PanelHost             from './pages/PanelHost'
import Historial             from './pages/Historial'
import Benchmark from './pages/Benchmark'
import EvaluacionExperto     from './pages/EvaluacionExperto'
import EvaluacionEstudiante  from './pages/EvaluacionEstudiante'
import MatrizComparativa from './pages/MatrizComparativa'
import Perfil from './pages/Perfil'
import Presentacion from './pages/Presentacion'
// dentro de <Routes>:


function Layout({ children }) {
    const location = useLocation()
    const sinNavbar = [
        '/login',
        '/register',
        '/verificar-otp',
        '/recuperar-password',
        '/reset-password'
    ]
    const mostrarNavbar = !sinNavbar.includes(location.pathname)

    return (
        <div className="flex flex-col min-h-screen">
            {mostrarNavbar && <Navbar />}
            <main className="flex-1 flex flex-col overflow-hidden">
                {children}
            </main>
            {location.pathname === '/lobby' && <Chatbot />}
        </div>
    )
}

export default function App() {
    return (
        <ThemeProvider>
            <AuthProvider>
                <BrowserRouter>
                    <Layout>
                        <Routes>
                            <Route path="/"
                                   element={<Navigate to="/login" replace />} />

                            {/* Rutas públicas */}
                            <Route path="/login"
                                   element={<Login />} />
                            <Route path="/register"
                                   element={<Register />} />
                            <Route path="/verificar-otp"
                                   element={<VerificarOtp />} />
                            <Route path="/recuperar-password"
                                   element={<RecuperarPassword />} />
                            <Route path="/reset-password"
                                   element={<ResetPassword />} />

                            {/* Rutas privadas */}
                            <Route path="/lobby"
                                   element={
                                       <PrivateRoute><Lobby /></PrivateRoute>
                                   } />
                            <Route path="/sala/:codigo"
                                   element={
                                       <PrivateRoute>
                                           <WaitingRoom />
                                       </PrivateRoute>
                                   } />
                            <Route path="/juego/:codigo"
                                   element={
                                       <PrivateRoute><Juego /></PrivateRoute>
                                   } />
                            <Route path="/sala/:codigo/resultados"
                                   element={
                                       <PrivateRoute>
                                           <ResultadosFinales />
                                       </PrivateRoute>
                                   } />
                            <Route path="/sala/:codigo/panel-host"
                                   element={
                                       <PrivateRoute>
                                           <PanelHost />
                                       </PrivateRoute>
                                   } />
                            <Route path="/historial"
                                   element={
                                       <PrivateRoute>
                                           <Historial />
                                       </PrivateRoute>
                                   } />
                            <Route path="/benchmark"
                                   element={<PrivateRoute><Benchmark /></PrivateRoute>} />
                            <Route path="/evaluacion/experto"
                                   element={<PrivateRoute><EvaluacionExperto /></PrivateRoute>} />
                            <Route path="/evaluar/:codigoAnonimo"
                                   element={<PrivateRoute><EvaluacionEstudiante /></PrivateRoute>} />
                            <Route path="/matriz-comparativa"
                                   element={<PrivateRoute><MatrizComparativa /></PrivateRoute>} />
                            <Route path="/perfil"
                                   element={<PrivateRoute><Perfil /></PrivateRoute>} />
                            <Route path="/presentacion/:codigo"
                                   element={<PrivateRoute><Presentacion /></PrivateRoute>} />
                        </Routes>
                    </Layout>
                </BrowserRouter>
            </AuthProvider>
        </ThemeProvider>
    )
}