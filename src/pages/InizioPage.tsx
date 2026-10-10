import { Navigate } from 'react-router-dom'
import DashboardPage from '../admin/DashboardPage'
import { useAuth } from '../auth/authContext'
import { percorsoEvento } from '../eventi/eventoContext'

/** L'indirizzo principale: Oder vede la dashboard, gli altri vanno al loro evento. */
export default function InizioPage() {
  const { isSuperadmin, eventoId, username, logout } = useAuth()

  if (isSuperadmin) return <DashboardPage />
  if (eventoId) return <Navigate to={percorsoEvento(eventoId)} replace />

  return (
    <div className="flex min-h-screen items-center justify-center bg-crema-100 px-4">
      <div className="card max-w-sm p-6 text-center">
        <h1 className="text-2xl font-semibold text-primario-800">Nessun evento collegato</h1>
        <p className="mt-2 text-sm text-inchiostro/65">
          L’utente <span className="font-mono">{username}</span> non fa parte di nessun evento:
          forse la festa è finita e l’evento è stato eliminato.
        </p>
        <button className="btn-secondary mt-5" onClick={() => logout()}>
          Esci
        </button>
      </div>
    </div>
  )
}
