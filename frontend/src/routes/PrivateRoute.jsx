import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function PrivateRoute({ children }) {
    const { user, loading } = useAuth()

    if (loading) {
        return (
            <div className="min-h-screen bg-game-darker flex items-center justify-center">
                <div className="text-game-cyan font-game text-xl animate-pulse">
                    CARGANDO...
                </div>
            </div>
        )
    }

    return user ? children : <Navigate to="/login" replace />
}