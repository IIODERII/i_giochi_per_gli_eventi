import { Navigate, Outlet, useLocation } from 'react-router-dom'
import Loader from '../components/Loader'
import { useAuth } from './authContext'

export default function ProtectedRoute() {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader testo="Un attimo…" />
      </div>
    )
  }

  // gli invitati che giocano dal QR usano un'identita' a parte (vedi
  // cashorsara/istanzaGioco.ts): qui serve sempre utente e password
  if (!user || user.isAnonymous) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  return <Outlet />
}
