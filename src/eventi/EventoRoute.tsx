import { Navigate, Outlet, useParams } from 'react-router-dom'
import { useAuth } from '../auth/authContext'
import EventoProvider from './EventoProvider'
import { percorsoEvento, useEvento } from './eventoContext'

/**
 * Le pagine di un evento. Oder entra ovunque; tutti gli altri solo nel
 * proprio evento: chi prova ad aprirne un altro torna al suo.
 */
export default function EventoRoute() {
  const { eventoId = '' } = useParams()
  const { ruolo, eventoId: mioEvento } = useAuth()

  if (ruolo !== 'superadmin') {
    if (!mioEvento) return <Navigate to="/" replace />
    if (mioEvento !== eventoId) return <Navigate to={percorsoEvento(mioEvento)} replace />
  }

  return (
    <EventoProvider key={eventoId} eventoId={eventoId}>
      <Outlet />
    </EventoProvider>
  )
}

/** Pagine riservate all'admin dell'evento (e a Oder). */
export function SoloAdmin() {
  const { isAdmin, percorso } = useEvento()
  return isAdmin ? <Outlet /> : <Navigate to={percorso()} replace />
}
