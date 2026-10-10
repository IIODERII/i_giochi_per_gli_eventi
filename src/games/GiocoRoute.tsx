import { Navigate } from 'react-router-dom'
import { useEvento } from '../eventi/eventoContext'
import { giochiVisibili, type Gioco } from './registry'

/** Apre il gioco solo se e' attivo in questo evento e chi guarda puo' vederlo. */
export default function GiocoRoute({ gioco }: { gioco: Gioco }) {
  const { evento, isAdmin, percorso } = useEvento()
  const visibile = giochiVisibili(evento, isAdmin).some((g) => g.id === gioco.id)
  if (!visibile) return <Navigate to={percorso()} replace />
  return <gioco.Componente />
}
